console.log('AI Bots: ChatGPT Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt, message.image);
    }
});

async function typeAndSend(prompt, image) {
    // ChatGPT Input Selector
    const inputEl = document.querySelector('#prompt-textarea') ||
        document.querySelector('textarea') ||
        document.querySelector('div[contenteditable="true"]');

    if (inputEl) {
        inputEl.focus();

        // 1. Upload Image (if any)
        // 1. Upload Image (if any)
        if (image) {
            console.log('[AI Council] Attempting paste upload...');
            await pasteImageToElement(inputEl, image);

            // Wait a moment for upload to process (not perfect, but necessary)
            await new Promise(r => setTimeout(r, 2000));
        }

        // 2. Type Prompt
        if (inputEl.tagName === 'TEXTAREA') {
            inputEl.value = prompt;
        } else {
            inputEl.textContent = prompt;
        }
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));

        // 3. Shared Submit Retry
        retryClickSubmit(() => {
            const sendBtn = document.querySelector('[data-testid="send-button"]') ||
                document.querySelector('button[aria-label="Send"]');

            // Return element if enabled, or just the element (util checks enabling)
            // But util checks `!disabled`. We return the element found.
            return sendBtn;
        }, inputEl);

        monitorResponse();
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
