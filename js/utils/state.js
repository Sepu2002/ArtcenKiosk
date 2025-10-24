// Este archivo maneja todo lo relacionado con el estado de los casilleros.
import { showModal } from '../widgets/modal.js';

// El estado de la aplicación vive aquí.
export let bays = [];

/**
 * Carga el estado inicial sincronizando el hardware con localStorage.
 */
export async function initializeState() {
    console.log("Sincronizando estado del hardware...");
    let savedSoftwareBays = [];
    
    // 1. Cargar el estado "software" (reservas) desde localStorage
    try {
        const savedState = localStorage.getItem('lockerState');
        if (savedState) {
            savedSoftwareBays = JSON.parse(savedState);
        }
    } catch (e) {
        console.error("Falló al parsear el estado de localStorage", e);
    }

    // 2. Cargar el estado "hardware" (físico) desde el servidor
    try {
        const response = await fetch('http://127.0.0.1:5000/check-all-statuses');
        if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);
        
        const data = await response.json();
        if (!data.success) throw new Error('El servidor falló al obtener el estado');

        const hardwareBays = data.bays;

        // 3. Fusionar los estados (Lógica CORREGIDA)
        bays = hardwareBays.map(hwBay => {
            const swBay = savedSoftwareBays.find(b => b.id === hwBay.channel);
            
            // Definir los estados del software
            const isOccupied = swBay?.occupied || false;
            const customerEmail = swBay?.customerEmail || null;
            const pickupCode = swBay?.pickupCode || null;

            // Definir el estado físico
            // "LOCKED" (cerrado) o "UNLOCKED" (abierto) o "UNKNOWN" (error)
            const hardwareStatus = hwBay.status;

            return {
                id: hwBay.channel,
                occupied: isOccupied,
                customerEmail: customerEmail,
                pickupCode: pickupCode,
                hardwareStatus: hardwareStatus // Guardamos el estado físico real
            };
        });
        
        console.log("Estado sincronizado con éxito:", bays);
        saveState(); // Guarda el nuevo estado fusionado

    } catch (e) {
        console.error("¡FALLO CRÍTICO! No se pudo conectar al servidor de casilleros.", e);
        bays = getDefaultState(savedSoftwareBays); // Fallback al estado guardado
        showModal("Error de Conexión", 
            `<p class="text-red-500">No se pudo conectar al hardware. El estado mostrado puede ser incorrecto.</p>`,
            0
        );
    }
}

/**
 * Guarda el estado actual en localStorage.
 */
export function saveState() {
    try {
        // Solo guardamos los datos del software, no el estado del hardware
        const softwareState = bays.map(b => ({
            id: b.id,
            occupied: b.occupied,
            customerEmail: b.customerEmail,
            pickupCode: b.pickupCode
        }));
        localStorage.setItem('lockerState', JSON.stringify(softwareState));
    } catch (e) {
        console.error("Falló al guardar el estado en localStorage", e);
    }
}

/**
 * Reemplaza el estado actual de los casilleros (usado para importación).
 * @param {Array} newBays - El nuevo array de casilleros.
 */
export function setBays(newBays) {
    bays = newBays;
}

function getDefaultState(savedBays = null) {
    if (savedBays && savedBays.length > 0) {
        return savedBays.map(b => ({ ...b, hardwareStatus: "UNKNOWN" }));
    }
    
    // Si no hay nada, genera un array de 8
    return Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        occupied: false,
        customerEmail: null,
        pickupCode: null,
        hardwareStatus: "UNKNOWN" // Estado físico desconocido
    }));
}