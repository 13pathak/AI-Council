console.log('AI Bots: DeepSeek Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt, message.images);
    }
});

async function typeAndSend(prompt, images) {
    // DeepSeek likely uses a textarea or standard contenteditable
    const inputEl = document.querySelector('textarea') ||
        document.querySelector('div[contenteditable="true"]');

    if (inputEl) {
        inputEl.focus();

        if (images && images.length > 0) {
            console.log('[AI Council] Attempting paste upload for DeepSeek...');
            for (const img of images) {
                await pasteImageToElement(inputEl, img);
                await new Promise(r => setTimeout(r, 2000));
            }
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

        // 2. Submit: Shared Smart Retry
        retryClickSubmit(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.reverse().find(b => {
                const hasText = b.innerText && ['send', 'submit'].includes(b.innerText.toLowerCase().trim());
                const hasIcon = b.querySelector('svg');
                return (hasText || hasIcon) && !b.disabled;
            });
        }, inputEl);

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
