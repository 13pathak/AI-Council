console.log('AI Bots: Copilot Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt, message.image);
    }
});

async function typeAndSend(prompt, image) {
    // 1. Find Input
    // Copilot inputs often have specific IDs or roles
    const inputEl = document.querySelector('#searchbox') ||
        document.querySelector('textarea[id*="search"]') ||
        document.querySelector('textarea[aria-label="Ask Copilot"]') ||
        document.querySelector('textarea');

    if (inputEl) {
        inputEl.focus();
        inputEl.click();

        if (image) {
            console.log('[AI Council] Attempting paste upload for Copilot...');
            await pasteImageToElement(inputEl, image);
            await new Promise(r => setTimeout(r, 2000));
        }

        // 2. Insert Text
        document.execCommand('insertText', false, prompt);
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));

        // 3. The "Nudge" (React Wake-Up)
        // Type a space and delete it to force the "Submit" button to enable
        // 3. The "Nudge" (React Wake-Up)
        setTimeout(() => {
            document.execCommand('insertText', false, ' ');
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));

            setTimeout(() => {
                document.execCommand('delete');
                inputEl.dispatchEvent(new Event('input', { bubbles: true }));

                // 4. Submit: Wait and Retry for Button
                let attempts = 0;
                const clickInterval = setInterval(() => {
                    attempts++;
                    const submitBtn = document.querySelector('button[data-testid="submit-button"]') ||
                        document.querySelector('button[aria-label="Submit message"]');

                    const isEnabled = submitBtn && !submitBtn.disabled && submitBtn.getAttribute('aria-disabled') !== 'true';

                    if (isEnabled) {
                        // Sometimes the button needs a 'mousedown' before a 'click'
                        submitBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                        submitBtn.click();
                        submitBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                        clearInterval(clickInterval);
                    } else if (attempts > 30) { // 15 seconds
                        console.log('[AI Council] Copilot send timeout, trying Enter...');
                        const enterEvent = new KeyboardEvent('keydown', {
                            bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13
                        });
                        inputEl.dispatchEvent(enterEvent);
                        clearInterval(clickInterval);
                    }
                }, 500);

                monitorResponse();
            }, 100);
        }, 100);
    } else {
        console.error('Copilot Input not found');
    }
}

function monitorResponse() {
    let attempts = 0;
    const checkInterval = setInterval(() => {
        attempts++;
        // Target the AI response bubbles
        const responseContainers = document.querySelectorAll('[data-content="ai-response"], .markdown-body, .ac-container');

        if (responseContainers.length > 0) {
            const lastContainer = responseContainers[responseContainers.length - 1];
            if (lastContainer.innerText.trim().length > 5) {
                chrome.runtime.sendMessage({
                    action: 'content_response',
                    targetBot: 'copilot',
                    content: lastContainer.innerText
                });
            }
        }
        if (attempts > 60) clearInterval(checkInterval);
    }, 1000);
}