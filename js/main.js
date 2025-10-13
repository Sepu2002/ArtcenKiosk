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

// --- CONTROLADOR DE VIDEOS DE YOUTUBE ---

// IDs de los videos de YouTube que quieres mostrar. ¡Reemplázalos por los tuyos!
const videoIdLeft = 'xee27Eiytes?si=VvlLX6wKf3gxR28o';  // Ejemplo: Rick Astley
const videoIdRight = 'j_hUCJ9LAgE?si=xncTqfv9ZeBYcMrI'; // Ejemplo: Lo-fi Girl

/**
 * Esta función es llamada automáticamente por la API de YouTube cuando está lista.
 * Es crucial que esté en el scope global, por eso la asignamos a `window`.
 */
window.onYouTubeIframeAPIReady = function() {
    // Crear el primer reproductor (izquierda)
    new YT.Player('player-left', {
        videoId: videoIdLeft,
        playerVars: {
            autoplay: 1,      // Autoplay
            controls: 0,      // Ocultar controles
            loop: 1,          // Repetir video
            playlist: videoIdLeft, // Requerido para que el loop funcione en un solo video
            mute: 1,          // Silenciar (requerido para autoplay en muchos navegadores)
            showinfo: 0,      // Ocultar información del video
            modestbranding: 1 // Minimizar logo de YouTube
        },
        events: {
            'onReady': (event) => {
                event.target.playVideo();
            }
        }
    });

    // Crear el segundo reproductor (derecha)
    new YT.Player('player-right', {
        videoId: videoIdRight,
        playerVars: {
            autoplay: 1,
            controls: 0,
            loop: 1,
            playlist: videoIdRight,
            mute: 1,
            showinfo: 0,
            modestbranding: 1
        },
        events: {
            'onReady': (event) => {
                event.target.playVideo();
            }
        }
    });
};