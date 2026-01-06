const { useState, useEffect } = React;

// --- Imports ---
const UpdateAppModal = window.UpdateAppModal;
const ResumeTripModal = window.ResumeTripModal;
const ExpenseModal = window.ExpenseModal;
const CategorySelector = window.CategorySelector;
const ChargeTypeModal = window.ChargeTypeModal;
const DestinationInputModal = window.DestinationInputModal;
const ParkingAskModal = window.ParkingAskModal;
const UpdatePromptModal = window.UpdatePromptModal;
const TripEditModal = window.TripEditModal;
const VisitEditModal = window.VisitEditModal;
const DataImportModal = window.DataImportModal;

const HomeView = window.HomeView;
const HistoryView = window.HistoryView;
const SettingsView = window.SettingsView;
const StartingView = window.StartingView;
const ActiveTripView = window.ActiveTripView;
const EndingTripView = window.EndingTripView;

const APP_VERSION = window.APP_VERSION;
const formatMoney = window.formatMoney;
const OFFICIAL_RATES = window.OFFICIAL_RATES;
const getVehicleInfo = window.getVehicleInfo;

window.App = () => {
    // --- ESTADO ---
    const [rateChanges, setRateChanges] = useState([]);
    const [showUpdateAppModal, setShowUpdateAppModal] = useState(false);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [pendingResumeData, setPendingResumeData] = useState(null);
    const [showDataImportModal, setShowDataImportModal] = useState(false);
    
    // Estado de Sincronización
    const [googleScriptUrl, setGoogleScriptUrl] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    const [appState, setAppState] = useState('IDLE');
    const [defaultVehicleId, setDefaultVehicleId] = useState('PERSONAL');
    const [historyTab, setHistoryTab] = useState('TRIPS');
    const [dataLoaded, setDataLoaded] = useState(false);

    const [vehicleOdometers, setVehicleOdometers] = useState({
        PERSONAL: 10500, COMPANY_FUEL: 45200, COMPANY_ELECTRIC: 5000, OTHER: 0
    });
    
    const [lastLocation, setLastLocation] = useState('Casa');
    const [trips, setTrips] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [visits, setVisits] = useState([]);

    const [dashboardVehicleId, setDashboardVehicleId] = useState('PERSONAL');

    // UI States
    const [showLocationSelector, setShowLocationSelector] = useState(false);
    const [showOdometerEditor, setShowOdometerEditor] = useState(false);
    const [showVehicleSelector, setShowVehicleSelector] = useState(false);
    const [showExpenseCategorySelector, setShowExpenseCategorySelector] = useState(false);
    const [showDestinationModal, setShowDestinationModal] = useState(false); 
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [showParkingAskModal, setShowParkingAskModal] = useState(false);
    const [showChargeTypeModal, setShowChargeTypeModal] = useState(false); 
    const [showUpdatePrompt, setShowUpdatePrompt] = useState(false); 

    const [editingTrip, setEditingTrip] = useState(null);
    const [editingVisit, setEditingVisit] = useState(null);
    const [editingVehicleId, setEditingVehicleId] = useState('PERSONAL');
    
    const [locationSelectorMode, setLocationSelectorMode] = useState('ORIGIN'); 
    const [textModalTitle, setTextModalTitle] = useState('Nombre del Cliente');
    const [pendingStartData, setPendingStartData] = useState(null);

    // Configs
    const [vehicleConfigs, setVehicleConfigs] = useState({
        PERSONAL: { tollPrice: '162.00', fuelPrice: '78.02', kmValue: '14.24', currency: 'UYU' },
        COMPANY_FUEL: { tollPrice: '162.00', fuelPrice: '78.02', kmValue: '12.00', currency: 'UYU' },
        COMPANY_ELECTRIC: { tollPrice: '162.00', fuelPriceAC: '9.50', fuelPriceDC: '10.80', kmValue: '4.00', currency: 'UYU' }, 
        OTHER: { tollPrice: '162.00', fuelPrice: '78.02', kmValue: '20.00', currency: 'UYU' }
    });

    const [currentTrip, setCurrentTrip] = useState({
        startTime: null, vehicle: 'PERSONAL', origin: '', destination: '', startOdometer: 0, tripExpenses: []
    });

    const [expenseModalData, setExpenseModalData] = useState({
        isOpen: false, id: null, category: '', amount: '', currency: 'UYU', currencyType: 'UYU', method: 'EFECTIVO', type: 'Personal', notes: '', odometer: '', volume: '', unitPrice: null
    });

    const [inputOdometer, setInputOdometer] = useState('');
    const [inputDestination, setInputDestination] = useState(''); 
    const [showGapAlert, setShowGapAlert] = useState(false);
    const [gapKm, setGapKm] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    // --- CHECK VERSIÓN & INIT ---
    useEffect(() => {
        const checkAppVersion = async () => {
            try {
                const response = await fetch(`./version.json?t=${new Date().getTime()}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.version !== APP_VERSION) setShowUpdateAppModal(true);
                }
            } catch (error) { console.warn("Versión check fallido:", error); }
        };
        if (appState === 'IDLE') checkAppVersion();
    }, [appState]);

    const handleAppUpdateConfirm = async () => {
        if ('caches' in window) { (await caches.keys()).forEach(name => caches.delete(name)); }
        if ('serviceWorker' in navigator) { (await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister()); }
        window.location.reload(true);
    };

    const confirmResume = () => {
        if (pendingResumeData) {
            setAppState(pendingResumeData.appState);
            const restoredTrip = { ...pendingResumeData.currentTrip };
            if (restoredTrip.startTime) restoredTrip.startTime = new Date(restoredTrip.startTime);
            setCurrentTrip(restoredTrip);
        }
        setShowResumeModal(false);
        setPendingResumeData(null);
    };

    const discardResume = () => {
        window.dbHelper.set('app_state_persist', null);
        setShowResumeModal(false);
        setPendingResumeData(null);
        setAppState('IDLE');
    };

    // --- DB LOAD ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const [sTrips, sExpenses, sVisits, sOdos, sConfigs, sLoc, sState, sUrl] = await Promise.all([
                    window.dbHelper.get('trips'), window.dbHelper.get('expenses'), window.dbHelper.get('visits'),
                    window.dbHelper.get('odometers'), window.dbHelper.get('configs'), window.dbHelper.get('lastLocation'),
                    window.dbHelper.get('app_state_persist'), window.dbHelper.get('google_script_url')
                ]);

                if (sTrips) setTrips(sTrips);
                if (sExpenses) setExpenses(sExpenses);
                if (sVisits) setVisits(sVisits);
                if (sOdos) setVehicleOdometers(sOdos);
                if (sLoc) setLastLocation(sLoc);
                if (sConfigs) setVehicleConfigs(sConfigs);
                if (sUrl) setGoogleScriptUrl(sUrl);
                
                if (sState && sState.appState === 'ACTIVE') {
                     setPendingResumeData(sState);
                     setShowResumeModal(true);
                }
                setDataLoaded(true);
            } catch (error) { console.error("Error DB", error); setDataLoaded(true); }
        };
        loadData();
    }, []);

    // --- DB SAVE ---
    useEffect(() => { if(dataLoaded) {
        window.dbHelper.set('trips', trips);
        window.dbHelper.set('expenses', expenses);
        window.dbHelper.set('visits', visits);
        window.dbHelper.set('odometers', vehicleOdometers);
        window.dbHelper.set('configs', vehicleConfigs);
        window.dbHelper.set('lastLocation', lastLocation);
        window.dbHelper.set('app_state_persist', { appState, currentTrip });
        window.dbHelper.set('google_script_url', googleScriptUrl);
    }}, [trips, expenses, visits, vehicleOdometers, vehicleConfigs, lastLocation, appState, currentTrip, googleScriptUrl, dataLoaded]);

    // --- SYNC BIDIRECCIONAL INTELIGENTE ---
    const handleCloudSync = async () => {
        if (!googleScriptUrl) return;
        setIsSyncing(true);
        try {
            // Empaquetamos TODO para que el script lo guarde, incluyendo ESTADO DEL VIAJE
            const dataToSync = {
                trips,
                expenses,
                visits,
                vehicleOdometers,
                vehicleConfigs,
                lastLocation,
                // Enviamos el estado actual para que se guarde en la nube
                currentTripState: {
                    appState,
                    currentTrip,
                    lastUpdated: new Date().toISOString()
                }
            };
            
            if (!window.GoogleSheetSync) throw new Error("Servicio de sincronización no cargado.");
            
            const result = await window.GoogleSheetSync.syncData(googleScriptUrl, dataToSync);
            
            if (result.status === 'success' && result.data) {
                const cloud = result.data;
                
                // 1. ACTUALIZAR DATOS MAESTROS
                if (cloud.trips) setTrips(cloud.trips);
                if (cloud.expenses) setExpenses(cloud.expenses);
                if (cloud.vehicleOdometers) setVehicleOdometers(cloud.vehicleOdometers);
                if (cloud.vehicleConfigs) setVehicleConfigs(cloud.vehicleConfigs);
                
                // 2. ACTUALIZAR UBICACIÓN Y ESTADO DEL VIAJE (CRÍTICO)
                if (cloud.appStateData) {
                    const cloudState = cloud.appStateData; // Datos que vienen de la pestaña APP_STATE del Sheet
                    
                    // Si la nube tiene una ubicación más reciente o diferente, la adoptamos
                    if (cloudState.lastLocation && cloudState.lastLocation !== lastLocation) {
                        setLastLocation(cloudState.lastLocation);
                    }

                    // --- LÓGICA DE CONTINUIDAD DE VIAJE ---
                    // Si la nube dice que hay un viaje activo y nosotros estamos en IDLE...
                    if (cloudState.tripStatus === 'ACTIVE' && appState === 'IDLE') {
                        const confirmContinue = window.confirm(
                            `Se detectó un viaje activo en otro dispositivo desde: ${cloudState.tripOrigin}.\n\n¿Deseas continuar este viaje aquí?`
                        );
                        
                        if (confirmContinue) {
                            setAppState('ACTIVE');
                            setCurrentTrip({
                                ...currentTrip,
                                startTime: new Date(cloudState.tripStartTime), // Importante: convertir string a Date
                                origin: cloudState.tripOrigin,
                                vehicle: cloudState.tripVehicle,
                                startOdometer: parseInt(cloudState.tripStartOdo || 0),
                                tripExpenses: [] // Los gastos anteriores ya deberían estar en 'expenses' si se sincronizaron
                            });
                        }
                    }
                }

                // Reconstruir Visitas
                if (cloud.visits && cloud.trips) {
                    const hydratedVisits = cloud.visits.map(v => ({
                        ...v,
                        inboundTrip: cloud.trips.find(t => String(t.id) === String(v.inboundTripId)) || null,
                        outboundTrip: cloud.trips.find(t => String(t.id) === String(v.outboundTripId)) || null
                    }));
                    setVisits(hydratedVisits);
                }

                alert("✅ Sincronización completa. Estado actualizado.");
            } else {
                alert("⚠️ " + (result.message || "Error en el servidor."));
            }
        } catch (error) {
            console.error(error);
            alert("❌ Error de conexión: " + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    // --- TIMER ---
    useEffect(() => {
        let interval;
        if (appState === 'ACTIVE' && currentTrip.startTime) {
            const startTimestamp = new Date(currentTrip.startTime).getTime();
            setElapsedTime(Math.floor((Date.now() - startTimestamp) / 1000));
            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTimestamp) / 1000));
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [appState, currentTrip.startTime]);

    // --- LOGIC HELPERS ---
    const getActiveConfig = () => {
        const vId = (appState === 'ACTIVE' || appState === 'ENDING' || appState === 'STARTING') ? currentTrip.vehicle : dashboardVehicleId; 
        return vehicleConfigs[vId] || vehicleConfigs['PERSONAL'];
    };

    const handleUpdateRates = () => {
        const updatedConfigs = { ...vehicleConfigs };
        Object.keys(updatedConfigs).forEach(key => {
            updatedConfigs[key].tollPrice = OFFICIAL_RATES.toll;
            if(updatedConfigs[key].fuelPrice) updatedConfigs[key].fuelPrice = OFFICIAL_RATES.fuel;
            if(updatedConfigs[key].fuelPriceAC) updatedConfigs[key].fuelPriceAC = OFFICIAL_RATES.electricAC;
            if(updatedConfigs[key].fuelPriceDC) updatedConfigs[key].fuelPriceDC = OFFICIAL_RATES.electricDC;
        });
        setVehicleConfigs(updatedConfigs);
        setShowUpdatePrompt(false);
    };

    const handleStartPress = () => {
        setInputOdometer(vehicleOdometers[dashboardVehicleId].toString());
        setInputDestination('');
        setCurrentTrip({ startTime: null, vehicle: dashboardVehicleId, origin: lastLocation, destination: '', startOdometer: 0, tripExpenses: [] });
        setAppState('STARTING');
    };

    const confirmStartTrip = (destinationOverride = undefined) => {
        const inputOdoVal = parseInt(inputOdometer) || 0;
        const currentVehicleOdo = vehicleOdometers[currentTrip.vehicle];
        if (inputOdoVal > currentVehicleOdo) {
            setGapKm(inputOdoVal - currentVehicleOdo);
            setShowGapAlert(true);
            if (destinationOverride) setInputDestination(destinationOverride);
            return;
        }
        const isOriginClient = lastLocation.toLowerCase().includes('cliente') || ['Otra', 'Otro'].includes(lastLocation);
        if (isOriginClient && !currentTrip.tripExpenses.some(e => e.category === 'Estacionamiento')) {
            setPendingStartData({ odo: inputOdoVal, dest: destinationOverride });
            setShowParkingAskModal(true);
            return;
        }
        startTripProcess(inputOdoVal, destinationOverride);
    };

    const startTripProcess = (startOdo, destinationOverride = undefined) => {
        setCurrentTrip(prev => ({ ...prev, startTime: new Date(), origin: lastLocation, destination: destinationOverride !== undefined ? destinationOverride : inputDestination, startOdometer: startOdo }));
        setAppState('ACTIVE');
    };

    const handleArrivePress = () => {
        const lastKnown = Math.max(vehicleOdometers[currentTrip.vehicle] || 0, parseInt(currentTrip.startOdometer) || 0);
        setInputOdometer((lastKnown + 1).toString());
        setInputDestination(currentTrip.destination || '');
        setAppState('ENDING');
    };

    const confirmEndTrip = () => {
        const endOdo = parseInt(inputOdometer) || 0;
        const distance = endOdo - currentTrip.startOdometer;
        const safeStartTime = currentTrip.startTime instanceof Date ? currentTrip.startTime : new Date();
        const safeEndTime = new Date();
        const newTrip = {
            id: Date.now(),
            date: safeEndTime.toLocaleDateString(),
            startTime: currentTrip.startTime instanceof Date ? currentTrip.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "00:00",
            endTime: safeEndTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            origin: currentTrip.origin || 'Desconocido',
            destination: inputDestination || 'Desconocido',
            distance: distance > 0 ? distance : 0,
            vehicle: currentTrip.vehicle,
            expenses: currentTrip.tripExpenses,
            status: 'CLOSED',
            startOdometer: currentTrip.startOdometer,
            endOdometer: endOdo,
            updatedAt: new Date().toISOString()
        };
        setTrips(prev => [newTrip, ...prev]);
        
        if (newTrip.origin.toLowerCase().startsWith('cliente')) {
            setVisits(prev => {
                const idx = prev.findIndex(v => v.client === newTrip.origin && v.status === 'OPEN');
                if (idx !== -1) { const updated = [...prev]; updated[idx] = { ...updated[idx], outboundTrip: newTrip, status: 'COMPLETED', updatedAt: new Date().toISOString() }; return updated; }
                return prev;
            });
        }
        if (newTrip.destination.toLowerCase().startsWith('cliente')) {
            setVisits(prev => [{ id: Date.now() + '_visit', client: newTrip.destination, date: newTrip.date, inboundTrip: newTrip, outboundTrip: null, status: 'OPEN', updatedAt: new Date().toISOString() }, ...prev]);
        }

        setVehicleOdometers(prev => ({ ...prev, [currentTrip.vehicle]: endOdo }));
        setLastLocation(inputDestination);
        setAppState('IDLE');
        window.dbHelper.set('app_state_persist', null);
    };

    const updateDashboardOdometer = (newVal) => {
        const val = parseInt(newVal);
        if (!isNaN(val)) {
            setVehicleOdometers(prev => ({ ...prev, [dashboardVehicleId]: val }));
        }
        setShowOdometerEditor(false);
    };

    const handleLocationSelection = (loc) => {
        if (locationSelectorMode === 'ORIGIN') {
            if (loc === 'Cliente') { setTextModalTitle('Nombre del Cliente'); setShowDestinationModal(true); } 
            else if (loc === 'Otra') { setTextModalTitle('Punto de Partida'); setShowDestinationModal(true); } 
            else { setLastLocation(loc); setShowLocationSelector(false); }
        } else {
            if (loc === 'Cliente') { setTextModalTitle('Nombre del Cliente'); setShowDestinationModal(true); } 
            else if (loc === 'Otra') { setTextModalTitle('¿Hacia dónde vas?'); setShowDestinationModal(true); } 
            else { 
                setInputDestination(loc); 
                if (appState === 'STARTING') confirmStartTrip(loc);
                setShowLocationSelector(false); 
            }
        }
    };

    const updateVehicleConfig = (field, value) => {
        setVehicleConfigs(prev => ({ ...prev, [editingVehicleId]: { ...prev[editingVehicleId], [field]: value } }));
    };

    const handleChargeTypeSelection = (type) => {
        setShowChargeTypeModal(false);
        const activeConfig = getActiveConfig();
        let price = 0;
        if (type === 'AC') price = parseFloat(activeConfig.fuelPriceAC || 0);
        else if (type === 'DC') price = parseFloat(activeConfig.fuelPriceDC || 0);
        openExpenseModalLogic('Carga Eléctrica', formatMoney(price));
    };

    const handleExportData = () => {
        const dataToExport = { trips, expenses, visits, vehicleOdometers, vehicleConfigs, lastLocation, exportDate: new Date().toISOString(), appVersion: APP_VERSION };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    const handleImportData = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (!importedData.trips) { alert("Archivo inválido"); return; }
                setTrips(importedData.trips || []);
                setExpenses(importedData.expenses || []);
                setVisits(importedData.visits || []);
                setVehicleOdometers(importedData.vehicleOdometers || vehicleOdometers);
                setVehicleConfigs(importedData.vehicleConfigs || vehicleConfigs);
                setLastLocation(importedData.lastLocation || lastLocation);
                setShowDataImportModal(false);
                alert("Datos importados.");
            } catch (error) { console.error(error); alert("Error al importar."); }
        };
        reader.readAsText(file);
    };

    const openExpenseModalLogic = (category, amountOverride = null, expenseToEdit = null) => {
        const currentVId = (appState === 'ACTIVE' || appState === 'ENDING' || appState === 'STARTING') ? currentTrip.vehicle : dashboardVehicleId;
        const currentOdo = vehicleOdometers[currentVId] || 0;
        const activeConfig = getActiveConfig();

        if (expenseToEdit) {
            setExpenseModalData({ ...expenseModalData, isOpen: true, ...expenseToEdit, unitPrice: null });
        } else {
            let defaults = { amount: '', currency: 'UYU', method: 'CREDITO', type: 'Empresa', unitPrice: null };
            if (category === 'Peaje') defaults = { amount: formatMoney(activeConfig.tollPrice), currency: activeConfig.currency, method: 'DEBITO', type: 'Personal', unitPrice: null };
            else if (['Carga Combustible', 'Combustible'].includes(category)) defaults = { ...defaults, method: 'CREDITO', type: 'Personal', unitPrice: activeConfig.fuelPrice };
            else if (category === 'Carga Eléctrica') defaults = { ...defaults, method: 'CREDITO', type: 'Personal', unitPrice: amountOverride || activeConfig.fuelPriceAC };
            
            setExpenseModalData({ 
                isOpen: true, id: null, category, amount: defaults.amount, currency: defaults.currency, 
                currencyType: ['UYU', 'U$D'].includes(defaults.currency) ? defaults.currency : 'Otro',
                method: defaults.method, type: defaults.type, notes: '', odometer: currentOdo, volume: '', unitPrice: defaults.unitPrice 
            });
        }
        setShowExpenseCategorySelector(false);
    };

    const confirmExpense = () => {
        const newExpense = {
            id: expenseModalData.id || Date.now(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            category: expenseModalData.category,
            amount: parseFloat(expenseModalData.amount) || 0,
            currency: expenseModalData.currency,
            method: expenseModalData.method,
            type: expenseModalData.type,
            notes: expenseModalData.notes,
            odometer: expenseModalData.odometer,
            volume: expenseModalData.volume,
            tripId: currentTrip.startTime ? 'current_trip' : 'loose_expense',
            updatedAt: new Date().toISOString()
        };

        const isCharge = ['Carga Combustible', 'Carga Eléctrica'].includes(expenseModalData.category);
        const currentVId = (appState === 'ACTIVE' || appState === 'ENDING' || appState === 'STARTING') ? currentTrip.vehicle : dashboardVehicleId;
        
        if (isCharge && expenseModalData.odometer) {
             const newOdo = parseInt(expenseModalData.odometer);
             if (!isNaN(newOdo) && newOdo > vehicleOdometers[currentVId]) {
                 setVehicleOdometers(prev => ({ ...prev, [currentVId]: newOdo }));
             }
        }

        if (expenseModalData.id) {
            setExpenses(prev => prev.map(e => e.id === expenseModalData.id ? newExpense : e));
        } else {
            if (['ACTIVE', 'ENDING', 'STARTING'].includes(appState)) {
                setCurrentTrip(prev => ({ ...prev, tripExpenses: [...prev.tripExpenses, newExpense] }));
            }
            setExpenses(prev => [newExpense, ...prev]);
        }
        setExpenseModalData({ ...expenseModalData, isOpen: false });
        
        if (appState === 'STARTING' && pendingStartData && expenseModalData.category === 'Estacionamiento') {
             startTripProcess(pendingStartData.odo, pendingStartData.dest);
             setPendingStartData(null);
        }
    };
    
    // --- EDIT HANDLERS ---
    const saveEditedTrip = (updatedTrip) => {
        const tripWithDate = { ...updatedTrip, updatedAt: new Date().toISOString() };
        setTrips(prev => prev.map(t => t.id === updatedTrip.id ? tripWithDate : t));
        setEditingTrip(null);
    };

    const saveEditedVisit = (updatedVisit) => {
        const visitWithDate = { ...updatedVisit, updatedAt: new Date().toISOString() };
        setVisits(prev => prev.map(v => v.id === updatedVisit.id ? visitWithDate : v));
        setEditingVisit(null);
    };

    const deleteTrip = (tripId) => {
        setTrips(prev => prev.filter(t => t.id !== tripId));
        setEditingTrip(null);
    };
    
    const deleteVisit = (visitId) => {
        setVisits(prev => prev.filter(v => v.id !== visitId));
        setEditingVisit(null);
    };

    // --- RENDER ---
    return (
        <div className="flex flex-col h-screen w-full max-w-md mx-auto shadow-2xl overflow-hidden font-sans relative bg-slate-100">
            <UpdateAppModal isOpen={showUpdateAppModal} onClose={() => setShowUpdateAppModal(false)} onConfirm={handleAppUpdateConfirm} />
            <ResumeTripModal isOpen={showResumeModal} onResume={confirmResume} onDiscard={discardResume} />
            <DataImportModal isOpen={showDataImportModal} onClose={() => setShowDataImportModal(false)} onImport={() => document.getElementById('file-upload').click()} />
            <input type="file" id="file-upload" className="hidden" accept=".json" onChange={handleImportData} />

            <ExpenseModal 
                isOpen={expenseModalData.isOpen} 
                onClose={(action) => {
                    if (action === 'DELETE') {
                        if (expenseModalData.id) setExpenses(prev => prev.filter(e => e.id !== expenseModalData.id));
                        setExpenseModalData({...expenseModalData, isOpen: false});
                    } else setExpenseModalData({...expenseModalData, isOpen: false})
                }} 
                onConfirm={confirmExpense}
                expenseData={expenseModalData}
                setExpenseData={setExpenseModalData}
            />

            <CategorySelector isOpen={showExpenseCategorySelector} onClose={() => setShowExpenseCategorySelector(false)} onSelect={openExpenseModalLogic} />
            <ChargeTypeModal isOpen={showChargeTypeModal} onClose={() => setShowChargeTypeModal(false)} onSelectType={handleChargeTypeSelection} />

            <DestinationInputModal
                isOpen={showDestinationModal}
                title={textModalTitle}
                placeholder="Ej. Empresa X"
                initialValue=""
                onClose={() => setShowDestinationModal(false)}
                onConfirm={(name) => {
                    const finalName = name.trim();
                    const fmtName = (textModalTitle.includes('Cliente') && !finalName.toLowerCase().startsWith('cliente')) ? `Cliente: ${finalName}` : finalName;
                    
                    if (locationSelectorMode === 'ORIGIN') {
                        setLastLocation(fmtName);
                        setShowDestinationModal(false);
                        setShowLocationSelector(false);
                    } else {
                        setInputDestination(fmtName);
                        setShowDestinationModal(false);
                        if (appState === 'STARTING') confirmStartTrip(fmtName);
                        setShowLocationSelector(false);
                    }
                }}
            />

            <ParkingAskModal 
                isOpen={showParkingAskModal}
                onClose={() => setShowParkingAskModal(false)}
                onNo={() => { setShowParkingAskModal(false); if(pendingStartData) startTripProcess(pendingStartData.odo, pendingStartData.dest); }}
                onYes={() => { setShowParkingAskModal(false); openExpenseModalLogic('Estacionamiento'); }}
            />

            <UpdatePromptModal isOpen={showUpdatePrompt} onClose={() => setShowUpdatePrompt(false)} onConfirm={handleUpdateRates} changes={rateChanges} />
            
            <TripEditModal 
                isOpen={!!editingTrip}
                trip={editingTrip}
                onClose={() => setEditingTrip(null)}
                onSave={saveEditedTrip}
                onDelete={deleteTrip}
            />
            
            <VisitEditModal 
                isOpen={!!editingVisit}
                visit={editingVisit}
                onClose={() => setEditingVisit(null)}
                onSave={saveEditedVisit}
                onDelete={deleteVisit}
            />

            {/* ROUTER DE VISTAS */}
            {appState === 'IDLE' && (
                <HomeView 
                    vehicleOdometers={vehicleOdometers} dashboardVehicleId={dashboardVehicleId} lastLocation={lastLocation} trips={trips}
                    showLocationSelector={showLocationSelector} setShowLocationSelector={setShowLocationSelector}
                    showVehicleSelector={showVehicleSelector} setShowVehicleSelector={setShowVehicleSelector}
                    showOdometerEditor={showOdometerEditor} setShowOdometerEditor={setShowOdometerEditor}
                    setDashboardVehicleId={setDashboardVehicleId} updateDashboardOdometer={updateDashboardOdometer}
                    setLocationSelectorMode={setLocationSelectorMode} setLastLocation={setLastLocation} handleLocationSelection={handleLocationSelection}
                    setAppState={setAppState} handleStartPress={handleStartPress} openExpenseModal={openExpenseModalLogic}
                    setShowExpenseCategorySelector={setShowExpenseCategorySelector} setShowChargeTypeModal={setShowChargeTypeModal} setEditingTrip={setEditingTrip}
                />
            )}

            {appState === 'STARTING' && (
                <StartingView 
                    showGapAlert={showGapAlert} gapKm={gapKm} setShowGapAlert={setShowGapAlert} startTripProcess={startTripProcess}
                    inputOdometer={inputOdometer} setInputOdometer={setInputOdometer} showLocationSelector={showLocationSelector}
                    setShowLocationSelector={setShowLocationSelector} locationSelectorMode={locationSelectorMode} lastLocation={lastLocation}
                    inputDestination={inputDestination} setInputDestination={setInputDestination} handleLocationSelection={handleLocationSelection}
                    showVehicleSelector={showVehicleSelector} setShowVehicleSelector={setShowVehicleSelector}
                    currentTrip={currentTrip} setCurrentTrip={setCurrentTrip} vehicleOdometers={vehicleOdometers}
                    setLocationSelectorMode={setLocationSelectorMode} setTextModalTitle={setTextModalTitle} setShowDestinationModal={setShowDestinationModal}
                    confirmStartTrip={confirmStartTrip} setAppState={setAppState} openExpenseModal={openExpenseModalLogic}
                />
            )}

            {appState === 'ACTIVE' && (
                <ActiveTripView 
                    currentTrip={currentTrip} elapsedTime={elapsedTime} setAppState={setAppState}
                    openExpenseModal={openExpenseModalLogic} getActiveConfig={getActiveConfig}
                    setShowChargeTypeModal={setShowChargeTypeModal} setShowExpenseCategorySelector={setShowExpenseCategorySelector}
                    handleArrivePress={handleArrivePress}
                />
            )}

            {appState === 'ENDING' && (
                <EndingTripView 
                    inputOdometer={inputOdometer} setInputOdometer={setInputOdometer} currentTrip={currentTrip}
                    setLocationSelectorMode={setLocationSelectorMode} handleLocationSelection={handleLocationSelection}
                    inputDestination={inputDestination} openExpenseModal={openExpenseModalLogic} confirmEndTrip={confirmEndTrip}
                />
            )}

            {appState === 'SETTINGS' && (
                <SettingsView 
                    vehicleConfigs={vehicleConfigs} editingVehicleId={editingVehicleId} setEditingVehicleId={setEditingVehicleId}
                    updateVehicleConfig={updateVehicleConfig} setShowSaveConfirmation={setShowSaveConfirmation}
                    setAppState={setAppState} showSaveConfirmation={showSaveConfirmation}
                    handleExportData={handleExportData} setShowDataImportModal={setShowDataImportModal}
                    // Props nuevas para sync
                    googleScriptUrl={googleScriptUrl} setGoogleScriptUrl={setGoogleScriptUrl} 
                    handleCloudSync={handleCloudSync} isSyncing={isSyncing}
                />
            )}

            {appState === 'HISTORY' && (
                <HistoryView 
                    historyTab={historyTab} setHistoryTab={setHistoryTab} trips={trips} visits={visits} expenses={expenses}
                    setAppState={setAppState} setEditingTrip={setEditingTrip} setEditingVisit={setEditingVisit} openExpenseModal={openExpenseModalLogic}
                />
            )}
        </div>
    );
};