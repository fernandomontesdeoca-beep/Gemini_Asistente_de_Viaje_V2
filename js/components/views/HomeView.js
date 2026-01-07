const Icon = window.Icon;
const VEHICLE_TYPES = window.VEHICLE_TYPES;
const LOCATIONS_PRESETS = window.LOCATIONS_PRESETS;
const LOCATIONS_CONFIG = window.LOCATIONS_CONFIG;
const getVehicleInfo = window.getVehicleInfo;
const APP_VERSION = window.APP_VERSION;

window.HomeView = ({ 
    vehicleOdometers, dashboardVehicleId, lastLocation, trips, 
    showLocationSelector, setShowLocationSelector, 
    showVehicleSelector, setShowVehicleSelector, 
    showOdometerEditor, setShowOdometerEditor, 
    setDashboardVehicleId, updateDashboardOdometer, 
    setLocationSelectorMode, setLastLocation, handleLocationSelection,
    setAppState, handleStartPress, openExpenseModal, setShowExpenseCategorySelector,
    setShowChargeTypeModal, setEditingTrip 
}) => {
    return (
        <div className="flex flex-col h-full bg-slate-100">
            {/* ... (Modales anteriores showLocationSelector, showVehicleSelector, showOdometerEditor se mantienen igual) ... */}
            {showLocationSelector && (
                <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLocationSelector(false)}>
                    <div className="bg-white w-full rounded-2xl p-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Cambiar Ubicación Actual</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {LOCATIONS_PRESETS.map(loc => {
                                const preset = LOCATIONS_CONFIG[loc] || { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
                                return (
                                    <button key={loc} onClick={() => { 
                                        setLastLocation(loc); 
                                        setShowLocationSelector(false); 
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

            {/* HEADER */}
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

            {/* CONTENIDO PRINCIPAL */}
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
            
            {/* HISTORIAL RECIENTE Y VERSION */}
            <div className="bg-white h-1/4 rounded-t-[2rem] shadow-lg p-6 overflow-hidden flex flex-col">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wider">Últimos Viajes</h3>
                    {/* VERSIÓN AQUI */}
                    <span className="text-[10px] font-mono text-slate-300 opacity-60">v{APP_VERSION}</span>
                </div>

                <div className="space-y-3 overflow-y-auto h-full pb-10 scrollbar-hide flex-1">
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
    );
};