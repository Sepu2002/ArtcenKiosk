// js/widgets/keyboard.js

let keyboardContainer = null; // Will be created upon initialization
let targetInput = null;
let isShiftActive = false;

const keyLayout = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
    ['close', 'space', 'enter']
];

/**
 * Creates the keyboard element and appends it to the body.
 * Should only be called once.
 */
export function initKeyboard() {
    if (keyboardContainer) return; // Prevent multiple initializations
    keyboardContainer = document.createElement('div');
    keyboardContainer.id = 'keyboard-container';
    keyboardContainer.className = 'keyboard-container';
    document.body.appendChild(keyboardContainer);
}

function renderKeyboard() {
    if (!keyboardContainer) return;
    keyboardContainer.innerHTML = '';
    const keyboard = document.createElement('div');
    keyboard.className = 'keyboard';

    keyLayout.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'keyboard-row';
        row.forEach(key => {
            const keyEl = document.createElement('button');
            keyEl.className = 'keyboard-key';
            if (key.length > 1) {
                keyEl.classList.add(`key-${key}`);
            }

            switch (key) {
                case 'backspace':
                    keyEl.innerHTML = '<i class="fas fa-backspace"></i>';
                    keyEl.addEventListener('click', () => {
                        if (targetInput) {
                            targetInput.value = targetInput.value.slice(0, -1);
                        }
                    });
                    break;
                case 'shift':
                    keyEl.innerHTML = '<i class="fas fa-arrow-up"></i>';
                    keyEl.addEventListener('click', () => {
                        isShiftActive = !isShiftActive;
                        renderKeyboard();
                    });
                    if (isShiftActive) {
                        keyEl.classList.add('active');
                    }
                    break;
                case 'space':
                    keyEl.innerHTML = ' ';
                    keyEl.addEventListener('click', () => {
                        if (targetInput) {
                            targetInput.value += ' ';
                        }
                    });
                    break;
                case 'enter':
                    keyEl.innerHTML = '<i class="fas fa-level-down-alt fa-rotate-90"></i>';
                    keyEl.addEventListener('click', () => {
                        if (targetInput) {
                            const event = new KeyboardEvent('keypress', { key: 'Enter' });
                            targetInput.dispatchEvent(event);
                        }
                        hideKeyboard();
                    });
                    break;
                case 'close':
                    keyEl.innerHTML = '<i class="fas fa-keyboard"></i>';
                    keyEl.addEventListener('click', hideKeyboard);
                    break;
                default:
                    keyEl.textContent = isShiftActive ? key.toUpperCase() : key.toLowerCase();
                    keyEl.addEventListener('click', () => {
                        if (targetInput) {
                            targetInput.value += isShiftActive ? key.toUpperCase() : key.toLowerCase();
                        }
                    });
            }
            rowEl.appendChild(keyEl);
        });
        keyboard.appendChild(rowEl);
    });
    keyboardContainer.appendChild(keyboard);
}

export function showKeyboard(inputElement) {
    if (!inputElement || !keyboardContainer) return;
    targetInput = inputElement;
    isShiftActive = false;
    renderKeyboard();
    keyboardContainer.classList.add('visible');
}

export function hideKeyboard() {
    if (!keyboardContainer) return;
    keyboardContainer.classList.remove('visible');
}

export function attachKeyboardToInputs() {
    document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"]').forEach(input => {
        input.addEventListener('focus', () => showKeyboard(input));
    });
}