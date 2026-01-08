// ==========================================
// CONFIGURACIÓN GLOBAL v4.0.0
// ==========================================

window.APP_VERSION = "4.0.0";

// --- VEHÍCULOS (Definición Base) ---
// Se ha ampliado para incluir eficiencia y capacidad
window.VEHICLE_TYPES = [
    { id: 'PERSONAL', label: 'Auto Personal', icon: 'Car', type: 'fuel', defaultEfficiency: 10 },
    { id: 'COMPANY_FUEL', label: 'Camioneta Empresa', icon: 'Truck', type: 'fuel', defaultEfficiency: 8 },
    { id: 'COMPANY_ELECTRIC', label: 'Eléctrico Empresa', icon: 'Zap', type: 'electric', defaultEfficiency: 5 }, // km/kWh
    { id: 'OTHER', label: 'Otro Vehículo', icon: 'Car', type: 'fuel', defaultEfficiency: 10 },
];

window.LOCATIONS_CONFIG = {
    'Cliente': { icon: 'User', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    'Trabajo': { icon: 'Briefcase', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    'Casa': { icon: 'Home', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    'Restaurante': { icon: 'Utensils', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    'Hotel': { icon: 'Bed', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    'Otra': { icon: 'MapPin', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
};
window.LOCATIONS_PRESETS = Object.keys(window.LOCATIONS_CONFIG);

window.EXPENSE_CATEGORIES = {
    FOOD: ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Refrigerio'],
    LODGING: ['Alojamiento'],
    TRIP: ['Peaje', 'Estacionamiento', 'Carga Combustible', 'Carga Eléctrica'],
    OTHER: ['Otros']
};

window.PAYMENT_METHODS = [
    { id: 'EFECTIVO', label: 'Efectivo', icon: 'Wallet' },
    { id: 'DEBITO', label: 'Débito', icon: 'CreditCard' },
    { id: 'CREDITO', label: 'Crédito', icon: 'CreditCard' },
    { id: 'TRANSFERENCIA', label: 'Transferencia', icon: 'Landmark' },
];

window.CURRENCIES = ['UYU', 'U$D', 'Otro'];
window.EXPENSE_TYPES = ['Personal', 'Empresa'];

window.OFFICIAL_RATES = {
    toll: '162.00',
    fuel: '78.02', 
    electricAC: '9.50',
    electricDC: '10.80'
};

window.getVehicleInfo = (id) => window.VEHICLE_TYPES.find(v => v.id === id) || window.VEHICLE_TYPES[0];
window.formatMoney = (amount) => Number(amount || 0).toFixed(2);