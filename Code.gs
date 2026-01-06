// ==========================================
// BACKEND: ASISTENTE DE VIAJE v3.3.0
// ==========================================

// Definición de columnas (Schema)
const SCHEMA = {
  TRIPS: ["id", "date", "startTime", "endTime", "origin", "destination", "distance", "vehicle", "status", "startOdometer", "endOdometer", "updatedAt", "_deleted"],
  EXPENSES: ["id", "date", "time", "category", "amount", "currency", "method", "type", "notes", "odometer", "volume", "tripId", "updatedAt", "_deleted"],
  VISITS: ["id", "client", "date", "status", "inboundTripId", "outboundTripId", "updatedAt", "_deleted"],
  ODOMETERS: ["id", "value", "updatedAt"],
  CONFIGS: ["id", "tollPrice", "fuelPrice", "fuelPriceAC", "fuelPriceDC", "kmValue", "currency", "updatedAt"],
  APP_STATE: ["key", "value", "updatedAt"]
};

// Nombres de las pestañas
const SHEET_NAMES = {
  TRIPS: "Trips",
  EXPENSES: "Expenses",
  VISITS: "Visits",
  ODOMETERS: "Odometers",
  CONFIGS: "Configs",
  APP_STATE: "AppState"
};

function doPost(e) {
  // Lock para evitar colisiones entre dispositivos
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return response("error", "Servidor ocupado, intenta en unos segundos.");
  }

  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // === COMANDO ESPECIAL: RESET TOTAL ===
    if (data.command === "RESET_ALL") {
      const sheets = ss.getSheets();
      sheets.forEach(sheet => {
        // Limpiamos todas las hojas gestionadas
        if (Object.values(SHEET_NAMES).includes(sheet.getName())) {
             sheet.clear();
        }
      });
      return response("success", "Base de datos en la nube eliminada completamente.");
    }

    // === SINCRONIZACIÓN ESTÁNDAR ===
    
    // 1. Viajes
    syncTable(ss, SHEET_NAMES.TRIPS, data.trips, SCHEMA.TRIPS);
    
    // 2. Gastos
    syncTable(ss, SHEET_NAMES.EXPENSES, data.expenses, SCHEMA.EXPENSES);
    
    // 3. Visitas (Aplanamos IDs)
    const visitsFlat = (data.visits || []).map(v => ({
      ...v,
      inboundTripId: v.inboundTrip ? v.inboundTrip.id : (v.inboundTripId || ""),
      outboundTripId: v.outboundTrip ? v.outboundTrip.id : (v.outboundTripId || "")
    }));
    syncTable(ss, SHEET_NAMES.VISITS, visitsFlat, SCHEMA.VISITS);

    // 4. Odómetros
    if(data.vehicleOdometers) {
       const odoList = Object.entries(data.vehicleOdometers).map(([k,v]) => ({id:k, value:v, updatedAt: new Date().toISOString()}));
       syncTable(ss, SHEET_NAMES.ODOMETERS, odoList, SCHEMA.ODOMETERS);
    }

    // 5. Configuraciones
    if(data.vehicleConfigs) {
       const cfgList = Object.entries(data.vehicleConfigs).map(([k,v]) => ({...v, id:k, updatedAt: new Date().toISOString()}));
       syncTable(ss, SHEET_NAMES.CONFIGS, cfgList, SCHEMA.CONFIGS);
    }
    
    // 6. Estado de la App
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

    // === PREPARAR RESPUESTA (SYNC BIDIRECCIONAL) ===
    const responseData = {
      trips: readTable(ss, SHEET_NAMES.TRIPS, SCHEMA.TRIPS),
      expenses: readTable(ss, SHEET_NAMES.EXPENSES, SCHEMA.EXPENSES),
      visits: readTable(ss, SHEET_NAMES.VISITS, SCHEMA.VISITS), // Visitas planas con IDs
      vehicleOdometers: readSimplePair(ss, SHEET_NAMES.ODOMETERS),
      vehicleConfigs: readConfigs(ss, SHEET_NAMES.CONFIGS, SCHEMA.CONFIGS),
      appStateData: readSimplePair(ss, SHEET_NAMES.APP_STATE, "key")
    };

    return response("success", "Sincronizado correctamente", responseData);

  } catch (error) {
    return response("error", error.toString());
  } finally {
    lock.releaseLock();
  }
}

// === ALGORITMO DE FUSIÓN (LAST WRITE WINS) ===
function syncTable(ss, sheetName, incomingItems, headers) {
  if (!incomingItems || incomingItems.length === 0) return;
  
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) { sheet = ss.insertSheet(sheetName); sheet.appendRow(headers); }
  
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  // Mapa de IDs existentes en la nube: ID -> Fila
  let dbMap = new Map();
  if (values.length > 1) {
      const storedData = values.slice(1);
      storedData.forEach((row, idx) => {
          // Asumimos siempre que la columna 0 es el ID único
          dbMap.set(String(row[0]), idx + 2); // +2 por header y base 1
      });
  }

  // Indices de columnas clave
  const dateIdx = headers.indexOf("updatedAt");

  incomingItems.forEach(item => {
    const strId = String(item[headers[0]]); // ID del item entrante
    
    let writeRow = null;
    let shouldWrite = true; // Por defecto escribimos (si es nuevo)

    if (dbMap.has(strId)) {
        const rowNum = dbMap.get(strId);
        
        // Si existe, comparamos fechas para ver cuál es más reciente
        if (dateIdx > -1) {
            const existingDateStr = sheet.getRange(rowNum, dateIdx + 1).getValue();
            const existingDate = new Date(existingDateStr || 0).getTime();
            const incomingDate = new Date(item.updatedAt || 0).getTime();
            
            // Si la nube tiene un dato más nuevo (fecha mayor), NO sobrescribimos
            if (incomingDate <= existingDate) {
                shouldWrite = false;
            }
        }
        
        if (shouldWrite) writeRow = rowNum;
    }

    if (shouldWrite) {
        // Mapeamos el objeto al orden de las columnas
        const rowArray = headers.map(h => {
             let val = item[h];
             return (val === undefined || val === null) ? "" : val;
        });

        if (writeRow) {
            // Actualizar fila existente
            sheet.getRange(writeRow, 1, 1, headers.length).setValues([rowArray]);
        } else {
            // Insertar nueva fila
            sheet.appendRow(rowArray);
        }
    }
  });
}

// === LECTURA DE DATOS ===
function readTable(ss, sheetName, headers) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const raw = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  return raw.map(row => {
      let obj = {}; 
      headers.forEach((h, i) => obj[h] = row[i]); 
      return obj; 
  });
}

function readSimplePair(ss, sheetName, keyName="id") {
    const list = readTable(ss, sheetName, [keyName, "value"]);
    let obj = {}; 
    list.forEach(i => obj[i[keyName]] = i.value); 
    return obj;
}

function readConfigs(ss, sheetName, headers) {
    const list = readTable(ss, sheetName, headers);
    let obj = {}; 
    list.forEach(i => { const id = i.id; delete i.id; obj[id] = i; }); 
    return obj;
}

function response(status, msg, data=null) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: status, 
      message: msg, 
      data: data 
    })).setMimeType(ContentService.MimeType.JSON);
}