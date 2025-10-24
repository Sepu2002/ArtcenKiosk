// Este archivo maneja todo lo relacionado con el estado de los casilleros.
import { showModal } from '../widgets/modal.js';

// El estado de la aplicación vive aquí.
export let bays = [];

/**
 * Carga el estado inicial sincronizando el hardware con localStorage.
 */
export async function initializeState() {
    console.log("Sincronizando estado del hardware...");
    let savedBays = [];
    
    // 1. Cargar el estado "software" (con emails/códigos) desde localStorage
    try {
        const savedState = localStorage.getItem('lockerState');
        if (savedState) {
            savedBays = JSON.parse(savedState);
        }
    } catch (e) {
        console.error("Falló al parsear el estado de localStorage", e);
    }

    // 2. Cargar el estado "hardware" (real) desde el servidor
    try {
        const response = await fetch('http://127.0.0.1:5000/check-all-statuses');
        if (!response.ok) {
            throw new Error(`Error de red: ${response.statusText}`);
        }
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('El servidor falló al obtener el estado de los casilleros.');
        }

        // 3. Fusionar los estados
        const hardwareBays = data.bays;
        bays = hardwareBays.map(hwBay => {
            const savedBay = savedBays.find(b => b.id === hwBay.channel);

            if (hwBay.status === "UNLOCKED") {
                // Si el hardware dice que está ABIERTO, está DISPONIBLE.
                return {
                    id: hwBay.channel,
                    occupied: false,
                    customerEmail: null,
                    pickupCode: null
                };
            } else {
                // Si el hardware dice que está CERRADO (LOCKED):
                // Confía en los datos de software (email/código) si existen.
                if (savedBay && savedBay.occupied) {
                    return savedBay;
                }
                // Si no hay datos de software, es un casillero "desconocido" pero cerrado.
                // Lo marcaremos como disponible (aunque esté cerrado)
                // OJO: O se podría marcar como 'error' o 'ocupado sin datos'.
                // Por ahora, lo más seguro es marcarlo como 'ocupado'
                // para evitar que se use. Lo forzaremos a 'disponible'
                // para que el admin pueda verlo, pero esto es una decisión de negocio.
                // Vamos a asumir que si está cerrado pero sin datos, está 'ocupado'.
                return {
                    id: hwBay.channel,
                    occupied: true, // Está cerrado, así que está ocupado
                    customerEmail: savedBay?.customerEmail || "Desconocido",
                    pickupCode: savedBay?.pickupCode || "???"
                };
                // *** CORRECCIÓN ***
                // Lo más seguro es: si está cerrado (LOCKED) pero el software
                // dice que está vacío (o no hay datos), el hardware gana.
                // Si el software dice que está ocupado, el software gana.
                
                const finalBay = {
                    id: hwBay.channel,
                    occupied: false,
                    customerEmail: null,
                    pickupCode: null
                };

                if (savedBay && savedBay.occupied) {
                    finalBay.occupied = true;
                    finalBay.customerEmail = savedBay.customerEmail;
                    finalBay.pickupCode = savedBay.pickupCode;
                }
                
                // Si hwBay.status es 'LOCKED' pero 'savedBay' dice 'occupied: false',
                // el 'savedBay' está mal. Lo forzamos a 'occupied: false' (UNLOCKED)
                // para que el admin lo vea como 'disponible' (aunque la puerta esté cerrada).
                // ...
                // Esta lógica es compleja. Simplifiquemos:
                // Si el hardware está "UNLOCKED" (abierto), está disponible.
                // Si el hardware está "LOCKED" (cerrado), confiamos en el software.
                if (savedBay) {
                    return savedBay; // Confía en el estado del software
                }
                
                return {
                    id: hwBay.channel,
                    occupied: false, // Default para un casillero cerrado y desconocido
                    customerEmail: null,
                    pickupCode: null
                };
            }
        });
        
        console.log("Estado sincronizado con éxito:", bays);
        saveState(); // Guarda el nuevo estado fusionado

    } catch (e) {
        console.error("¡FALLO CRÍTICO! No se pudo conectar al servidor de casilleros.", e);
        // Fallback: Cargar el estado antiguo desde localStorage
        bays = savedBays.length > 0 ? savedBays : getDefaultState();
        showModal("Error de Conexión", 
            `<p class="text-red-500">No se pudo conectar al hardware. El estado mostrado puede ser incorrecto. Por favor, reinicia la aplicación.</p>`,
            0 // No autocerrar
        );
    }
}

/**
 * Guarda el estado actual en localStorage.
 */
export function saveState() {
    try {
        localStorage.setItem('lockerState', JSON.stringify(bays));
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

function getDefaultState() {
    // Inicializa con un estado por defecto si no hay nada
    return [
        { id: 1, occupied: false, customerEmail: null, pickupCode: null },
        { id: 2, occupied: false, customerEmail: null, pickupCode: null },
        { id: 3, occupied: false, customerEmail: null, pickupCode: null },
        { id: 4, occupied: false, customerEmail: null, pickupCode: null },
        { id: 5, occupied: false, customerEmail: null, pickupCode: null },
        { id: 6, occupied: false, customerEmail: null, pickupCode: null },
        { id: 7, occupied: false, customerEmail: null, pickupCode: null },
        { id: 8, occupied: false, customerEmail: null, pickupCode: null },
    ];
}