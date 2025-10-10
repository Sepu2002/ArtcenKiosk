// Un widget reutilizable para mostrar y ocultar modales.
import { hide as hideKeyboard } from './keyboard.js'; // Importar la función para ocultar el teclado

const modalContainer = document.getElementById('modal-container');

/**
 * Muestra un modal con un título y contenido específico.
 * @param {string} title - El título del modal.
 * @param {string} content - El contenido HTML del modal.
 * @param {number} [autoCloseDelay=0] - Tiempo en ms para autocerrar. 0 para no autocerrar.
 */
export function showModal(title, content, autoCloseDelay = 0) {
    closeModal(); // Cierra cualquier modal existente primero
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    modalBackdrop.id = 'modal-backdrop';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.innerHTML = `
        <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">${title}</h2>
        <div id="modal-body">${content}</div>
    `;

    modalBackdrop.appendChild(modalContent);
    modalContainer.appendChild(modalBackdrop);

    // Activa la animación
    setTimeout(() => modalBackdrop.classList.add('active'), 10);

    if (autoCloseDelay > 0) {
        setTimeout(closeModal, autoCloseDelay);
    }

    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
    });
}

/**
 * Cierra el modal activo.
 */
export function closeModal() {
    // **CORRECCIÓN**: Ocultar el teclado al cerrar un modal.
    hideKeyboard();

    const modalBackdrop = document.getElementById('modal-backdrop');
    if (modalBackdrop) {
        modalBackdrop.classList.remove('active');
        // Espera a que la transición termine para eliminar el elemento
        modalBackdrop.addEventListener('transitionend', () => modalBackdrop.remove());
    }
}