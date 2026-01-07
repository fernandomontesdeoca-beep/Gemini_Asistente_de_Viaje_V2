// ==========================================
// VISTA DE HISTORIAL
// Version: 3.6.0
// Last Updated: 2026-01-07
// ==========================================

const Icon = window.Icon;
const formatMoney = window.formatMoney;
const PAYMENT_METHODS = window.PAYMENT_METHODS;

window.HistoryView = ({ 
    historyTab, setHistoryTab, trips, visits, expenses, 
    setAppState, setEditingTrip, setEditingVisit, openExpenseModal 
}) => {

    // Función auxiliar segura para calcular totales
    const calculateSafeTotal = (trip) => {
        if (!trip || !trip.expenses || !Array.isArray(trip.expenses)) return 0;
        return trip.expenses.reduce((sum, e) => sum + (e.currency === 'UYU' ? Number(e.amount) : 0), 0);
    };

    return (
        <div className="flex flex-col h-screen w-full max-w-md mx-auto shadow-2xl overflow-hidden font-sans relative bg-slate-50">
            <div className="bg-slate-800 text-white p-6 pb-8 rounded-b-[2rem] shadow-xl z-10">
                <div className="flex items-center mb-4">
                    <button onClick={() => setAppState('IDLE')}><Icon name="ArrowRight" className="rotate-180" size={24}/></button>
                    <h2 className="text-2xl font-bold ml-2">Historial</h2>
                </div>
            </div>
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
                                    {/* Mostrar badge si hay gastos de carga */}
                                    {t.expenses && Array.isArray(t.expenses) && t.expenses.some(e => e.category.includes('Carga')) && (
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
                                                {v.inboundTrip ? v.inboundTrip.date : 'Fecha desconocida'}
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${v.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{v.status === 'COMPLETED' ? 'Completada' : 'En Curso'}</span>
                                    </div>
                                    
                                    <div className="text-xs text-slate-500 space-y-2 mt-2 bg-slate-50 p-2 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center"><Icon name="ArrowRight" size={12} className="mr-1 text-blue-500"/> Ida</span>
                                            <span className="font-mono">{v.inboundTrip ? `${v.inboundTrip.startTime} (${v.inboundTrip.distance}km)` : 'N/A'}</span>
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

                                    {/* Calculo de Costo Total SEGURO */}
                                    <div className="flex justify-between border-t border-slate-100 pt-3 mt-1 font-bold text-slate-700">
                                        <span>Total Gastos:</span>
                                        <span className="text-blue-600">
                                            ${formatMoney(calculateSafeTotal(v.inboundTrip) + calculateSafeTotal(v.outboundTrip))}
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
    );
};