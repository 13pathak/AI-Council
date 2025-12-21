console.log('AI Bots: Gemini Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt, message.image);
    }
});

async function typeAndSend(prompt, image) {
    // Gemini Selectors
    const inputSelector = 'div[contenteditable="true"]'; // Often the rich text editor
    const sendSelector = 'button[aria-label*="Send"]'; // Usually has Send label

    const inputEl = document.querySelector(inputSelector);

    if (inputEl) {
        inputEl.focus();

        if (image) {
            // Gemini supports drop on the editable area, but paste is often better
            console.log('[AI Council] Attempting paste upload for Gemini...');
            await pasteImageToElement(inputEl, image);

            // Wait longer for image to process (large images take time)
            // Ideally we'd check for a thumbnail in the DOM, but structure varies.
            // 4 seconds is safer for larger files.
            await new Promise(r => setTimeout(r, 4000));
        }

        // Gemini often puts text in a <p> or just directly in the div
        // Use insertText to avoid overwriting pasted images
        if (document.queryCommandSupported('insertText')) {
            document.execCommand('insertText', false, prompt);
        } else {
            inputEl.textContent += prompt; // Fallback
        }
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));

        // Wait for send button to be enabled (upload processing)
        let attempts = 0;
        const clickInterval = setInterval(() => {
            attempts++;
            const sendBtn = document.querySelector(sendSelector) || document.querySelector('.send-button');

            // Check if button exists and is NOT disabled (aria-disabled or disabled attribute)
            const isEnabled = sendBtn && !sendBtn.disabled && sendBtn.getAttribute('aria-disabled') !== 'true';

            if (isEnabled) {
                sendBtn.click();
                clearInterval(clickInterval);
            } else if (attempts > 15) { // Wait up to 7.5 seconds
                // Try Enter key as fallback
                const enterEvent = new KeyboardEvent('keydown', {
                    bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13
                });
                inputEl.dispatchEvent(enterEvent);
                clearInterval(clickInterval);
            }
        }, 500);

        monitorResponse();
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
