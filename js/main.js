// Este es el archivo principal que une todo.
import { initializeState } from './utils/state.js'; // CAMBIADO
import { importFromCSV } from './utils/csv.js';
import { showAdminLogin } from './widgets/admin.js';
import { showPickupScreen } from './widgets/customer.js';

// --- CONFIGURACIÓN ---
const EMAILJS_PUBLIC_KEY = 'cLa8lTnHzamomf5by';
const EMAILJS_SERVICE_ID = 'service_gyjmvdw';

// --- ELEMENTOS DEL DOM ---
const themeToggleButton = document.getElementById('theme-toggle-button');
const adminLoginButton = document.getElementById('admin-login-button');
const pickupPackageButton = document.getElementById('pickup-package-button');
const csvFileInput = document.getElementById('csv-file-input');
const refreshButton = document.getElementById('refresh-button'); 

// --- MANEJO DEL TEMA ---
function toggleTheme() {
    // ... (sin cambios)
    const htmlEl = document.documentElement;
    htmlEl.classList.toggle('dark');
    const themeIcon = document.getElementById('theme-icon');
    if (htmlEl.classList.contains('dark')) {
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
        themeIcon.classList.replace('fa-sun', 'fa-moon');
    }
}

// --- INICIALIZACIÓN (MODIFICADA) ---
async function initialize() {
    // Muestra un modal de carga mientras se sincroniza el hardware
    // (Necesitaríamos importar 'showModal' y 'closeModal' aquí)
    
    // Carga el estado sincronizado al iniciar
    await initializeState(); // CAMBIADO
    
    // Cierra el modal de carga
    
    // Inicializa EmailJS si las claves están presentes
    if (EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID) {
        window.emailjs.init(EMAILJS_PUBLIC_KEY);
    }

    // Asigna los eventos a los botones principales
    adminLoginButton.addEventListener('click', showAdminLogin);
    pickupPackageButton.addEventListener('click', showPickupScreen);
    themeToggleButton.addEventListener('click', toggleTheme);
    csvFileInput.addEventListener('change', importFromCSV);
    refreshButton.addEventListener('click', () => location.reload()); 
}

// Inicia la aplicación
document.addEventListener('DOMContentLoaded', initialize);