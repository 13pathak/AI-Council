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
