// Este es el archivo principal que une todo.
// Importamos las funciones que necesitamos de otros módulos.
import { loadState } from './utils/state.js';
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
    const htmlEl = document.documentElement;
    htmlEl.classList.toggle('dark');
    const themeIcon = document.getElementById('theme-icon');
    if (htmlEl.classList.contains('dark')) {
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
        themeIcon.classList.replace('fa-sun', 'fa-moon');
    }
}

// --- INICIALIZACIÓN ---
function initialize() {
    // Carga el estado guardado al iniciar
    loadState(); 
    
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

// Inicia la aplicación cuando el contenido del DOM esté completamente cargado.
document.addEventListener('DOMContentLoaded', initialize);

