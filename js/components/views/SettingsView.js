const Icon = window.Icon;
const VEHICLE_TYPES = window.VEHICLE_TYPES;
const getVehicleInfo = window.getVehicleInfo;
const APP_VERSION = window.APP_VERSION;

window.SettingsView = ({ 
    vehicleConfigs, editingVehicleId, setEditingVehicleId, 
    updateVehicleConfig, setShowSaveConfirmation, 
    setAppState, showSaveConfirmation,
    handleExportData, setShowDataImportModal 
}) => {
    return (
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
            
            <div className="mt-8 border-t border-slate-200 pt-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center"><Icon name="Save" size={14} className="mr-2"/> Gestión de Datos</h4>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={handleExportData} className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"><Icon name="DownloadCloud" size={24} className="text-blue-600 mb-2"/><span className="text-xs font-bold text-slate-600">Exportar Backup</span></button>
                    <button onClick={() => setShowDataImportModal(true)} className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"><Icon name="UploadCloud" size={24} className="text-emerald-600 mb-2"/><span className="text-xs font-bold text-slate-600">Importar Datos</span></button>
                </div>
            </div>
            
            <button onClick={() => setShowSaveConfirmation(true)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl mt-4">Guardar</button>
        </div>
    );
};