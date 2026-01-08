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

            <div className="flex items-center mb-6">
                <button onClick={() => setAppState('IDLE')} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <Icon name="ArrowRight" className="rotate-180" size={24}/>
                </button>
                <h2 className="text-2xl font-bold ml-2 text-slate-800">Configuración</h2>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-1 scrollbar-hide pb-20">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-bold text-emerald-600 uppercase mb-3 flex items-center"><Icon name="Zap" size={14} className="mr-2"/> Nube</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">URL Script</label>
                            <input type="text" value={googleScriptUrl || ''} onChange={e => setGoogleScriptUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600 focus:border-emerald-500 outline-none break-all"/>
                        </div>
                        <button onClick={handleCloudSync} disabled={isSyncing || !googleScriptUrl} className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${isSyncing ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'}`}>
                            {isSyncing ? <><span className="animate-spin mr-2">⏳</span> Sync...</> : <><Icon name="UploadCloud" size={18} className="mr-2"/> Sincronizar Ahora</>}
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center"><Icon name="Save" size={14} className="mr-2"/> Respaldo</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleExportData} className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-blue-300 transition-all group">
                            <Icon name="DownloadCloud" size={24} className="text-slate-400 group-hover:text-blue-500 mb-2"/>
                            <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600">Descargar JSON</span>
                        </button>
                        <button onClick={onResetAll} className="flex flex-col items-center justify-center p-3 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all group">
                            <Icon name="AlertTriangle" size={24} className="text-rose-500 mb-2"/>
                            <span className="text-xs font-bold text-rose-700">BORRAR TODO</span>
                        </button>
                    </div>
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