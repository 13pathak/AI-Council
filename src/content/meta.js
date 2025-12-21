console.log('AI Bots: Meta AI Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt, message.image);
    }
});

async function typeAndSend(prompt, image) {
    // 1. Find the Visible Input (Hero or Footer)
    const candidates = [
        ...document.querySelectorAll('div[contenteditable="true"]'),
        ...document.querySelectorAll('textarea'),
        ...document.querySelectorAll('input[type="text"]')
    ];

    const inputEl = candidates.find(el => {
        // Must be visible (offsetParent check)
        return el.offsetParent !== null &&
            (el.getAttribute('role') === 'textbox' || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT');
    });

    if (inputEl) {
        inputEl.focus();
        inputEl.click();

        if (image) {
            console.log('[AI Council] Attempting paste upload for Meta AI (Reverted)...');
            // Revert to Paste. Drag & Drop was ignored.
            await pasteImageToElement(inputEl, image);
            await new Promise(r => setTimeout(r, 3000));
        }

        // 2. Insert Text
        document.execCommand('insertText', false, prompt);
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));

        // 3. The Nudge (Wake up the UI)
        setTimeout(() => {
            document.execCommand('insertText', false, ' ');
            setTimeout(() => {
                document.execCommand('delete');

                // 4. Primary: Try Enter Key
                const enterEvent = new KeyboardEvent('keydown', {
                    bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13
                });
                inputEl.dispatchEvent(enterEvent);

                // 5. Fallback: The "Hard Click" on the Div Button
                setTimeout(() => {
                    // Find the container relative to the input
                    // We look up 2-3 levels to find the wrapper that holds both input and button
                    const container = inputEl.closest('div.relative') ||
                        inputEl.parentElement?.parentElement;

                    if (container) {
                        // Your screenshot shows it's a DIV with aria-label="Send" and role="button"
                        const sendBtn = container.querySelector('div[aria-label="Send"][role="button"]') ||
                            container.querySelector('div[aria-label="Send"]');

                        if (sendBtn) {
                            // React often ignores simple .click() on divs
                            // We simulate a full mouse press sequence
                            const eventOptions = { bubbles: true, cancelable: true, view: window };
                            sendBtn.dispatchEvent(new MouseEvent('mousedown', eventOptions));
                            sendBtn.dispatchEvent(new MouseEvent('mouseup', eventOptions));
                            sendBtn.dispatchEvent(new MouseEvent('click', eventOptions));
                        }
                    }
                    monitorResponse();
                }, 600);
            }, 100);
        }, 100);
    } else {
        console.error('Meta AI Input not found');
    }
}

function monitorResponse() {
    let attempts = 0;
    const checkInterval = setInterval(() => {
        attempts++;
        // Meta AI bubbles
        const bubbles = document.querySelectorAll('div[dir="auto"]');
        if (bubbles.length > 0) {
            const lastBubble = bubbles[bubbles.length - 1];
            if (lastBubble.innerText.trim().length > 0) {
                chrome.runtime.sendMessage({
                    action: 'content_response',
                    targetBot: 'meta',
                    content: lastBubble.innerText
                });
            }
        }
        if (attempts > 60) clearInterval(checkInterval);
    }, 1000);
}