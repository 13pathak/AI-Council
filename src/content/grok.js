console.log('AI Bots: Grok Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt);
    }
});

function typeAndSend(prompt) {
    // Grok uses ProseMirror/Tiptap (contenteditable div)
    const inputSelector = '.ProseMirror';
    const inputEl = document.querySelector(inputSelector);

    if (inputEl) {
        inputEl.focus();

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

        // Give the editor time to process the paste
        setTimeout(() => {
            // Try multiple send button selectors for Grok
            const sendBtn = document.querySelector('button[aria-label="Send message"]') ||
                document.querySelector('button[aria-label="Send"]') ||
                document.querySelector('button[aria-label="Submit"]') ||
                document.querySelector('button[type="submit"]') ||
                // Grok may have an SVG icon button - look for common patterns
                document.querySelector('button svg[viewBox]')?.closest('button');

            if (sendBtn && !sendBtn.disabled) {
                sendBtn.click();
            } else {
                // Enter key fallback
                const enterEvent = new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelable: true,
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13
                });
                inputEl.dispatchEvent(enterEvent);
            }

            monitorResponse();
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
