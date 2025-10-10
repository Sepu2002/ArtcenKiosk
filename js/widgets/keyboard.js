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
 * Creates and shows the keyboard.
 * @param {HTMLInputElement} inputElement The input to attach the keyboard to.
 */
export function showKeyboard(inputElement) {
    // If the keyboard element doesn't exist, create it.
    if (!keyboardContainer) {
        keyboardContainer = document.createElement('div');
        keyboardContainer.id = 'keyboard-container';
        // These classes position and style the keyboard, including the z-index to be on top of modals.
        keyboardContainer.className = 'simple-keyboard hg-theme-default myTheme1 fixed bottom-0 left-0 right-0 z-[60] transition-transform transform translate-y-full';
        document.body.appendChild(keyboardContainer);

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
    }

    currentInput = inputElement;
    keyboard.setInput(currentInput.value);

    // Use a small timeout to ensure the element is in the DOM before starting the transition.
    setTimeout(() => {
        if (keyboardContainer) {
            keyboardContainer.classList.remove('translate-y-full');
        }
    }, 10);
}

/**
 * Hides and destroys the keyboard element and instance.
 */
export function hideKeyboard() {
    if (keyboardContainer) {
        keyboardContainer.classList.add('translate-y-full');

        // After the slide-out animation finishes, remove the element and clean up.
        keyboardContainer.addEventListener('transitionend', () => {
            if (keyboard) {
                keyboard.destroy();
                keyboard = null;
            }
            if (keyboardContainer) {
                keyboardContainer.remove();
                keyboardContainer = null;
            }
            currentInput = null;
        }, { once: true }); // Use 'once' to prevent multiple fires
    }
}

