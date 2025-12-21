console.log('AI Bots: DeepSeek Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt, message.image);
    }
});

async function typeAndSend(prompt, image) {
    // DeepSeek likely uses a textarea or standard contenteditable
    const inputEl = document.querySelector('textarea') ||
        document.querySelector('div[contenteditable="true"]');

    if (inputEl) {
        inputEl.focus();

        if (image) {
            console.log('[AI Council] Attempting paste upload for DeepSeek...');
            await pasteImageToElement(inputEl, image);
            await new Promise(r => setTimeout(r, 2000));
        }

        inputEl.click();

        // 1. Text Entry
        // Try standard value first (works for textarea)
        if (inputEl.tagName === 'TEXTAREA') {
            inputEl.value = prompt;
        } else {
            // Rich Text fallback
            document.execCommand('insertText', false, prompt);
        }

        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));

        // 2. Submit
        // 2. Submit: Smart Retry (Optimized)
        let attempts = 0;
        const clickInterval = setInterval(() => {
            attempts++;
            const buttons = Array.from(document.querySelectorAll('button'));
            const sendBtn = buttons.reverse().find(b => {
                // Look for send-like icons (svg) or labels
                // Added text check optimization similar to Mistral fix
                const hasText = b.innerText && ['send', 'submit'].includes(b.innerText.toLowerCase().trim());
                const hasIcon = b.querySelector('svg');
                return (hasText || hasIcon) && !b.disabled;
            });

            const isEnabled = sendBtn && !sendBtn.disabled && sendBtn.getAttribute('aria-disabled') !== 'true';

            if (isEnabled) {
                sendBtn.click();
                clearInterval(clickInterval);
            } else if (attempts > 30) { // 15 seconds
                console.log('[AI Council] DeepSeek send timeout, trying Enter...');
                inputEl.dispatchEvent(new KeyboardEvent('keydown', {
                    bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13
                }));
                clearInterval(clickInterval);
            }
        }, 500);

        monitorResponse();
    } else {
        console.error('DeepSeek input not found');
    }
}

function monitorResponse() {
    // Basic polling for now
    setInterval(() => {
        // Customize selector when we know it
        // Assuming typical chat structure
        const lastMsg = document.body.innerText.slice(-200); // Placeholder
    }, 2000);
}
