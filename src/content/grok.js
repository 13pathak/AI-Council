console.log('AI Bots: Grok Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt, message.images);
    }
});

async function typeAndSend(prompt, images) {
    // Grok uses textarea or ProseMirror/Tiptap (contenteditable div)
    const inputEl = document.querySelector('textarea') || 
                    document.querySelector('.ProseMirror') ||
                    document.querySelector('div[contenteditable="true"]');

    if (inputEl) {
        inputEl.focus();

        if (images && images.length > 0) {
            console.log('[AI Council] Attempting paste upload for Grok...');
            for (const img of images) {
                await pasteImageToElement(inputEl, img);
                await new Promise(r => setTimeout(r, 1500));
            }
        }

        if (inputEl.tagName === 'TEXTAREA') {
            inputEl.value = prompt;
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            // APPROACH: Simulate clipboard paste - ProseMirror handles paste events natively
            // This is the most reliable method for ProseMirror/Tiptap editors

            // Create a DataTransfer object with the prompt text
            const dataTransfer = new DataTransfer();
            dataTransfer.setData('text/plain', prompt);

            // Create and dispatch a paste event
            const pasteEvent = new ClipboardEvent('paste', {
                bubbles: true,
                cancelable: true,
                clipboardData: dataTransfer
            });
            inputEl.dispatchEvent(pasteEvent);
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Give the editor time to process the paste and enable the button
        let attempts = 0;
        const clickInterval = setInterval(() => {
            attempts++;
            // Try multiple send button selectors for Grok
            const sendBtn = document.querySelector('button[aria-label="Send message"]') ||
                document.querySelector('button[aria-label="Send"]') ||
                document.querySelector('button[aria-label="Submit"]') ||
                document.querySelector('button[type="submit"]') ||
                document.querySelector('button svg[viewBox]')?.closest('button');

            // Check if button is enabled
            const isEnabled = sendBtn && !sendBtn.disabled && sendBtn.getAttribute('aria-disabled') !== 'true';

            if (isEnabled) {
                // Ensure focus logic before click
                sendBtn.click();
                clearInterval(clickInterval);
            } else if (attempts > 15) { // 7.5 seconds
                // Fallback to Enter if button click fails
                console.log('[AI Council] Timed out waiting for Grok button, trying Enter...');
                const enterEvent = new KeyboardEvent('keydown', {
                    bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13
                });
                inputEl.dispatchEvent(enterEvent);
                clearInterval(clickInterval);
            }
        }, 500);
    } else {
        console.error('Grok Input (ProseMirror) not found');
    }
}

function monitorResponse() {
    setInterval(() => {
        const bubbles = document.querySelectorAll('.prose');
        if (bubbles.length > 0) {
            const lastBubble = bubbles[bubbles.length - 1];
            const text = lastBubble.innerText;
            chrome.runtime.sendMessage({
                action: 'content_response',
                targetBot: 'grok',
                content: text
            });
        }
    }, 1000);
}
