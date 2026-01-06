// ==========================================
// CONFIGURACIÓN Y CONSTANTES (GLOBALES)
// ==========================================

// --- VERSIÓN DE LA APP ---
window.APP_VERSION = "2.2.1"; // Debe coincidir con version.json

// --- UI CONFIG ---
window.LOCATIONS_CONFIG = {
    'Cliente': { icon: 'User', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    'Trabajo': { icon: 'Briefcase', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    'Casa': { icon: 'Home', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    'Restaurante': { icon: 'Utensils', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    'Hotel': { icon: 'Bed', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    'Otra': { icon: 'MapPin', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
};
window.LOCATIONS_PRESETS = Object.keys(window.LOCATIONS_CONFIG);

// --- CATEGORÍAS ---
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

window.VEHICLE_TYPES = [
    { id: 'PERSONAL', label: 'Personal', short: 'Personal', icon: 'Car', type: 'fuel' },
    { id: 'COMPANY_FUEL', label: 'Empresa Combustible', short: 'Emp. Comb.', icon: 'Truck', type: 'fuel' },
    { id: 'COMPANY_ELECTRIC', label: 'Empresa Eléctrico', short: 'Emp. Elec.', icon: 'Zap', type: 'electric' },
    { id: 'OTHER', label: 'Otros', short: 'Otros', icon: 'Car', type: 'fuel' },
];

// --- VALORES OFICIALES ---
window.OFFICIAL_RATES = {
    toll: '162.00',
    fuel: '78.02', // Super 95
    electricAC: '9.50',
    electricDC: '10.80'
};

// --- HELPERS GLOBALES ---
window.getVehicleInfo = (id) => window.VEHICLE_TYPES.find(v => v.id === id) || window.VEHICLE_TYPES[0];

window.formatMoney = (amount) => {
     return Number(amount || 0).toFixed(2);
};