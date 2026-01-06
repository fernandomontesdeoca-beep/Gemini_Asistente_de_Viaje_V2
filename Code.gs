// MAPA DE COLUMNAS 
const SCHEMA = {
  TRIPS: ["id", "date", "startTime", "endTime", "origin", "destination", "distance", "vehicle", "status", "startOdometer", "endOdometer", "updatedAt"],
  EXPENSES: ["id", "date", "time", "category", "amount", "currency", "method", "type", "notes", "odometer", "volume", "tripId", "updatedAt"],
  VISITS: ["id", "client", "date", "status", "inboundTripId", "outboundTripId", "updatedAt"],
  ODOMETERS: ["id", "value", "updatedAt"],
  CONFIGS: ["id", "tollPrice", "fuelPrice", "fuelPriceAC", "fuelPriceDC", "kmValue", "currency", "updatedAt"],
  APP_STATE: ["key", "value", "updatedAt"] // Nueva tabla para estado de viaje
};

const SHEET_NAMES = {
  TRIPS: "Trips", EXPENSES: "Expenses", VISITS: "Visits", 
  ODOMETERS: "Odometers", CONFIGS: "Configs", APP_STATE: "AppState"
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Servidor ocupado" })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const incomingData = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. PROCESO DE FUSIÓN (Tablas principales)
    syncTable(ss, SHEET_NAMES.TRIPS, incomingData.trips, SCHEMA.TRIPS);
    syncTable(ss, SHEET_NAMES.EXPENSES, incomingData.expenses, SCHEMA.EXPENSES);
    
    // Visitas
    const visitsFlat = (incomingData.visits || []).map(v => ({
      id: v.id, client: v.client, date: v.date, status: v.status,
      inboundTripId: v.inboundTrip ? v.inboundTrip.id : "",
      outboundTripId: v.outboundTrip ? v.outboundTrip.id : "",
      updatedAt: v.updatedAt
    }));
    syncTable(ss, SHEET_NAMES.VISITS, visitsFlat, SCHEMA.VISITS);

    // Odómetros y Configs
    if(incomingData.vehicleOdometers) {
       const odoList = Object.entries(incomingData.vehicleOdometers).map(([k,v]) => ({id:k, value:v, updatedAt: new Date().toISOString()}));
       syncTable(ss, SHEET_NAMES.ODOMETERS, odoList, SCHEMA.ODOMETERS);
    }
    if(incomingData.vehicleConfigs) {
       const cfgList = Object.entries(incomingData.vehicleConfigs).map(([k,v]) => ({...v, id:k, updatedAt: new Date().toISOString()}));
       syncTable(ss, SHEET_NAMES.CONFIGS, cfgList, SCHEMA.CONFIGS);
    }

    // --- NUEVO: GUARDAR ESTADO DE VIAJE ACTIVO ---
    if (incomingData.currentTripState) {
        // Guardamos metadatos clave para saber si hay un viaje activo
        const stateList = [
            { key: "lastLocation", value: incomingData.lastLocation, updatedAt: new Date().toISOString() },
            { key: "tripStatus", value: incomingData.currentTripState.appState, updatedAt: new Date().toISOString() },
            { key: "tripStartTime", value: incomingData.currentTripState.currentTrip.startTime, updatedAt: new Date().toISOString() },
            { key: "tripOrigin", value: incomingData.currentTripState.currentTrip.origin, updatedAt: new Date().toISOString() },
            { key: "tripVehicle", value: incomingData.currentTripState.currentTrip.vehicle, updatedAt: new Date().toISOString() },
            { key: "tripStartOdo", value: incomingData.currentTripState.currentTrip.startOdometer, updatedAt: new Date().toISOString() }
        ];
        syncTable(ss, SHEET_NAMES.APP_STATE, stateList, SCHEMA.APP_STATE);
    }

    // 2. PREPARAR RESPUESTA
    const responseData = {
      trips: readTable(ss, SHEET_NAMES.TRIPS, SCHEMA.TRIPS),
      expenses: readTable(ss, SHEET_NAMES.EXPENSES, SCHEMA.EXPENSES),
      visits: reconstructVisits(ss, SHEET_NAMES.VISITS, SCHEMA.VISITS),
      vehicleOdometers: readSimplePair(ss, SHEET_NAMES.ODOMETERS),
      vehicleConfigs: readConfigs(ss, SHEET_NAMES.CONFIGS, SCHEMA.CONFIGS),
      appStateData: readSimplePair(ss, SHEET_NAMES.APP_STATE, "key") // Devolvemos el estado
    };

    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: responseData }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ... (Resto de funciones auxiliares syncTable, readTable, etc. se mantienen igual que en la v3.0.0)
function syncTable(ss, sheetName, incomingItems, headers) {
  if (!incomingItems || incomingItems.length === 0) return;
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) { sheet = ss.insertSheet(sheetName); sheet.appendRow(headers); }
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const headersRow = values[0];
  const storedData = values.slice(1);
  let dbMap = new Map();
  storedData.forEach((row, idx) => {
    let item = {};
    headersRow.forEach((h, i) => item[h] = row[i]);
    // Usamos el primer campo como ID por defecto, a menos que sea APP_STATE
    const idKey = headers[0]; 
    dbMap.set(String(item[idKey]), { row: idx + 2, item: item });
  });

  incomingItems.forEach(newItem => {
    const idKey = headers[0];
    const strId = String(newItem[idKey]);
    const existing = dbMap.get(strId);
    let shouldWrite = false;
    let writeRow = null;

    if (!existing) {
      shouldWrite = true;
    } else {
      const cloudDate = new Date(existing.item.updatedAt || 0).getTime();
      const localDate = new Date(newItem.updatedAt || 0).getTime();
      if (localDate > cloudDate) { shouldWrite = true; writeRow = existing.row; }
    }

    if (shouldWrite) {
      const rowArray = headers.map(h => { let val = newItem[h]; return (val === undefined || val === null) ? "" : val; });
      if (writeRow) { sheet.getRange(writeRow, 1, 1, headers.length).setValues([rowArray]); } 
      else { sheet.appendRow(rowArray); }
    }
  });
}

function readTable(ss, sheetName, headers) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const raw = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  return raw.map(row => { let obj = {}; headers.forEach((h, i) => obj[h] = row[i]); return obj; });
}

function readSimplePair(ss, sheetName, keyName = "id") {
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

function reconstructVisits(ss, sheetName, headers) { return readTable(ss, sheetName, headers); }