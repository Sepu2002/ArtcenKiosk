// Configuración compartida de la aplicación. Único lugar para valores que
// dependen del sitio (como el número de casilleros).

// El frontend es servido por el propio server.py, así que las llamadas a la
// API son del mismo origen — no hace falta una URL absoluta.
export const API_BASE = '';

// Valor por defecto hasta que se confirme con el servidor.
export let NUM_LOCKERS = 8;

/**
 * Carga la configuración específica del sitio (p.ej. número de casilleros)
 * desde el servidor, para no tener que hardcodearla en el frontend.
 */
export async function loadRemoteConfig() {
    try {
        const response = await fetch(`${API_BASE}/api/config`);
        if (!response.ok) return;
        const data = await response.json();
        if (data.numLockers) NUM_LOCKERS = data.numLockers;
    } catch (e) {
        console.error('No se pudo cargar la configuración del servidor, usando valores por defecto.', e);
    }
}
