// Este es el archivo principal que une todo.
import { initializeState } from './utils/state.js';
import { API_BASE, loadRemoteConfig, BRAND_NAME, BRAND_LOGO, BRAND_COLOR, BRAND_FOOTER } from './utils/config.js';
import { showAdminLogin, showAdminPanel } from './widgets/admin.js';
import { showPickupScreen } from './widgets/customer.js';

// --- ELEMENTOS DEL DOM ---
const themeToggleButton = document.getElementById('theme-toggle-button');
const adminLoginButton = document.getElementById('admin-login-button');
const pickupPackageButton = document.getElementById('pickup-package-button');
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
    localStorage.setItem('kioskTheme', htmlEl.classList.contains('dark') ? 'dark' : 'light');
}

function applyStoredTheme() {
    if (localStorage.getItem('kioskTheme') === 'dark') {
        document.documentElement.classList.add('dark');
        document.getElementById('theme-icon').classList.replace('fa-moon', 'fa-sun');
    }
}

// --- MARCA DEL CLIENTE: aplica lo que haya en .env, o deja el look por defecto ---
function applyBranding() {
    document.documentElement.style.setProperty('--brand-color', BRAND_COLOR);

    if (BRAND_NAME || BRAND_LOGO) {
        document.getElementById('brand-header').classList.remove('hidden-input');
    }
    if (BRAND_NAME) {
        document.getElementById('brand-name').textContent = BRAND_NAME;
    }
    if (BRAND_LOGO) {
        const logo = document.getElementById('brand-logo');
        logo.src = BRAND_LOGO;
        logo.alt = BRAND_NAME || 'Logo';
        logo.classList.remove('hidden-input');
    }
    if (BRAND_FOOTER) {
        const footer = document.getElementById('brand-footer');
        footer.textContent = BRAND_FOOTER;
        footer.classList.remove('hidden-input');
    }
}

// --- ADMIN: reutiliza la sesión del servidor si ya hay una activa ---
async function openAdmin() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/session`);
        const data = await response.json();
        if (data.isAdmin) {
            showAdminPanel();
            return;
        }
    } catch (e) {
        console.error('No se pudo verificar la sesión de admin', e);
    }
    showAdminLogin();
}

// --- INICIALIZACIÓN ---
async function initialize() {
    applyStoredTheme();

    await loadRemoteConfig();
    applyBranding();
    await initializeState();

    adminLoginButton.addEventListener('click', openAdmin);
    pickupPackageButton.addEventListener('click', showPickupScreen);
    themeToggleButton.addEventListener('click', toggleTheme);
    refreshButton.addEventListener('click', () => location.reload());
}

document.addEventListener('DOMContentLoaded', initialize);
