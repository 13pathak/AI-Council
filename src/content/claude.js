console.log('AI Bots: Claude Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt, message.images);
    }
});

async function typeAndSend(prompt, images) {
    // Selectors for Claude (contenteditable div)
    const inputSelector = '[contenteditable="true"]';
    const sendSelector = 'button[aria-label="Send Message"]';

    const inputEl = document.querySelector(inputSelector);

    if (inputEl) {
        inputEl.focus();

        if (images && images.length > 0) {
            console.log('[AI Council] Attempting paste upload for Claude (Reverted)...');
            for (const img of images) {
                // Revert to Paste as Drag & Drop failed. 
                // Ensuring focus is very tight here.
                inputEl.focus();
                inputEl.click();
                await pasteImageToElement(inputEl, img);
                // Longer wait for Claude internal processing
                await new Promise(r => setTimeout(r, 3000));
            }
        }

        // Use standard text insertion to avoid wiping out the pasted image
        inputEl.focus(); // Ensure focus

        // Try insertText first (most robust for preservation)
        if (document.queryCommandSupported('insertText')) {
            document.execCommand('insertText', false, prompt);
        } else {
            // Fallback: This MIGHT still behave oddly but better than innerHTML replace
            const p = document.createElement('p');
            p.textContent = prompt;
            inputEl.appendChild(p);
        }

        inputEl.dispatchEvent(new Event('input', { bubbles: true }));

        // Tiny delay to wait for button state
        let attempts = 0;
        const clickInterval = setInterval(() => {
            attempts++;
            const sendBtn = document.querySelector(sendSelector) || document.querySelector('button[icon="send-message"]');

            // Check enablement
            const isEnabled = sendBtn && !sendBtn.disabled && sendBtn.getAttribute('aria-disabled') !== 'true';

            if (isEnabled) {
                sendBtn.click();
                clearInterval(clickInterval);
            } else if (attempts > 10) { // 5 seconds
                // Fallback to Enter
                const enterEvent = new KeyboardEvent('keydown', {
                    bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13
                });
                inputEl.dispatchEvent(enterEvent);
                clearInterval(clickInterval);
            }
        }, 500);
        // Enter key fallback (This might be redundant if the setInterval handles it, but keeping as per original intent)
        const enterEvent = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Enter',
            code: 'Enter',
            keyCode: 13
        });
        inputEl.dispatchEvent(enterEvent);

        monitorResponse();
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
