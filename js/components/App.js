const { useState, useEffect } = React;

const App = () => {
    // --- ESTADO ---
    const [rateChanges, setRateChanges] = useState([]);
    const [showUpdateAppModal, setShowUpdateAppModal] = useState(false);
    
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
        PERSONAL: { tollPrice: '162.00', fuelPrice: '78.02', kmValue: '14.24', currency: 'UYU' },
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
        volume: '',
        unitPrice: null
    });

    const [inputOdometer, setInputOdometer] = useState('');
    const [inputDestination, setInputDestination] = useState(''); 
    const [showGapAlert, setShowGapAlert] = useState(false);
    const [gapKm, setGapKm] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    // --- CHECK DE VERSIÓN ---
    useEffect(() => {
        const checkAppVersion = async () => {
            try {
                const response = await fetch(`./version.json?t=${new Date().getTime()}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.version !== APP_VERSION) {
                        console.log(`Nueva versión detectada: ${data.version} (Actual: ${APP_VERSION})`);
                        setShowUpdateAppModal(true);
                    }
                }
            } catch (error) {
                console.warn("No se pudo comprobar la versión:", error);
            }
        };

        if (appState === 'IDLE') {
            checkAppVersion();
        }
    }, [appState]);

    const handleAppUpdateConfirm = async () => {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(r => r.unregister()));
        }
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
            let defaults = { amount: '', currency: 'UYU', method: 'CREDITO', type: isCompanyVehicle ? 'Empresa' : 'Empresa', unitPrice: null };

            if (category === 'Peaje') {
                defaults = { amount: formatMoney(activeConfig.tollPrice), currency: activeConfig.currency, method: 'DEBITO', type: 'Personal', unitPrice: null };
            } else if (['Carga Combustible', 'Combustible'].includes(category)) {
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
                unitPrice: defaults.unitPrice 
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
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-lg">{v.client}</h3>
                                                    <div className="flex items-center text-xs text-slate-400 font-medium mt-1">
                                                        <Icon name="Calendar" size={12} className="mr-1"/>
                                                        {/* Mostrar fecha del viaje de ida */}
                                                        {v.inboundTrip ? v.inboundTrip.date : 'Fecha desconocida'}
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${v.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{v.status === 'COMPLETED' ? 'Completada' : 'En Curso'}</span>
                                            </div>
                                            
                                            <div className="text-xs text-slate-500 space-y-2 mt-2 bg-slate-50 p-2 rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <span className="flex items-center"><Icon name="ArrowRight" size={12} className="mr-1 text-blue-500"/> Ida</span>
                                                    <span className="font-mono">{v.inboundTrip.startTime} ({v.inboundTrip.distance}km)</span>
                                                </div>
                                                {v.outboundTrip ? (
                                                    <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                                                        <span className="flex items-center"><Icon name="ArrowRight" size={12} className="mr-1 text-emerald-500 rotate-180"/> Vuelta</span>
                                                        <span className="font-mono">{v.outboundTrip.endTime} ({v.outboundTrip.distance}km)</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-amber-500 italic text-right">Pendiente de retorno...</div>
                                                )}
                                            </div>

                                            {/* Calculo de Costo Total */}
                                            <div className="flex justify-between border-t border-slate-100 pt-3 mt-1 font-bold text-slate-700">
                                                <span>Total Gastos:</span>
                                                <span className="text-blue-600">
                                                    ${formatMoney(v.inboundTrip.expenses.reduce((sum, e) => sum + (e.currency === 'UYU' ? e.amount : 0), 0) + 
                                                    (v.outboundTrip ? v.outboundTrip.expenses.reduce((sum, e) => sum + (e.currency === 'UYU' ? e.amount : 0), 0) : 0))}
                                                </span>
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



type: uploaded file
fileName: fernandomontesdeoca-beep/gemini_asistente_de_viaje_v2/Gemini_Asistente_de_Viaje_V2-636a63a77a61f17197d6aafe8f6d47cc379964a5/js/components/Modals.js
fullContent:
const { useState, useEffect } = React;

// ==========================================
// COMPONENTES DE MODALES
// ==========================================

const UpdatePromptModal = ({ isOpen, onClose, onConfirm, changes }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-blue-100 p-3 rounded-full mb-4">
                        <Icon name="Zap" size={32} className="text-blue-600"/>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Tarifas Actualizadas</h3>
                    <p className="text-slate-500 mb-4 text-xs">Los valores oficiales en la web son distintos a tu configuración.</p>
                    
                    {/* TABLA DE COMPARACIÓN */}
                    <div className="bg-slate-50 rounded-xl p-3 w-full mb-6">
                        <div className="grid grid-cols-3 gap-1 text-xs font-bold text-slate-400 border-b border-slate-200 pb-2 mb-2 uppercase tracking-wider">
                            <span className="text-left">Concepto</span>
                            <span>Tuyo</span>
                            <span>Nuevo</span>
                        </div>
                        <div className="space-y-2">
                            {changes && changes.map((change, idx) => (
                                <div key={idx} className="grid grid-cols-3 gap-1 text-sm items-center">
                                    <span className="text-left font-bold text-slate-700 truncate">{change.label}</span>
                                    <span className="text-slate-500 line-through decoration-rose-400">{change.oldVal}</span>
                                    <span className="text-emerald-600 font-bold">{change.newVal}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full flex gap-3">
                        <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 text-sm">Mantener Míos</button>
                        <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 text-sm">Actualizar Todo</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ChargeTypeModal = ({ isOpen, onClose, onSelectType }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
                <div className="flex items-center mb-6 text-yellow-600">
                    <Icon name="Zap" size={24} className="mr-2"/>
                    <h3 className="text-xl font-bold text-slate-800">Tipo de Carga</h3>
                </div>
                <div className="flex flex-col gap-3">
                     <button 
                        onClick={() => onSelectType('AC')}
                        className="bg-blue-50 text-blue-700 py-4 rounded-xl font-bold text-lg hover:bg-blue-100 transition-all active:scale-95 flex items-center justify-center"
                      >
                        <Icon name="Clock" size={20} className="mr-2"/> Carga Lenta (AC)
                      </button>
                      <button 
                        onClick={() => onSelectType('DC')}
                        className="bg-yellow-50 text-yellow-700 py-4 rounded-xl font-bold text-lg hover:bg-yellow-100 transition-all active:scale-95 flex items-center justify-center"
                      >
                        <Icon name="Zap" size={20} className="mr-2"/> Carga Rápida (CC)
                      </button>
                      <button 
                        onClick={onClose}
                        className="mt-2 text-slate-400 font-bold text-sm hover:text-slate-600"
                      >
                        Cancelar
                      </button>
                </div>
            </div>
        </div>
    );
};

const ParkingAskModal = ({ isOpen, onClose, onYes, onNo }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
        <div className="flex items-center mb-4 text-blue-600">
            <Icon name="Car" size={24} className="mr-2"/>
            <h3 className="text-xl font-bold text-slate-800">¿Pagaste Estacionamiento?</h3>
        </div>
        <p className="text-slate-500 mb-6 font-medium">Saliendo de cliente. ¿Deseas registrar el gasto ahora?</p>
        <div className="flex gap-3">
             <button 
                onClick={onNo}
                className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all active:scale-95"
              >
                No
              </button>
              <button 
                onClick={onYes}
                className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
              >
                Sí
              </button>
        </div>
      </div>
    </div>
  );
};

const DestinationInputModal = ({ isOpen, onClose, onConfirm, title, placeholder, initialValue = '' }) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (isOpen) setValue(initialValue);
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
                {/* CABECERA: Título y Botón Cerrar */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center text-blue-600">
                        <Icon name="MapPin" size={24} className="mr-2"/>
                        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                    </div>
                    {/* Botón X para cancelar */}
                    <button 
                        onClick={onClose} 
                        className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <Icon name="X" size={24}/>
                    </button>
                </div>

                <input 
                    type="text" 
                    autoFocus
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="w-full text-lg font-medium text-slate-800 border-b-2 border-slate-200 focus:border-blue-500 outline-none py-2 mb-6"
                    placeholder={placeholder}
                    onKeyDown={(e) => { 
                        if (e.key === 'Enter') {
                            onConfirm(value);
                            setValue('');
                        }
                    }}
                />
                <button 
                    onClick={() => {
                        onConfirm(value);
                        setValue('');
                    }}
                    className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
                >
                    Confirmar e Iniciar
                </button>
            </div>
        </div>
    );
};

const VisitEditModal = ({ isOpen, onClose, onSave, onDelete, visit }) => {
    const [formData, setFormData] = useState(visit || {});
    
    useEffect(() => {
        setFormData(visit || {});
    }, [visit]);

    if (!isOpen || !visit) return null;

    // Helper para listar gastos de un viaje
    const renderExpenses = (trip) => {
        if (!trip || !trip.expenses || trip.expenses.length === 0) return null;
        return trip.expenses.map((exp, idx) => (
            <div key={idx} className="flex justify-between text-xs text-slate-600 border-b border-slate-100 last:border-0 py-1">
                <span>{exp.category}</span>
                <span className="font-mono font-bold">{exp.currency} {formatMoney(exp.amount)}</span>
            </div>
        ));
    };

    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <Icon name="Briefcase" size={20} className="mr-2 text-blue-600"/> Detalle de Visita
                    </h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><Icon name="X" size={20} className="text-slate-500"/></button>
                </div>

                <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar scrollbar-hide">
                    {/* Edición de Nombre */}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Cliente</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                            <Icon name="User" size={16} className="text-slate-400 mr-2"/>
                            <input 
                                type="text" 
                                value={formData.client || ''} 
                                onChange={e => setFormData({...formData, client: e.target.value})} 
                                className="bg-transparent w-full text-base font-bold text-slate-700 outline-none"
                            />
                        </div>
                    </div>

                    {/* Resumen de Gastos - IDA */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center mb-2 text-blue-600 font-bold text-xs uppercase tracking-wide">
                            <Icon name="ArrowRight" size={12} className="mr-1"/> Viaje de Ida
                        </div>
                        {renderExpenses(visit.inboundTrip) || <p className="text-xs text-slate-400 italic">Sin gastos registrados</p>}
                    </div>

                    {/* Resumen de Gastos - VUELTA */}
                    {visit.outboundTrip && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex items-center mb-2 text-emerald-600 font-bold text-xs uppercase tracking-wide">
                                <Icon name="ArrowRight" size={12} className="mr-1 rotate-180"/> Viaje de Vuelta
                            </div>
                            {renderExpenses(visit.outboundTrip) || <p className="text-xs text-slate-400 italic">Sin gastos registrados</p>}
                        </div>
                    )}
                </div>

                 <div className="mt-6 flex gap-3 pt-4 border-t border-slate-100">
                    <button onClick={() => onDelete(formData.id)} className="p-4 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors">
                        <Icon name="Trash2" size={20}/>
                    </button>
                    <button onClick={() => onSave(formData)} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all active:scale-95">
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

const TripEditModal = ({ isOpen, onClose, onSave, onDelete, trip }) => {
    const [formData, setFormData] = useState(trip || {});

    useEffect(() => {
        setFormData(trip || {});
    }, [trip]);

    // Función para recalcular distancia si cambian los odómetros
    const handleOdometerChange = (type, val) => {
        const newValue = parseInt(val) || 0;
        const newFormData = { ...formData, [type]: newValue };
        
        // Si ambos odómetros tienen valor, calcular distancia
        if (newFormData.startOdometer !== undefined && newFormData.endOdometer !== undefined) {
            newFormData.distance = newFormData.endOdometer - newFormData.startOdometer;
        }
        setFormData(newFormData);
    };

    if (!isOpen || !trip) return null;

    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <Icon name="Edit2" size={20} className="mr-2 text-blue-600"/> Editar Viaje
                    </h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><Icon name="X" size={20} className="text-slate-500"/></button>
                </div>
                
                <div className="space-y-4 overflow-y-auto flex-1 pr-2 scrollbar-hide">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Fecha</label>
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                <Icon name="Calendar" size={14} className="text-slate-400 mr-2"/>
                                <input type="text" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-transparent w-full text-sm font-bold text-slate-700 outline-none" onFocus={(e) => e.target.select()}/>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Distancia (km)</label>
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                <input type="number" value={formData.distance || 0} onChange={e => setFormData({...formData, distance: parseInt(e.target.value) || 0})} className="bg-transparent w-full text-sm font-bold text-slate-700 outline-none" onFocus={(e) => e.target.select()}/>
                            </div>
                        </div>
                    </div>
                    
                    {/* Campos de Odómetro */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Odo. Inicio</label>
                            <input type="number" value={formData.startOdometer || 0} onChange={e => handleOdometerChange('startOdometer', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700" onFocus={(e) => e.target.select()}/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Odo. Fin</label>
                            <input type="number" value={formData.endOdometer || 0} onChange={e => handleOdometerChange('endOdometer', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700" onFocus={(e) => e.target.select()}/>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Origen</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                            <Icon name="MapPin" size={14} className="text-slate-400 mr-2"/>
                            <input type="text" value={formData.origin || ''} onChange={e => setFormData({...formData, origin: e.target.value})} className="bg-transparent w-full text-sm font-bold text-slate-700 outline-none" onFocus={(e) => e.target.select()}/>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Destino</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                            <Icon name="MapPin" size={14} className="text-slate-400 mr-2"/>
                            <input type="text" value={formData.destination || ''} onChange={e => setFormData({...formData, destination: e.target.value})} className="bg-transparent w-full text-sm font-bold text-slate-700 outline-none" onFocus={(e) => e.target.select()}/>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Inicio</label>
                            <input type="text" value={formData.startTime || ''} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none" onFocus={(e) => e.target.select()}/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Fin</label>
                            <input type="text" value={formData.endTime || ''} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none" onFocus={(e) => e.target.select()}/>
                        </div>
                    </div>
                </div>
        
                <div className="mt-6 flex gap-3">
                    <button onClick={() => onDelete(formData.id)} className="p-4 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"><Icon name="Trash2" size={20}/></button>
                    <button onClick={() => onSave(formData)} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all active:scale-95">Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
};

const ExpenseModal = ({ isOpen, onClose, onConfirm, expenseData, setExpenseData }) => {
    if (!isOpen) return null;
    
    const isFuel = expenseData.category === 'Carga Combustible';
    const isElectric = expenseData.category === 'Carga Eléctrica';
    const isCharge = isFuel || isElectric;

    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <Icon name="DollarSign" className="mr-2 text-violet-600"/> {expenseData.category}
                    </h3>
                    <button onClick={() => onClose()} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><Icon name="X" size={20} className="text-slate-500"/></button>
                </div>
                <div className="space-y-4">
                     {/* CAMPOS EXTRA PARA CARGA (COMBUSTIBLE O ELECTRICA) */}
                     {isCharge && (
                        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Odómetro</label>
                                <input
                                    type="number"
                                    value={expenseData.odometer}
                                    onChange={e => setExpenseData({...expenseData, odometer: e.target.value})}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-700"
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">{isElectric ? 'kWh' : 'Litros'}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={expenseData.volume}
                                    onChange={e => {
                                        const val = e.target.value;
                                        let newAmount = expenseData.amount;
                                        
                                        // Si hay un precio unitario configurado y se escriben litros, calculamos el monto
                                        if (expenseData.unitPrice && val) {
                                            newAmount = (parseFloat(val) * parseFloat(expenseData.unitPrice)).toFixed(2);
                                        }
                                        
                                        setExpenseData({...expenseData, volume: val, amount: newAmount});
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-700"
                                    placeholder="0"
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                        </div>
                     )}

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Monto</label>
                            <input 
                                type="number" 
                                step="0.01"
                                autoFocus
                                value={expenseData.amount}
                                onChange={e => setExpenseData({...expenseData, amount: e.target.value})}
                                className="w-full text-2xl font-bold text-slate-900 bg-transparent border-b-2 border-slate-200 focus:border-violet-500 outline-none py-2"
                                placeholder="0.00"
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="text-xs font-bold text-slate-400 uppercase">Moneda</label>
                            <select 
                                value={expenseData.currencyType}
                                onChange={e => {
                                    const newType = e.target.value;
                                    setExpenseData({
                                        ...expenseData, 
                                        currencyType: newType,
                                        currency: newType === 'Otro' ? '' : newType 
                                    });
                                }}
                                className="w-full bg-slate-50 rounded-lg p-2 font-bold text-slate-700 mt-2"
                            >
                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    {expenseData.currencyType === 'Otro' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Especifique Moneda</label>
                            <input 
                                type="text" 
                                placeholder="Ej. BRL, ARS, EUR"
                                value={expenseData.currency}
                                onChange={e => setExpenseData({...expenseData, currency: e.target.value.toUpperCase()})}
                                className="w-full bg-blue-50 border border-blue-100 rounded-lg p-3 font-bold text-blue-800 focus:border-blue-500 outline-none mt-1"
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Método de Pago</label>
                        <div className="grid grid-cols-2 gap-2">
                            {PAYMENT_METHODS.map(m => (
                                <button key={m.id} onClick={() => setExpenseData({...expenseData, method: m.id})} className={`flex items-center p-2 rounded-lg text-xs font-bold transition-all ${expenseData.method === m.id ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-50 text-slate-500 border border-transparent'}`}>
                                    <Icon name={m.icon} size={14} className="mr-2"/> {m.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Tipo</label>
                        <div className="flex gap-2">
                            {EXPENSE_TYPES.map(t => (
                                <button key={t} onClick={() => setExpenseData({...expenseData, type: t})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${expenseData.type === t ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-slate-50 text-slate-500'}`}>{t}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Nota (Opcional)</label>
                        <div className="relative">
                            <Icon name="StickyNote" size={16} className="absolute left-3 top-3 text-slate-400"/>
                            <textarea rows="2" value={expenseData.notes} onChange={e => setExpenseData({...expenseData, notes: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-violet-500 outline-none resize-none" placeholder="Ej. Almuerzo con cliente..." onFocus={(e) => e.target.select()}/>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    {/* Mostrar botón eliminar si se está editando (tiene ID) */}
                    {expenseData.id && (
                        <button onClick={() => onClose('DELETE')} className="p-4 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"><Icon name="Trash2" size={20}/></button>
                    )}
                    <button onClick={() => onConfirm()} className="flex-1 bg-violet-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-violet-200 hover:bg-violet-700 active:scale-95 transition-all">{expenseData.id ? 'Guardar Cambios' : 'Confirmar Gasto'}</button>
                </div>
            </div>
        </div>
    );
};

const CategorySelector = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 z-[60] flex flex-col justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
            <div className="bg-white w-full rounded-t-[2.5rem] p-6 shadow-2xl relative z-10 animate-in slide-in-from-bottom duration-300 max-h-[75%] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Nuevo Gasto</h3>
                        <p className="text-slate-400 text-xs font-medium">Selecciona una categoría</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"><Icon name="X" size={24}/></button>
                </div>
                <div className="space-y-8 overflow-y-auto pb-8 pr-1 custom-scrollbar scrollbar-hide">
                    {Object.entries({ 'Alimentación': EXPENSE_CATEGORIES.FOOD, 'Alojamiento': EXPENSE_CATEGORIES.LODGING, 'Viaje & Transporte': EXPENSE_CATEGORIES.TRIP }).map(([label, items], idx) => (
                        <div key={label}>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center tracking-wider">
                                {idx === 0 ? <Icon name="Utensils" size={14} className="mr-2 text-orange-400"/> : idx === 1 ? <Icon name="Bed" size={14} className="mr-2 text-indigo-400"/> : <Icon name="Car" size={14} className="mr-2 text-blue-400"/>} {label}
                            </h4>
                            <div className={`grid ${items.length > 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                                {items.map(item => (
                                    <button key={item} onClick={() => onSelect(item)} className="group bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 text-slate-600 font-bold py-4 px-4 rounded-2xl text-sm transition-all text-left shadow-sm active:scale-95">
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div>
                        <button onClick={() => onSelect('Otros')} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 font-bold py-4 px-4 rounded-2xl text-sm transition-all flex items-center justify-center border border-transparent hover:border-slate-300">
                            <Icon name="ShoppingBag" size={18} className="mr-2"/> Otro / Varios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UpdateAppModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-emerald-100 p-3 rounded-full mb-4">
                        <Icon name="Zap" size={32} className="text-emerald-600"/>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">¡Nueva Versión Disponible!</h3>
                    <p className="text-slate-500 mb-6 text-sm">Hay una actualización lista con mejoras y correcciones.</p>
                    <div className="w-full flex gap-3">
                        <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">Más tarde</button>
                        <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">Actualizar Ahora</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

Si hago clic en una visita en historial me abre el modal y muestra la información, si quiero ver los gastos no hace nada, creo que la idea es que muestre el modal de edición como ya lo hacía pero a este agregarle el detalle del total de gastos en la visita.

Con respecto al formato de hora esta bien, lo veo en el modal 12:00.
