// Este archivo contiene toda la lógica y las pantallas para el administrador.
import { showModal, closeModal } from './modal.js';
import { bays, saveState } from '../utils/state.js';
import { exportToCSV } from '../utils/csv.js';

// --- CONFIGURACIÓN DE EMAILJS ---
const EMAILJS_PUBLIC_KEY = 'cLa8lTnHzamomf5by';
const EMAILJS_SERVICE_ID = 'service_gyjmvdw';
const EMAILJS_TEMPLATE_ID = 'template_zwug2z7';

/**
 * Muestra el modal de login para el administrador.
 */
export function showAdminLogin() {
    const content = `
        <p class="mb-4 text-gray-600 dark:text-gray-400">Por favor, introduce la contraseña de administrador para continuar.</p>
        <input type="password" id="admin-password" class="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg mb-4" placeholder="Contraseña" inputmode="text">
        <button id="admin-submit" class="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition">Iniciar Sesión</button>
    `;
    showModal('Login de Admin', content, 0, '#admin-password'); // Añadido selector de input
    document.getElementById('admin-password').focus();
    document.getElementById('admin-submit').addEventListener('click', verifyAdminPassword);
    document.getElementById('admin-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') verifyAdminPassword();
    });
}

function verifyAdminPassword() {
    const password = document.getElementById('admin-password').value;
    if (password === 'admin123') {
        showAdminPanel();
    } else {
        showModal('Error', '<p class="text-red-500">Contraseña incorrecta. Por favor, inténtalo de nuevo.</p>', 3000);
    }
}

/**
 * Muestra el panel de control del administrador.
 */
export function showAdminPanel() {
    const content = `
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Estado de los Casilleros</h3>
            <div id="admin-bays-container" class="bay-grid"></div>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-6">
            <button id="deposit-package-btn" class="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition">Depositar Paquete</button>
            <button id="manage-bays-btn" class="bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700 transition">Gestionar Casilleros</button>
        </div>
        <div>
             <h3 class="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Gestión de Datos</h3>
             <div class="grid grid-cols-2 gap-4">
                <button id="import-csv-btn" class="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition">Importar de CSV</button>
                <button id="export-csv-btn" class="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition">Exportar a CSV</button>
             </div>
        </div>
    `;
    showModal('Panel de Administrador', content);
    renderAdminBays();

    document.getElementById('deposit-package-btn').addEventListener('click', showDepositScreen);
    document.getElementById('manage-bays-btn').addEventListener('click', showManageBaysScreen);
    document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);
    document.getElementById('import-csv-btn').addEventListener('click', () => document.getElementById('csv-file-input').click());
}

function renderAdminBays() {
    const baysContainer = document.getElementById('admin-bays-container');
    if (!baysContainer) return;

    baysContainer.innerHTML = bays.map(bay => {
        const isOccupied = bay.occupied;
        const statusColor = isOccupied ? 'red' : 'green';
        
        let details = isOccupied ? `
            <p class="text-sm text-gray-600 dark:text-gray-300 font-medium">Para: <span class="font-normal break-all">${bay.customerEmail}</span></p>
            <p class="text-sm text-gray-600 dark:text-gray-300 font-medium mt-1">Código: <span class="font-mono text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/50 px-2 py-1 rounded">${bay.pickupCode}</span></p>
        ` : '';

        return `
            <div class="border dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-700 shadow-sm">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">Casillero ${bay.id}</h3>
                    <span class="text-sm font-semibold text-${statusColor}-600 bg-${statusColor}-100 dark:text-${statusColor}-300 dark:bg-${statusColor}-900/50 px-3 py-1 rounded-full">${isOccupied ? 'Ocupado' : 'Disponible'}</span>
                </div>
                <div class="min-h-[40px]">${details}</div>
            </div>
        `;
    }).join('');
}


function showDepositScreen() {
    const availableBays = bays.filter(bay => !bay.occupied);
    if (availableBays.length === 0) {
        showModal('No hay Casilleros Disponibles', '<p class="dark:text-gray-300">Todos los casilleros están actualmente ocupados.</p>', 3000);
        return;
    }

    const bayOptions = availableBays.map(bay => `<option value="${bay.id}">Casillero ${bay.id}</option>`).join('');
    const content = `
        <p class="mb-4 text-gray-600 dark:text-gray-400">Selecciona un casillero disponible e introduce el correo del cliente.</p>
        <select id="bay-select" class="w-full p-3 border rounded-lg mb-4">${bayOptions}</select>
        <input type="email" id="customer-email" class="w-full p-3 border rounded-lg mb-4" placeholder="cliente@example.com" inputmode="email">
        <button id="submit-deposit" class="w-full bg-blue-600 text-white p-3 rounded-lg">Depositar y Enviar Código</button>
    `;
    showModal('Depositar Paquete', content, 0, '#customer-email'); // Añadido selector de input
    document.getElementById('customer-email').focus();
    document.getElementById('submit-deposit').addEventListener('click', handleDeposit);
}

async function handleDeposit() {
    const selectedBayId = parseInt(document.getElementById('bay-select').value);
    const email = document.getElementById('customer-email').value;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        alert("Por favor, introduce una dirección de correo válida.");
        return;
    }

    const pickupCode = `PKG${Date.now().toString().slice(-6)}`;
    const bay = bays.find(b => b.id === selectedBayId);
    
    if (bay) {
        bay.occupied = true;
        bay.customerEmail = email;
        bay.pickupCode = pickupCode;
        saveState();

        showModal('Abriendo Casillero...', `<p class="dark:text-gray-300">Abriendo Casillero ${selectedBayId}. Coloca el paquete dentro y cierra la puerta.</p>`, 0);
        await new Promise(resolve => setTimeout(resolve, 2000));

        const emailSent = await sendEmailWithQRCode(email, pickupCode);
        
        if (emailSent) {
            showQRCodeModal(pickupCode, email, true);
        } else {
            showQRCodeModal(pickupCode, email, false);
        }
    }
}

async function sendEmailWithQRCode(toEmail, pickupCode) {
    if (!EMAILJS_PUBLIC_KEY) {
         console.warn("Claves de EmailJS no configuradas. Omitiendo envío de correo.");
         return false;
    }

    const canvas = document.createElement('canvas');
    new QRious({ element: canvas, value: pickupCode, size: 256 });
    const qrCodeImage = canvas.toDataURL('image/png');

    const templateParams = { to_email: toEmail, pickup_code: pickupCode, qr_code_image: qrCodeImage };
    
    try {
        showModal("Enviando...", `<p class="dark:text-gray-300">Enviando código de recogida a ${toEmail}</p>`, 0);
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        return true;
    } catch (error) {
        console.error('Falló al enviar el correo:', error);
        return false;
    }
}

function showQRCodeModal(pickupCode, email, isConfirmation = false) {
    const title = isConfirmation ? 'Confirmación de Depósito' : 'Código de Recogida de Respaldo';
    const message = isConfirmation
        ? `Los siguientes detalles de recogida se enviaron con éxito a ${email}.`
        : 'Como el correo no pudo ser enviado, por favor muestra este código QR al cliente o proporciónale el código manual.';

    const content = `
        <p class="mb-4 text-center dark:text-gray-300">${message}</p>
        <div class="flex justify-center mb-4 bg-white p-2 rounded-lg"><canvas id="qr-canvas"></canvas></div>
        <p class="text-center text-2xl font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">${pickupCode}</p>
        <p class="text-center text-sm text-gray-500 mt-2">Para: ${email}</p>
         <button id="qr-close-btn" class="w-full mt-4 bg-gray-500 text-white p-2 rounded-lg">Cerrar y Ver Panel</button>
    `;
    showModal(title, content);
    new QRious({ element: document.getElementById('qr-canvas'), value: pickupCode, size: 200 });
    
    document.getElementById('qr-close-btn').addEventListener('click', () => {
        closeModal();
        showAdminPanel();
    });
}

function showManageBaysScreen() {
    const baysContent = bays.map(bay => `
        <div class="border dark:border-gray-600 rounded-lg p-4 flex flex-col justify-between">
            <div class="flex justify-between items-center mb-3">
               <h4 class="font-bold dark:text-gray-100">Casillero ${bay.id}</h4>
               <span class="text-xs font-semibold ${bay.occupied ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'} px-2 py-1 rounded-full">${bay.occupied ? 'Ocupado' : 'Disponible'}</span>
            </div>
            <div class="flex space-x-2">
               <button data-bay-id="${bay.id}" class="open-door-btn flex-1 bg-yellow-500 text-black p-2 rounded-lg text-sm">Abrir Puerta</button>
               ${bay.occupied ? `<button data-bay-id="${bay.id}" class="clear-bay-btn flex-1 bg-red-600 text-white p-2 rounded-lg text-sm">Liberar</button>` : ''}
            </div>
        </div>
    `).join('');

    const content = `
        <p class="mb-4 text-gray-600 dark:text-gray-400">Abre manualmente un casillero para mantenimiento o libera un casillero ocupado.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">${baysContent}</div>
    `;
    showModal('Gestionar Casilleros', content);

    document.querySelectorAll('.open-door-btn').forEach(button => {
        button.addEventListener('click', (e) => showModal('Éxito', `<p>Casillero ${e.currentTarget.dataset.bayId} ha sido abierto.</p>`, 3000));
    });
    document.querySelectorAll('.clear-bay-btn').forEach(button => {
        button.addEventListener('click', (e) => confirmClearBay(parseInt(e.currentTarget.dataset.bayId)));
    });
}

function confirmClearBay(bayId) {
    const content = `
        <p class="mb-4">¿Seguro que quieres liberar el Casillero ${bayId}? Esto lo marcará como disponible y borrará su código. Esta acción no se puede deshacer.</p>
        <div class="flex justify-end space-x-3">
            <button id="cancel-clear-btn" class="bg-gray-200 px-4 py-2 rounded-lg">Cancelar</button>
            <button id="confirm-clear-btn" class="bg-red-600 text-white px-4 py-2 rounded-lg">Sí, Liberar</button>
        </div>
    `;
    showModal(`Confirmar Liberación Casillero ${bayId}`, content);

    document.getElementById('cancel-clear-btn').addEventListener('click', showManageBaysScreen);
    document.getElementById('confirm-clear-btn').addEventListener('click', () => handleClearBay(bayId));
}

function handleClearBay(bayId) {
    const bay = bays.find(b => b.id === bayId);
    if(bay) {
        bay.occupied = false;
        bay.customerEmail = null;
        bay.pickupCode = null;
    }
    saveState();
    showManageBaysScreen();
}
