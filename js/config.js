// ==========================================
// CONFIGURACIÓN Y CONSTANTES
// ==========================================

// --- VERSIÓN DE LA APP ---
const APP_VERSION = "2.1.9"; // Debe coincidir con version.json

// --- UI CONFIG ---
const LOCATIONS_CONFIG = {
    'Cliente': { icon: 'User', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    'Trabajo': { icon: 'Briefcase', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    'Casa': { icon: 'Home', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    'Restaurante': { icon: 'Utensils', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    'Hotel': { icon: 'Bed', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    'Otra': { icon: 'MapPin', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
};
const LOCATIONS_PRESETS = Object.keys(LOCATIONS_CONFIG);

// --- CATEGORÍAS ---
const EXPENSE_CATEGORIES = {
    FOOD: ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Refrigerio'],
    LODGING: ['Alojamiento'],
    TRIP: ['Peaje', 'Estacionamiento', 'Carga Combustible', 'Carga Eléctrica'],
    OTHER: ['Otros']
};

const PAYMENT_METHODS = [
    { id: 'EFECTIVO', label: 'Efectivo', icon: 'Wallet' },
    { id: 'DEBITO', label: 'Débito', icon: 'CreditCard' },
    { id: 'CREDITO', label: 'Crédito', icon: 'CreditCard' },
    { id: 'TRANSFERENCIA', label: 'Transferencia', icon: 'Landmark' },
];

const CURRENCIES = ['UYU', 'U$D', 'Otro'];
const EXPENSE_TYPES = ['Personal', 'Empresa'];

const VEHICLE_TYPES = [
    { id: 'PERSONAL', label: 'Personal', short: 'Personal', icon: 'Car', type: 'fuel' },
    { id: 'COMPANY_FUEL', label: 'Empresa Combustible', short: 'Emp. Comb.', icon: 'Truck', type: 'fuel' },
    { id: 'COMPANY_ELECTRIC', label: 'Empresa Eléctrico', short: 'Emp. Elec.', icon: 'Zap', type: 'electric' },
    { id: 'OTHER', label: 'Otros', short: 'Otros', icon: 'Car', type: 'fuel' },
];

// --- VALORES OFICIALES (Reference) ---
// TARIFAS OFICIALES URUGUAY 2025
const OFFICIAL_RATES = {
    toll: '162.00',
    fuel: '78.02', // Super 95
    electricAC: '9.50',
    electricDC: '10.80'
};

// --- HELPERS GLOBALES ---
const getVehicleInfo = (id) => VEHICLE_TYPES.find(v => v.id === id) || VEHICLE_TYPES[0];

const formatMoney = (amount) => {
     return Number(amount || 0).toFixed(2);
};