// Este archivo contiene la lógica para importar y exportar a CSV.
import { bays, setBays, saveState } from './state.js';
import { showAdminPanel } from '../widgets/admin.js';
import { showModal } from '../widgets/modal.js';

/**
 * Exporta el estado actual de los casilleros a un archivo CSV.
 */
export function exportToCSV() {
    const headers = "id,occupied,customerEmail,pickupCode";
    const csvContent = bays.map(bay =>
        `${bay.id},${bay.occupied},${bay.customerEmail || ''},${bay.pickupCode || ''}`
    ).join('\n');

    const fullCsv = `${headers}\n${csvContent}`;
    const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `locker_state_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Importa el estado desde un archivo CSV.
 * @param {Event} event - El evento del input de archivo.
 */
export function importFromCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const rows = text.split('\n').slice(1); // Omitir cabecera
        const newBays = [];
        try {
            rows.forEach(row => {
                if (row.trim() === '') return;
                const columns = row.split(',');
                newBays.push({
                    id: parseInt(columns[0]),
                    occupied: columns[1] === 'true',
                    customerEmail: columns[2] || null,
                    pickupCode: columns[3] || null,
                });
            });
            setBays(newBays); // Actualiza el estado global
            saveState();
            showAdminPanel(); // Refresca la vista del panel de admin
            showModal("Éxito", "<p class='dark:text-gray-300'>Estado importado correctamente desde CSV.</p>", 3000);
        } catch (err) {
            showModal("Error de Importación", "<p class='text-red-500'>Falló al parsear el archivo CSV. Por favor, revisa el formato.</p>", 4000);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Resetea el input
}
