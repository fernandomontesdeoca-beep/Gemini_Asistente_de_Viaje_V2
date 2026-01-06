const { useState, useEffect } = React;

const App = () => {
    // --- ESTADO ---
    const [rateChanges, setRateChanges] = useState([]);
    const [showUpdateAppModal, setShowUpdateAppModal] = useState(false); // <--- NUEVO: Estado para actualización de App
    
    const [appState, setAppState] = useState('IDLE');
    const [defaultVehicleId, setDefaultVehicleId] = useState('PERSONAL');
    const [historyTab, setHistoryTab] = useState('TRIPS');
    const [dataLoaded, setDataLoaded] = useState(false);

    const [vehicleOdometers, setVehicleOdometers] = useState({
        PERSONAL: 10500,
        COMPANY_FUEL: 45200,
        COMPANY_ELECTRIC: 5000,
        OTHER: 0
    });
    
    const [lastLocation, setLastLocation] = useState('Casa');
    const [trips, setTrips] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [visits, setVisits] = useState([]);

    const [dashboardVehicleId, setDashboardVehicleId] = useState('PERSONAL');

    // Modales
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
    
    const [locationSelectorMode, setLocationSelectorMode] = useState('ORIGIN'); 
    const [textModalTitle, setTextModalTitle] = useState('Nombre del Cliente');
    const [pendingStartData, setPendingStartData] = useState(null);

    // Configs
    const [vehicleConfigs, setVehicleConfigs] = useState({
        PERSONAL: { tollPrice: '162.00', fuelPrice: '78.02', kmValue: '15.00', currency: 'UYU' },
        COMPANY_FUEL: { tollPrice: '162.00', fuelPrice: '78.02', kmValue: '12.00', currency: 'UYU' },
        COMPANY_ELECTRIC: { tollPrice: '162.00', fuelPriceAC: '9.50', fuelPriceDC: '10.80', kmValue: '4.00', currency: 'UYU' }, 
        OTHER: { tollPrice: '162.00', fuelPrice: '78.02', kmValue: '20.00', currency: 'UYU' }
    });

    const [editingVehicleId, setEditingVehicleId] = useState('PERSONAL');

    const [currentTrip, setCurrentTrip] = useState({
        startTime: null,
        vehicle: 'PERSONAL',
        origin: '',
        destination: '', 
        startOdometer: 0,
        tripExpenses: []
    });

    const [expenseModalData, setExpenseModalData] = useState({
        isOpen: false,
        id: null,
        category: '', 
        amount: '',
        currency: 'UYU',
        currencyType: 'UYU', 
        method: 'EFECTIVO',
        type: 'Personal',
        notes: '',
        odometer: '',
        volume: ''
    });

    const [inputOdometer, setInputOdometer] = useState('');
    const [inputDestination, setInputDestination] = useState(''); 
    const [showGapAlert, setShowGapAlert] = useState(false);
    const [gapKm, setGapKm] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    // --- NUEVO: CHECK DE VERSIÓN ---
    useEffect(() => {
        const checkAppVersion = async () => {
            try {
                // Agregamos timestamp para evitar que el navegador use una versión vieja del JSON en caché
                const response = await fetch(`./version.json?t=${new Date().getTime()}`);
                if (response.ok) {
                    const data = await response.json();
                    // Comparamos la versión de la nube con la local (APP_VERSION de config.js)
                    if (data.version !== APP_VERSION) {
                        console.log(`Nueva versión detectada: ${data.version} (Actual: ${APP_VERSION})`);
                        setShowUpdateAppModal(true);
                    }
                }
            } catch (error) {
                console.warn("No se pudo comprobar la versión:", error);
            }
        };

        // Solo comprobar si estamos en modo IDLE (pantalla principal)
        if (appState === 'IDLE') {
            checkAppVersion();
        }
    }, [appState]);

    const handleAppUpdateConfirm = async () => {
        // 1. Borrar todas las cachés (Esperar a que termine)
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        // 2. Desregistrar Service Workers (Esperar a que termine)
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(r => r.unregister()));
        }
        
        // 3. Forzar recarga desde el servidor
        window.location.reload(true);
    };

    // --- INDEXEDDB LOAD & SAVE ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const [savedTrips, savedExpenses, savedVisits, savedOdometers, savedConfigs, savedLocation] = await Promise.all([
                    dbHelper.get('trips'),
                    dbHelper.get('expenses'),
                    dbHelper.get('visits'),
                    dbHelper.get('odometers'),
                    dbHelper.get('configs'),
                    dbHelper.get('lastLocation')
                ]);

                if (savedTrips) setTrips(savedTrips);
                if (savedExpenses) setExpenses(savedExpenses);
                if (savedVisits) setVisits(savedVisits);
                if (savedOdometers) setVehicleOdometers(savedOdometers);
                if (savedLocation) setLastLocation(savedLocation);
                
                if (savedConfigs) {
                    setVehicleConfigs(savedConfigs);
                    // Comparación de Tarifas
                    const detectedChanges = [];
                    const myRef = savedConfigs['PERSONAL']; 
                    if (myRef) {
                        if (parseFloat(myRef.tollPrice) !== parseFloat(OFFICIAL_RATES.toll)) {
                            detectedChanges.push({ label: 'Peaje', oldVal: myRef.tollPrice, newVal: OFFICIAL_RATES.toll });
                        }
                        if (parseFloat(myRef.fuelPrice) !== parseFloat(OFFICIAL_RATES.fuel)) {
                            detectedChanges.push({ label: 'Nafta', oldVal: myRef.fuelPrice, newVal: OFFICIAL_RATES.fuel });
                        }
                    }
                    const elecRef = savedConfigs['COMPANY_ELECTRIC'];
                    if (elecRef) {
                        if (parseFloat(elecRef.fuelPriceAC) !== parseFloat(OFFICIAL_RATES.electricAC)) {
                            detectedChanges.push({ label: 'Carga AC', oldVal: elecRef.fuelPriceAC, newVal: OFFICIAL_RATES.electricAC });
                        }
                        if (parseFloat(elecRef.fuelPriceDC) !== parseFloat(OFFICIAL_RATES.electricDC)) {
                            detectedChanges.push({ label: 'Carga DC', oldVal: elecRef.fuelPriceDC, newVal: OFFICIAL_RATES.electricDC });
                        }
                    }
                    if (detectedChanges.length > 0) {
                        setRateChanges(detectedChanges);
                        setShowUpdatePrompt(true);
                    }
                }
                setDataLoaded(true);
            } catch (error) {
                console.error("Error loading DB", error);
                setDataLoaded(true);
            }
        };
        loadData();
    }, []);

    useEffect(() => { if(dataLoaded) dbHelper.set('trips', trips); }, [trips, dataLoaded]);
    useEffect(() => { if(dataLoaded) dbHelper.set('expenses', expenses); }, [expenses, dataLoaded]);
    useEffect(() => { if(dataLoaded) dbHelper.set('visits', visits); }, [visits, dataLoaded]);
    useEffect(() => { if(dataLoaded) dbHelper.set('odometers', vehicleOdometers); }, [vehicleOdometers, dataLoaded]);
    useEffect(() => { if(dataLoaded) dbHelper.set('configs', vehicleConfigs); }, [vehicleConfigs, dataLoaded]);
    useEffect(() => { if(dataLoaded) dbHelper.set('lastLocation', lastLocation); }, [lastLocation, dataLoaded]);

    // --- TIMER ---
    useEffect(() => {
        let interval;
        if (appState === 'ACTIVE') {
            interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [appState]);

    // --- LOGIC ---
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

    const getActiveConfig = () => {
        const vId = (appState === 'ACTIVE' || appState === 'ENDING' || appState === 'STARTING') && currentTrip.vehicle 
            ? currentTrip.vehicle 
            : dashboardVehicleId; 
        return vehicleConfigs[vId] || vehicleConfigs['PERSONAL'];
    };

    const handleChargeTypeSelection = (type) => {
        setShowChargeTypeModal(false);
        const activeConfig = getActiveConfig();
        let price = 0;
        if (type === 'AC') price = parseFloat(activeConfig.fuelPriceAC || 0);
        else if (type === 'DC') price = parseFloat(activeConfig.fuelPriceDC || 0);
        openExpenseModal('Carga Eléctrica', formatMoney(price));
    };

   const openExpenseModal = (category, amountOverride = null, expenseToEdit = null) => {
        const currentVId = (appState === 'ACTIVE' || appState === 'ENDING' || appState === 'STARTING') ? currentTrip.vehicle : dashboardVehicleId;
        const currentOdo = vehicleOdometers[currentVId] || 0;

        if (expenseToEdit) {
            setExpenseModalData({
                isOpen: true,
                id: expenseToEdit.id,
                category: expenseToEdit.category,
                amount: expenseToEdit.amount,
                currency: expenseToEdit.currency,
                currencyType: expenseToEdit.currencyType || expenseToEdit.currency,
                method: expenseToEdit.method,
                type: expenseToEdit.type,
                notes: expenseToEdit.notes || '',
                odometer: expenseToEdit.odometer || currentOdo,
                volume: expenseToEdit.volume || '',
                unitPrice: null 
            });
        } else {
            const activeConfig = getActiveConfig();
            const isCompanyVehicle = currentVId.includes('COMPANY');
            // Inicializamos unitPrice en null
            let defaults = { amount: '', currency: 'UYU', method: 'CREDITO', type: isCompanyVehicle ? 'Empresa' : 'Empresa', unitPrice: null };

            if (category === 'Peaje') {
                defaults = { amount: formatMoney(activeConfig.tollPrice), currency: activeConfig.currency, method: 'DEBITO', type: 'Personal', unitPrice: null };
            } else if (['Carga Combustible', 'Combustible'].includes(category)) {
                // CORRECCIÓN: Aquí pasamos el precio del combustible (fuelPrice) como unitPrice
                defaults = { amount: '', currency: activeConfig.currency, method: 'CREDITO', type: 'Personal', unitPrice: activeConfig.fuelPrice };
            } else if (category === 'Carga Eléctrica') {
                const price = amountOverride || activeConfig.fuelPriceAC; 
                defaults = { amount: '', currency: activeConfig.currency, method: 'CREDITO', type: 'Personal', unitPrice: price };
            }
            
            const isStandardCurrency = ['UYU', 'U$D'].includes(defaults.currency);
            
            setExpenseModalData({
                isOpen: true,
                id: null,
                category,
                amount: defaults.amount,
                currency: defaults.currency,
                currencyType: isStandardCurrency ? defaults.currency : 'Otro',
                method: defaults.method,
                type: defaults.type,
                notes: '',
                odometer: currentOdo,
                volume: '',
                unitPrice: defaults.unitPrice // IMPORTANTE: Pasamos el precio al estado del modal
            });
        }
        setShowExpenseCategorySelector(false);
    };

    const confirmExpense = () => {
        const isCharge = ['Carga Combustible', 'Carga Eléctrica'].includes(expenseModalData.category);
        const currentVId = (appState === 'ACTIVE' || appState === 'ENDING' || appState === 'STARTING') ? currentTrip.vehicle : dashboardVehicleId;
        
        if (isCharge && expenseModalData.odometer) {
            const newOdo = parseInt(expenseModalData.odometer);
            if (!isNaN(newOdo) && newOdo > vehicleOdometers[currentVId]) {
                setVehicleOdometers(prev => ({ ...prev, [currentVId]: newOdo }));
            }
        }

        if (expenseModalData.id) {
             setExpenses(prev => prev.map(e => e.id === expenseModalData.id ? {
                ...e,
                category: expenseModalData.category,
                amount: parseFloat(expenseModalData.amount) || 0,
                currency: expenseModalData.currency,
                method: expenseModalData.method,
                type: expenseModalData.type,
                notes: expenseModalData.notes,
                odometer: expenseModalData.odometer,
                volume: expenseModalData.volume
            } : e));
            setExpenseModalData({ ...expenseModalData, isOpen: false });
        } else {
            const newExpense = {
                id: Date.now(),
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
                tripId: currentTrip.startTime ? (typeof currentTrip.startTime.getTime === 'function' ? currentTrip.startTime.getTime() : Date.now()) : 'loose_expense'
            };

            if (['ACTIVE', 'ENDING', 'STARTING'].includes(appState)) {
                setCurrentTrip(prev => ({
                    ...prev,
                    tripExpenses: [...prev.tripExpenses, newExpense]
                }));
            }
            setExpenses(prev => [newExpense, ...prev]);
            setExpenseModalData({ ...expenseModalData, isOpen: false });

            if (appState === 'STARTING' && pendingStartData) {
                startTripProcess(pendingStartData.odo, pendingStartData.dest);
                setPendingStartData(null);
            }
        }
    };

    const deleteExpense = () => {
        if (expenseModalData.id) {
            setExpenses(prev => prev.filter(e => e.id !== expenseModalData.id));
            setExpenseModalData({ ...expenseModalData, isOpen: false });
        }
    };

    const updateVehicleConfig = (field, value) => {
        setVehicleConfigs(prev => ({
            ...prev,
            [editingVehicleId]: { ...prev[editingVehicleId], [field]: value }
        }));
    };

    const updateDashboardOdometer = (newVal) => {
        const val = parseInt(newVal);
        if (!isNaN(val)) {
            setVehicleOdometers(prev => ({ ...prev, [dashboardVehicleId]: val }));
        }
        setShowOdometerEditor(false);
    };

    const handleStartPress = () => {
        const currentOdo = vehicleOdometers[dashboardVehicleId];
        setInputOdometer(currentOdo.toString());
        setInputDestination('');
        setCurrentTrip({
            startTime: null,
            vehicle: dashboardVehicleId,
            origin: lastLocation,
            destination: '', 
            startOdometer: 0,
            tripExpenses: [] 
        });
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
        const hasParkingExpense = currentTrip.tripExpenses.some(e => e.category === 'Estacionamiento');

        if (isOriginClient && !hasParkingExpense) {
            setPendingStartData({ odo: inputOdoVal, dest: destinationOverride });
            setShowParkingAskModal(true);
            return;
        }
        startTripProcess(inputOdoVal, destinationOverride);
    };

    const startTripProcess = (startOdo, destinationOverride = undefined) => {
        setCurrentTrip(prev => ({
            ...prev,
            startTime: new Date(),
            origin: lastLocation,
            destination: destinationOverride !== undefined ? destinationOverride : inputDestination, 
            startOdometer: startOdo,
        }));
        setAppState('ACTIVE');
    };

    const handleArrivePress = () => {
        const currentVehicleOdo = vehicleOdometers[currentTrip.vehicle] || 0;
        const startOdo = parseInt(currentTrip.startOdometer) || 0;
        const lastKnown = Math.max(currentVehicleOdo, startOdo);
        setInputOdometer((lastKnown + 1).toString());
        if (currentTrip.destination) {
            setInputDestination(currentTrip.destination);
        } else {
            setInputDestination('');
        }
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
            startTime: safeStartTime.toLocaleTimeString ? safeStartTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "00:00",
            endTime: safeEndTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            origin: currentTrip.origin || 'Desconocido',
            destination: inputDestination || 'Desconocido',
            distance: distance > 0 ? distance : 0,
            vehicle: currentTrip.vehicle,
            expenses: currentTrip.tripExpenses,
            status: 'CLOSED',
            startOdometer: currentTrip.startOdometer,
            endOdometer: endOdo
        };

        setTrips(prev => [newTrip, ...prev]);
        
        if (newTrip.origin.toLowerCase().startsWith('cliente')) {
            setVisits(prev => {
                const idx = prev.findIndex(v => v.client === newTrip.origin && v.status === 'OPEN');
                if (idx !== -1) {
                    const updated = [...prev];
                    updated[idx] = { 
                        ...updated[idx], 
                        outboundTrip: newTrip, 
                        status: 'COMPLETED' 
                    };
                    return updated;
                }
                return prev;
            });
        }

        if (newTrip.destination.toLowerCase().startsWith('cliente')) {
            setVisits(prev => [{
                id: Date.now() + '_visit',
                client: newTrip.destination,
                date: newTrip.date,
                inboundTrip: newTrip,
                outboundTrip: null,
                status: 'OPEN'
            }, ...prev]);
        }

        setVehicleOdometers(prev => ({ ...prev, [currentTrip.vehicle]: endOdo }));
        setLastLocation(inputDestination);
        setAppState('IDLE');
    };

    const handleLocationSelection = (loc) => {
        if (locationSelectorMode === 'ORIGIN') {
            if (loc === 'Cliente') {
                setTextModalTitle('Nombre del Cliente');
                setShowDestinationModal(true);
            } else if (loc === 'Otra') {
                setTextModalTitle('Punto de Partida');
                setShowDestinationModal(true);
            } else {
                setLastLocation(loc);
                setShowLocationSelector(false);
            }
        } else {
            if (loc === 'Cliente') {
                setTextModalTitle('Nombre del Cliente');
                setShowDestinationModal(true);
            } else if (loc === 'Otra') {
                setTextModalTitle('¿Hacia dónde vas?');
                setShowDestinationModal(true); 
            } else {
                setInputDestination(loc);
                if (appState === 'STARTING') {
                    confirmStartTrip(loc);
                }
                setShowLocationSelector(false);
            }
        }
    }
    
    const saveEditedTrip = (updatedTrip) => {
        setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
        setVisits(prev => prev.map(v => {
            let newV = { ...v };
            let changed = false;
            if (newV.inboundTrip && newV.inboundTrip.id === updatedTrip.id) {
                newV.inboundTrip = updatedTrip;
                changed = true;
            }
            if (newV.outboundTrip && newV.outboundTrip.id === updatedTrip.id) {
                newV.outboundTrip = updatedTrip;
                changed = true;
            }
            return changed ? newV : v;
        }));
        setEditingTrip(null);
        const vehicleTrips = trips.filter(t => t.vehicle === updatedTrip.vehicle);
        if (vehicleTrips.length > 0 && vehicleTrips[0].id === updatedTrip.id) {
                setVehicleOdometers(prev => ({
                ...prev,
                [updatedTrip.vehicle]: updatedTrip.endOdometer
            }));
        }
    };

    const deleteTrip = (tripId) => {
        setTrips(prev => prev.filter(t => t.id !== tripId));
        setVisits(prev => prev.map(v => {
            let newV = { ...v };
            if (newV.inboundTrip && newV.inboundTrip.id === tripId) newV.inboundTrip = null;
            if (newV.outboundTrip && newV.outboundTrip.id === tripId) newV.outboundTrip = null;
            return newV;
        }));
        setEditingTrip(null);
    };
    
    const saveEditedVisit = (updatedVisit) => {
        setVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
        setEditingVisit(null);
    };
    
    const deleteVisit = (visitId) => {
        setVisits(prev => prev.filter(v => v.id !== visitId));
        setEditingVisit(null);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- RENDER ---
    return (
        <div className="flex flex-col h-screen w-full max-w-md mx-auto shadow-2xl overflow-hidden font-sans relative bg-slate-100">
            {/* NUEVO: MODAL DE ACTUALIZACIÓN DE APP */}
            <UpdateAppModal 
                isOpen={showUpdateAppModal}
                onClose={() => setShowUpdateAppModal(false)}
                onConfirm={handleAppUpdateConfirm}
            />

            <ExpenseModal 
                isOpen={expenseModalData.isOpen} 
                onClose={(action) => {
                    if (action === 'DELETE') deleteExpense();
                    else setExpenseModalData({...expenseModalData, isOpen: false})
                }} 
                onConfirm={confirmExpense}
                expenseData={expenseModalData}
                setExpenseData={setExpenseModalData}
            />
            
            <CategorySelector 
                isOpen={showExpenseCategorySelector} 
                onClose={() => setShowExpenseCategorySelector(false)}
                onSelect={openExpenseModal}
            />
            
            <ChargeTypeModal 
                isOpen={showChargeTypeModal}
                onClose={() => setShowChargeTypeModal(false)}
                onSelectType={handleChargeTypeSelection}
            />

            <DestinationInputModal
                isOpen={showDestinationModal}
                title={textModalTitle}
                placeholder={textModalTitle.includes('Cliente') ? "Ej. Empresa X" : "Ej. Gimnasio"}
                initialValue=""
                onClose={() => setShowDestinationModal(false)}
                onConfirm={(name) => {
                    const finalName = name.trim();
                    let formattedName = finalName;
                    if (textModalTitle.includes('Cliente') && !finalName.toLowerCase().startsWith('cliente')) {
                            formattedName = `Cliente: ${finalName}`;
                    }
                    if (locationSelectorMode === 'ORIGIN') {
                        setLastLocation(formattedName);
                        setShowDestinationModal(false);
                        setShowLocationSelector(false);
                    } else {
                        setInputDestination(formattedName);
                        setShowDestinationModal(false);
                        if (appState === 'STARTING') {
                            confirmStartTrip(formattedName);
                        }
                        setShowLocationSelector(false);
                    }
                }}
            />

            <ParkingAskModal 
                isOpen={showParkingAskModal}
                onClose={() => setShowParkingAskModal(false)}
                onNo={() => {
                    setShowParkingAskModal(false);
                    if(pendingStartData) {
                        startTripProcess(pendingStartData.odo, pendingStartData.dest);
                        setPendingStartData(null);
                    }
                }}
                onYes={() => {
                    setShowParkingAskModal(false);
                    openExpenseModal('Estacionamiento');
                }}
            />

            <UpdatePromptModal
                isOpen={showUpdatePrompt}
                onClose={() => setShowUpdatePrompt(false)}
                onConfirm={handleUpdateRates}
                changes={rateChanges}
            />
            
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

            {/* IDLE VIEW */}
            {appState === 'IDLE' && (
                <div className="flex flex-col h-full bg-slate-100">
                    {showLocationSelector && (
                        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLocationSelector(false)}>
                            <div className="bg-white w-full rounded-2xl p-4 shadow-xl" onClick={e => e.stopPropagation()}>
                                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Cambiar Ubicación Actual</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {LOCATIONS_PRESETS.map(loc => {
                                        const preset = LOCATIONS_CONFIG[loc] || { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
                                        return (
                                            <button key={loc} onClick={() => { 
                                                if(appState === 'IDLE') { setLastLocation(loc); setShowLocationSelector(false); }
                                                else handleLocationSelection(loc);
                                            }} className={`p-3 rounded-xl text-sm font-bold border ${loc === lastLocation ? 'bg-blue-50 border-blue-500 text-blue-700' : `${preset.bg} ${preset.border} ${preset.color}`}`}>{loc}</button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {showVehicleSelector && (
                        <div className="absolute inset-0 bg-black/20 z-40 flex flex-col justify-end" onClick={() => setShowVehicleSelector(false)}>
                            <div className="bg-white rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 text-center">Seleccionar Vehículo</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {VEHICLE_TYPES.map(v => (
                                        <button key={v.id} onClick={() => { setDashboardVehicleId(v.id); setShowVehicleSelector(false); }} className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all border-2 h-32 ${dashboardVehicleId === v.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-[1.02]' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-100'}`}>
                                            <Icon name={v.icon} size={32} className="mb-2"/>
                                            <span className="font-bold text-xs text-center leading-tight">{v.label}</span>
                                            <span className="font-mono text-[10px] opacity-80">{vehicleOdometers[v.id]} km</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {showOdometerEditor && (
                        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowOdometerEditor(false)}>
                            <div className="bg-white w-full rounded-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Corregir Odómetro</h3>
                                <input type="number" defaultValue={vehicleOdometers[dashboardVehicleId]} onBlur={(e) => updateDashboardOdometer(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') updateDashboardOdometer(e.currentTarget.value) }} autoFocus className="w-full text-4xl font-mono font-bold text-slate-800 border-b-2 border-blue-500 focus:outline-none mb-4" onFocus={(e) => e.target.select()}/>
                                <p className="text-xs text-slate-400">Presiona Enter para guardar.</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-800 text-white p-6 rounded-b-[2rem] shadow-xl z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div><h1 className="text-xl font-bold">Bitácora de Viaje</h1><p className="text-slate-400 text-xs">Sistema de Control</p></div>
                            <div className="flex gap-2">
                                <button onClick={() => setAppState('HISTORY')} className="bg-slate-700 p-2 rounded-full hover:bg-slate-600 transition-colors"><Icon name="History" size={20}/></button>
                                <button onClick={() => setAppState('SETTINGS')} className="bg-slate-700 p-2 rounded-full hover:bg-slate-600 transition-colors"><Icon name="Settings" size={20}/></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => { setLocationSelectorMode('ORIGIN'); setShowLocationSelector(true); }} className="bg-slate-700/50 p-3 rounded-2xl backdrop-blur-md text-left hover:bg-slate-700 transition-colors group relative">
                                <div className="flex justify-between items-start"><p className="text-slate-400 text-[10px] uppercase font-bold group-hover:text-blue-300">Ubicación Actual</p><Icon name="Edit2" size={10} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"/></div>
                                <div className="flex items-center font-bold text-lg truncate mt-1"><Icon name="MapPin" size={16} className="mr-1 text-emerald-400"/> {lastLocation}</div>
                            </button>
                            <div className="bg-slate-700/50 p-3 rounded-2xl backdrop-blur-md flex flex-col justify-between group">
                                <div className="flex justify-between items-start mb-1">
                                    <button onClick={(e) => { e.stopPropagation(); setShowVehicleSelector(true); }} className="flex items-center text-[10px] uppercase font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full hover:bg-blue-600 hover:text-white transition-colors">
                                        {getVehicleInfo(dashboardVehicleId).short} <Icon name="ChevronDown" size={10} className="ml-1"/>
                                    </button>
                                </div>
                                <button onClick={() => setShowOdometerEditor(true)} className="text-right hover:opacity-80 transition-opacity w-full">
                                    <div className="font-mono text-xl leading-none">{vehicleOdometers[dashboardVehicleId].toLocaleString()}</div><span className="text-[10px] text-slate-500 font-bold">km</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center relative">
                        <div className="absolute top-6 w-full px-6 flex justify-between">
                            <button onClick={() => {
                                const currentVeh = getVehicleInfo(dashboardVehicleId);
                                if (currentVeh.type === 'electric') {
                                    setShowChargeTypeModal(true);
                                } else {
                                    openExpenseModal('Carga Combustible');
                                }
                            }} className="flex flex-col items-center text-orange-600 hover:text-orange-700 scale-90 transition-transform active:scale-95"><div className="bg-orange-50 p-3 rounded-full shadow-md mb-1 w-12 h-12 flex items-center justify-center border border-orange-100"><Icon name="Fuel" size={20}/></div><span className="text-[10px] font-bold">Cargar</span></button>
                            <button onClick={() => openExpenseModal('Estacionamiento')} className="flex flex-col items-center text-blue-600 hover:text-blue-700 scale-90 transition-transform active:scale-95"><div className="bg-blue-50 p-3 rounded-full shadow-md mb-1 w-12 h-12 flex items-center justify-center border border-blue-100"><Icon name="Car" size={20}/></div><span className="text-[10px] font-bold">Estacionar</span></button>
                        </div>
                        <button onClick={handleStartPress} className="w-56 h-56 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-2xl shadow-emerald-200 flex flex-col items-center justify-center border-4 border-white active:scale-95 transition-all z-20 mt-12">
                            <Icon name="Play" fill="white" size={60} className="text-white ml-2 mb-1"/><span className="text-white font-bold text-lg tracking-widest mt-2">INICIAR</span>
                        </button>
                        <div className="mt-8 flex items-center justify-center gap-4 z-20 w-full px-8">
                            <button onClick={() => setShowExpenseCategorySelector(true)} className="flex-1 flex items-center justify-center bg-violet-50 backdrop-blur-sm py-3 rounded-2xl shadow-sm text-violet-700 font-bold text-sm hover:bg-violet-100 transition-all active:scale-95 border border-violet-100"><Icon name="Plus" size={18} className="mr-2"/> Gasto</button>
                            <button onClick={() => setShowVehicleSelector(true)} className="flex-1 flex items-center justify-center bg-white/80 backdrop-blur-sm py-3 rounded-2xl shadow-sm text-slate-600 font-bold text-sm hover:bg-white transition-all active:scale-95 border border-white">
                                <div className="mr-2"><Icon name={getVehicleInfo(dashboardVehicleId).icon} size={18} className="text-blue-500"/></div>
                                {getVehicleInfo(dashboardVehicleId).label}
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-white h-1/4 rounded-t-[2rem] shadow-lg p-6 overflow-hidden">
                        <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-4">Últimos Viajes</h3>
                        <div className="space-y-3 overflow-y-auto h-full pb-10 scrollbar-hide">
                            {trips.length === 0 ? <p className="text-slate-300 text-center text-sm italic mt-4">No hay viajes registrados</p> : 
                                trips.map(t => (
                                    <div key={t.id} onClick={() => setEditingTrip(t)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 active:scale-95 transition-transform cursor-pointer">
                                        <div className="flex justify-between items-center border-b border-slate-50 pb-2 mb-1">
                                            <span className="text-xs font-bold text-slate-400">{t.date}</span>
                                            <Icon name="Edit2" size={12} className="text-slate-300"/>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800">{t.origin}</span>
                                                <Icon name="ArrowRight" size={14} className="text-slate-300 my-0.5 rotate-90 sm:rotate-0"/>
                                                <span className="text-sm font-bold text-slate-800">{t.destination}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-2xl font-mono font-bold text-blue-600">{t.distance} <span className="text-sm font-sans text-slate-400">km</span></span>
                                                <span className="text-xs text-slate-400">{t.startTime} - {t.endTime}</span>
                                            </div>
                                        </div>
                                        {/* Mini badge si fue carga */}
                                        {t.expenses && t.expenses.some(e => e.category.includes('Carga')) && (
                                            <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-500">
                                                <span className="flex items-center"><Icon name="Fuel" size={10} className="mr-1"/> Carga</span>
                                                <span className="font-bold">
                                                    {t.expenses.find(e => e.category.includes('Carga')).volume} {t.expenses.find(e => e.category.includes('Carga')).category.includes('Eléctrica') ? 'kWh' : 'L'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}
            
            {/* ... Vistas STARTING, ACTIVE, ENDING, SETTINGS, HISTORY ... */}
            {appState === 'STARTING' && (
                <div className="flex flex-col h-screen w-full max-w-md mx-auto p-5 font-sans relative overflow-hidden bg-white shadow-2xl">
                        {showGapAlert && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6 mx-5 mt-5">
                            <div className="flex items-center text-amber-600 font-bold mb-2"><Icon name="AlertTriangle" size={18} className="mr-2"/> Diferencia: {gapKm} km</div>
                            <p className="text-xs text-amber-700 mb-3">El odómetro no coincide con el último cierre del vehículo seleccionado.</p>
                            <div className="flex gap-2"><button onClick={() => { setShowGapAlert(false); startTripProcess(parseInt(inputOdometer)); }} className="flex-1 bg-amber-200 text-amber-800 py-2 rounded-lg text-xs font-bold">Ignorar</button></div>
                        </div>
                    )}

                    {showLocationSelector && (
                        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLocationSelector(false)}>
                            <div className="bg-white w-full rounded-2xl p-4 shadow-xl" onClick={e => e.stopPropagation()}>
                                <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">
                                    {locationSelectorMode === 'ORIGIN' ? 'Cambiar Origen' : 'Seleccionar Destino'}
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {LOCATIONS_PRESETS.map(loc => {
                                            const preset = LOCATIONS_CONFIG[loc] || { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
                                            return (
                                            <button key={loc} onClick={() => handleLocationSelection(loc)} className={`p-3 rounded-xl text-sm font-bold border ${((locationSelectorMode === 'ORIGIN' && loc === lastLocation) || (locationSelectorMode === 'DESTINATION' && loc === inputDestination)) ? 'bg-blue-50 border-blue-500 text-blue-700' : `${preset.bg} ${preset.border} ${preset.color}`}`}>{loc}</button>
                                            );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {showVehicleSelector && (
                        <div className="absolute inset-0 bg-black/20 z-40 flex flex-col justify-end" onClick={() => setShowVehicleSelector(false)}>
                            <div className="bg-white rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
                                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 text-center">Seleccionar Vehículo</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {VEHICLE_TYPES.map(v => (
                                        <button key={v.id} onClick={() => { setCurrentTrip({...currentTrip, vehicle: v.id}); setInputOdometer(vehicleOdometers[v.id].toString()); setShowVehicleSelector(false); }} className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all border-2 h-32 ${currentTrip.vehicle === v.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-[1.02]' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-100'}`}>
                                            <Icon name={v.icon} size={32} className="mb-2"/>
                                            <span className="font-bold text-xs text-center leading-tight">{v.label}</span>
                                            <span className="font-mono text-[10px] opacity-80">{vehicleOdometers[v.id]} km</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto scrollbar-hide p-5 pb-24">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Confirmar Salida</h2>
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-3 rounded-2xl">
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Odómetro Inicial</label>
                                <input type="number" value={inputOdometer} onChange={e => setInputOdometer(e.target.value)} className="w-full bg-transparent text-4xl font-mono font-bold text-slate-800 outline-none" autoFocus onFocus={(e) => e.target.select()}/>
                            </div>
                            
                            {/* Origin Selector */}
                            <button onClick={() => { setLocationSelectorMode('ORIGIN'); setShowLocationSelector(true); }} className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 transition-colors">
                                <span className="text-slate-500 font-medium">Saliendo de:</span>
                                <div className="flex items-center font-bold text-slate-800 bg-blue-50 px-3 py-1 rounded-full"><Icon name="MapPin" size={14} className="mr-1 text-blue-500"/>{lastLocation}<Icon name="Edit2" size={12} className="ml-2 text-blue-300"/></div>
                            </button>

                            {(lastLocation.toLowerCase().includes('cliente') || ['Otra', 'Otro'].includes(lastLocation)) && (
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl animate-in slide-in-from-left">
                                    <div className="flex items-center justify-between mb-2"><span className="font-bold text-blue-800 text-sm flex items-center"><Icon name="Car" size={16} className="mr-2"/> ¿Pagaste Estacionamiento?</span></div>
                                    {currentTrip.tripExpenses.some(e => e.category === 'Estacionamiento') ? (
                                        <div className="flex items-center text-emerald-600 font-bold text-sm"><Icon name="CheckCircle" size={16} className="mr-2"/> Registrado</div>
                                    ) : (
                                        <div className="flex gap-2"><button onClick={() => openExpenseModal('Estacionamiento')} className="flex-1 bg-white text-blue-600 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-100">SÍ, REGISTRAR</button><button className="flex-1 text-slate-400 text-xs font-bold hover:text-slate-600">No</button></div>
                                    )}
                                </div>
                            )}

                            {/* Destination Selector (NEW GRID INLINE) */}
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-3">¿Hacia dónde vas?</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {LOCATIONS_PRESETS.map(loc => {
                                        const preset = LOCATIONS_CONFIG[loc] || { color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200', icon: 'MapPin' };
                                        const Icon = preset.icon;
                                        return (
                                            <button
                                                key={loc}
                                                onClick={() => {
                                                    if (loc === 'Cliente') {
                                                        setTextModalTitle('Nombre del Cliente');
                                                        setLocationSelectorMode('DESTINATION'); 
                                                        setShowDestinationModal(true);
                                                    } else if (loc === 'Otra') {
                                                        setTextModalTitle('¿Hacia dónde vas?');
                                                        setLocationSelectorMode('DESTINATION');
                                                        setShowDestinationModal(true); 
                                                    } else {
                                                        setInputDestination(loc);
                                                        confirmStartTrip(loc);
                                                    }
                                                }}
                                                className={`
                                                    flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all h-16
                                                    ${(inputDestination === loc || (loc === 'Cliente' && inputDestination.startsWith('Cliente')))
                                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg transform scale-[1.02]'
                                                        : `${preset.bg} ${preset.border} ${preset.color} hover:border-emerald-300`
                                                    }
                                                `}
                                            >
                                                <Icon name={preset.icon} size={24} className="mb-1"/>
                                                <span className="text-sm font-bold">{loc}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Vehículo</label>
                                <button onClick={() => setShowVehicleSelector(true)} className="w-full flex items-center p-3 rounded-2xl border-2 border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-200 transition-all text-left group">
                                    <div className="p-2 bg-white rounded-full shadow-sm mr-3 text-blue-600 group-hover:scale-110 transition-transform"><Icon name={getVehicleInfo(currentTrip.vehicle).icon} size={24}/></div>
                                    <span className="font-bold text-lg text-slate-700 flex-1">{getVehicleInfo(currentTrip.vehicle).label}</span>
                                    <Icon name="ChevronDown" size={20} className="text-slate-400"/>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-md p-5 border-t border-slate-100 z-10">
                        <button onClick={() => setAppState('IDLE')} className="w-full bg-slate-100 text-slate-500 py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-colors">Cancelar</button>
                    </div>
                </div>
            )}

            {/* VIEW: ACTIVE */}
            {appState === 'ACTIVE' && (
                <div className="flex flex-col h-screen bg-slate-900 text-white w-full max-w-md mx-auto shadow-2xl overflow-hidden font-sans relative">
                    <div className="z-10 bg-slate-800/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-slate-700">
                        <div className="flex items-center text-emerald-400 animate-pulse"><div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div><span className="font-bold text-xs tracking-widest uppercase">En Ruta</span></div>
                        {/* Modified Right Side with Timer and Cancel Button */}
                        <div className="flex items-center gap-3">
                            <div className="font-mono text-xl flex items-center"><Icon name="Clock" size={16} className="mr-2 text-slate-500"/>{formatTime(elapsedTime)}</div>
                            <button onClick={() => setAppState('IDLE')} className="bg-slate-800 p-2 rounded-full text-rose-500 border border-slate-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors">
                                <Icon name="X" size={20} />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 z-10">
                        <div className="text-center">
                            <div className="inline-flex items-center bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-400 mb-2">
                                {getVehicleInfo(currentTrip.vehicle).type === 'electric' ? <Icon name="Zap" size={12} className="mr-1 text-yellow-400"/> : <Icon name="Car" size={12} className="mr-1"/>}
                                {getVehicleInfo(currentTrip.vehicle).label}
                            </div>
                            <p className="text-slate-400 text-xs uppercase tracking-wide">Origen</p>
                            <h2 className="text-4xl font-bold">{currentTrip.origin}</h2>
                            {currentTrip.destination && (
                                <div className="mt-2 text-slate-400 text-sm animate-pulse">
                                    <span className="opacity-60">Hacia: </span> <span className="text-white font-bold">{currentTrip.destination}</span>
                                </div>
                            )}
                        </div>
                        <Icon name="ArrowRight" className="text-slate-600 rotate-90" size={32}/>
                        <div className="grid grid-cols-2 gap-4 w-full">
                            <button onClick={() => openExpenseModal('Peaje')} className="bg-rose-600 hover:bg-rose-500 p-6 rounded-2xl flex flex-col items-center justify-center transition-all shadow-lg shadow-rose-900/40">
                                <div className="bg-white/20 p-3 rounded-full mb-2"><Icon name="DollarSign" size={24} className="text-white"/></div>
                                <span className="font-bold text-lg text-white">PEAJE</span>
                                <span className="text-xs text-rose-200 mt-1 opacity-80">${formatMoney(getActiveConfig().tollPrice)} {getActiveConfig().currency}</span>
                            </button>
                            <button onClick={() => {
                                if (getVehicleInfo(currentTrip.vehicle).type === 'electric') {
                                    setShowChargeTypeModal(true);
                                } else {
                                    openExpenseModal('Carga Combustible');
                                }
                            }} className="bg-orange-600 hover:bg-orange-500 p-6 rounded-2xl flex flex-col items-center justify-center transition-all shadow-lg shadow-orange-900/40">
                                {getVehicleInfo(currentTrip.vehicle).type === 'electric' ? <Icon name="Zap" size={28} className="text-yellow-300 mb-2"/> : <Icon name="Fuel" size={28} className="text-slate-300 mb-2"/>}
                                <span className="font-bold text-lg text-white">{getVehicleInfo(currentTrip.vehicle).type === 'electric' ? 'CARGA' : 'NAFTA'}</span>
                                <span className="text-xs text-orange-200 mt-1 opacity-80">
                                    {getVehicleInfo(currentTrip.vehicle).type === 'electric' ? 'AC/DC' : `${formatMoney(getActiveConfig().fuelPrice)}/${getVehicleInfo(currentTrip.vehicle).type === 'electric' ? 'kWh' : 'L'}`}
                                </span>
                            </button>
                        </div>
                        <div className="w-full"><button onClick={() => setShowExpenseCategorySelector(true)} className="w-full py-4 border border-violet-700 text-violet-300 rounded-xl text-sm font-bold hover:bg-violet-900/30 flex items-center justify-center transition-all"><Icon name="Plus" size={18} className="mr-2"/> Gasto</button></div>
                    </div>
                    <div className="p-6 bg-slate-900 border-t border-slate-800 z-10">
                        <button onClick={handleArrivePress} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-900/50 flex items-center justify-center hover:bg-emerald-500"><Icon name="MapPin" className="mr-2" fill="currentColor"/> LLEGAR A DESTINO</button>
                    </div>
                </div>
            )}

            {/* VIEW: ENDING */}
            {appState === 'ENDING' && (
                <div className="flex flex-col h-screen w-full max-w-md mx-auto shadow-2xl overflow-hidden font-sans relative bg-slate-50">
                    <div className="bg-emerald-600 p-6 text-white rounded-b-[2rem] shadow-lg">
                        <h2 className="text-2xl font-bold">Llegada</h2>
                        <p className="text-emerald-100 text-sm">Completa los datos de cierre.</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Odómetro Final</label>
                                <span className={`font-mono font-bold ${(parseInt(inputOdometer) || 0) - currentTrip.startOdometer < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{(parseInt(inputOdometer) || 0) - currentTrip.startOdometer} km</span>
                            </div>
                            <input type="number" value={inputOdometer} onChange={(e) => setInputOdometer(e.target.value)} className="w-full text-3xl font-mono font-bold text-slate-800 outline-none border-b-2 border-slate-100 focus:border-emerald-500" autoFocus onFocus={(e) => e.target.select()}/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Llegaste a:</label>
                            <div className="grid grid-cols-3 gap-2">
                                {LOCATIONS_PRESETS.map(loc => (
                                    <button 
                                        key={loc} 
                                        onClick={() => { 
                                            setLocationSelectorMode('DESTINATION');
                                            handleLocationSelection(loc);
                                        }} 
                                        className={`py-3 px-1 rounded-xl text-xs font-bold border-2 transition-all ${inputDestination === loc || (loc === 'Cliente' && inputDestination.startsWith('Cliente:')) ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-100 text-slate-500'}`}
                                    >
                                        {loc}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Gastos Adicionales</label>
                            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                {EXPENSE_CATEGORIES.FOOD.map(item => (
                                    <button key={item} onClick={() => openExpenseModal(item)} className="flex items-center flex-shrink-0 bg-white border border-slate-100 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 shadow-sm active:scale-95"><Icon name="Utensils" size={14} className="mr-2 text-orange-400"/> {item}</button>
                                ))}
                                {EXPENSE_CATEGORIES.LODGING.map(item => (
                                    <button key={item} onClick={() => openExpenseModal(item)} className="flex items-center flex-shrink-0 bg-white border border-slate-100 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 shadow-sm active:scale-95"><Icon name="Bed" size={14} className="mr-2 text-indigo-400"/> {item}</button>
                                ))}
                            </div>
                        </div>
                        {currentTrip.tripExpenses.length > 0 && (
                            <div className="border-t border-slate-100 pt-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Resumen de Gastos</h4>
                                {currentTrip.tripExpenses.map(exp => (
                                    <div key={exp.id} className="flex flex-col mb-3 border-b border-slate-50 pb-2 last:border-0">
                                        <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">{exp.category}</span><span className="font-mono font-bold text-slate-800">{exp.currency} {formatMoney(exp.amount)}</span></div>
                                        {exp.notes && <div className="text-xs text-slate-400 mt-1 italic flex items-center"><Icon name="StickyNote" size={10} className="mr-1"/> {exp.notes}</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-6 bg-white border-t border-slate-100">
                        <button disabled={!inputDestination || ((parseInt(inputOdometer) || 0) - currentTrip.startOdometer) < 0} onClick={confirmEndTrip} className="w-full bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 rounded-xl font-bold text-lg shadow-xl">CERRAR VIAJE</button>
                    </div>
                </div>
            )}

            {/* VIEW: SETTINGS */}
            {appState === 'SETTINGS' && (
                <div className="flex flex-col h-screen w-full max-w-md mx-auto shadow-2xl overflow-hidden font-sans relative bg-slate-50 p-6">
                    {showSaveConfirmation && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-xs text-center animate-in fade-in zoom-in duration-300">
                                <div className="mx-auto bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mb-4 ring-8 ring-emerald-50"><Icon name="CheckCircle" size={40} className="text-emerald-600" /></div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">¡Datos Guardados!</h3>
                                <p className="text-slate-500 text-sm mb-6 leading-relaxed">Perfil actualizado.</p>
                                <button onClick={() => setShowSaveConfirmation(false)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-200">Entendido</button>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center mb-6"><button onClick={() => setAppState('IDLE')} className="p-2 -ml-2 text-slate-400 hover:text-slate-600"><Icon name="ArrowRight" className="rotate-180" size={24}/></button><h2 className="text-2xl font-bold ml-2">Configuración</h2></div>
                    <div className="grid grid-cols-2 gap-3 mb-4">{VEHICLE_TYPES.map(v => <button key={v.id} onClick={() => setEditingVehicleId(v.id)} className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all border-2 ${editingVehicleId === v.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100'}`}><Icon name={v.icon} size={28}/><span className="text-xs mt-2">{v.label}</span></button>)}</div>
                    <div className="space-y-4 flex-1 overflow-y-auto">
                        <div><label className="text-xs font-bold text-slate-500">Peaje</label><input type="number" step="0.01" value={vehicleConfigs[editingVehicleId].tollPrice} onChange={e => updateVehicleConfig('tollPrice', e.target.value)} className="w-full border p-3 rounded-xl" onFocus={(e) => e.target.select()}/></div>
                        <div><label className="text-xs font-bold text-slate-500">Valor Km</label><input type="number" step="0.01" value={vehicleConfigs[editingVehicleId].kmValue} onChange={e => updateVehicleConfig('kmValue', e.target.value)} className="w-full border p-3 rounded-xl" onFocus={(e) => e.target.select()}/></div>
                        {getVehicleInfo(editingVehicleId).type === 'electric' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-500">Carga AC</label><input type="number" step="0.01" value={vehicleConfigs[editingVehicleId].fuelPriceAC} onChange={e => updateVehicleConfig('fuelPriceAC', e.target.value)} className="w-full border p-3 rounded-xl" onFocus={(e) => e.target.select()}/></div>
                                <div><label className="text-xs font-bold text-slate-500">Carga CC</label><input type="number" step="0.01" value={vehicleConfigs[editingVehicleId].fuelPriceDC} onChange={e => updateVehicleConfig('fuelPriceDC', e.target.value)} className="w-full border p-3 rounded-xl" onFocus={(e) => e.target.select()}/></div>
                            </div>
                        ) : (
                            <div><label className="text-xs font-bold text-slate-500">Combustible</label><input type="number" step="0.01" value={vehicleConfigs[editingVehicleId].fuelPrice} onChange={e => updateVehicleConfig('fuelPrice', e.target.value)} className="w-full border p-3 rounded-xl" onFocus={(e) => e.target.select()}/></div>
                        )}
                    </div>
                    <button onClick={() => setShowSaveConfirmation(true)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl mt-4">Guardar</button>
                </div>
            )}

            {/* VIEW: HISTORY */}
            {appState === 'HISTORY' && (
                <div className="flex flex-col h-screen w-full max-w-md mx-auto shadow-2xl overflow-hidden font-sans relative bg-slate-50">
                    {/* Modal Edición de Viaje */}
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

                    <div className="bg-slate-800 text-white p-6 pb-8 rounded-b-[2rem] shadow-xl z-10"><div className="flex items-center mb-4"><button onClick={() => setAppState('IDLE')}><Icon name="ArrowRight" className="rotate-180" size={24}/></button><h2 className="text-2xl font-bold ml-2">Historial</h2></div></div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        <div className="bg-white rounded-2xl shadow-lg p-1 flex mb-4">
                            <button onClick={() => setHistoryTab('TRIPS')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${historyTab === 'TRIPS' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Viajes</button>
                            <button onClick={() => setHistoryTab('VISITS')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${historyTab === 'VISITS' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Visitas</button>
                            <button onClick={() => setHistoryTab('EXPENSES')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${historyTab === 'EXPENSES' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Gastos</button>
                        </div>
                        <div className="space-y-3 pb-10 scrollbar-hide">
                            {historyTab === 'TRIPS' && (
                                trips.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-slate-400"><Icon name="Car" size={48} className="mb-4 opacity-20"/><p className="text-sm font-medium">Sin viajes registrados</p></div> : 
                                    trips.map(t => (
                                        <div key={t.id} onClick={() => setEditingTrip(t)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 active:scale-95 transition-transform cursor-pointer">
                                            <div className="flex justify-between items-center border-b border-slate-50 pb-2 mb-1">
                                                <span className="text-xs font-bold text-slate-400">{t.date}</span>
                                                <Icon name="Edit2" size={12} className="text-slate-300"/>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800">{t.origin}</span>
                                                    <Icon name="ArrowRight" size={14} className="text-slate-300 my-0.5 rotate-90 sm:rotate-0"/>
                                                    <span className="text-sm font-bold text-slate-800">{t.destination}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-2xl font-mono font-bold text-blue-600">{t.distance} <span className="text-sm font-sans text-slate-400">km</span></span>
                                                    <span className="text-xs text-slate-400">{t.startTime} - {t.endTime}</span>
                                                </div>
                                            </div>
                                            {/* Mini badge si fue carga */}
                                            {t.expenses && t.expenses.some(e => e.category.includes('Carga')) && (
                                                <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-500">
                                                    <span className="flex items-center"><Icon name="Fuel" size={10} className="mr-1"/> Carga</span>
                                                    <span className="font-bold">
                                                        {t.expenses.find(e => e.category.includes('Carga')).volume} {t.expenses.find(e => e.category.includes('Carga')).category.includes('Eléctrica') ? 'kWh' : 'L'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                            )}
                            {historyTab === 'VISITS' && (
                                visits.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-slate-400"><Icon name="Users" size={48} className="mb-4 opacity-20"/><p className="text-sm font-medium">Sin visitas registradas</p></div> : 
                                    visits.map(v => (
                                        <div key={v.id} onClick={() => setEditingVisit(v)} className="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-blue-500 flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-bold text-slate-800">{v.client}</h3>
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${v.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{v.status === 'COMPLETED' ? 'Completada' : 'En Curso'}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 space-y-1 mt-1">
                                                <div className="flex justify-between"><span>Ida: {v.inboundTrip.startTime} ({v.inboundTrip.distance}km)</span></div>
                                                {v.outboundTrip ? <div className="flex justify-between border-t border-slate-50 pt-1"><span>Vuelta: {v.outboundTrip.endTime} ({v.outboundTrip.distance}km)</span></div> : <div className="text-amber-500 italic">Pendiente de retorno...</div>}
                                                {/* Calculo de Costo Total de Visita */}
                                                <div className="flex justify-between border-t border-slate-100 pt-2 mt-2 font-bold text-slate-700">
                                                    <span>Total Gastos:</span>
                                                    <span>
                                                        ${formatMoney(v.inboundTrip.expenses.reduce((sum, e) => sum + (e.currency === 'UYU' ? e.amount : 0), 0) + 
                                                            (v.outboundTrip ? v.outboundTrip.expenses.reduce((sum, e) => sum + (e.currency === 'UYU' ? e.amount : 0), 0) : 0))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                            {historyTab === 'EXPENSES' && (
                                expenses.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-slate-400"><Icon name="DollarSign" size={48} className="mb-4 opacity-20"/><p className="text-sm font-medium">Sin gastos registrados</p></div> : 
                                    expenses.map(e => (
                                        <div key={e.id} onClick={() => openExpenseModal(null, null, e)} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer active:scale-95 transition-transform">
                                            <div>
                                                <div className="text-xs font-bold text-slate-400 mb-1">{e.date} • {e.category}</div>
                                                <div className="font-bold text-slate-700 flex items-center">
                                                    {e.type === 'Empresa' ? <Icon name="Briefcase" size={14} className="mr-1.5 text-indigo-500"/> : <Icon name="Car" size={14} className="mr-1.5 text-blue-500"/>}
                                                    {e.notes ? <span className="italic">{e.notes}</span> : e.type}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono font-bold text-lg text-slate-800">{e.currency} {formatMoney(e.amount)}</div>
                                                <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded inline-block mt-1">{PAYMENT_METHODS.find(m => m.id === e.method)?.label}</div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};