console.log('AI Bots: Mistral Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt, message.images);
    }
});

async function typeAndSend(prompt, images) {
    // Mistral uses ProseMirror (contenteditable div)
    // Priority selector based on user screenshot
    const inputEl = document.querySelector('.ProseMirror') ||
        document.querySelector('div[contenteditable="true"]');

    if (inputEl) {
        inputEl.focus();
        inputEl.click();

        // 1. Upload Images
        if (images && images.length > 0) {
            console.log('[AI Council] Attempting upload for Mistral...');

            for (const img of images) {
                // Try Shared Hidden Input Method First
                const success = await uploadToHiddenInput(img);
                if (success) {
                    console.log('[AI Council] Uploaded via hidden input.');
                    await new Promise(r => setTimeout(r, 2000));
                } else {
                    // Fallback: Paste Simulation
                    console.log('[AI Council] No file input, trying Paste...');
                    await pasteImageToElement(inputEl, img);
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        }

        // 2. Insert Text
        document.execCommand('insertText', false, prompt);

        // Dispatch basic events
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));

        // 3. The "Nudge" & Submit
        setTimeout(() => {
            document.execCommand('insertText', false, ' ');
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));

            setTimeout(() => {
                document.execCommand('delete');
                inputEl.dispatchEvent(new Event('input', { bubbles: true }));

                // Shared Retry Logic
                retryClickSubmit(() => {
                    const sendBtn = document.querySelector('button[aria-label="Send"]') ||
                        document.querySelector('button[type="submit"]') ||
                        Array.from(document.querySelectorAll('button')).find(b => {
                            const hasText = b.innerText && b.innerText.trim().toLowerCase() === 'send';
                            const hasIcon = b.querySelector('svg');
                            return (hasText || hasIcon) && !b.disabled && b.offsetWidth > 0;
                        });
                    return sendBtn;
                }, inputEl);

            }, 100);
        }, 100);
    } else {
        console.error('Mistral Input (.ProseMirror) not found');
    }
}
