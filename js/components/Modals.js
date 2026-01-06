const { useState, useEffect } = React;

// Asignar todos los componentes a window
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
                    <p className="text-slate-500 mb-4 text-xs">Los valores oficiales en la web son distintos a tu configuración.</p>
                    
                    {/* TABLA DE COMPARACIÓN */}
                    <div className="bg-slate-50 rounded-xl p-3 w-full mb-6">
                        <div className="grid grid-cols-3 gap-1 text-xs font-bold text-slate-400 border-b border-slate-200 pb-2 mb-2 uppercase tracking-wider">
                            <span className="text-left">Concepto</span>
                            <span>Tuyo</span>
                            <span>Nuevo</span>
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

window.ChargeTypeModal = ({ isOpen, onClose, onSelectType }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
                <div className="flex items-center mb-6 text-yellow-600">
                    <Icon name="Zap" size={24} className="mr-2"/>
                    <h3 className="text-xl font-bold text-slate-800">Tipo de Carga</h3>
                </div>
                <div className="flex flex-col gap-3">
                     <button 
                        onClick={() => onSelectType('AC')}
                        className="bg-blue-50 text-blue-700 py-4 rounded-xl font-bold text-lg hover:bg-blue-100 transition-all active:scale-95 flex items-center justify-center"
                      >
                        <Icon name="Clock" size={20} className="mr-2"/> Carga Lenta (AC)
                      </button>
                      <button 
                        onClick={() => onSelectType('DC')}
                        className="bg-yellow-50 text-yellow-700 py-4 rounded-xl font-bold text-lg hover:bg-yellow-100 transition-all active:scale-95 flex items-center justify-center"
                      >
                        <Icon name="Zap" size={20} className="mr-2"/> Carga Rápida (CC)
                      </button>
                      <button 
                        onClick={onClose}
                        className="mt-2 text-slate-400 font-bold text-sm hover:text-slate-600"
                      >
                        Cancelar
                      </button>
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
        <div className="flex items-center mb-4 text-blue-600">
            <Icon name="Car" size={24} className="mr-2"/>
            <h3 className="text-xl font-bold text-slate-800">¿Pagaste Estacionamiento?</h3>
        </div>
        <p className="text-slate-500 mb-6 font-medium">Saliendo de cliente. ¿Deseas registrar el gasto ahora?</p>
        <div className="flex gap-3">
             <button 
                onClick={onNo}
                className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all active:scale-95"
              >
                No
              </button>
              <button 
                onClick={onYes}
                className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-700 transition-all active:scale-95"
              >
                Sí
              </button>
        </div>
      </div>
    </div>
  );
};

window.DestinationInputModal = ({ isOpen, onClose, onConfirm, title, placeholder, initialValue = '' }) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (isOpen) setValue(initialValue);
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center text-blue-600">
                        <Icon name="MapPin" size={24} className="mr-2"/>
                        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <Icon name="X" size={24}/>
                    </button>
                </div>

                <input 
                    type="text" 
                    autoFocus
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="w-full text-lg font-medium text-slate-800 border-b-2 border-slate-200 focus:border-blue-500 outline-none py-2 mb-6"
                    placeholder={placeholder}
                    onKeyDown={(e) => { 
                        if (e.key === 'Enter') {
                            onConfirm(value);
                            setValue('');
                        }
                    }}
                />
                <button 
                    onClick={() => {
                        onConfirm(value);
                        setValue('');
                    }}
                    className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
                >
                    Confirmar e Iniciar
                </button>
            </div>
        </div>
    );
};

window.VisitEditModal = ({ isOpen, onClose, onSave, onDelete, visit }) => {
    const [formData, setFormData] = useState(visit || {});
    
    useEffect(() => {
        setFormData(visit || {});
    }, [visit]);

    if (!isOpen || !visit) return null;

    const renderExpenses = (trip) => {
        if (!trip || !trip.expenses || trip.expenses.length === 0) return null;
        return trip.expenses.map((exp, idx) => (
            <div key={idx} className="flex justify-between text-xs text-slate-600 border-b border-slate-100 last:border-0 py-1">
                <span>{exp.category}</span>
                <span className="font-mono font-bold">{exp.currency} {formatMoney(exp.amount)}</span>
            </div>
        ));
    };

    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <Icon name="Briefcase" size={20} className="mr-2 text-blue-600"/> Detalle de Visita
                    </h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><Icon name="X" size={20} className="text-slate-500"/></button>
                </div>

                <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar scrollbar-hide">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Cliente</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                            <Icon name="User" size={16} className="text-slate-400 mr-2"/>
                            <input 
                                type="text" 
                                value={formData.client || ''} 
                                onChange={e => setFormData({...formData, client: e.target.value})} 
                                className="bg-transparent w-full text-base font-bold text-slate-700 outline-none"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center mb-2 text-blue-600 font-bold text-xs uppercase tracking-wide">
                            <Icon name="ArrowRight" size={12} className="mr-1"/> Viaje de Ida
                        </div>
                        {renderExpenses(visit.inboundTrip) || <p className="text-xs text-slate-400 italic">Sin gastos registrados</p>}
                    </div>

                    {visit.outboundTrip && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex items-center mb-2 text-emerald-600 font-bold text-xs uppercase tracking-wide">
                                <Icon name="ArrowRight" size={12} className="mr-1 rotate-180"/> Viaje de Vuelta
                            </div>
                            {renderExpenses(visit.outboundTrip) || <p className="text-xs text-slate-400 italic">Sin gastos registrados</p>}
                        </div>
                    )}
                </div>

                 <div className="mt-6 flex gap-3 pt-4 border-t border-slate-100">
                    <button onClick={() => onDelete(formData.id)} className="p-4 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors">
                        <Icon name="Trash2" size={20}/>
                    </button>
                    <button onClick={() => onSave(formData)} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all active:scale-95">
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

window.TripEditModal = ({ isOpen, onClose, onSave, onDelete, trip }) => {
    const [formData, setFormData] = useState(trip || {});

    useEffect(() => {
        setFormData(trip || {});
    }, [trip]);

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
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <Icon name="Edit2" size={20} className="mr-2 text-blue-600"/> Editar Viaje
                    </h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><Icon name="X" size={20} className="text-slate-500"/></button>
                </div>
                <div className="space-y-4 overflow-y-auto flex-1 pr-2 scrollbar-hide">
                    {/* ... Resto del contenido del modal igual ... */}
                    {/* Para brevedad, asumo que el contenido interno es el mismo, solo que ahora envuelto en window.TripEditModal */}
                    {/* Pega el resto del contenido del TripEditModal aquí si es necesario, o usa la estructura previa */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Fecha</label>
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                <Icon name="Calendar" size={14} className="text-slate-400 mr-2"/>
                                <input type="text" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-transparent w-full text-sm font-bold text-slate-700 outline-none" onFocus={(e) => e.target.select()}/>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Distancia (km)</label>
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                                <input type="number" value={formData.distance || 0} onChange={e => setFormData({...formData, distance: parseInt(e.target.value) || 0})} className="bg-transparent w-full text-sm font-bold text-slate-700 outline-none" onFocus={(e) => e.target.select()}/>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Odo. Inicio</label>
                            <input type="number" value={formData.startOdometer || 0} onChange={e => handleOdometerChange('startOdometer', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700" onFocus={(e) => e.target.select()}/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Odo. Fin</label>
                            <input type="number" value={formData.endOdometer || 0} onChange={e => handleOdometerChange('endOdometer', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700" onFocus={(e) => e.target.select()}/>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Origen</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                            <Icon name="MapPin" size={14} className="text-slate-400 mr-2"/>
                            <input type="text" value={formData.origin || ''} onChange={e => setFormData({...formData, origin: e.target.value})} className="bg-transparent w-full text-sm font-bold text-slate-700 outline-none" onFocus={(e) => e.target.select()}/>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Destino</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                            <Icon name="MapPin" size={14} className="text-slate-400 mr-2"/>
                            <input type="text" value={formData.destination || ''} onChange={e => setFormData({...formData, destination: e.target.value})} className="bg-transparent w-full text-sm font-bold text-slate-700 outline-none" onFocus={(e) => e.target.select()}/>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Inicio</label>
                            <input type="text" value={formData.startTime || ''} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none" onFocus={(e) => e.target.select()}/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Fin</label>
                            <input type="text" value={formData.endTime || ''} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none" onFocus={(e) => e.target.select()}/>
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

window.ExpenseModal = ({ isOpen, onClose, onConfirm, expenseData, setExpenseData }) => {
    if (!isOpen) return null;
    
    const isFuel = expenseData.category === 'Carga Combustible';
    const isElectric = expenseData.category === 'Carga Eléctrica';
    const isCharge = isFuel || isElectric;

    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center">
                        <Icon name="DollarSign" className="mr-2 text-violet-600"/> {expenseData.category}
                    </h3>
                    <button onClick={() => onClose()} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><Icon name="X" size={20} className="text-slate-500"/></button>
                </div>
                <div className="space-y-4">
                     {isCharge && (
                        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Odómetro</label>
                                <input
                                    type="number"
                                    value={expenseData.odometer}
                                    onChange={e => setExpenseData({...expenseData, odometer: e.target.value})}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-700"
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">{isElectric ? 'kWh' : 'Litros'}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={expenseData.volume}
                                    onChange={e => {
                                        const val = e.target.value;
                                        let newAmount = expenseData.amount;
                                        if (expenseData.unitPrice && val) {
                                            newAmount = (parseFloat(val) * parseFloat(expenseData.unitPrice)).toFixed(2);
                                        }
                                        setExpenseData({...expenseData, volume: val, amount: newAmount});
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-700"
                                    placeholder="0"
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                        </div>
                     )}

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Monto</label>
                            <input 
                                type="number" 
                                step="0.01"
                                autoFocus
                                value={expenseData.amount}
                                onChange={e => setExpenseData({...expenseData, amount: e.target.value})}
                                className="w-full text-2xl font-bold text-slate-900 bg-transparent border-b-2 border-slate-200 focus:border-violet-500 outline-none py-2"
                                placeholder="0.00"
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="text-xs font-bold text-slate-400 uppercase">Moneda</label>
                            <select 
                                value={expenseData.currencyType}
                                onChange={e => {
                                    const newType = e.target.value;
                                    setExpenseData({
                                        ...expenseData, 
                                        currencyType: newType,
                                        currency: newType === 'Otro' ? '' : newType 
                                    });
                                }}
                                className="w-full bg-slate-50 rounded-lg p-2 font-bold text-slate-700 mt-2"
                            >
                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    {expenseData.currencyType === 'Otro' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Especifique Moneda</label>
                            <input 
                                type="text" 
                                placeholder="Ej. BRL, ARS, EUR"
                                value={expenseData.currency}
                                onChange={e => setExpenseData({...expenseData, currency: e.target.value.toUpperCase()})}
                                className="w-full bg-blue-50 border border-blue-100 rounded-lg p-3 font-bold text-blue-800 focus:border-blue-500 outline-none mt-1"
                                onFocus={(e) => e.target.select()}
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Método de Pago</label>
                        <div className="grid grid-cols-2 gap-2">
                            {PAYMENT_METHODS.map(m => (
                                <button key={m.id} onClick={() => setExpenseData({...expenseData, method: m.id})} className={`flex items-center p-2 rounded-lg text-xs font-bold transition-all ${expenseData.method === m.id ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-slate-50 text-slate-500 border border-transparent'}`}>
                                    <Icon name={m.icon} size={14} className="mr-2"/> {m.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Tipo</label>
                        <div className="flex gap-2">
                            {EXPENSE_TYPES.map(t => (
                                <button key={t} onClick={() => setExpenseData({...expenseData, type: t})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${expenseData.type === t ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-slate-50 text-slate-500'}`}>{t}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Nota (Opcional)</label>
                        <div className="relative">
                            <Icon name="StickyNote" size={16} className="absolute left-3 top-3 text-slate-400"/>
                            <textarea rows="2" value={expenseData.notes} onChange={e => setExpenseData({...expenseData, notes: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-violet-500 outline-none resize-none" placeholder="Ej. Almuerzo con cliente..." onFocus={(e) => e.target.select()}/>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    {expenseData.id && (
                        <button onClick={() => onClose('DELETE')} className="p-4 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"><Icon name="Trash2" size={20}/></button>
                    )}
                    <button onClick={() => onConfirm()} className="flex-1 bg-violet-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-violet-200 hover:bg-violet-700 active:scale-95 transition-all">{expenseData.id ? 'Guardar Cambios' : 'Confirmar Gasto'}</button>
                </div>
            </div>
        </div>
    );
};

window.CategorySelector = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 z-[60] flex flex-col justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
            <div className="bg-white w-full rounded-t-[2.5rem] p-6 shadow-2xl relative z-10 animate-in slide-in-from-bottom duration-300 max-h-[75%] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Nuevo Gasto</h3>
                        <p className="text-slate-400 text-xs font-medium">Selecciona una categoría</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"><Icon name="X" size={24}/></button>
                </div>
                <div className="space-y-8 overflow-y-auto pb-8 pr-1 custom-scrollbar scrollbar-hide">
                    {Object.entries({ 'Alimentación': EXPENSE_CATEGORIES.FOOD, 'Alojamiento': EXPENSE_CATEGORIES.LODGING, 'Viaje & Transporte': EXPENSE_CATEGORIES.TRIP }).map(([label, items], idx) => (
                        <div key={label}>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center tracking-wider">
                                {idx === 0 ? <Icon name="Utensils" size={14} className="mr-2 text-orange-400"/> : idx === 1 ? <Icon name="Bed" size={14} className="mr-2 text-indigo-400"/> : <Icon name="Car" size={14} className="mr-2 text-blue-400"/>} {label}
                            </h4>
                            <div className={`grid ${items.length > 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                                {items.map(item => (
                                    <button key={item} onClick={() => onSelect(item)} className="group bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 text-slate-600 font-bold py-4 px-4 rounded-2xl text-sm transition-all text-left shadow-sm active:scale-95">
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div>
                        <button onClick={() => onSelect('Otros')} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 font-bold py-4 px-4 rounded-2xl text-sm transition-all flex items-center justify-center border border-transparent hover:border-slate-300">
                            <Icon name="ShoppingBag" size={18} className="mr-2"/> Otro / Varios
                        </button>
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
                    <div className="bg-emerald-100 p-3 rounded-full mb-4">
                        <Icon name="Zap" size={32} className="text-emerald-600"/>
                    </div>
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