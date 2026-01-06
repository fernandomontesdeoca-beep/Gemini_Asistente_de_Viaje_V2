const Icon = window.Icon;
const VEHICLE_TYPES = window.VEHICLE_TYPES;
const getVehicleInfo = window.getVehicleInfo;
const APP_VERSION = window.APP_VERSION;

window.SettingsView = ({ 
    vehicleConfigs, editingVehicleId, setEditingVehicleId, 
    updateVehicleConfig, setShowSaveConfirmation, 
    setAppState, showSaveConfirmation,
    handleExportData, setShowDataImportModal,
    // Nuevas props
    googleScriptUrl, setGoogleScriptUrl, handleCloudSync, isSyncing,
    onResetAll // Prop para borrar todo
}) => {
    return (
        <div className="flex flex-col h-screen w-full max-w-md mx-auto shadow-2xl overflow-hidden font-sans relative bg-slate-50 p-6">
            {showSaveConfirmation && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-xs text-center animate-in zoom-in duration-300">
                        <div className="mx-auto bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mb-4 ring-8 ring-emerald-50">
                            <Icon name="CheckCircle" size={40} className="text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">¡Datos Guardados!</h3>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed">Tu configuración ha sido actualizada.</p>
                        <button onClick={() => setShowSaveConfirmation(false)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-200">Entendido</button>
                    </div>
                </div>
            )}

            {/* Cabecera */}
            <div className="flex items-center mb-6">
                <button onClick={() => setAppState('IDLE')} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <Icon name="ArrowRight" className="rotate-180" size={24}/>
                </button>
                <h2 className="text-2xl font-bold ml-2 text-slate-800">Configuración</h2>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-1 scrollbar-hide pb-20">
                
                {/* SECCIÓN 1: VEHÍCULOS */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
                        <Icon name="Car" size={14} className="mr-2"/> Tarifas por Vehículo
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {VEHICLE_TYPES.map(v => (
                            <button 
                                key={v.id} 
                                onClick={() => setEditingVehicleId(v.id)} 
                                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border-2 ${editingVehicleId === v.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}
                            >
                                <Icon name={v.icon} size={24} className="mb-1"/>
                                <span className="text-[10px] font-bold uppercase">{v.short}</span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Peaje</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-slate-400 text-sm">$</span>
                                <input type="number" step="0.01" value={vehicleConfigs[editingVehicleId].tollPrice} onChange={e => updateVehicleConfig('tollPrice', e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 pl-7 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 outline-none" onFocus={(e) => e.target.select()}/>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Valor por Km</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-slate-400 text-sm">$</span>
                                <input type="number" step="0.01" value={vehicleConfigs[editingVehicleId].kmValue} onChange={e => updateVehicleConfig('kmValue', e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 pl-7 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 outline-none" onFocus={(e) => e.target.select()}/>
                            </div>
                        </div>
                        
                        {getVehicleInfo(editingVehicleId).type === 'electric' ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Carga AC</label>
                                    <input type="number" step="0.01" value={vehicleConfigs[editingVehicleId].fuelPriceAC} onChange={e => updateVehicleConfig('fuelPriceAC', e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 outline-none" onFocus={(e) => e.target.select()}/>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">Carga DC</label>
                                    <input type="number" step="0.01" value={vehicleConfigs[editingVehicleId].fuelPriceDC} onChange={e => updateVehicleConfig('fuelPriceDC', e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 outline-none" onFocus={(e) => e.target.select()}/>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Combustible (Litro)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-slate-400 text-sm">$</span>
                                    <input type="number" step="0.01" value={vehicleConfigs[editingVehicleId].fuelPrice} onChange={e => updateVehicleConfig('fuelPrice', e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2.5 pl-7 rounded-xl text-sm font-bold text-slate-700 focus:border-blue-500 outline-none" onFocus={(e) => e.target.select()}/>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECCIÓN 2: NUBE (GOOGLE SHEETS) */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-bold text-emerald-600 uppercase mb-3 flex items-center">
                        <Icon name="Zap" size={14} className="mr-2"/> Nube (Google Sheets)
                    </h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">URL del Script de Google</label>
                            <input 
                                type="text" 
                                value={googleScriptUrl || ''} 
                                onChange={e => setGoogleScriptUrl(e.target.value)} 
                                placeholder="https://script.google.com/macros/s/..."
                                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600 focus:border-emerald-500 outline-none break-all"
                            />
                        </div>
                        <button 
                            onClick={handleCloudSync}
                            disabled={isSyncing || !googleScriptUrl}
                            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${isSyncing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}
                        >
                            {isSyncing ? (
                                <><span className="animate-spin mr-2">⏳</span> Sincronizando...</>
                            ) : (
                                <><Icon name="UploadCloud" size={18} className="mr-2"/> Sincronizar Ahora</>
                            )}
                        </button>
                    </div>
                </div>

                {/* SECCIÓN 3: BACKUP LOCAL */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center">
                        <Icon name="Save" size={14} className="mr-2"/> Respaldo Local (Archivo)
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleExportData} className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-blue-300 transition-all group">
                            <Icon name="DownloadCloud" size={24} className="text-slate-400 group-hover:text-blue-500 mb-2 transition-colors"/>
                            <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600">Descargar</span>
                        </button>
                        <button onClick={() => setShowDataImportModal(true)} className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-rose-300 transition-all group">
                            <Icon name="UploadCloud" size={24} className="text-slate-400 group-hover:text-rose-500 mb-2 transition-colors"/>
                            <span className="text-xs font-bold text-slate-600 group-hover:text-rose-600">Restaurar</span>
                        </button>
                    </div>
                </div>
                
                {/* SECCIÓN 4: ZONA DE PELIGRO (RESET) */}
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 shadow-sm mt-4">
                     <h4 className="text-xs font-bold text-rose-600 uppercase mb-3 flex items-center">
                        <Icon name="AlertTriangle" size={14} className="mr-2"/> Zona de Peligro
                    </h4>
                    <button onClick={onResetAll} className="w-full py-3 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl text-sm hover:bg-rose-600 hover:text-white transition-all">
                        BORRAR TODO (Reset de Fábrica)
                    </button>
                </div>

                <div className="text-center pt-4">
                    <p className="text-[10px] text-slate-300 font-mono">v{APP_VERSION}</p>
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-md p-4 border-t border-slate-100">
                <button onClick={() => setShowSaveConfirmation(true)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
                    Guardar Cambios
                </button>
            </div>
        </div>
    );
};