// Este archivo maneja la interfaz y lógica para el cliente.
import { showModal, closeModal } from './modal.js';
import { bays, saveState } from '../utils/state.js';
// IMPORTAMOS LA NUEVA FUNCIÓN DE AVISO
import { waitForDoorClose } from '../utils/hardware.js';

/**
 * Muestra la pantalla para que el cliente introduzca su código de recogida.
 */
export function showPickupScreen() {
    const content = `
         <p class="mb-4 text-gray-600 dark:text-gray-400">Escanea el código QR de tu correo o introduce el código manualmente.</p>
         <div id="scanner-placeholder" class="w-64 h-64 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <i class="fas fa-qrcode fa-5x"></i>
            <p class="absolute mt-24 font-semibold">Placeholder Escáner QR</p>
         </div>
         <input type="text" id="pickup-code-input" class="w-full p-3 text-center tracking-widest font-mono border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg mb-4" placeholder="INTRODUCE EL CÓDIGO" autocapitalize="characters" inputmode="text">
         <button id="submit-pickup-code" class="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition mb-4">Enviar Código</button>
    `;
    showModal('Recoger Paquete', content, 0, '#pickup-code-input'); // Añadido selector de input
    document.getElementById('pickup-code-input').focus();
    document.getElementById('submit-pickup-code').addEventListener('click', verifyCode);
    document.getElementById('pickup-code-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') verifyCode();
    });
}
/**
 * Verifica el código de recogida introducido por el cliente.
 */

function verifyCode() {
    const code = document.getElementById('pickup-code-input').value.trim().toUpperCase();
    const bay = bays.find(b => b.pickupCode === code && b.occupied);

    if (bay) {
        showModal('Abriendo Casillero...', `<p class="dark:text-gray-300">Código aceptado. Abriendo Casillero ${bay.id}...</p>`, 0);

        fetch('http://127.0.0.1:5000/open-locker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lockerId: bay.id }),
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                
                // 1. La puerta se abrió.
                // Actualiza el estado del hardware localmente
                bay.hardwareStatus = "UNLOCKED";
                
                // 2. Muestra un aviso inicial
                showModal('¡Éxito!', `<p class="dark:text-gray-300">Casillero ${bay.id} abierto.</p><p class="dark:text-gray-300">Por favor, recoge tu paquete y <strong>CIERRA LA PUERTA</strong>.</p>`, 0);
                
                // 3. Llama a la función de AVISO Y SONDEO
                waitForDoorClose(bay.id, () => {
                    // --- ESTE CÓDIGO SOLO SE EJECUTA DESPUÉS DE QUE LA PUERTA SE CIERRA ---
                    console.log(`Puerta ${bay.id} cerrada después de la recogida.`);

                    // 4. ¡NUEVO! Envía el log al servidor
                    fetch('http://127.0.0.1:5000/log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            message: `PAQUETE RECOGIDO del casillero ${bay.id} (Código: ${bay.pickupCode})`
                        })
                    }).catch(err => console.error("Fallo al enviar log:", err));

                    // 5. Ahora SÍ actualiza el estado del software y guarda
                    bay.occupied = false;
                    bay.customerEmail = null;
                    bay.pickupCode = null;
                    bay.hardwareStatus = "LOCKED";
                    saveState();
                    
                    // Muestra un modal final de "gracias"
                    closeModal(); // Cierra el modal de "cierre la puerta"
                });
                
            } else {
                throw new Error(result.error || 'Fallo en la comunicación con la controladora.');
            }
        })
        .catch(error => {
            console.error("Failed to open locker:", error);
            showModal('Error de Hardware', `<p class="text-red-500">No se pudo abrir el casillero. Por favor, contacta a soporte.</p>`, 5000);
        });
        // --- MODIFICATION END ---
    } else {
        const input = document.getElementById('pickup-code-input');
        input.classList.add('border-red-500');
        showModal('Código Inválido', '<p class="text-red-500">El código que introduciste no es válido o ya ha sido usado. Por favor, inténtalo de nuevo.</p>', 4000);
        setTimeout(() => {
            if (input) input.classList.remove('border-red-500');
        }, 4000);
    }
}