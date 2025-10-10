// js/widgets/keyboard.js

let keyboard = null;
let currentInput = null;

/**
 * Initializes the keyboard instance.
 */
function initKeyboard() {
    keyboard = new window.SimpleKeyboard.default({
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
     // Add a class to the keyboard container for styling
    document.querySelector(".simple-keyboard").classList.add("w-full", "max-w-4xl", "mx-auto", "p-2");
}

/**
 * Handles input changes from the keyboard.
 * @param {string} input - The current value of the keyboard's input.
 */
function onChange(input) {
    if (currentInput) {
        currentInput.value = input;
        currentInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

/**
 * Handles key press events.
 * @param {string} button - The button that was pressed.
 */
function onKeyPress(button) {
    if (button === "{shift}" || button === "{lock}") handleShift();
    if (button === "{numbers}" || button === "{abc}") handleNumbers();

    if (button === "{enter}") {
        const modal = document.getElementById('modal-backdrop');
        if (modal) {
            const submitButton = modal.querySelector('button[id*="submit"], button[id*="Submit"]');
            if (submitButton) {
                submitButton.click();
            }
        }
        hideKeyboard();
    }
}

/**
 * Toggles between default and shift layouts.
 */
function handleShift() {
    const currentLayout = keyboard.options.layoutName;
    const shiftToggle = currentLayout === "default" ? "shift" : "default";
    keyboard.setOptions({ layoutName: shiftToggle });
}

/**
 * Toggles between letter and number layouts.
 */
function handleNumbers() {
    const currentLayout = keyboard.options.layoutName;
    const numbersToggle = currentLayout !== "numbers" ? "numbers" : "default";
    keyboard.setOptions({ layoutName: numbersToggle });
}

/**
 * Shows the keyboard and attaches it to an input element.
 * @param {HTMLInputElement} inputElement - The input field to attach to.
 */
export function showKeyboard(inputElement) {
    const keyboardContainer = document.getElementById('keyboard-container');
    if (!keyboard) {
        initKeyboard();
    }
    currentInput = inputElement;
    keyboardContainer.classList.remove('translate-y-full'); // Slide up
    keyboard.setInput(currentInput.value);
}

/**
 * Hides the keyboard.
 */
export function hideKeyboard() {
    const keyboardContainer = document.getElementById('keyboard-container');
    if (keyboardContainer) {
        keyboardContainer.classList.add('translate-y-full'); // Slide down
    }
}
