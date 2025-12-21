console.log('AI Bots: ChatGPT Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt);
    }
});

function typeAndSend(prompt) {
    // ChatGPT uses a div contenteditable or a textarea
    const inputEl = document.querySelector('#prompt-textarea') ||
        document.querySelector('textarea') ||
        document.querySelector('div[contenteditable="true"]');

    if (inputEl) {
        inputEl.focus();

        // Set the value based on element type
        if (inputEl.tagName === 'TEXTAREA') {
            inputEl.value = prompt;
        } else {
            inputEl.textContent = prompt;
        }
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));

        setTimeout(() => {
            const sendBtn = document.querySelector('[data-testid="send-button"]') ||
                document.querySelector('button[aria-label="Send"]');

            if (sendBtn && !sendBtn.disabled) {
                sendBtn.click();
            } else {
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
        console.error('ChatGPT Input not found');
    }
}

function monitorResponse() {
    setInterval(() => {
        const messages = document.querySelectorAll('div[data-message-author-role="assistant"]');

        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const text = lastMessage.innerText;

            chrome.runtime.sendMessage({
                action: 'content_response',
                targetBot: 'chatgpt',
                content: text
            });
        }
    }, 1000);
}
