const { useState, useEffect, useRef, useCallback } = React;

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
    const [isInitializing, setIsInitializing] = useState(true);
    const [rateChanges, setRateChanges] = useState([]);
    const [showUpdateAppModal, setShowUpdateAppModal] = useState(false);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [pendingResumeData, setPendingResumeData] = useState(null);
    const [showDataImportModal, setShowDataImportModal] = useState(false);
    
    // Sync
    const [googleScriptUrl, setGoogleScriptUrl] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    // App Core
    const [appState, setAppState] = useState('IDLE');
    const [defaultVehicleId, setDefaultVehicleId] = useState('PERSONAL');
    const [historyTab, setHistoryTab] = useState('TRIPS');
    
    // Datos Maestros
    const [vehicleOdometers, setVehicleOdometers] = useState({
        PERSONAL: 10500, COMPANY_FUEL: 45200, COMPANY_ELECTRIC: 5000, OTHER: 0
    });
    const [lastLocation, setLastLocation] = useState('Casa');
    const [trips, setTrips] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [visits, setVisits] = useState([]);
    
    // UI State
    const [dashboardVehicleId, setDashboardVehicleId] = useState('PERSONAL');
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

    const isFirstLoad = useRef(true);

    // --- ALGORITMO DE FUSIÓN CLIENTE (Client-Side Merge) ---
    // Esta función es la clave para evitar que la nube borre datos locales nuevos
    const mergeData = useCallback((localList, cloudList) => {
        const mergedMap = new Map();
        
        // 1. Agregar datos locales primero
        localList.forEach(item => mergedMap.set(String(item.id), item));
        
        // 2. Agregar/Actualizar con datos de la nube
        if (cloudList && Array.isArray(cloudList)) {
            cloudList.forEach(cloudItem => {
                const id = String(cloudItem.id);
                const localItem = mergedMap.get(id);
                
                if (!localItem) {
                    // Si no existe localmente, lo agregamos
                    mergedMap.set(id, cloudItem);
                } else {
                    // CONFLICTO: Si existe en ambos, gana el más reciente
                    const cloudDate = new Date(cloudItem.updatedAt || 0).getTime();
                    const localDate = new Date(localItem.updatedAt || 0).getTime();
                    
                    if (cloudDate > localDate) {
                        mergedMap.set(id, cloudItem);
                    }
                    // Si local es más nuevo, MANTENEMOS el local (evita el borrado)
                }
            });
        }
        
        // Retornar array ordenado por fecha (el más nuevo primero para la UI)
        return Array.from(mergedMap.values()).sort((a, b) => {
            // Asumimos que los objetos tienen 'date' o 'startTime' para ordenar visualmente
            // Si no, usamos updatedAt
            const dateA = new Date(a.date || a.updatedAt || 0).getTime();
            const dateB = new Date(b.date || b.updatedAt || 0).getTime();
            return dateB - dateA;
        });
    }, []);

    // --- PROCESAMIENTO DE RESPUESTA DE NUBE ---
    const processCloudData = (cloudData) => {
        if (!cloudData) return;

        setTrips(prev => mergeData(prev, cloudData.trips));
        setExpenses(prev => mergeData(prev, cloudData.expenses));
        
        // Visitas requiere re-hidratación de objetos
        if (cloudData.visits && cloudData.trips) {
            const rawCloudVisits = cloudData.visits;
            // Primero mezclamos los objetos planos
            setVisits(prev => {
                const mergedVisits = mergeData(prev, rawCloudVisits);
                // Luego rehidratamos las referencias
                return mergedVisits.map(v => ({
                    ...v,
                    inboundTrip: cloudData.trips.find(t => String(t.id) === String(v.inboundTripId)) || trips.find(t => String(t.id) === String(v.inboundTripId)) || null,
                    outboundTrip: cloudData.trips.find(t => String(t.id) === String(v.outboundTripId)) || trips.find(t => String(t.id) === String(v.outboundTripId)) || null
                }));
            });
        }

        if (cloudData.vehicleOdometers) setVehicleOdometers(cloudData.vehicleOdometers);
        if (cloudData.vehicleConfigs) setVehicleConfigs(cloudData.vehicleConfigs);

        // Estado de la App
        if (cloudData.appStateData) {
            const cloudState = cloudData.appStateData;
            if (cloudState.lastLocation && cloudState.lastLocation !== lastLocation) {
                setLastLocation(cloudState.lastLocation);
            }
             // Lógica de Continuidad (Split Brain Protection)
             if (cloudState.tripStatus === 'ACTIVE' && appState === 'IDLE') {
                 // Solo preguntamos si no acabamos de cargar
                 const confirmContinue = window.confirm(`⚠️ DETECTADO VIAJE ACTIVO EN OTRO DISPOSITIVO\n\n¿Deseas sincronizar y continuar ese viaje aquí?`);
                 if (confirmContinue) {
                     setAppState('ACTIVE');
                     setCurrentTrip({
                         startTime: new Date(cloudState.tripStartTime),
                         origin: cloudState.tripOrigin,
                         vehicle: cloudState.tripVehicle,
                         startOdometer: parseInt(cloudState.tripStartOdo || 0),
                         tripExpenses: []
                     });
                 }
             }
        }
    };

    // --- HANDLERS (Definidos antes de useEffect) ---
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

    const handleAppUpdateConfirm = async () => {
        if ('caches' in window) { (await caches.keys()).forEach(name => caches.delete(name)); }
        if ('serviceWorker' in navigator) { (await navigator.serviceWorker.getRegistrations()).forEach(r => r.unregister()); }
        window.location.reload(true);
    };

    // --- SYNC ENGINE ---
    const handleCloudSync = async (silent = false, overrideData = null) => {
        if (!googleScriptUrl) { if(!silent) alert("Configura URL Google."); return; }
        setIsSyncing(true);
        
        try {
            // Construir paquete de datos
            // Usamos overrideData para asegurar que enviamos el estado MÁS NUEVO posible
            // (evitando el lag de React setState)
            const packetTrips = overrideData?.trips || trips;
            const packetAppState = overrideData?.appState || appState;
            const packetCurrentTrip = overrideData?.currentTrip || currentTrip;

            // Determinar estado real para la nube
            let statusToSend = packetAppState;
            if (packetCurrentTrip.startTime && (packetAppState !== 'IDLE' && packetAppState !== 'ENDING')) {
                statusToSend = 'ACTIVE';
            }

            const dataToSync = { 
                trips: packetTrips, 
                expenses: expenses, 
                visits: visits, 
                vehicleOdometers: vehicleOdometers, 
                vehicleConfigs: vehicleConfigs, 
                lastLocation: lastLocation, 
                currentTripState: { 
                    appState: statusToSend, 
                    currentTrip: packetCurrentTrip, 
                    lastUpdated: new Date().toISOString() 
                } 
            };

            const result = await window.GoogleSheetSync.syncData(googleScriptUrl, dataToSync);
            
            if (result.status === 'success' && result.data) {
                // AQUÍ ESTÁ LA MAGIA: Usamos processCloudData que hace MERGE, no replace
                processCloudData(result.data);
                if(!silent) console.log("✅ Sync Completado");
            } else {
                if(!silent) alert("⚠️ " + (result.message || "Error Servidor"));
            }
        } catch (e) {
            console.error(e);
            if(!silent) alert("❌ Error Red: " + e.message);
        } finally {
            setIsSyncing(false);
        }
    };

    // --- INIT ---
    useEffect(() => {
        const init = async () => {
            console.log("🚀 Iniciando...");
            try {
                // Carga DB Local
                const [sTrips, sExpenses, sVisits, sOdos, sConfigs, sLoc, sState, sUrl] = await Promise.all([
                    window.dbHelper.get('trips'), window.dbHelper.get('expenses'), window.dbHelper.get('visits'),
                    window.dbHelper.get('odometers'), window.dbHelper.get('configs'), window.dbHelper.get('lastLocation'),
                    window.dbHelper.get('app_state_persist'), window.dbHelper.get('google_script_url')
                ]);

                // Hidratación
                if (sTrips) setTrips(sTrips);
                if (sExpenses) setExpenses(sExpenses);
                if (sVisits) setVisits(sVisits);
                if (sOdos) setVehicleOdometers(sOdos);
                if (sLoc) setLastLocation(sLoc);
                if (sConfigs) setVehicleConfigs(sConfigs);
                setGoogleScriptUrl(sUrl || '');

                if (sState && sState.appState === 'ACTIVE') {
                    setPendingResumeData(sState);
                    setShowResumeModal(true); // Prioridad a recuperación local inmediata
                }

                // Sync Inicial (Non-blocking para UI, pero vital)
                if (sUrl && navigator.onLine) {
                    handleCloudSync(true); // Sync silencioso al inicio
                }

            } catch (e) { console.error(e); } finally { setIsInitializing(false); }
        };
        
        // Version Check
        const checkVersion = async () => {
             try {
                const r = await fetch(`./version.json?t=${Date.now()}`);
                if (r.ok) {
                    const d = await r.json();
                    if (d.version !== APP_VERSION) setShowUpdateAppModal(true);
                }
            } catch (e) {}
        };

        if (isFirstLoad.current) {
            init();
            checkVersion();
            isFirstLoad.current = false;
        }
    }, []);

    // --- AUTO-SAVE LOCAL ---
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


    // --- HANDLERS LÓGICA DE NEGOCIO ---

    const handleStartPress = () => {
        handleCloudSync(true); // Verificar estado nube
        setInputOdometer(vehicleOdometers[dashboardVehicleId].toString());
        setInputDestination('');
        setCurrentTrip({ startTime: null, vehicle: dashboardVehicleId, origin: lastLocation, destination: '', startOdometer: 0, tripExpenses: [] });
        setAppState('STARTING');
    };

    const confirmStartTrip = (destinationOverride = undefined) => {
        const inputOdoVal = parseInt(inputOdometer) || 0;
        const currentVehicleOdo = vehicleOdometers[currentTrip.vehicle];
        
        // Validación Odómetro
        if (inputOdoVal > currentVehicleOdo) {
            setGapKm(inputOdoVal - currentVehicleOdo);
            setShowGapAlert(true);
            if (destinationOverride) setInputDestination(destinationOverride);
            return;
        }

        // Validación Parking
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
        
        // Sync Crítico: Enviamos el nuevo estado INMEDIATAMENTE
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
        
        // Crear objeto viaje FINALIZADO
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

        // Actualización Optimista Local
        const updatedTrips = [newTrip, ...trips]; // Agregamos al principio
        setTrips(updatedTrips);

        // Lógica de Visitas
        let updatedVisits = [...visits];
        if (newTrip.origin.toLowerCase().startsWith('cliente')) {
            updatedVisits = updatedVisits.map(v => 
                (v.client === newTrip.origin && v.status === 'OPEN' && !v._deleted) 
                ? { ...v, outboundTrip: newTrip, status: 'COMPLETED', updatedAt: new Date().toISOString() } 
                : v
            );
        }
        if (newTrip.destination.toLowerCase().startsWith('cliente')) {
            updatedVisits = [{ 
                id: generateId('visit'), client: newTrip.destination, date: newTrip.date, 
                inboundTrip: newTrip, outboundTrip: null, status: 'OPEN', 
                updatedAt: new Date().toISOString(), _deleted: false 
            }, ...updatedVisits];
        }
        setVisits(updatedVisits);

        const newOdos = { ...vehicleOdometers, [currentTrip.vehicle]: endOdo };
        setVehicleOdometers(newOdos);
        setLastLocation(inputDestination);
        
        // Reset State
        const idleTrip = { startTime: null, vehicle: 'PERSONAL', origin: '', destination: '', startOdometer: 0, tripExpenses: [] };
        setCurrentTrip(idleTrip);
        setAppState('IDLE');

        // SYNC FINAL CRÍTICO
        // Enviamos manualmente el nuevo array de trips para asegurar que el viaje cerrado se envíe
        handleCloudSync(true, {
            appState: 'IDLE',
            currentTrip: idleTrip,
            trips: updatedTrips // Forzamos el envío del array actualizado
        });
    };

    // --- Boilerplate Handlers ---
    const updateDashboardOdometer = (val) => { const v = parseInt(val); if(!isNaN(v)) setVehicleOdometers(p => ({...p, [dashboardVehicleId]: v})); setShowOdometerEditor(false); };
    const updateVehicleConfig = (f, v) => setVehicleConfigs(p => ({...p, [editingVehicleId]: {...p[editingVehicleId], [f]: v}}));
    const handleChargeTypeSelection = (t) => { setShowChargeTypeModal(false); openExpenseModalLogic('Carga Eléctrica'); };
    const handleUpdateRates = () => { 
        const updated = { ...vehicleConfigs };
        Object.keys(updated).forEach(k => { updated[k].tollPrice = OFFICIAL_RATES.toll; });
        setVehicleConfigs(updated); setShowUpdatePrompt(false); 
    };
    
    // CRUD Handlers (Soft Delete)
    const saveEditedTrip = (t) => { setTrips(prev => prev.map(x => x.id === t.id ? {...t, updatedAt: new Date().toISOString()} : x)); setEditingTrip(null); setTimeout(()=>handleCloudSync(true), 500);};
    const saveEditedVisit = (v) => { setVisits(prev => prev.map(x => x.id === v.id ? {...v, updatedAt: new Date().toISOString()} : x)); setEditingVisit(null); setTimeout(()=>handleCloudSync(true), 500);};
    const deleteTrip = (id) => { setTrips(prev => prev.map(t => String(t.id) === String(id) ? { ...t, _deleted: true, updatedAt: new Date().toISOString() } : t)); setEditingTrip(null); setTimeout(() => handleCloudSync(true), 500); };
    const deleteVisit = (id) => { setVisits(prev => prev.map(v => String(v.id) === String(id) ? { ...v, _deleted: true, updatedAt: new Date().toISOString() } : v)); setEditingVisit(null); setTimeout(() => handleCloudSync(true), 500); };
    const deleteExpense = () => { if (expenseModalData.id) { setExpenses(prev => prev.map(e => String(e.id) === String(expenseModalData.id) ? { ...e, _deleted: true, updatedAt: new Date().toISOString() } : e)); setExpenseModalData({ ...expenseModalData, isOpen: false }); setTimeout(() => handleCloudSync(true), 500); } };
    
    const handleResetAll = async () => { if (!confirm("⚠️ BORRAR TODO?")) return; setIsSyncing(true); try { if (googleScriptUrl) await window.GoogleSheetSync.resetCloudData(googleScriptUrl); setTrips([]); setExpenses([]); setVisits([]); setVehicleOdometers({ PERSONAL: 0, COMPANY_FUEL: 0, COMPANY_ELECTRIC: 0, OTHER: 0 }); setLastLocation('Casa'); setAppState('IDLE'); await window.dbHelper.set('trips', []); await window.dbHelper.set('expenses', []); await window.dbHelper.set('visits', []); alert("🧹 Reset Completo."); } catch (e) { alert("Error: " + e.message); } finally { setIsSyncing(false); } };
    const handleExportData = () => { const data = JSON.stringify({trips, expenses, visits}, null, 2); const blob = new Blob([data], {type: "application/json"}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = "backup.json"; a.click(); };
    const handleImportData = () => {}; 
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

    // --- RENDER ---
    if (isInitializing) {
        return <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-white"><div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div></div>;
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