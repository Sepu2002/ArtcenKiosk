// js/widgets/keyboard.js
// Este módulo crea y gestiona un teclado virtual en pantalla.

const keyboardLayouts = {
    en: {
        default: [
            ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'backspace'],
            ['tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
            ['caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', 'enter'],
            ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'shift'],
            ['space', 'close']
        ],
        shifted: [
            ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', 'backspace'],
            ['tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', '|'],
            ['caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"', 'enter'],
            ['shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', 'shift'],
            ['space', 'close']
        ]
    }
};

let currentTarget = null;
let isCaps = false;
let isShifted = false;
let keyboardElement = null;

function createKey(key) {
    const keyElement = document.createElement('button');
    keyElement.className = 'keyboard-key';
    keyElement.textContent = key;
    keyElement.setAttribute('type', 'button'); // Prevent form submission

    switch (key) {
        case 'backspace':
            keyElement.innerHTML = '<i class="fas fa-backspace"></i>';
            keyElement.classList.add('key-wide');
            keyElement.addEventListener('click', () => {
                if (currentTarget) currentTarget.value = currentTarget.value.slice(0, -1);
            });
            break;
        case 'caps':
            keyElement.innerHTML = '<i class="fas fa-caps-lock"></i>';
            keyElement.classList.add('key-wide', 'key-activatable');
            keyElement.addEventListener('click', () => {
                isCaps = !isCaps;
                keyElement.classList.toggle('active', isCaps);
                renderKeys();
            });
            break;
        case 'shift':
            keyElement.innerHTML = '<i class="fas fa-arrow-up"></i>';
            keyElement.classList.add('key-wide');
            keyElement.addEventListener('click', () => {
                isShifted = !isShifted;
                renderKeys();
            });
            break;
        case 'enter':
            keyElement.innerHTML = '<i class="fas fa-level-down-alt fa-rotate-90"></i>';
            keyElement.classList.add('key-wide');
            keyElement.addEventListener('click', () => {
                if (currentTarget && typeof currentTarget.form.requestSubmit === 'function') {
                    // Modern way to submit forms, triggers validation.
                    currentTarget.form.requestSubmit();
                } else if (currentTarget && currentTarget.form) {
                    // Fallback for older browsers
                    currentTarget.form.submit();
                }
                hide();
            });
            break;
        case 'space':
            keyElement.innerHTML = ' ';
            keyElement.classList.add('key-space');
            keyElement.addEventListener('click', () => {
                if (currentTarget) currentTarget.value += ' ';
            });
            break;
        case 'close':
            keyElement.textContent = 'Cerrar';
            keyElement.classList.add('key-wide', 'key-dark');
            keyElement.addEventListener('click', hide);
            break;
        case 'tab':
             keyElement.innerHTML = '<i class="fas fa-arrows-alt-h"></i>';
             keyElement.addEventListener('click', () => {
                if (currentTarget) currentTarget.value += '\t';
            });
            break;
        default:
            keyElement.addEventListener('click', () => {
                if (currentTarget) {
                    currentTarget.value += keyElement.textContent;
                    if (isShifted) {
                        isShifted = false;
                        renderKeys();
                    }
                }
            });
            break;
    }

    return keyElement;
}

function renderKeys() {
    if (!keyboardElement) return;

    const layout = isShifted ? keyboardLayouts.en.shifted : keyboardLayouts.en.default;
    const keysContainer = keyboardElement.querySelector('.keyboard-keys');
    keysContainer.innerHTML = '';

    layout.forEach(row => {
        const rowElement = document.createElement('div');
        rowElement.className = 'keyboard-row';
        row.forEach(key => {
            let displayKey = (isCaps && key.length === 1) ? key.toUpperCase() : key;
            if (isShifted && isCaps && key.length === 1) {
                displayKey = key.toLowerCase();
            }
             if (isShifted && !isCaps && key.length === 1) {
                displayKey = key.toUpperCase();
            }

            rowElement.appendChild(createKey(displayKey));
        });
        keysContainer.appendChild(rowElement);
    });
}

export function init() {
    if (document.getElementById('virtual-keyboard')) return;

    keyboardElement = document.createElement('div');
    keyboardElement.id = 'virtual-keyboard';
    keyboardElement.className = 'keyboard-container';
    keyboardElement.innerHTML = '<div class="keyboard-keys"></div>';
    document.body.appendChild(keyboardElement);

    renderKeys();
}

export function show(targetElement) {
    currentTarget = targetElement;
    if (keyboardElement) {
        keyboardElement.classList.add('visible');
    }
}

export function hide() {
    currentTarget = null;
    if (keyboardElement) {
        keyboardElement.classList.remove('visible');
    }
}
