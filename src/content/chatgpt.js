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

        // Wait for button to become enabled (it might be disabled while image is processing)
        let attempts = 0;
        const clickInterval = setInterval(() => {
            attempts++;
            const sendBtn = document.querySelector('[data-testid="send-button"]') ||
                document.querySelector('button[aria-label="Send"]');

            // Check enabling state more robustly
            if (sendBtn && !sendBtn.disabled && sendBtn.getAttribute('aria-disabled') !== 'true') {
                sendBtn.click();
                clearInterval(clickInterval);
            } else if (attempts > 30) {
                // Stop trying after 15 seconds (30 * 500ms)
                console.log('[AI Council] ChatGPT send timeout, trying Enter fallback...');
                const enterEvent = new KeyboardEvent('keydown', {
                    bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13
                });
                inputEl.dispatchEvent(enterEvent);
                clearInterval(clickInterval);
            }
        }, 500);

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
