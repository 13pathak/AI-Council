console.log('AI Bots: Mistral Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt);
    }
});

function typeAndSend(prompt) {
    // Mistral uses a textarea or contenteditable
    const inputEl = document.querySelector('textarea') ||
        document.querySelector('div[contenteditable="true"]');

    if (inputEl) {
        inputEl.focus();
        inputEl.click();

        if (inputEl.tagName === 'TEXTAREA') {
            inputEl.value = prompt;
            // React state hack for textareas
            const tracker = inputEl._valueTracker;
            if (tracker) tracker.setValue(prompt);
        } else {
            document.execCommand('insertText', false, prompt);
        }

        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));

        // 2. Submit
        setTimeout(() => {
            // Enter Key
            inputEl.dispatchEvent(new KeyboardEvent('keydown', {
                bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13
            }));

            // Fallback Button
            setTimeout(() => {
                // Mistral Send button usually has an arrow icon
                const buttons = Array.from(document.querySelectorAll('button'));
                const sendBtn = buttons.reverse().find(b => b.querySelector('svg'));
                if (sendBtn) sendBtn.click();
            }, 300);
        }, 500);
    }
}
