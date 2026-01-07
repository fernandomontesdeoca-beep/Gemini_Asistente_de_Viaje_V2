// ==========================================
// MODALES DE VIAJES
// Version: 3.6.0
// Last Updated: 2026-01-07
// ==========================================

const { useState, useEffect } = React;
const Icon = window.Icon;
const formatMoney = window.formatMoney;

window.ResumeTripModal = ({ isOpen, onResume, onDiscard }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-amber-100 p-4 rounded-full mb-4"><Icon name="AlertTriangle" size={32} className="text-amber-600"/></div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Viaje Detectado</h3>
                    <p className="text-slate-500 mb-6 text-sm">Se cerró la aplicación con un viaje en curso. <br/>¿Deseas retomarlo?</p>
                    <div className="w-full flex gap-3">
                        <button onClick={onDiscard} className="flex-1 py-3 rounded-xl font-bold text-rose-600 bg-rose-50 hover:bg-rose-100">Descartar</button>
                        <button onClick={onResume} className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">Continuar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.VisitEditModal = ({ isOpen, onClose, onSave, onDelete, visit }) => {
    const [formData, setFormData] = useState(visit || {});
    useEffect(() => { setFormData(visit || {}); }, [visit]);
    if (!isOpen || !visit) return null;

    // Helper seguro para renderizar gastos
    const renderExpenses = (trip) => {
        if (!trip || !trip.expenses || !Array.isArray(trip.expenses) || trip.expenses.length === 0) return null;
        return trip.expenses.map((exp, idx) => (
            <div key={idx} className="flex justify-between text-xs text-slate-600 border-b border-slate-100 last:border-0 py-1">
                <span>{exp.category}</span><span className="font-mono font-bold">{exp.currency} {formatMoney(exp.amount)}</span>
            </div>
        ));
    };

    // Helper para calcular total global de la visita
    const calculateTotal = () => {
        let total = 0;
        if (visit.inboundTrip && Array.isArray(visit.inboundTrip.expenses)) {
            total += visit.inboundTrip.expenses.reduce((acc, curr) => acc + (curr.currency === 'UYU' ? Number(curr.amount) : 0), 0);
        }
        if (visit.outboundTrip && Array.isArray(visit.outboundTrip.expenses)) {
            total += visit.outboundTrip.expenses.reduce((acc, curr) => acc + (curr.currency === 'UYU' ? Number(curr.amount) : 0), 0);
        }
        return total;
    };

    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center"><Icon name="Briefcase" size={20} className="mr-2 text-blue-600"/> Detalle de Visita</h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><Icon name="X" size={20} className="text-slate-500"/></button>
                </div>
                <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar scrollbar-hide">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Cliente</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                            <Icon name="User" size={16} className="text-slate-400 mr-2"/>
                            <input type="text" value={formData.client || ''} onChange={e => setFormData({...formData, client: e.target.value})} className="bg-transparent w-full text-base font-bold text-slate-700 outline-none"/>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center mb-2 text-blue-600 font-bold text-xs uppercase tracking-wide"><Icon name="ArrowRight" size={12} className="mr-1"/> Viaje de Ida</div>
                        {renderExpenses(visit.inboundTrip) || <p className="text-xs text-slate-400 italic">Sin gastos registrados</p>}
                    </div>
                    
                    {visit.outboundTrip && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex items-center mb-2 text-emerald-600 font-bold text-xs uppercase tracking-wide"><Icon name="ArrowRight" size={12} className="mr-1 rotate-180"/> Viaje de Vuelta</div>
                            {renderExpenses(visit.outboundTrip) || <p className="text-xs text-slate-400 italic">Sin gastos registrados</p>}
                        </div>
                    )}

                    {/* NUEVO: Resumen Total */}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="text-sm font-bold text-slate-600">Total Gastos (UYU)</span>
                        <span className="text-xl font-bold text-blue-600">${formatMoney(calculateTotal())}</span>
                    </div>
                </div>

                 <div className="mt-6 flex gap-3 pt-4 border-t border-slate-100">
                    <button onClick={() => onDelete(formData.id)} className="p-4 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"><Icon name="Trash2" size={20}/></button>
                    <button onClick={() => onSave(formData)} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all active:scale-95">Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
};

window.TripEditModal = ({ isOpen, onClose, onSave, onDelete, trip }) => {
    const [formData, setFormData] = useState(trip || {});
    useEffect(() => { setFormData(trip || {}); }, [trip]);

    const handleOdometerChange = (type, val) => {
        const newValue = parseInt(val) || 0;
        const newFormData = { ...formData, [type]: newValue };
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
                    <h3 className="text-xl font-bold text-slate-800 flex items-center"><Icon name="Edit2" size={20} className="mr-2 text-blue-600"/> Editar Viaje</h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><Icon name="X" size={20} className="text-slate-500"/></button>
                </div>
                <div className="space-y-4 overflow-y-auto flex-1 pr-2 scrollbar-hide">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Fecha</label>
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                <Icon name="Calendar" size={14} className="text-slate-400 mr-2"/>
                                <input type="text" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-transparent w-full text-sm font-bold text-slate-700 outline-none"/>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Distancia (km)</label>
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                <input type="number" value={formData.distance || 0} onChange={e => setFormData({...formData, distance: parseInt(e.target.value) || 0})} className="bg-transparent w-full text-sm font-bold text-slate-700 outline-none"/>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Odo. Inicio</label>
                            <input type="number" value={formData.startOdometer || 0} onChange={e => handleOdometerChange('startOdometer', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Odo. Fin</label>
                            <input type="number" value={formData.endOdometer || 0} onChange={e => handleOdometerChange('endOdometer', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700"/>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Origen</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                            <Icon name="MapPin" size={14} className="text-slate-400 mr-2"/>
                            <input type="text" value={formData.origin || ''} onChange={e => setFormData({...formData, origin: e.target.value})} className="bg-transparent w-full text-sm font-bold text-slate-700 outline-none"/>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Destino</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                            <Icon name="MapPin" size={14} className="text-slate-400 mr-2"/>
                            <input type="text" value={formData.destination || ''} onChange={e => setFormData({...formData, destination: e.target.value})} className="bg-transparent w-full text-sm font-bold text-slate-700 outline-none"/>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Inicio</label>
                            <input type="text" value={formData.startTime || ''} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Fin</label>
                            <input type="text" value={formData.endTime || ''} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none"/>
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