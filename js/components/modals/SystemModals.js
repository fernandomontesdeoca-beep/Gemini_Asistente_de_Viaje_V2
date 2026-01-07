// ==========================================
// MODALES DEL SISTEMA
// Version: 3.6.0
// Last Updated: 2026-01-07
// ==========================================

const { useState, useEffect } = React;
const Icon = window.Icon;

window.UpdatePromptModal = ({ isOpen, onClose, onConfirm, changes }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-blue-100 p-3 rounded-full mb-4">
                        <Icon name="Zap" size={32} className="text-blue-600"/>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Tarifas Actualizadas</h3>
                    <div className="bg-slate-50 rounded-xl p-3 w-full mb-6">
                        <div className="grid grid-cols-3 gap-1 text-xs font-bold text-slate-400 border-b border-slate-200 pb-2 mb-2 uppercase tracking-wider">
                            <span className="text-left">Concepto</span><span>Tuyo</span><span>Nuevo</span>
                        </div>
                        <div className="space-y-2">
                            {changes && changes.map((change, idx) => (
                                <div key={idx} className="grid grid-cols-3 gap-1 text-sm items-center">
                                    <span className="text-left font-bold text-slate-700 truncate">{change.label}</span>
                                    <span className="text-slate-500 line-through decoration-rose-400">{change.oldVal}</span>
                                    <span className="text-emerald-600 font-bold">{change.newVal}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="w-full flex gap-3">
                        <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 text-sm">Mantener Míos</button>
                        <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 text-sm">Actualizar Todo</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.UpdateAppModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-emerald-100 p-3 rounded-full mb-4"><Icon name="Zap" size={32} className="text-emerald-600"/></div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">¡Nueva Versión Disponible!</h3>
                    <p className="text-slate-500 mb-6 text-sm">Hay una actualización lista con mejoras y correcciones.</p>
                    <div className="w-full flex gap-3">
                        <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">Más tarde</button>
                        <button onClick={onConfirm} className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200">Actualizar Ahora</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.DataImportModal = ({ isOpen, onClose, onImport }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                <div className="flex flex-col items-center text-center">
                    <div className="bg-rose-100 p-4 rounded-full mb-4"><Icon name="AlertTriangle" size={32} className="text-rose-600"/></div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Importar Datos</h3>
                    <p className="text-slate-500 mb-6 text-sm">¡Atención! Al importar, <strong className="text-rose-600">se borrarán los datos actuales</strong>.</p>
                    <div className="w-full flex gap-3">
                        <button onClick={onClose} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">Cancelar</button>
                        <button onClick={onImport} className="flex-1 py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200">Sí, Importar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.ParkingAskModal = ({ isOpen, onClose, onYes, onNo }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
        <div className="flex items-center mb-4 text-blue-600"><Icon name="Car" size={24} className="mr-2"/><h3 className="text-xl font-bold text-slate-800">¿Pagaste Estacionamiento?</h3></div>
        <p className="text-slate-500 mb-6 font-medium">Saliendo de cliente. ¿Deseas registrar el gasto ahora?</p>
        <div className="flex gap-3">
             <button onClick={onNo} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-xl font-bold text-lg hover:bg-slate-200">No</button>
             <button onClick={onYes} className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-700">Sí</button>
        </div>
      </div>
    </div>
  );
};

window.DestinationInputModal = ({ isOpen, onClose, onConfirm, title, placeholder, initialValue = '' }) => {
    const [value, setValue] = useState(initialValue);
    useEffect(() => { if (isOpen) setValue(initialValue); }, [isOpen, initialValue]);
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center text-blue-600"><Icon name="MapPin" size={24} className="mr-2"/><h3 className="text-xl font-bold text-slate-800">{title}</h3></div>
                    <button onClick={onClose} className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"><Icon name="X" size={24}/></button>
                </div>
                <input type="text" autoFocus value={value} onChange={e => setValue(e.target.value)} className="w-full text-lg font-medium text-slate-800 border-b-2 border-slate-200 focus:border-blue-500 outline-none py-2 mb-6" placeholder={placeholder} onKeyDown={(e) => { if (e.key === 'Enter') { onConfirm(value); setValue(''); }}} />
                <button onClick={() => { onConfirm(value); setValue(''); }} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700">Confirmar e Iniciar</button>
            </div>
        </div>
    );
};