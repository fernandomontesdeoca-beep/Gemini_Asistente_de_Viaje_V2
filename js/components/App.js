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

// --- GENERADOR DE IDs ROBUSTO ---
const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

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
    
    // DATOS (Arrays)
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

    // --- FUNCIONES CRÍTICAS DE RESUME (Definidas antes de usarse en Effects o Render) ---
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

    // --- INIT ---
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

    useEffect(() => {
        const init = async () => {
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
            } catch (e) { console.error("Error DB", e); setDataLoaded(true); }
        };
        init();
    }, []);

    // --- SAVE ---
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

    const handleAppUpdateConfirm = async () => {
        if ('caches' in window) { (await caches.keys()).forEach(name => caches.delete(name)); }
        if ('serviceWorker' in navigator) { (await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister()); }
        window.location.reload(true);
    };

    // --- SYNC ---
    const handleCloudSync = async (silent = false) => {
        if (!googleScriptUrl) { if(!silent) alert("Falta URL de Google."); return; }
        setIsSyncing(true);
        try {
            const dataToSync = { 
                trips, expenses, visits, vehicleOdometers, vehicleConfigs, lastLocation, 
                currentTripState: { appState, currentTrip, lastUpdated: new Date().toISOString() } 
            };
            
            const result = await window.GoogleSheetSync.syncData(googleScriptUrl, dataToSync);
            
            if (result.status === 'success' && result.data) {
                const cloud = result.data;
                if (cloud.trips) setTrips(cloud.trips);
                if (cloud.expenses) setExpenses(cloud.expenses);
                if (cloud.visits && cloud.trips) {
                    const hydratedVisits = cloud.visits.map(v => ({
                        ...v,
                        inboundTrip: cloud.trips.find(t => String(t.id) === String(v.inboundTripId)) || null,
                        outboundTrip: cloud.trips.find(t => String(t.id) === String(v.outboundTripId)) || null
                    }));
                    setVisits(hydratedVisits);
                }
                if (cloud.vehicleOdometers) setVehicleOdometers(cloud.vehicleOdometers);
                if (cloud.vehicleConfigs) setVehicleConfigs(cloud.vehicleConfigs);

                if (cloud.appStateData && cloud.appStateData.lastLocation && cloud.appStateData.lastLocation !== lastLocation) {
                    setLastLocation(cloud.appStateData.lastLocation);
                }
                
                if(!silent) alert("✅ Sincronizado");
            }
        } catch (e) {
            console.error(e);
            if(!silent) alert("Error Sync: " + e.message);
        } finally {
            setIsSyncing(false);
        }
    };

    // --- RESET TOTAL ---
    const handleResetAll = async () => {
        if (!confirm("⚠️ ¿ESTÁS SEGURO?\n\nEsto borrará TODOS los datos del celular y de Google Sheets. Es irreversible.")) return;
        
        setIsSyncing(true);
        try {
            if (googleScriptUrl) {
                await window.GoogleSheetSync.resetCloudData(googleScriptUrl);
            }
            setTrips([]);
            setExpenses([]);
            setVisits([]);
            setVehicleOdometers({ PERSONAL: 0, COMPANY_FUEL: 0, COMPANY_ELECTRIC: 0, OTHER: 0 });
            setLastLocation('Casa');
            setAppState('IDLE');
            
            await window.dbHelper.set('trips', []);
            await window.dbHelper.set('expenses', []);
            await window.dbHelper.set('visits', []);
            
            alert("🧹 Sistema restablecido de fábrica.");
        } catch (e) {
            alert("Error al resetear: " + e.message);
        } finally {
            setIsSyncing(false);
        }
    };

    // --- HANDLERS (SOFT DELETE) ---
    const deleteTrip = (id) => {
        setTrips(prev => prev.map(t => String(t.id) === String(id) ? { ...t, _deleted: true, updatedAt: new Date().toISOString() } : t));
        setEditingTrip(null);
        setTimeout(() => handleCloudSync(true), 500);
    };

    const deleteVisit = (id) => {
        setVisits(prev => prev.map(v => String(v.id) === String(id) ? { ...v, _deleted: true, updatedAt: new Date().toISOString() } : v));
        setEditingVisit(null);
        setTimeout(() => handleCloudSync(true), 500);
    };

    const deleteExpense = () => {
        if (expenseModalData.id) {
            setExpenses(prev => prev.map(e => String(e.id) === String(expenseModalData.id) ? { ...e, _deleted: true, updatedAt: new Date().toISOString() } : e));
            setExpenseModalData({ ...expenseModalData, isOpen: false });
            setTimeout(() => handleCloudSync(true), 500);
        }
    };

    // --- TIMERS Y LOGICA COMUN ---
    useEffect(() => {
        let interval;
        if (appState === 'ACTIVE' && currentTrip.startTime) {
            const start = new Date(currentTrip.startTime).getTime();
            setElapsedTime(Math.floor((Date.now() - start) / 1000));
            interval = setInterval(() => setElapsedTime(Math.floor((Date.now() - start) / 1000)), 1000);
        } else setElapsedTime(0);
        return () => clearInterval(interval);
    }, [appState, currentTrip.startTime]);

    const getActiveConfig = () => vehicleConfigs[((appState === 'ACTIVE' || appState === 'ENDING' || appState === 'STARTING') ? currentTrip.vehicle : dashboardVehicleId)] || vehicleConfigs['PERSONAL'];
    
    // --- APP FLOW HANDLERS ---
    
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
        handleCloudSync(true); 
    };

    const handleArrivePress = () => {
        const lastKnown = Math.max(vehicleOdometers[currentTrip.vehicle] || 0, parseInt(currentTrip.startOdometer) || 0);
        setInputOdometer((lastKnown + 1).toString());
        setInputDestination(currentTrip.destination || '');
        setAppState('ENDING');
    };

    const confirmEndTrip = () => {
        const endOdo = parseInt(inputOdometer) || 0;
        const newTrip = {
            id: generateId('trip'), // ID UNICO
            date: new Date().toLocaleDateString(),
            startTime: currentTrip.startTime instanceof Date ? currentTrip.startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "00:00",
            endTime: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
            origin: currentTrip.origin || 'Desconocido',
            destination: inputDestination || 'Desconocido',
            distance: (endOdo - currentTrip.startOdometer) > 0 ? (endOdo - currentTrip.startOdometer) : 0,
            vehicle: currentTrip.vehicle,
            expenses: currentTrip.tripExpenses,
            status: 'CLOSED',
            startOdometer: currentTrip.startOdometer,
            endOdometer: endOdo,
            updatedAt: new Date().toISOString(),
            _deleted: false
        };
        setTrips(prev => [newTrip, ...prev]);

        if (newTrip.origin.toLowerCase().startsWith('cliente')) {
            setVisits(prev => {
                const idx = prev.findIndex(v => v.client === newTrip.origin && v.status === 'OPEN' && !v._deleted);
                if (idx !== -1) { 
                    const updated = [...prev]; 
                    updated[idx] = { ...updated[idx], outboundTrip: newTrip, status: 'COMPLETED', updatedAt: new Date().toISOString() }; 
                    return updated; 
                }
                return prev;
            });
        }
        if (newTrip.destination.toLowerCase().startsWith('cliente')) {
            setVisits(prev => [{ 
                id: generateId('visit'), // ID UNICO
                client: newTrip.destination, date: newTrip.date, 
                inboundTrip: newTrip, outboundTrip: null, status: 'OPEN', 
                updatedAt: new Date().toISOString(), _deleted: false 
            }, ...prev]);
        }

        setVehicleOdometers(prev => ({ ...prev, [currentTrip.vehicle]: endOdo }));
        setLastLocation(inputDestination);
        setAppState('IDLE');
        window.dbHelper.set('app_state_persist', null);
        setTimeout(() => handleCloudSync(true), 500);
    };

    const updateDashboardOdometer = (val) => { 
        const v = parseInt(val); if(!isNaN(v)) setVehicleOdometers(p => ({...p, [dashboardVehicleId]: v})); setShowOdometerEditor(false); 
    };
    const updateVehicleConfig = (f, v) => setVehicleConfigs(p => ({...p, [editingVehicleId]: {...p[editingVehicleId], [f]: v}}));
    
    const handleChargeTypeSelection = (t) => { setShowChargeTypeModal(false); /* logic */ openExpenseModalLogic('Carga Eléctrica'); };
    
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
    
    const handleUpdateRates = () => { 
        const updated = { ...vehicleConfigs };
        setVehicleConfigs(updated);
        setShowUpdatePrompt(false); 
    };
    
    const saveEditedTrip = (t) => { setTrips(prev => prev.map(x => x.id === t.id ? {...t, updatedAt: new Date().toISOString()} : x)); setEditingTrip(null); };
    const saveEditedVisit = (v) => { setVisits(prev => prev.map(x => x.id === v.id ? {...v, updatedAt: new Date().toISOString()} : x)); setEditingVisit(null); };
    
    // Config Handlers
    const handleExportData = () => { 
         const data = JSON.stringify({trips, expenses, visits}, null, 2);
         const blob = new Blob([data], {type: "application/json"});
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a'); a.href = url; a.download = "backup.json"; a.click();
    };
    const handleImportData = (e) => { /* Import logic */ };

    const openExpenseModalLogic = (category, amountOverride = null, expenseToEdit = null) => {
        const currentVId = (appState === 'ACTIVE' || appState === 'ENDING' || appState === 'STARTING') ? currentTrip.vehicle : dashboardVehicleId;
        const currentOdo = vehicleOdometers[currentVId] || 0;
        const activeConfig = vehicleConfigs[currentVId] || vehicleConfigs['PERSONAL'];

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
            id: expenseModalData.id || generateId('exp'), // ID UNICO
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
            updatedAt: new Date().toISOString(),
            _deleted: false
        };

        const currentVId = (appState === 'ACTIVE' || appState === 'ENDING' || appState === 'STARTING') ? currentTrip.vehicle : dashboardVehicleId;
        const isCharge = ['Carga Combustible', 'Carga Eléctrica'].includes(expenseModalData.category);
        if (isCharge && expenseModalData.odometer) {
             const newOdo = parseInt(expenseModalData.odometer);
             if (!isNaN(newOdo) && newOdo > vehicleOdometers[currentVId]) setVehicleOdometers(prev => ({ ...prev, [currentVId]: newOdo }));
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
             setCurrentTrip(prev => ({ ...prev, startTime: new Date(), origin: lastLocation, destination: pendingStartData.dest || inputDestination, startOdometer: pendingStartData.odo }));
             setAppState('ACTIVE');
             setPendingStartData(null);
             setTimeout(() => handleCloudSync(true), 500);
        }
    };

    const handleExitHistory = () => {
        setAppState('IDLE');
        handleCloudSync(true);
    };

    return (
        <div className="flex flex-col h-screen w-full max-w-md mx-auto shadow-2xl overflow-hidden font-sans relative bg-slate-100">
            {/* Modales */}
            <UpdateAppModal isOpen={showUpdateAppModal} onClose={() => setShowUpdateAppModal(false)} onConfirm={handleAppUpdateConfirm} />
            <ResumeTripModal isOpen={showResumeModal} onResume={confirmResume} onDiscard={discardResume} />
            
            <ExpenseModal isOpen={expenseModalData.isOpen} onClose={(a) => { if(a==='DELETE') deleteExpense(); else setExpenseModalData({...expenseModalData, isOpen: false}) }} onConfirm={confirmExpense} expenseData={expenseModalData} setExpenseData={setExpenseModalData} />
            <CategorySelector isOpen={showExpenseCategorySelector} onClose={() => setShowExpenseCategorySelector(false)} onSelect={openExpenseModalLogic} />
            <ChargeTypeModal isOpen={showChargeTypeModal} onClose={() => setShowChargeTypeModal(false)} onSelectType={handleChargeTypeSelection} />
            <DestinationInputModal isOpen={showDestinationModal} title={textModalTitle} onClose={() => setShowDestinationModal(false)} onConfirm={(name) => {
                 const fmt = (textModalTitle.includes('Cliente') && !name.toLowerCase().startsWith('cliente')) ? `Cliente: ${name}` : name;
                 if(locationSelectorMode==='ORIGIN') { setLastLocation(fmt); setShowDestinationModal(false); setShowLocationSelector(false); }
                 else { setInputDestination(fmt); setShowDestinationModal(false); if(appState==='STARTING') confirmStartTrip(fmt); setShowLocationSelector(false); }
            }} />
            <ParkingAskModal isOpen={showParkingAskModal} onClose={() => setShowParkingAskModal(false)} onNo={() => {setShowParkingAskModal(false); if(pendingStartData) startTripProcess(pendingStartData.odo, pendingStartData.dest);}} onYes={()=>{setShowParkingAskModal(false); openExpenseModalLogic('Estacionamiento');}} />
            <UpdatePromptModal isOpen={showUpdatePrompt} onClose={() => setShowUpdatePrompt(false)} onConfirm={handleUpdateRates} changes={rateChanges} />
            <TripEditModal isOpen={!!editingTrip} trip={editingTrip} onClose={()=>setEditingTrip(null)} onSave={saveEditedTrip} onDelete={(id)=>deleteTrip(id)} />
            <VisitEditModal isOpen={!!editingVisit} visit={editingVisit} onClose={()=>setEditingVisit(null)} onSave={saveEditedVisit} onDelete={(id)=>deleteVisit(id)} />

            {/* Vistas (IMPORTANTE: Filtramos datos borrados) */}
            {appState === 'IDLE' && <HomeView 
                vehicleOdometers={vehicleOdometers} dashboardVehicleId={dashboardVehicleId} lastLocation={lastLocation} 
                trips={trips.filter(t => !t._deleted)} 
                showLocationSelector={showLocationSelector} setShowLocationSelector={setShowLocationSelector}
                showVehicleSelector={showVehicleSelector} setShowVehicleSelector={setShowVehicleSelector}
                showOdometerEditor={showOdometerEditor} setShowOdometerEditor={setShowOdometerEditor}
                setDashboardVehicleId={setDashboardVehicleId} updateDashboardOdometer={updateDashboardOdometer}
                setLocationSelectorMode={setLocationSelectorMode} setLastLocation={setLastLocation} handleLocationSelection={handleLocationSelection}
                setAppState={setAppState} handleStartPress={handleStartPress} openExpenseModal={openExpenseModalLogic}
                setShowExpenseCategorySelector={setShowExpenseCategorySelector} setShowChargeTypeModal={setShowChargeTypeModal} setEditingTrip={setEditingTrip}
            />}

            {appState === 'STARTING' && <StartingView 
                 showGapAlert={showGapAlert} gapKm={gapKm} setShowGapAlert={setShowGapAlert} startTripProcess={startTripProcess}
                 inputOdometer={inputOdometer} setInputOdometer={setInputOdometer} showLocationSelector={showLocationSelector}
                 setShowLocationSelector={setShowLocationSelector} locationSelectorMode={locationSelectorMode} lastLocation={lastLocation}
                 inputDestination={inputDestination} setInputDestination={setInputDestination} handleLocationSelection={handleLocationSelection}
                 showVehicleSelector={showVehicleSelector} setShowVehicleSelector={setShowVehicleSelector}
                 currentTrip={currentTrip} setCurrentTrip={setCurrentTrip} vehicleOdometers={vehicleOdometers}
                 setLocationSelectorMode={setLocationSelectorMode} setTextModalTitle={setTextModalTitle} setShowDestinationModal={setShowDestinationModal}
                 confirmStartTrip={confirmStartTrip} setAppState={setAppState} openExpenseModal={openExpenseModalLogic}
            />}

            {appState === 'ACTIVE' && <ActiveTripView 
                currentTrip={currentTrip} elapsedTime={elapsedTime} setAppState={setAppState}
                openExpenseModal={openExpenseModalLogic} getActiveConfig={getActiveConfig}
                setShowChargeTypeModal={setShowChargeTypeModal} setShowExpenseCategorySelector={setShowExpenseCategorySelector}
                handleArrivePress={handleArrivePress}
            />}

            {appState === 'ENDING' && <EndingTripView 
                inputOdometer={inputOdometer} setInputOdometer={setInputOdometer} currentTrip={currentTrip}
                setLocationSelectorMode={setLocationSelectorMode} handleLocationSelection={handleLocationSelection}
                inputDestination={inputDestination} openExpenseModal={openExpenseModalLogic} confirmEndTrip={confirmEndTrip}
            />}

            {appState === 'SETTINGS' && <SettingsView 
                vehicleConfigs={vehicleConfigs} editingVehicleId={editingVehicleId} setEditingVehicleId={setEditingVehicleId}
                updateVehicleConfig={updateVehicleConfig} setShowSaveConfirmation={setShowSaveConfirmation}
                setAppState={setAppState} showSaveConfirmation={showSaveConfirmation}
                handleExportData={handleExportData} setShowDataImportModal={setShowDataImportModal}
                googleScriptUrl={googleScriptUrl} setGoogleScriptUrl={setGoogleScriptUrl} 
                handleCloudSync={() => handleCloudSync(false)} isSyncing={isSyncing}
                onResetAll={handleResetAll}
            />}

            {appState === 'HISTORY' && <HistoryView 
                historyTab={historyTab} setHistoryTab={setHistoryTab} 
                trips={trips.filter(t => !t._deleted)} 
                visits={visits.filter(v => !v._deleted)} 
                expenses={expenses.filter(e => !e._deleted)} 
                setAppState={setAppState} setEditingTrip={setEditingTrip} setEditingVisit={setEditingVisit} openExpenseModal={openExpenseModalLogic}
                onExit={handleExitHistory}
            />}
        </div>
    );
};