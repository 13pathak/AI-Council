console.log('AI Bots: Gemini Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt);
    }
});

function typeAndSend(prompt) {
    // Gemini Selectors
    const inputSelector = 'div[contenteditable="true"]'; // Often the rich text editor
    const sendSelector = 'button[aria-label*="Send"]'; // Usually has Send label

    const inputEl = document.querySelector(inputSelector);

    if (inputEl) {
        inputEl.focus();
        // Gemini often puts text in a <p> or just directly in the div
        inputEl.textContent = prompt;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));

        setTimeout(() => {
            const sendBtn = document.querySelector(sendSelector) || document.querySelector('.send-button'); // Fallback class
            if (sendBtn) {
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
        console.error('Gemini Input not found');
    }
}

function monitorResponse() {
    setInterval(() => {
        // Gemini response containers usually have a specific model-response class or similar
        const messages = document.querySelectorAll('.model-response-text'); // Guess
        // Fallback or more generic if that fails
        const allMessages = document.querySelectorAll('message-content');

        const targetList = messages.length > 0 ? messages : allMessages;

        if (targetList.length > 0) {
            const lastMessage = targetList[targetList.length - 1];
            const text = lastMessage.innerText;
            chrome.runtime.sendMessage({
                action: 'content_response',
                targetBot: 'gemini',
                content: text
            });
        }
    }, 1000);
}
