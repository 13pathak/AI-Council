/**
 * Utility to simulate a drag-and-drop file upload on a target element.
 * @param {HTMLElement} targetElement - The element to drop the file onto (usually the textarea or a drop zone)
 * @param {Object} fileData - { name, type, data } (data is Base64 Data URL)
 */
async function uploadToInput(targetElement, fileData) {
    if (!targetElement || !fileData) return;

    // Convert Base64 to Blob/File
    const res = await fetch(fileData.data);
    const blob = await res.blob();
    const file = new File([blob], fileData.name, { type: fileData.type });

    // Create a DataTransfer object
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    const fileList = dataTransfer.files;

    // Dispatch events: dragenter -> dragover -> drop
    ['dragenter', 'dragover', 'drop'].forEach(eventType => {
        const event = new DragEvent(eventType, {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer,
            files: fileList // Some listeners look here specifically
        });

        // Custom hack for some frameworks that check originalEvent or detail
        Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
        targetElement.dispatchEvent(event);
    });

    console.log(`[AI Council] Dispatched drop event for ${fileData.name}`);
}

/**
 * Simulates a paste event with the image data.
 */
async function pasteImageToElement(targetElement, fileData) {
    if (!targetElement || !fileData) return;

    const res = await fetch(fileData.data);
    const blob = await res.blob();
    const file = new File([blob], fileData.name, {
        type: fileData.type,
        lastModified: new Date().getTime()
    });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dataTransfer
    });

    targetElement.dispatchEvent(pasteEvent);
    console.log(`[AI Council] Dispatched paste event for ${fileData.name}`);
}

/**
 * Shared logic to periodically check for an enabled send button and click it.
 * Falls back to Enter key if timeout is reached.
 * @param {Function} buttonFinder - A function that returns the desired button element (or a boolean true if relying on a broader search inside).
 * @param {HTMLElement} fallbackInput - The input element to dispatch an Enter key to if timeout occurs.
 * @param {number} timeoutMs - Duration in ms to wait before falling back (default 15000).
 */
function retryClickSubmit(buttonFinder, fallbackInput, timeoutMs = 15000) {
    let attempts = 0;
    const intervalMs = 500;
    const maxAttempts = timeoutMs / intervalMs;

    const clickInterval = setInterval(() => {
        attempts++;

        // Find button using the provided finder strategy
        const sendBtn = buttonFinder();

        // Check if enabled
        const isEnabled = sendBtn && !sendBtn.disabled && sendBtn.getAttribute('aria-disabled') !== 'true';

        if (isEnabled) {
            // Optional: Mouse events pattern if needed (some React apps like Copilot prefer this)
            // But standard click usually works if enabled.
            sendBtn.click();
            console.log('[AI Council] Shared Submit: Clicked button.');
            clearInterval(clickInterval);
        } else if (attempts > maxAttempts) {
            console.log('[AI Council] Shared Submit: Timeout, dispatching Enter.');
            if (fallbackInput) {
                fallbackInput.dispatchEvent(new KeyboardEvent('keydown', {
                    bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13
                }));
            }
            clearInterval(clickInterval);
        }
    }, intervalMs);
}

/**
 * Searches for a hidden file input (often used by 'Attach' buttons) and assigns the file directly.
 * @param {Object} fileData - { name, type, data }
 * @returns {Promise<boolean>} - True if successful, False if input not found.
 */
async function uploadToHiddenInput(fileData) {
    const fileInput = document.querySelector('input[type="file"]');
    if (!fileInput) return false;

    try {
        const res = await fetch(fileData.data);
        const blob = await res.blob();
        const file = new File([blob], fileData.name, {
            type: fileData.type,
            lastModified: new Date().getTime()
        });

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        // Dispatch change events to notify framework (React/Vue often listens here)
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        fileInput.dispatchEvent(new Event('input', { bubbles: true }));

        return true;
    } catch (e) {
        console.error('[AI Council] Hidden input upload failed:', e);
        return false;
    }
}
