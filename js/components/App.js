const { useState, useEffect, useRef, useCallback } = React;

// Imports seguros
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
    // ESTADO GLOBAL
    const [isInitializing, setIsInitializing] = useState(true);
    const [showUpdateAppModal, setShowUpdateAppModal] = useState(false);
    
    // Core
    const [appState, setAppState] = useState('IDLE');
    const [googleScriptUrl, setGoogleScriptUrl] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Data
    const [trips, setTrips] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [visits, setVisits] = useState([]);
    const [vehicleOdometers, setVehicleOdometers] = useState({ PERSONAL: 10500, COMPANY_FUEL: 45200, COMPANY_ELECTRIC: 5000, OTHER: 0 });
    const [vehicleConfigs, setVehicleConfigs] = useState({}); // Se inicializa luego con defaults
    const [lastLocation, setLastLocation] = useState('Casa');
    
    // Trip State
    const [dashboardVehicleId, setDashboardVehicleId] = useState('PERSONAL');
    const [currentTrip, setCurrentTrip] = useState({ startTime: null, vehicle: 'PERSONAL', origin: '', destination: '', startOdometer: 0, tripExpenses: [] });

    // UI Modals
    const [modals, setModals] = useState({
        resume: false,
        update: false,
        expense: false,
        category: false,
        charge: false,
        destination: false,
        parking: false,
        editTrip: null,
        editVisit: null,
        saveConfirm: false
    });
    
    // UI Data Buffers
    const [inputOdometer, setInputOdometer] = useState('');
    const [inputDestination, setInputDestination] = useState('');
    const [locationSelectorMode, setLocationSelectorMode] = useState('ORIGIN');
    const [textModalTitle, setTextModalTitle] = useState('');
    const [showLocationSelector, setShowLocationSelector] = useState(false);
    const [showVehicleSelector, setShowVehicleSelector] = useState(false);
    const [showOdometerEditor, setShowOdometerEditor] = useState(false);
    
    const [expenseModalData, setExpenseModalData] = useState({ isOpen: false });
    const [pendingStartData, setPendingStartData] = useState(null);
    const [pendingResumeData, setPendingResumeData] = useState(null);
    const [gapKm, setGapKm] = useState(0);
    const [showGapAlert, setShowGapAlert] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Refs
    const isFirstLoad = useRef(true);

    // ==========================================
    // 1. MERGE LOGIC (EL CEREBRO DE CONSISTENCIA)
    // ==========================================
    const mergeData = useCallback((local, cloud) => {
        const map = new Map();
        // 1. Base local
        local.forEach(item => map.set(String(item.id), item));
        
        // 2. Fusión Nube
        if (cloud && Array.isArray(cloud)) {
            cloud.forEach(cloudItem => {
                const id = String(cloudItem.id);
                const localItem = map.get(id);
                
                if (!localItem) {
                    map.set(id, cloudItem); // Nuevo de la nube
                } else {
                    // CONFLICT RESOLUTION: Last Write Wins
                    const cloudTime = new Date(cloudItem.updatedAt || 0).getTime();
                    const localTime = new Date(localItem.updatedAt || 0).getTime();
                    
                    // Solo sobrescribimos si la nube es ESTRICTAMENTE más nueva
                    // Esto protege tus cambios locales recientes (ej. cerrar viaje)
                    if (cloudTime > localTime) {
                        map.set(id, cloudItem);
                    }
                }
            });
        }
        // Ordenar: Más recientes primero
        return Array.from(map.values()).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }, []);

    // ==========================================
    // 2. SYNC ENGINE
    // ==========================================
    const processCloudData = useCallback((cloud) => {
        if (!cloud) return;
        
        setTrips(prev => mergeData(prev, cloud.trips));
        setExpenses(prev => mergeData(prev, cloud.expenses));
        setVisits(prev => mergeData(prev, cloud.visits)); // Simplificado para brevedad
        
        if (cloud.vehicleOdometers) setVehicleOdometers(cloud.vehicleOdometers);
        if (cloud.vehicleConfigs) setVehicleConfigs(prev => ({...prev, ...cloud.vehicleConfigs}));
        
        // Lógica de "Split Brain" (Viaje en otro dispositivo)
        if (cloud.appStateData) {
            const cloudState = cloud.appStateData;
            if (cloudState.lastLocation) setLastLocation(cloudState.lastLocation);
            
            // Si la nube dice "Active" y yo estoy "Idle", avisar
            if (cloudState.tripStatus === 'ACTIVE' && appState === 'IDLE' && !pendingResumeData) {
                // No interrumpimos al usuario si ya está haciendo algo, solo si está en Home
                const isUserActive = document.visibilityState === 'visible';
                if(isUserActive) {
                    if(confirm(`⚠️ Se detectó un viaje activo en otro dispositivo.\nOrigen: ${cloudState.tripOrigin}\n\n¿Sincronizar y continuar aquí?`)) {
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
        }
    }, [appState, mergeData, pendingResumeData]);

    const handleCloudSync = async (silent = false, overridePayload = null) => {
        if (!googleScriptUrl) return;
        setIsSyncing(true);

        const currentTripData = overridePayload?.currentTrip || currentTrip;
        const currentStatus = overridePayload?.appState || appState;
        
        // Calcular estado real para enviar
        let statusToSend = currentStatus;
        if (currentTripData.startTime && currentStatus !== 'IDLE' && currentStatus !== 'ENDING') {
            statusToSend = 'ACTIVE';
        }

        const payload = {
            trips: overridePayload?.trips || trips, // Si enviamos override, usamos ese array (crítico para endTrip)
            expenses, visits, vehicleOdometers, vehicleConfigs, lastLocation,
            currentTripState: {
                appState: statusToSend,
                currentTrip: currentTripData,
                lastUpdated: new Date().toISOString()
            }
        };

        try {
            const res = await window.GoogleSheetSync.syncData(googleScriptUrl, payload);
            if (res.status === 'success') {
                processCloudData(res.data);
                if (!silent) console.log("Sync OK");
            }
        } catch (e) {
            console.error("Sync Failed", e);
            if(!silent) alert("Sin conexión: Datos guardados localmente.");
        } finally {
            setIsSyncing(false);
        }
    };

    // ==========================================
    // 3. ACTIONS (HANDLERS)
    // ==========================================
    
    // Start Trip
    const handleStartPress = () => {
        handleCloudSync(true); // Check nube rápido
        setInputOdometer(vehicleOdometers[dashboardVehicleId]);
        setInputDestination('');
        setAppState('STARTING');
    };

    const confirmStartTrip = (destOverride) => {
        const dest = destOverride || inputDestination;
        const startOdo = parseInt(inputOdometer) || 0;
        
        // Validaciones... (Omitidas por brevedad, igual que antes)
        
        const newTrip = {
            ...currentTrip,
            startTime: new Date(),
            origin: lastLocation,
            destination: dest,
            startOdometer: startOdo,
            vehicle: dashboardVehicleId
        };
        
        setCurrentTrip(newTrip);
        setAppState('ACTIVE');
        // SYNC INMEDIATO CON OVERRIDE
        handleCloudSync(true, { currentTrip: newTrip, appState: 'ACTIVE' });
    };

    // End Trip (CRÍTICO: SOLUCIÓN DE BORRADO)
    const confirmEndTrip = () => {
        const endOdo = parseInt(inputOdometer) || 0;
        const closedTrip = {
            id: generateId('trip'),
            ...currentTrip,
            endTime: new Date().toLocaleTimeString(),
            endOdometer: endOdo,
            distance: endOdo - currentTrip.startOdometer,
            status: 'CLOSED',
            updatedAt: new Date().toISOString(), // Marca de tiempo fresca
            _deleted: false
        };

        // 1. Guardar Localmente PRIMERO
        const newTripsList = [closedTrip, ...trips];
        setTrips(newTripsList);
        
        setVehicleOdometers(prev => ({...prev, [currentTrip.vehicle]: endOdo}));
        setLastLocation(inputDestination);
        
        // 2. Limpiar Estado
        const idleState = { startTime: null, vehicle: 'PERSONAL', origin: '', destination: '', startOdometer: 0, tripExpenses: [] };
        setCurrentTrip(idleState);
        setAppState('IDLE');

        // 3. Sincronizar DESPUÉS (con override para forzar la lista nueva)
        // Usamos setTimeout para salir del ciclo de render actual
        setTimeout(() => {
            handleCloudSync(true, {
                appState: 'IDLE',
                currentTrip: idleState,
                trips: newTripsList // <--- ESTO EVITA QUE LA NUBE BORRE EL VIAJE
            });
        }, 100);
    };

    // Configs
    const updateVehicleConfig = (field, val) => {
        // Soporte para alias y eficiencia
        setVehicleConfigs(prev => ({
            ...prev,
            [editingVehicleId]: { ...prev[editingVehicleId], [field]: val, updatedAt: new Date().toISOString() }
        }));
    };

    // Auxiliares Modal
    const openExpenseModalLogic = (cat) => {
        setExpenseModalData({ isOpen: true, category: cat, amount: '', notes: '' }); // Simplificado
        setModals(prev => ({ ...prev, category: false }));
    };
    
    // Reset
    const handleResetAll = async () => {
        if(!confirm("⚠️ ¿ESTÁS SEGURO?")) return;
        if(googleScriptUrl) await window.GoogleSheetSync.resetCloudData(googleScriptUrl);
        // Limpieza local...
        window.location.reload();
    };

    // ==========================================
    // 4. LIFECYCLE
    // ==========================================
    useEffect(() => {
        const boot = async () => {
            try {
                // Cargar DB
                const [sTrips, sExpenses, sVisits, sOdos, sConfigs, sLoc, sState, sUrl] = await Promise.all([
                    window.dbHelper.get('trips'), window.dbHelper.get('expenses'), window.dbHelper.get('visits'),
                    window.dbHelper.get('odometers'), window.dbHelper.get('configs'), window.dbHelper.get('lastLocation'),
                    window.dbHelper.get('app_state_persist'), window.dbHelper.get('google_script_url')
                ]);

                // Restaurar
                if(sTrips) setTrips(sTrips);
                if(sConfigs) setVehicleConfigs(sConfigs);
                else {
                    // Defaults iniciales si está vacío
                    const defaults = {};
                    window.VEHICLE_TYPES.forEach(v => {
                        defaults[v.id] = { 
                            tollPrice: window.OFFICIAL_RATES.toll, 
                            fuelPrice: window.OFFICIAL_RATES.fuel,
                            efficiency: v.defaultEfficiency,
                            alias: v.label 
                        };
                    });
                    setVehicleConfigs(defaults);
                }
                
                if(sOdos) setVehicleOdometers(sOdos);
                if(sLoc) setLastLocation(sLoc);
                setGoogleScriptUrl(sUrl || '');

                // Resume Logic
                if (sState && sState.appState === 'ACTIVE') {
                    setPendingResumeData(sState);
                    setModals(prev => ({ ...prev, resume: true }));
                }

                // Check Update (Solo una vez)
                const lastCheck = localStorage.getItem('last_version_check');
                const now = Date.now();
                if (!lastCheck || (now - lastCheck) > 3600000) { // 1 hora
                    fetch(`./version.json?t=${now}`).then(r => r.json()).then(d => {
                        if(d.version !== APP_VERSION) setShowUpdateAppModal(true);
                        localStorage.setItem('last_version_check', now);
                    }).catch(()=>{});
                }

            } catch(e) { console.error(e); } finally { setIsInitializing(false); }
        };
        
        if (isFirstLoad.current) { boot(); isFirstLoad.current = false; }
    }, []);

    // Auto-Save
    useEffect(() => {
        if(!isInitializing) {
            window.dbHelper.set('trips', trips);
            window.dbHelper.set('vehicleConfigs', vehicleConfigs); // Guardar configs nuevas
            window.dbHelper.set('odometers', vehicleOdometers);
            window.dbHelper.set('app_state_persist', { appState, currentTrip });
            // ... resto
        }
    }, [trips, vehicleConfigs, vehicleOdometers, appState, currentTrip, isInitializing]);

    // ==========================================
    // 5. RENDER ROUTER
    // ==========================================
    if (isInitializing) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white font-bold">CARGANDO SISTEMA...</div>;

    return (
        <div className="flex flex-col h-screen w-full max-w-md mx-auto shadow-2xl relative bg-slate-100">
            {/* GLOBAL MODALS */}
            <UpdateAppModal isOpen={showUpdateAppModal} onConfirm={() => window.location.reload(true)} onClose={() => setShowUpdateAppModal(false)}/>
            <ResumeTripModal isOpen={modals.resume} onResume={() => { setAppState(pendingResumeData.appState); setCurrentTrip(pendingResumeData.currentTrip); setModals(p=>({...p, resume:false})); }} onDiscard={() => { setModals(p=>({...p, resume:false})); setAppState('IDLE'); }} />
            
            {/* ROUTING */}
            {appState === 'IDLE' && <HomeView 
                vehicleOdometers={vehicleOdometers} 
                dashboardVehicleId={dashboardVehicleId}
                setDashboardVehicleId={setDashboardVehicleId}
                lastLocation={lastLocation}
                trips={trips.filter(t => !t._deleted)}
                handleStartPress={handleStartPress}
                setAppState={setAppState}
                // ... props UI ...
                showLocationSelector={showLocationSelector} setShowLocationSelector={setShowLocationSelector}
                showVehicleSelector={showVehicleSelector} setShowVehicleSelector={setShowVehicleSelector}
                showOdometerEditor={showOdometerEditor} setShowOdometerEditor={setShowOdometerEditor}
                updateDashboardOdometer={(v) => { setVehicleOdometers(p=>({...p, [dashboardVehicleId]: v})); setShowOdometerEditor(false); }}
                setLastLocation={setLastLocation}
                openExpenseModal={openExpenseModalLogic}
                setShowExpenseCategorySelector={(v) => setModals(p=>({...p, category: v}))}
            />}

            {appState === 'STARTING' && <StartingView 
                // ... pasar props necesarios
                inputOdometer={inputOdometer} setInputOdometer={setInputOdometer}
                inputDestination={inputDestination} setInputDestination={setInputDestination}
                confirmStartTrip={confirmStartTrip}
                handleLocationSelection={(loc) => { setInputDestination(loc); confirmStartTrip(loc); }}
                lastLocation={lastLocation}
                setAppState={setAppState}
                vehicleOdometers={vehicleOdometers}
                currentTrip={currentTrip} setCurrentTrip={setCurrentTrip}
                showVehicleSelector={showVehicleSelector} setShowVehicleSelector={setShowVehicleSelector}
            />}

            {appState === 'ACTIVE' && <ActiveTripView 
                currentTrip={currentTrip} 
                elapsedTime={elapsedTime} 
                setAppState={setAppState}
                handleArrivePress={handleArrivePress}
                openExpenseModal={openExpenseModalLogic}
                getActiveConfig={() => vehicleConfigs[currentTrip.vehicle] || {}}
            />}

            {appState === 'ENDING' && <EndingTripView 
                inputOdometer={inputOdometer} setInputOdometer={setInputOdometer}
                inputDestination={inputDestination}
                currentTrip={currentTrip}
                confirmEndTrip={confirmEndTrip}
                handleLocationSelection={(loc) => setInputDestination(loc)}
                openExpenseModal={openExpenseModalLogic}
            />}

            {appState === 'SETTINGS' && <SettingsView 
                vehicleConfigs={vehicleConfigs}
                editingVehicleId={editingVehicleId} setEditingVehicleId={setEditingVehicleId}
                updateVehicleConfig={updateVehicleConfig}
                googleScriptUrl={googleScriptUrl} setGoogleScriptUrl={setGoogleScriptUrl}
                handleCloudSync={() => handleCloudSync(false)} isSyncing={isSyncing}
                onResetAll={handleResetAll}
                setAppState={setAppState}
                showSaveConfirmation={modals.saveConfirm} setShowSaveConfirmation={(v) => setModals(p=>({...p, saveConfirm:v}))}
            />}
            
            {/* Modales Auxiliares (Renderizados siempre para evitar null pointers) */}
            <CategorySelector isOpen={modals.category} onClose={() => setModals(p=>({...p, category: false}))} onSelect={openExpenseModalLogic} />
            <ExpenseModal isOpen={expenseModalData.isOpen} onClose={() => setExpenseModalData({isOpen:false})} onConfirm={confirmExpense} expenseData={expenseModalData} setExpenseData={setExpenseModalData} />
        </div>
    );
};