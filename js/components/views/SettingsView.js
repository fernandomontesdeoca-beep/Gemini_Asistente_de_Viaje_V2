const Icon = window.Icon;
const VEHICLE_TYPES = window.VEHICLE_TYPES;
const getVehicleInfo = window.getVehicleInfo;
const APP_VERSION = window.APP_VERSION;

window.SettingsView = ({ 
    vehicleConfigs, editingVehicleId, setEditingVehicleId, 
    updateVehicleConfig, setShowSaveConfirmation, 
    setAppState, showSaveConfirmation,
    handleExportData, setShowDataImportModal,
    googleScriptUrl, setGoogleScriptUrl, handleCloudSync, isSyncing,
    onResetAll 
}) => {
    
    const activeVehicle = getVehicleInfo(editingVehicleId);
    const config = vehicleConfigs[editingVehicleId] || {};

    return (
        <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-slate-50 font-sans">
            {/* Header Flotante */}
            <div className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center">
                    <button onClick={() => setAppState('IDLE')} className="p-2 -ml-2 text-slate-400 hover:text-slate-800 transition-colors">
                        <Icon name="ArrowRight" className="rotate-180" size={28}/>
                    </button>
                    <h2 className="text-xl font-bold ml-2 text-slate-800">Ajustes</h2>
                </div>
                <div className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-400">v{APP_VERSION}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
                
                {/* 1. SELECTOR DE VEHÍCULO (TABS) */}
                <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex overflow-x-auto no-scrollbar">
                    {VEHICLE_TYPES.map(v => (
                        <button 
                            key={v.id} 
                            onClick={() => setEditingVehicleId(v.id)} 
                            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all min-w-[80px] ${editingVehicleId === v.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            <Icon name={v.icon} size={20} className="mb-1"/>
                            <span className="text-[10px] font-bold uppercase tracking-wider">{v.id.split('_')[0]}</span>
                        </button>
                    ))}
                </div>

                {/* 2. CONFIGURACIÓN DEL VEHÍCULO */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm animate-fade-in">
                    <div className="flex items-center mb-4 text-blue-600">
                        <Icon name="Settings" size={20} className="mr-2"/>
                        <h3 className="font-bold text-lg text-slate-800">Datos de {activeVehicle.label}</h3>
                    </div>

                    <div className="space-y-4">
                        {/* Alias Personalizado */}
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Alias (Nombre en Pantalla)</label>
                            <input 
                                type="text" 
                                value={config.alias || activeVehicle.label} 
                                onChange={e => updateVehicleConfig('alias', e.target.value)} 
                                className="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-blue-500 px-3 py-2 outline-none font-bold text-slate-700 transition-colors"
                                placeholder="Ej. La Nave"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Peaje */}
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Peaje ($)</label>
                                <input type="number" step="0.01" value={config.tollPrice} onChange={e => updateVehicleConfig('tollPrice', e.target.value)} className="w-full bg-slate-50 rounded-xl px-3 py-3 font-mono font-bold text-slate-700 outline-none border border-slate-200 focus:ring-2 focus:ring-blue-200"/>
                            </div>
                            {/* Valor KM */}
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Valor KM ($)</label>
                                <input type="number" step="0.01" value={config.kmValue} onChange={e => updateVehicleConfig('kmValue', e.target.value)} className="w-full bg-slate-50 rounded-xl px-3 py-3 font-mono font-bold text-slate-700 outline-none border border-slate-200 focus:ring-2 focus:ring-blue-200"/>
                            </div>
                        </div>

                        {/* Combustible / Eficiencia */}
                        <div className="pt-2 border-t border-slate-100">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-2 block flex items-center">
                                <Icon name={activeVehicle.type === 'electric' ? 'Zap' : 'Fuel'} size={12} className="mr-1"/> 
                                {activeVehicle.type === 'electric' ? 'Energía & Rendimiento' : 'Combustible & Rendimiento'}
                            </label>
                            
                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                    <label className="text-[10px] text-slate-400 mb-1 block">Precio {activeVehicle.type === 'electric' ? 'kWh (AC)' : 'Litro'}</label>
                                    <input type="number" step="0.01" value={activeVehicle.type === 'electric' ? config.fuelPriceAC : config.fuelPrice} onChange={e => updateVehicleConfig(activeVehicle.type === 'electric' ? 'fuelPriceAC' : 'fuelPrice', e.target.value)} className="w-full bg-slate-50 rounded-lg p-2 font-mono text-sm font-bold text-slate-700 border border-slate-200"/>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 mb-1 block">Rendimiento ({activeVehicle.type === 'electric' ? 'km/kWh' : 'km/L'})</label>
                                    <input type="number" step="0.1" value={config.efficiency || activeVehicle.defaultEfficiency} onChange={e => updateVehicleConfig('efficiency', e.target.value)} className="w-full bg-slate-50 rounded-lg p-2 font-mono text-sm font-bold text-slate-700 border border-slate-200"/>
                                </div>
                            </div>
                            
                            {activeVehicle.type === 'electric' && (
                                <div>
                                    <label className="text-[10px] text-slate-400 mb-1 block">Precio Carga Rápida (DC)</label>
                                    <input type="number" step="0.01" value={config.fuelPriceDC} onChange={e => updateVehicleConfig('fuelPriceDC', e.target.value)} className="w-full bg-slate-50 rounded-lg p-2 font-mono text-sm font-bold text-slate-700 border border-slate-200"/>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. NUBE Y DATOS */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center"><Icon name="DownloadCloud" size={14} className="mr-2"/> Nube y Respaldo</h4>
                    
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={googleScriptUrl || ''} 
                                onChange={e => setGoogleScriptUrl(e.target.value)} 
                                placeholder="Pegar URL del Script aquí..."
                                className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600 focus:border-emerald-500 outline-none"
                            />
                        </div>
                        
                        <button 
                            onClick={handleCloudSync}
                            disabled={isSyncing || !googleScriptUrl}
                            className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${isSyncing ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'}`}
                        >
                            {isSyncing ? <><span className="animate-spin mr-2">⏳</span> Sincronizando...</> : <><Icon name="Zap" size={18} className="mr-2"/> Forzar Sincronización</>}
                        </button>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button onClick={handleExportData} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold hover:bg-white hover:border-blue-300 transition-all">
                                📥 Backup JSON
                            </button>
                            <button onClick={onResetAll} className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold hover:bg-rose-600 hover:text-white transition-all">
                                🧹 Reset Fábrica
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-md p-4 border-t border-slate-100 z-50">
                <button onClick={() => setShowSaveConfirmation(true)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
                    Guardar Todo
                </button>
            </div>
        </div>
    );
};