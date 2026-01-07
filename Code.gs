// ==========================================
// BACKEND: ASISTENTE DE VIAJE v3.3.1 (Anti-Ghost)
// ==========================================

const SCHEMA = {
  TRIPS: ["id", "date", "startTime", "endTime", "origin", "destination", "distance", "vehicle", "status", "startOdometer", "endOdometer", "updatedAt", "_deleted"],
  EXPENSES: ["id", "date", "time", "category", "amount", "currency", "method", "type", "notes", "odometer", "volume", "tripId", "updatedAt", "_deleted"],
  VISITS: ["id", "client", "date", "status", "inboundTripId", "outboundTripId", "updatedAt", "_deleted"],
  ODOMETERS: ["id", "value", "updatedAt"],
  CONFIGS: ["id", "tollPrice", "fuelPrice", "fuelPriceAC", "fuelPriceDC", "kmValue", "currency", "updatedAt"],
  APP_STATE: ["key", "value", "updatedAt"]
};

const SHEET_NAMES = {
  TRIPS: "Trips", EXPENSES: "Expenses", VISITS: "Visits", 
  ODOMETERS: "Odometers", CONFIGS: "Configs", APP_STATE: "AppState"
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return response("error", "Servidor ocupado.");

  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // === RESET DE EMERGENCIA ===
    if (data.command === "RESET_ALL") {
      const sheets = ss.getSheets();
      sheets.forEach(sheet => {
        if (Object.values(SHEET_NAMES).includes(sheet.getName())) sheet.clear();
      });
      return response("success", "Base de datos reseteada.");
    }

    // === SINCRONIZACIÓN ===
    syncTable(ss, SHEET_NAMES.TRIPS, data.trips, SCHEMA.TRIPS);
    syncTable(ss, SHEET_NAMES.EXPENSES, data.expenses, SCHEMA.EXPENSES);
    
    // Aplanar Visitas
    const visitsFlat = (data.visits || []).map(v => ({
      ...v,
      inboundTripId: v.inboundTrip ? v.inboundTrip.id : (v.inboundTripId || ""),
      outboundTripId: v.outboundTrip ? v.outboundTrip.id : (v.outboundTripId || "")
    }));
    syncTable(ss, SHEET_NAMES.VISITS, visitsFlat, SCHEMA.VISITS);

    // Tablas simples
    if(data.vehicleOdometers) {
       const odoList = Object.entries(data.vehicleOdometers).map(([k,v]) => ({id:k, value:v, updatedAt: new Date().toISOString()}));
       syncTable(ss, SHEET_NAMES.ODOMETERS, odoList, SCHEMA.ODOMETERS);
    }
    if(data.vehicleConfigs) {
       const cfgList = Object.entries(data.vehicleConfigs).map(([k,v]) => ({...v, id:k, updatedAt: new Date().toISOString()}));
       syncTable(ss, SHEET_NAMES.CONFIGS, cfgList, SCHEMA.CONFIGS);
    }
    
    // Estado App
    if (data.currentTripState) {
        const stateList = [
            { key: "lastLocation", value: data.lastLocation, updatedAt: new Date().toISOString() },
            { key: "tripStatus", value: data.currentTripState.appState, updatedAt: new Date().toISOString() },
            { key: "tripStartTime", value: data.currentTripState.currentTrip.startTime, updatedAt: new Date().toISOString() },
            { key: "tripOrigin", value: data.currentTripState.currentTrip.origin, updatedAt: new Date().toISOString() },
            { key: "tripVehicle", value: data.currentTripState.currentTrip.vehicle, updatedAt: new Date().toISOString() },
            { key: "tripStartOdo", value: data.currentTripState.currentTrip.startOdometer, updatedAt: new Date().toISOString() }
        ];
        syncTable(ss, SHEET_NAMES.APP_STATE, stateList, SCHEMA.APP_STATE);
    }

    // === RESPUESTA ===
    return response("success", "OK", {
      trips: readTable(ss, SHEET_NAMES.TRIPS, SCHEMA.TRIPS),
      expenses: readTable(ss, SHEET_NAMES.EXPENSES, SCHEMA.EXPENSES),
      visits: readTable(ss, SHEET_NAMES.VISITS, SCHEMA.VISITS),
      vehicleOdometers: readSimplePair(ss, SHEET_NAMES.ODOMETERS),
      vehicleConfigs: readConfigs(ss, SHEET_NAMES.CONFIGS, SCHEMA.CONFIGS),
      appStateData: readSimplePair(ss, SHEET_NAMES.APP_STATE, "key")
    });

  } catch (error) {
    return response("error", error.toString());
  } finally {
    lock.releaseLock();
  }
}

// === ALGORITMO ANTI-DUPLICADOS ===
function syncTable(ss, sheetName, incomingItems, headers) {
  if (!incomingItems || incomingItems.length === 0) return;
  
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) { sheet = ss.insertSheet(sheetName); sheet.appendRow(headers); }
  
  const lastRow = sheet.getLastRow();
  let dbMap = new Map(); // Mapa ID -> Fila
  
  // Leer datos existentes
  if (lastRow > 1) {
      // Leemos solo la columna de IDs para velocidad (Columna 1)
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues(); 
      ids.forEach((row, idx) => {
          // Guardamos ID como String limpio
          dbMap.set(String(row[0]).trim(), idx + 2); 
      });
  }

  const dateIdx = headers.indexOf("updatedAt");

  incomingItems.forEach(item => {
    // Usar el primer campo como ID y limpiarlo
    const idVal = item[headers[0]];
    if(idVal === undefined || idVal === null) return; // Skip si no hay ID
    const strId = String(idVal).trim();
    
    let writeRow = null;
    let shouldWrite = true;

    // 1. CHEQUEO: ¿Existe en el Mapa (Nube o Cache Local)?
    if (dbMap.has(strId)) {
        const rowNum = dbMap.get(strId);
        
        // 2. CHEQUEO: ¿Es más nuevo?
        if (dateIdx > -1) {
            // Leemos fecha de la celda específica solo si es necesario (Optimización)
            const existingDateCell = sheet.getRange(rowNum, dateIdx + 1).getValue();
            const existingDate = new Date(existingDateCell || 0).getTime();
            const incomingDate = new Date(item.updatedAt || 0).getTime();
            
            if (incomingDate <= existingDate) shouldWrite = false; // Nube gana
        }
        if (shouldWrite) writeRow = rowNum;
    }

    if (shouldWrite) {
        const rowArray = headers.map(h => {
             let val = item[h];
             // Convertir fechas a string ISO para evitar problemas de formato Excel
             if (val instanceof Date) return val.toISOString();
             return (val === undefined || val === null) ? "" : val;
        });

        if (writeRow) {
            sheet.getRange(writeRow, 1, 1, headers.length).setValues([rowArray]);
        } else {
            sheet.appendRow(rowArray);
            // 3. ACTUALIZACIÓN CRÍTICA DEL MAPA
            // Registramos el nuevo ID inmediatamente para que si viene duplicado en este mismo lote,
            // se detecte como "Existente" y se actualice en lugar de crear otra fila.
            dbMap.set(strId, sheet.getLastRow()); 
        }
    }
  });
}

function readTable(ss, sheetName, headers) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  // Leemos todo como texto plano para evitar formatos científicos
  const raw = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getDisplayValues();
  return raw.map(row => {
      let obj = {}; 
      headers.forEach((h, i) => {
          // Intentar recuperar tipos básicos
          let val = row[i];
          if(h === "startOdometer" || h === "endOdometer" || h === "amount" || h === "distance") {
             val = val ? parseFloat(val) : 0;
          }
          obj[h] = val;
      }); 
      return obj; 
  });
}

function readSimplePair(ss, sheetName, keyName="id") {
    const list = readTable(ss, sheetName, [keyName, "value"]);
    let obj = {}; list.forEach(i => obj[i[keyName]] = i.value); return obj;
}
function readConfigs(ss, sheetName, headers) {
    const list = readTable(ss, sheetName, headers);
    let obj = {}; list.forEach(i => { const id = i.id; delete i.id; obj[id] = i; }); return obj;
}
function response(status, msg, data=null) {
    return ContentService.createTextOutput(JSON.stringify({ status: status, message: msg, data: data })).setMimeType(ContentService.MimeType.JSON);
}