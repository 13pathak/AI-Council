console.log('AI Bots: DeepSeek Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt);
    }
});

function typeAndSend(prompt) {
    // DeepSeek likely uses a textarea or standard contenteditable
    const inputEl = document.querySelector('textarea') ||
        document.querySelector('div[contenteditable="true"]');

    if (inputEl) {
        inputEl.focus();
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
        setTimeout(() => {
            // Priority: Enter Key
            inputEl.dispatchEvent(new KeyboardEvent('keydown', {
                bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13
            }));

            // Fallback: Button
            setTimeout(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const sendBtn = buttons.reverse().find(b => {
                    // Look for send-like icons or labels
                    if (b.querySelector('svg') || (b.innerText && b.innerText.toLowerCase() === 'send')) return true;
                    return false;
                });
                if (sendBtn) sendBtn.click();
            }, 300);
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
