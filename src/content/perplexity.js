console.log('AI Bots: Perplexity Script Loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'type_and_send') {
        typeAndSend(message.prompt);
    }
});

function typeAndSend(prompt) {
    const inputEl = document.querySelector('[data-lexical-editor="true"]') ||
        document.querySelector('div[contenteditable="true"]');

    if (inputEl) {
        inputEl.focus();
        inputEl.click();

        // 1. Insert the main text
        document.execCommand('insertText', false, prompt);
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));

        // 2. THE FIX: The "Digital Nudge"
        // React sometimes ignores the first paste. We simulate typing a "Space"
        // and then deleting it. This forces React to wake up and enable the button.
        setTimeout(() => {
            inputEl.focus();

            // Type a space
            document.execCommand('insertText', false, ' ');
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));

            // Delete the space (Clean up)
            // Even if this fails, a trailing space is harmless
            document.execCommand('delete');
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));

            // 3. Press Enter (Primary Submit)
            setTimeout(() => {
                const enterEvent = new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelable: true,
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13
                });
                inputEl.dispatchEvent(enterEvent);
            }, 200);

            // 4. Fallback: Button Click (Scoped)
            setTimeout(() => {
                // Look for the specific 'bg-super' class which Perplexity uses for the active send button
                // or the specific aria-label.
                const sendBtn = document.querySelector('button[aria-label="Submit"]') ||
                    document.querySelector('button.bg-super');

                if (sendBtn) {
                    // Only click if it's not disabled
                    if (!sendBtn.disabled && !sendBtn.classList.contains('opacity-50')) {
                        sendBtn.click();
                    } else {
                        // If still disabled, force a click anyway (sometimes looks disabled but works)
                        sendBtn.click();
                    }
                }

                monitorResponse();
            }, 500);

        }, 100); // Small delay before the "Nudge"

    } else {
        console.error('Perplexity Input not found');
    }
}

function monitorResponse() {
    let attempts = 0;
    const checkInterval = setInterval(() => {
        attempts++;
        const containers = document.querySelectorAll('.prose');
        if (containers.length > 0) {
            const lastContainer = containers[containers.length - 1];
            // Ensure we aren't grabbing empty init states
            if (lastContainer.innerText.trim().length > 1) {
                chrome.runtime.sendMessage({
                    action: 'content_response',
                    targetBot: 'perplexity',
                    content: lastContainer.innerText
                });
            }
        }
        // Stop checking after 60 seconds
        if (attempts > 60) clearInterval(checkInterval);
    }, 1000);
}