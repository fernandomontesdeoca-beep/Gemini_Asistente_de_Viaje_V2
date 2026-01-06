const Icon = window.Icon;
const formatMoney = window.formatMoney;
const getVehicleInfo = window.getVehicleInfo;

window.ActiveTripView = ({ 
    currentTrip, elapsedTime, setAppState, openExpenseModal, 
    getActiveConfig, setShowChargeTypeModal, setShowExpenseCategorySelector, handleArrivePress 
}) => {
    
    // Función auxiliar para formatear tiempo (mm:ss)
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-screen bg-slate-900 text-white w-full max-w-md mx-auto shadow-2xl overflow-hidden font-sans relative">
            <div className="z-10 bg-slate-800/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center text-emerald-400 animate-pulse"><div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div><span className="font-bold text-xs tracking-widest uppercase">En Ruta</span></div>
                <div className="flex items-center gap-3">
                    <div className="font-mono text-xl flex items-center"><Icon name="Clock" size={16} className="mr-2 text-slate-500"/>{formatTime(elapsedTime)}</div>
                    <button onClick={() => setAppState('IDLE')} className="bg-slate-800 p-2 rounded-full text-rose-500 border border-slate-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors">
                        <Icon name="X" size={20} />
                    </button>
                </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 z-10">
                <div className="text-center">
                    <div className="inline-flex items-center bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-400 mb-2">
                        {getVehicleInfo(currentTrip.vehicle).type === 'electric' ? <Icon name="Zap" size={12} className="mr-1 text-yellow-400"/> : <Icon name="Car" size={12} className="mr-1"/>}
                        {getVehicleInfo(currentTrip.vehicle).label}
                    </div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Origen</p>
                    <h2 className="text-4xl font-bold">{currentTrip.origin}</h2>
                    {currentTrip.destination && (
                        <div className="mt-2 text-slate-400 text-sm animate-pulse">
                            <span className="opacity-60">Hacia: </span> <span className="text-white font-bold">{currentTrip.destination}</span>
                        </div>
                    )}
                </div>
                <Icon name="ArrowRight" className="text-slate-600 rotate-90" size={32}/>
                <div className="grid grid-cols-2 gap-4 w-full">
                    <button onClick={() => openExpenseModal('Peaje')} className="bg-rose-600 hover:bg-rose-500 p-6 rounded-2xl flex flex-col items-center justify-center transition-all shadow-lg shadow-rose-900/40">
                        <div className="bg-white/20 p-3 rounded-full mb-2"><Icon name="DollarSign" size={24} className="text-white"/></div>
                        <span className="font-bold text-lg text-white">PEAJE</span>
                        <span className="text-xs text-rose-200 mt-1 opacity-80">${formatMoney(getActiveConfig().tollPrice)} {getActiveConfig().currency}</span>
                    </button>
                    <button onClick={() => {
                        if (getVehicleInfo(currentTrip.vehicle).type === 'electric') {
                            setShowChargeTypeModal(true);
                        } else {
                            openExpenseModal('Carga Combustible');
                        }
                    }} className="bg-orange-600 hover:bg-orange-500 p-6 rounded-2xl flex flex-col items-center justify-center transition-all shadow-lg shadow-orange-900/40">
                        {getVehicleInfo(currentTrip.vehicle).type === 'electric' ? <Icon name="Zap" size={28} className="text-yellow-300 mb-2"/> : <Icon name="Fuel" size={28} className="text-slate-300 mb-2"/>}
                        <span className="font-bold text-lg text-white">{getVehicleInfo(currentTrip.vehicle).type === 'electric' ? 'CARGA' : 'NAFTA'}</span>
                        <span className="text-xs text-orange-200 mt-1 opacity-80">
                            {getVehicleInfo(currentTrip.vehicle).type === 'electric' ? 'AC/DC' : `${formatMoney(getActiveConfig().fuelPrice)}/${getVehicleInfo(currentTrip.vehicle).type === 'electric' ? 'kWh' : 'L'}`}
                        </span>
                    </button>
                </div>
                <div className="w-full"><button onClick={() => setShowExpenseCategorySelector(true)} className="w-full py-4 border border-violet-700 text-violet-300 rounded-xl text-sm font-bold hover:bg-violet-900/30 flex items-center justify-center transition-all"><Icon name="Plus" size={18} className="mr-2"/> Gasto</button></div>
            </div>
            <div className="p-6 bg-slate-900 border-t border-slate-800 z-10">
                <button onClick={handleArrivePress} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-900/50 flex items-center justify-center hover:bg-emerald-500"><Icon name="MapPin" className="mr-2" fill="currentColor"/> LLEGAR A DESTINO</button>
            </div>
        </div>
    );
};