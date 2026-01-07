// ==========================================
// VISTA DE CIERRE DE VIAJE
// Version: 3.6.0
// Last Updated: 2026-01-07
// ==========================================

const Icon = window.Icon;
const formatMoney = window.formatMoney;
const LOCATIONS_PRESETS = window.LOCATIONS_PRESETS;
const EXPENSE_CATEGORIES = window.EXPENSE_CATEGORIES;

window.EndingTripView = ({ 
    inputOdometer, setInputOdometer, currentTrip, 
    setLocationSelectorMode, handleLocationSelection, 
    inputDestination, openExpenseModal, confirmEndTrip 
}) => {
    
    // Calculamos distancia visualmente
    const distance = (parseInt(inputOdometer) || 0) - currentTrip.startOdometer;
    const isDistanceValid = distance >= 0;

    return (
        <div className="flex flex-col h-screen w-full max-w-md mx-auto shadow-2xl overflow-hidden font-sans relative bg-slate-50">
            <div className="bg-emerald-600 p-6 text-white rounded-b-[2rem] shadow-lg">
                <h2 className="text-2xl font-bold">Llegada</h2>
                <p className="text-emerald-100 text-sm">Completa los datos de cierre.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Odómetro Final</label>
                        <span className={`font-mono font-bold ${!isDistanceValid ? 'text-red-500' : 'text-emerald-600'}`}>
                            {distance} km
                        </span>
                    </div>
                    <input 
                        type="number" 
                        value={inputOdometer} 
                        onChange={(e) => setInputOdometer(e.target.value)} 
                        className="w-full text-3xl font-mono font-bold text-slate-800 outline-none border-b-2 border-slate-100 focus:border-emerald-500 transition-colors" 
                        autoFocus 
                        onFocus={(e) => e.target.select()}
                    />
                    {!isDistanceValid && (
                        <p className="text-xs text-red-500 mt-1">El odómetro final debe ser mayor al inicial ({currentTrip.startOdometer}).</p>
                    )}
                </div>
                
                {/* Selector de Destino Rápido */}
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

                {/* Gastos */}
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
                <button 
                    disabled={!inputDestination || !isDistanceValid} 
                    onClick={confirmEndTrip} 
                    className="w-full bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-emerald-700 transition-all active:scale-95"
                >
                    CERRAR VIAJE
                </button>
            </div>
        </div>
    );
};