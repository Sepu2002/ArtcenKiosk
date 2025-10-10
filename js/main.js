// js/main.js

// Este es el archivo principal que une todo.
// Importamos las funciones que necesitamos de otros módulos.
import { loadState } from './utils/state.js';
import { importFromCSV } from './utils/csv.js';
import { showAdminLogin } from './widgets/admin.js';
import { showPickupScreen } from './widgets/customer.js';
import { hideKeyboard, initKeyboard } from './widgets/keyboard.js';

// --- CONFIGURACIÓN ---
const EMAILJS_PUBLIC_KEY = 'cLa8lTnHzamomf5by';
const EMAILJS_SERVICE_ID = 'service_gyjmvdw';

// --- ELEMENTOS DEL DOM ---
const themeToggleButton = document.getElementById('theme-toggle-button');
const adminLoginButton = document.getElementById('admin-login-button');
const pickupPackageButton = document.getElementById('pickup-package-button');
const csvFileInput = document.getElementById('csv-file-input');

// --- MANEJO DEL TEMA ---
function toggleTheme() {
    const htmlEl = document.documentElement;
    htmlEl.classList.toggle('dark');
    const themeIcon = document.getElementById('theme-icon');
    if (htmlEl.classList.contains('dark')) {
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    } else {
        themeIcon.classList.replace('fa-sun', 'moon');
    }
}

// --- INICIALIZACIÓN ---
function initialize() {
    // Initialize all components first
    initKeyboard();
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

    // Oculta el teclado si se hace clic fuera de un input
    document.addEventListener('click', (e) => {
        if (!e.target.closest('input[type="text"], input[type="password"], input[type="email"]') && !e.target.closest('#keyboard-container')) {
            hideKeyboard();
        }
    });
}

// Inicia la aplicación cuando el contenido del DOM esté completamente cargado.
document.addEventListener('DOMContentLoaded', initialize);