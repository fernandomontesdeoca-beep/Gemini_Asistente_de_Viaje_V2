// Importar funciones de Firebase (necesitas agregar los scripts en index.html)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, collection, addDoc, updateDoc, doc, onSnapshot, 
  enableIndexedDbPersistence, query, where, orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  // Tu configuración de Firebase aquí
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Habilitar persistencia Offline (Sustituye a tu js/db.js)
enableIndexedDbPersistence(db).catch((err) => {
    console.error("Error persistencia:", err);
});

// Servicio para escuchar cambios en tiempo real
export const subscribeToTrips = (callback) => {
    const q = query(collection(db, "trips"), orderBy("date", "desc"));
    // onSnapshot es MÁGICO: Se dispara cuando cambia la nube O cuando cambias algo localmente
    return onSnapshot(q, (snapshot) => {
        const trips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(trips);
    });
};

export const saveTrip = async (trip) => {
    if (trip.id) {
        // Actualizar
        const tripRef = doc(db, "trips", trip.id);
        await updateDoc(tripRef, trip);
    } else {
        // Crear
        await addDoc(collection(db, "trips"), trip);
    }
};