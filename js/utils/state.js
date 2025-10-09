// Este archivo maneja todo lo relacionado con el estado de los casilleros.

// El estado de la aplicación vive aquí. Lo exportamos para que otros módulos puedan leerlo.
export let bays = [];

/**
 * Carga el estado desde localStorage o inicializa con valores por defecto.
 */
export function loadState() {
    try {
        const savedState = localStorage.getItem('lockerState');
        if (savedState) {
            bays = JSON.parse(savedState);
        } else {
            // Inicializa con un estado por defecto si no hay nada guardado
            bays = [
                { id: 1, occupied: false, customerEmail: null, pickupCode: null },
                { id: 2, occupied: true, customerEmail: 'demo@example.com', pickupCode: 'DEMO123' },
                { id: 3, occupied: false, customerEmail: null, pickupCode: null },
                { id: 4, occupied: false, customerEmail: null, pickupCode: null },
            ];
        }
    } catch (e) {
        console.error("Falló al cargar o parsear el estado desde localStorage", e);
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
