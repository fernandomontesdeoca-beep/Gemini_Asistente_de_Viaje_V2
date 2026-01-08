// ==========================================
// BACKEND: ASISTENTE DE VIAJE v3.6.0 (Backup & Restore)
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

    // === COMANDO: RESET TOTAL (Borrado remoto) ===
    if (data.command === "RESET_ALL") {
      const sheets = ss.getSheets();
      sheets.forEach(sheet => {
        if (Object.values(SHEET_NAMES).includes(sheet.getName())) sheet.clear();
      });
      return response("success", "Nube formateada correctamente.");
    }

    // === SINCRONIZACIÓN (Guardar cambios locales) ===
    // Solo procesamos si vienen datos en el array
    if (data.trips) syncTable(ss, SHEET_NAMES.TRIPS, data.trips, SCHEMA.TRIPS);
    if (data.expenses) syncTable(ss, SHEET_NAMES.EXPENSES, data.expenses, SCHEMA.EXPENSES);
    
    // Visitas: Aplanar objetos para guardar IDs
    const visitsFlat = (data.visits || []).map(v => ({
      ...v,
      inboundTripId: v.inboundTrip ? v.inboundTrip.id : (v.inboundTripId || ""),
      outboundTripId: v.outboundTrip ? v.outboundTrip.id : (v.outboundTripId || "")
    }));
    if (data.visits) syncTable(ss, SHEET_NAMES.VISITS, visitsFlat, SCHEMA.VISITS);

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

    // === RESTAURACIÓN (Devolver todo lo que hay en la nube) ===
    // Esto es lo que permite recuperar los datos en un dispositivo nuevo
    return response("success", "Sincronizado", {
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

// === ALGORITMO LAST WRITE WINS ===
function syncTable(ss, sheetName, incomingItems, headers) {
  if (!incomingItems || incomingItems.length === 0) return;
  
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) { sheet = ss.insertSheet(sheetName); sheet.appendRow(headers); }
  
  const lastRow = sheet.getLastRow();
  let dbMap = new Map();
  
  if (lastRow > 1) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues(); 
      ids.forEach((row, idx) => dbMap.set(String(row[0]).trim(), idx + 2));
  }

  const dateIdx = headers.indexOf("updatedAt");

  incomingItems.forEach(item => {
    const idVal = item[headers[0]];
    if(idVal === undefined || idVal === null) return;
    const strId = String(idVal).trim();
    
    let writeRow = null;
    let shouldWrite = true;

    if (dbMap.has(strId)) {
        const rowNum = dbMap.get(strId);
        if (dateIdx > -1) {
            const existingDateCell = sheet.getRange(rowNum, dateIdx + 1).getValue();
            const existingDate = new Date(existingDateCell || 0).getTime();
            const incomingDate = new Date(item.updatedAt || 0).getTime();
            if (incomingDate <= existingDate) shouldWrite = false; 
        }
        if (shouldWrite) writeRow = rowNum;
    }

    if (shouldWrite) {
        const rowArray = headers.map(h => {
             let val = item[h];
             if (val instanceof Date) return val.toISOString();
             return (val === undefined || val === null) ? "" : val;
        });

        if (writeRow) sheet.getRange(writeRow, 1, 1, headers.length).setValues([rowArray]);
        else {
            sheet.appendRow(rowArray);
            dbMap.set(strId, sheet.getLastRow());
        }
    }
  });
}

function readTable(ss, sheetName, headers) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const raw = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getDisplayValues();
  return raw.map(row => {
      let obj = {}; 
      headers.forEach((h, i) => {
          let val = row[i];
          if(h === "startOdometer" || h === "endOdometer" || h === "amount" || h === "distance") {
             val = val ? parseFloat(val.replace(',','.')) : 0;
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
    return ContentService.createTextOutput(JSON.stringify({ status, message: msg, data })).setMimeType(ContentService.MimeType.JSON);
}