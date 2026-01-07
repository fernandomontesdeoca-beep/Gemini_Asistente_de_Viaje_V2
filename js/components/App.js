const { useState, useEffect, useRef } = React;

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
const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

window.App = () => {
    // --- ESTADO ---
    const [isInitializing, setIsInitializing] = useState(true);
    const [rateChanges, setRateChanges] = useState([]);
    const [showUpdateAppModal, setShowUpdateAppModal] = useState(false);
    const [showDataImportModal, setShowDataImportModal] = useState(false);
    
    // Sync
    const [googleScriptUrl, setGoogleScriptUrl] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    // App Core
    const [appState, setAppState] = useState('IDLE');
    const [historyTab, setHistoryTab] = useState('TRIPS');
    
    // Estado de Modales de Inicio (Declarados al principio para evitar ReferenceErrors)
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [pendingResumeData, setPendingResumeData] = useState(null);

    // Data
    const [vehicleOdometers, setVehicleOdometers] = useState({ PERSONAL: 10500, COMPANY_FUEL: 45200, COMPANY_ELECTRIC: 5000, OTHER: 0 });
    const [lastLocation, setLastLocation] = useState('Casa');
    const [trips, setTrips] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [visits, setVisits] = useState([]);
    const [vehicleConfigs, setVehicleConfigs] = useState({
        PERSONAL: { tollPrice: '162.00', fuelPrice: '78.02', kmValue: '14.24', currency: 'UYU' },
        COMPANY_FUEL: { tollPrice: '162.00', fuelPrice: '78.02', kmValue: '12.00', currency: 'UYU' },
        COMPANY_ELECTRIC: { tollPrice: '162.00', fuelPriceAC: '9.50', fuelPriceDC: '10.80', kmValue: '4.00', currency: 'UYU' }, 
        OTHER: { tollPrice: '162.00', fuelPrice: '78.02', kmValue: '20.00', currency: 'UYU' }
    });

    // Current Action
    const [dashboardVehicleId, setDashboardVehicleId] = useState('PERSONAL');
    const [currentTrip, setCurrentTrip] = useState({
        startTime: null, vehicle: 'PERSONAL', origin: '', destination: '', startOdometer: 0, tripExpenses: []
    });
    
    // UI Modals State
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
    const [expenseModalData, setExpenseModalData] = useState({ isOpen: false });

    const [inputOdometer, setInputOdometer] = useState('');
    const [inputDestination, setInputDestination] = useState(''); 
    const [showGapAlert, setShowGapAlert] = useState(false);
    const [gapKm, setGapKm] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    const isFirstLoad = useRef(true);

    // --- HANDLERS BASE (DEFINIDOS AL PRINCIPIO) ---
    
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

    // --- INICIALIZACIÓN ---
    useEffect(() => {
        const initializeApp = async () => {
            console.log("🚀 Iniciando App...");
            try {
                // Chequear versión
                try {
                    const response = await fetch(`./version.json?t=${new Date().getTime()}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.version !== APP_VERSION) setShowUpdateAppModal(true);
                    }
                } catch (error) { console.warn("Check version error", error); }

                // Cargar DB
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
                const url = sUrl || '';
                setGoogleScriptUrl(url);

                if (sState && sState.appState === 'ACTIVE') {
                    setPendingResumeData(sState);
                    // No mostramos el modal inmediatamente si vamos a sincronizar, dejamos que la nube decida primero
                }

                // Sincronización Bloqueante
                if (url && navigator.onLine) {
                    console.log("☁️ Sincronizando al inicio...");
                    setIsSyncing(true);
                    try {
                        const localDataPacket = { 
                            trips: sTrips || [], 
                            expenses: sExpenses || [], 
                            visits: sVisits || [],
                            vehicleOdometers: sOdos || {},
                            vehicleConfigs: sConfigs || {},
                            lastLocation: sLoc || "",
                            currentTripState: sState ? {
                                appState: sState.appState,
                                currentTrip: sState.currentTrip,
                                lastUpdated: new Date().toISOString()
                            } : null
                        };

                        const result = await window.GoogleSheetSync.syncData(url, localDataPacket);
                        
                        if (result.status === 'success') {
                            processCloudData(result.data, sState);
                        }
                    } catch (syncError) {
                        console.error("⚠️ Fallo sync inicial:", syncError);
                        // Si falla sync y teníamos algo pendiente localmente, mostramos el modal
                        if (sState && sState.appState === 'ACTIVE') setShowResumeModal(true);
                    } finally {
                        setIsSyncing(false);
                    }
                } else {
                     // Offline: si hay estado pendiente, preguntar
                     if (sState && sState.appState === 'ACTIVE') setShowResumeModal(true);
                }

            } catch (error) {
                console.error("🔥 Error crítico inicio:", error);
            } finally {
                setIsInitializing(false);
            }
        };

        if (isFirstLoad.current) {
            initializeApp();
            isFirstLoad.current = false;
        }
    }, []);

    const processCloudData = (cloud, localState) => {
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

        if (cloud.appStateData) {
            const cloudState = cloud.appStateData;
            if (cloudState.lastLocation) setLastLocation(cloudState.lastLocation);

            const cloudIsActive = cloudState.tripStatus === 'ACTIVE';
            
            if (cloudIsActive) {
                console.log("☁️ La nube dice: VIAJE ACTIVO");
                setAppState('ACTIVE');
                setCurrentTrip({
                    startTime: new Date(cloudState.tripStartTime),
                    origin: cloudState.tripOrigin,
                    vehicle: cloudState.tripVehicle,
                    startOdometer: parseInt(cloudState.tripStartOdo || 0),
                    tripExpenses: [],
                    destination: '', 
                    originId: null
                });
                // Si la nube manda activo, anulamos cualquier resume local pendiente
                setPendingResumeData(null);
                setShowResumeModal(false);
            } else {
                 if (localState && localState.appState === 'ACTIVE') {
                     console.log("☁️ La nube cerró el viaje. Reseteando local.");
                     setAppState('IDLE');
                     setCurrentTrip({ startTime: null, vehicle: 'PERSONAL', origin: '', destination: '', startOdometer: 0, tripExpenses: [] });
                     setPendingResumeData(null);
                     setShowResumeModal(false);
                 }
            }
        }
    };

    useEffect(() => { 
        if (!isInitializing) {
            window.dbHelper.set('trips', trips);
            window.dbHelper.set('expenses', expenses);
            window.dbHelper.set('visits', visits);
            window.dbHelper.set('odometers', vehicleOdometers);
            window.dbHelper.set('configs', vehicleConfigs);
            window.dbHelper.set('lastLocation', lastLocation);
            window.dbHelper.set('app_state_persist', { appState, currentTrip });
            window.dbHelper.set('google_script_url', googleScriptUrl);
        }
    }, [trips, expenses, visits, vehicleOdometers, vehicleConfigs, lastLocation, appState, currentTrip, googleScriptUrl, isInitializing]);

    const handleCloudSync = async (silent = false, overrideData = null) => {
        if (!googleScriptUrl) { if(!silent) alert("Configura URL Google."); return; }
        setIsSyncing(true);
        
        const currentTripData = overrideData?.currentTrip || currentTrip;
        const appStateData = overrideData?.appState || appState;

        let tripStatusToSend = appStateData;
        if (currentTripData.startTime && (appStateData !== 'IDLE' && appStateData !== 'ENDING')) {
            tripStatusToSend = 'ACTIVE';
        }

        const dataToSync = { 
            trips, expenses, visits, vehicleOdometers, vehicleConfigs, lastLocation, 
            currentTripState: { 
                appState: tripStatusToSend, 
                currentTrip: currentTripData, 
                lastUpdated: new Date().toISOString() 
            } 
        };

        try {
            const result = await window.GoogleSheetSync.syncData(googleScriptUrl, dataToSync);
            if (result.status === 'success') {
                processCloudData(result.data, { appState, currentTrip });
                if(!silent) console.log("✅ Sync OK");
            } else {
                if(!silent) alert("⚠️ Error Servidor: " + result.message);
            }
        } catch (e) {
            console.error(e);
            if(!silent) alert("❌ Error Red: " + e.message);
        } finally {
            setIsSyncing(false);
        }
    };

    // --- APP FLOW ---

    const handleStartPress = () => {
        handleCloudSync(true);
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
        const newStartTime = new Date();
        const newDest = destinationOverride !== undefined ? destinationOverride : inputDestination;
        
        const newTripState = {
            ...currentTrip,
            startTime: newStartTime,
            origin: lastLocation,
            destination: newDest,
            startOdometer: startOdo
        };

        setCurrentTrip(newTripState);
        setAppState('ACTIVE');
        
        handleCloudSync(true, { 
            currentTrip: newTripState, 
            appState: 'ACTIVE' 
        });
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
            id: generateId('trip'),
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
                id: generateId('visit'), 
                client: newTrip.destination, date: newTrip.date, 
                inboundTrip: newTrip, outboundTrip: null, status: 'OPEN', 
                updatedAt: new Date().toISOString(), _deleted: false 
            }, ...prev]);
        }

        setVehicleOdometers(prev => ({ ...prev, [currentTrip.vehicle]: endOdo }));
        setLastLocation(inputDestination);
        setAppState('IDLE');
        window.dbHelper.set('app_state_persist', null);
        
        setTimeout(() => {
            handleCloudSync(true, {
                appState: 'IDLE',
                currentTrip: { startTime: null, vehicle: 'PERSONAL', origin: '', destination: '', startOdometer: 0, tripExpenses: [] }
            });
        }, 100);
    };

    // --- TIMERS ---
    useEffect(() => {
        let interval;
        if (appState === 'ACTIVE' && currentTrip.startTime) {
            const start = new Date(currentTrip.startTime).getTime();
            setElapsedTime(Math.floor((Date.now() - start) / 1000));
            interval = setInterval(() => setElapsedTime(Math.floor((Date.now() - start) / 1000)), 1000);
        } else setElapsedTime(0);
        return () => clearInterval(interval);
    }, [appState, currentTrip.startTime]);

    // --- HELPERS ---
    const getActiveConfig = () => vehicleConfigs[((appState === 'ACTIVE' || appState === 'ENDING' || appState === 'STARTING') ? currentTrip.vehicle : dashboardVehicleId)] || vehicleConfigs['PERSONAL'];
    const updateDashboardOdometer = (val) => { const v = parseInt(val); if(!isNaN(v)) setVehicleOdometers(p => ({...p, [dashboardVehicleId]: v})); setShowOdometerEditor(false); };
    const updateVehicleConfig = (f, v) => setVehicleConfigs(p => ({...p, [editingVehicleId]: {...p[editingVehicleId], [f]: v}}));
    const handleChargeTypeSelection = (t) => { setShowChargeTypeModal(false); openExpenseModalLogic('Carga Eléctrica'); };
    const handleLocationSelection = (loc) => { 
        if (locationSelectorMode === 'ORIGIN') {
            if (loc === 'Cliente') { setTextModalTitle('Nombre del Cliente'); setShowDestinationModal(true); } 
            else if (loc === 'Otra') { setTextModalTitle('Punto de Partida'); setShowDestinationModal(true); } 
            else { setLastLocation(loc); setShowLocationSelector(false); }
        } else {
            if (loc === 'Cliente') { setTextModalTitle('Nombre del Cliente'); setShowDestinationModal(true); } 
            else if (loc === 'Otra') { setTextModalTitle('¿Hacia dónde vas?'); setShowDestinationModal(true); } 
            else { setInputDestination(loc); if (appState === 'STARTING') confirmStartTrip(loc); setShowLocationSelector(false); }
        }
    };
    const handleUpdateRates = () => { 
        const updated = { ...vehicleConfigs };
        Object.keys(updated).forEach(k => { updated[k].tollPrice = OFFICIAL_RATES.toll; });
        setVehicleConfigs(updated); setShowUpdatePrompt(false); 
    };
    const saveEditedTrip = (t) => { setTrips(prev => prev.map(x => x.id === t.id ? {...t, updatedAt: new Date().toISOString()} : x)); setEditingTrip(null); setTimeout(()=>handleCloudSync(true), 500);};
    const saveEditedVisit = (v) => { setVisits(prev => prev.map(x => x.id === v.id ? {...v, updatedAt: new Date().toISOString()} : x)); setEditingVisit(null); setTimeout(()=>handleCloudSync(true), 500);};
    const deleteTrip = (id) => { setTrips(prev => prev.map(t => String(t.id) === String(id) ? { ...t, _deleted: true, updatedAt: new Date().toISOString() } : t)); setEditingTrip(null); setTimeout(() => handleCloudSync(true), 500); };
    const deleteVisit = (id) => { setVisits(prev => prev.map(v => String(v.id) === String(id) ? { ...v, _deleted: true, updatedAt: new Date().toISOString() } : v)); setEditingVisit(null); setTimeout(() => handleCloudSync(true), 500); };
    const deleteExpense = () => { if (expenseModalData.id) { setExpenses(prev => prev.map(e => String(e.id) === String(expenseModalData.id) ? { ...e, _deleted: true, updatedAt: new Date().toISOString() } : e)); setExpenseModalData({ ...expenseModalData, isOpen: false }); setTimeout(() => handleCloudSync(true), 500); } };
    const handleResetAll = async () => { if (!confirm("⚠️ BORRAR TODO?")) return; setIsSyncing(true); try { if (googleScriptUrl) await window.GoogleSheetSync.resetCloudData(googleScriptUrl); setTrips([]); setExpenses([]); setVisits([]); setVehicleOdometers({ PERSONAL: 0, COMPANY_FUEL: 0, COMPANY_ELECTRIC: 0, OTHER: 0 }); setLastLocation('Casa'); setAppState('IDLE'); await window.dbHelper.set('trips', []); await window.dbHelper.set('expenses', []); await window.dbHelper.set('visits', []); alert("🧹 Reset Completo."); } catch (e) { alert("Error: " + e.message); } finally { setIsSyncing(false); } };
    const handleExportData = () => { 
        const data = JSON.stringify({trips, expenses, visits}, null, 2);
        const blob = new Blob([data], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = "backup.json"; a.click();
    };
    const handleImportData = (e) => {}; // Simplificado
    const handleExitHistory = () => { setAppState('IDLE'); handleCloudSync(true); };

    const openExpenseModalLogic = (category, amountOverride = null, expenseToEdit = null) => {
        const currentVId = (appState === 'ACTIVE' || appState === 'ENDING' || appState === 'STARTING') ? currentTrip.vehicle : dashboardVehicleId;
        const currentOdo = vehicleOdometers[currentVId] || 0;
        const activeConfig = vehicleConfigs[currentVId] || vehicleConfigs['PERSONAL'];
        if (expenseToEdit) { setExpenseModalData({ ...expenseModalData, isOpen: true, ...expenseToEdit, unitPrice: null }); } 
        else {
            let defaults = { amount: '', currency: 'UYU', method: 'CREDITO', type: 'Empresa', unitPrice: null };
            if (category === 'Peaje') defaults = { amount: formatMoney(activeConfig.tollPrice), currency: activeConfig.currency, method: 'DEBITO', type: 'Personal', unitPrice: null };
            setExpenseModalData({ isOpen: true, id: null, category, amount: defaults.amount, currency: defaults.currency, currencyType: 'UYU', method: defaults.method, type: defaults.type, notes: '', odometer: currentOdo, volume: '', unitPrice: defaults.unitPrice });
        }
        setShowExpenseCategorySelector(false);
    };

    const confirmExpense = () => {
        const newExpense = {
            id: expenseModalData.id || generateId('exp'),
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
        if (expenseModalData.id) setExpenses(prev => prev.map(e => e.id === expenseModalData.id ? newExpense : e));
        else {
            if (['ACTIVE', 'ENDING', 'STARTING'].includes(appState)) setCurrentTrip(prev => ({ ...prev, tripExpenses: [...prev.tripExpenses, newExpense] }));
            setExpenses(prev => [newExpense, ...prev]);
        }
        setExpenseModalData({ ...expenseModalData, isOpen: false });
    };

    if (isInitializing) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-white flex-col">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
                <h2 className="text-xl font-bold">Sincronizando...</h2>
                <p className="text-slate-400 text-sm mt-2">Conectando con la nube</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-full max-w-md mx-auto shadow-2xl overflow-hidden font-sans relative bg-slate-100">
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