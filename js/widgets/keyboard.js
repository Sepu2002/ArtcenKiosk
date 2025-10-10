// js/widgets/keyboard.js

let keyboard = null;
let currentInput = null;
let keyboardContainer = null; // Keep a reference to the DOM element

/**
 * Handles the keyboard's onChange event.
 * @param {string} input The current input value.
 */
function onChange(input) {
    if (currentInput) {
        currentInput.value = input;
        // Dispatch an input event to notify any listeners (e.g., frameworks)
        currentInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

/**
 * Handles special key presses.
 * @param {string} button The pressed button.
 */
function onKeyPress(button) {
    if (button === "{shift}" || button === "{lock}") {
        const currentLayout = keyboard.options.layoutName;
        const shiftToggle = currentLayout === "default" ? "shift" : "default";
        keyboard.setOptions({ layoutName: shiftToggle });
    }

    if (button === "{numbers}" || button === "{abc}") {
        const currentLayout = keyboard.options.layoutName;
        const numbersToggle = currentLayout !== "numbers" ? "numbers" : "default";
        keyboard.setOptions({ layoutName: numbersToggle });
    }
}

/**
 * Creates and shows the keyboard inside the currently active modal.
 * @param {HTMLInputElement} inputElement The input to attach the keyboard to.
 */
export function showKeyboard(inputElement) {
    if (keyboard) return; // Prevent creating multiple keyboards

    const keyboardHost = document.getElementById('keyboard-host');
    if (!keyboardHost) {
        console.error("Keyboard host not found inside the modal!");
        return;
    }
    
    // Create the container for the keyboard
    keyboardContainer = document.createElement('div');
    keyboardContainer.id = 'keyboard-container';
    keyboardContainer.className = 'simple-keyboard hg-theme-default myTheme1 mt-4'; // Added margin-top for spacing
    keyboardHost.appendChild(keyboardContainer);

    // Create a new keyboard instance
    keyboard = new window.SimpleKeyboard.default(keyboardContainer, {
        onChange: input => onChange(input),
        onKeyPress: button => onKeyPress(button),
        theme: "hg-theme-default myTheme1",
        layout: {
            'default': [
                'q w e r t y u i o p',
                'a s d f g h j k l',
                '{shift} z x c v b n m {bksp}',
                '{numbers} @ . {space}'
            ],
            'shift': [
                'Q W E R T Y U I O P',
                'A S D F G H J K L',
                '{shift} Z X C V B N M {bksp}',
                '{numbers} @ . {space}'
            ],
            'numbers': [
                '1 2 3',
                '4 5 6',
                '7 8 9',
                '{abc} 0 {bksp}'
            ]
        },
        display: {
            '{numbers}': '123',
            '{abc}': 'ABC',
            '{shift}': '⬆',
            '{bksp}': '⬅',
            '{space}': '     ',
        }
    });
    
    currentInput = inputElement;
    keyboard.setInput(currentInput.value);
}

/**
 * Hides and destroys the keyboard instance.
 */
export function hideKeyboard() {
    if (keyboard) {
        keyboard.destroy();
        keyboard = null;
    }
    if (keyboardContainer) {
        keyboardContainer.remove();
        keyboardContainer = null;
    }
    currentInput = null;
}

