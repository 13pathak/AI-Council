console.log('AI Bots: Claude Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt);
    }
});

function typeAndSend(prompt) {
    // Selectors for Claude (contenteditable div)
    const inputSelector = '[contenteditable="true"]';
    const sendSelector = 'button[aria-label="Send Message"]';

    const inputEl = document.querySelector(inputSelector);

    if (inputEl) {
        inputEl.focus();
        // For contenteditable, we often need to set innerHTML or textContent
        inputEl.innerHTML = `<p>${prompt}</p>`;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));

        // Tiny delay
        setTimeout(() => {
            const sendBtn = document.querySelector(sendSelector) || document.querySelector('button[icon="send-message"]'); // Fallback
            if (sendBtn) {
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
        console.error('Claude Input not found');
    }
}

function monitorResponse() {
    setInterval(() => {
        // Claude message selectors
        const messages = document.querySelectorAll('.font-claude-message');
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const text = lastMessage.innerText;
            chrome.runtime.sendMessage({
                action: 'content_response',
                targetBot: 'claude',
                content: text
            });
        }
    }, 1000);
}
