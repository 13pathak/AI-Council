console.log('AI Bots: Mistral Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt, message.image);
    }
});

async function typeAndSend(prompt, image) {
    // Mistral uses ProseMirror (contenteditable div)
    // Priority selector based on user screenshot
    const inputEl = document.querySelector('.ProseMirror') ||
        document.querySelector('div[contenteditable="true"]');

    if (inputEl) {
        inputEl.focus();
        inputEl.click();

        // 1. Upload Image
        if (image) {
            console.log('[AI Council] Attempting upload for Mistral...');

            // Priority 1: Hidden File Input (Most reliable if available)
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) {
                console.log('[AI Council] Found hidden file input, assigning...');
                const dataTransfer = new DataTransfer();
                const blob = await fetch(image).then(r => r.blob());
                const file = new File([blob], "uploaded_image.png", { type: "image/png", lastModified: new Date().getTime() });
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                fileInput.dispatchEvent(new Event('input', { bubbles: true }));
                await new Promise(r => setTimeout(r, 2000));
            } else {
                // Priority 2: Paste Simulation (Fallback)
                console.log('[AI Council] No file input, trying Paste...');
                await pasteImageToElement(inputEl, image);
                await new Promise(r => setTimeout(r, 2000));
            }
        }

        // 2. Insert Text
        document.execCommand('insertText', false, prompt);

        // Dispatch basic events
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));

        // 3. The "Nudge"
        setTimeout(() => {
            document.execCommand('insertText', false, ' ');
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));

            setTimeout(() => {
                document.execCommand('delete');
                inputEl.dispatchEvent(new Event('input', { bubbles: true }));

                // 4. Submit: Smart Retry
                let attempts = 0;
                const clickInterval = setInterval(() => {
                    attempts++;

                    // Mistral Send Button
                    // Added 'Send' text check based on screenshot
                    const sendBtn = document.querySelector('button[aria-label="Send"]') ||
                        document.querySelector('button[type="submit"]') ||
                        Array.from(document.querySelectorAll('button')).find(b => {
                            // Check for "Send" text explicitly
                            const hasText = b.innerText && b.innerText.trim().toLowerCase() === 'send';
                            const hasIcon = b.querySelector('svg');
                            return (hasText || hasIcon) && !b.disabled && b.offsetWidth > 0;
                        });

                    const isEnabled = sendBtn && !sendBtn.disabled && sendBtn.getAttribute('aria-disabled') !== 'true';

                    if (isEnabled) {
                        sendBtn.click();
                        clearInterval(clickInterval);
                    } else if (attempts > 30) {
                        console.log('[AI Council] Mistral send timeout, trying Enter...');
                        inputEl.dispatchEvent(new KeyboardEvent('keydown', {
                            bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13
                        }));
                        clearInterval(clickInterval);
                    }
                }, 500);
            }, 100);
        }, 100);
    } else {
        console.error('Mistral Input (.ProseMirror) not found');
    }
}
