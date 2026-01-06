const Icon = window.Icon;
const LOCATIONS_PRESETS = window.LOCATIONS_PRESETS;
const LOCATIONS_CONFIG = window.LOCATIONS_CONFIG;
const VEHICLE_TYPES = window.VEHICLE_TYPES;
const getVehicleInfo = window.getVehicleInfo;

window.StartingView = ({ 
    showGapAlert, gapKm, setShowGapAlert, startTripProcess, inputOdometer, 
    setInputOdometer, showLocationSelector, setShowLocationSelector, 
    locationSelectorMode, lastLocation, inputDestination, setInputDestination,
    handleLocationSelection, showVehicleSelector, setShowVehicleSelector,
    currentTrip, setCurrentTrip, vehicleOdometers, setLocationSelectorMode,
    setTextModalTitle, setShowDestinationModal, confirmStartTrip, setAppState,
    openExpenseModal
}) => {
    return (
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

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-3">¿Hacia dónde vas?</label>
                        <div className="grid grid-cols-2 gap-3">
                            {LOCATIONS_PRESETS.map(loc => {
                                const preset = LOCATIONS_CONFIG[loc] || { color: 'text-slate-600', bg: 'bg-white', border: 'border-slate-200', icon: 'MapPin' };
                                const IconComp = window.Icon; 
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
                                        className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all h-16 ${(inputDestination === loc || (loc === 'Cliente' && inputDestination.startsWith('Cliente'))) ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg transform scale-[1.02]' : `${preset.bg} ${preset.border} ${preset.color} hover:border-emerald-300`}`}
                                    >
                                        <IconComp name={preset.icon} size={24} className="mb-1"/>
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
    );
};