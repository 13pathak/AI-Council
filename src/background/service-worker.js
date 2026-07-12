// Map bot IDs to their URL patterns
const BOT_URLS = {
    'chatgpt': ['https://chatgpt.com/'],
    'claude': ['https://claude.ai/'],
    'gemini': ['https://gemini.google.com/'],
    'grok': ['https://grok.com/'],
    'perplexity': ['https://www.perplexity.ai/'],
    'meta': ['https://www.meta.ai/']
};

// Lifecycle Management
let activePanelCount = 0;

chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'app_interface') {
        activePanelCount++;
        console.log('App Interface connected. Active count:', activePanelCount);

        port.onDisconnect.addListener(() => {
            activePanelCount--;
            console.log('App Interface disconnected. Active count:', activePanelCount);
        });
    }
});

// Open App in New Tab on Icon Click
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: 'src/app/index.html' });
});

// Message Handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'broadcast_prompt') {
        broadcastToContentScripts(message.prompt, message.images);
    } else if (message.action === 'check_connection') {
        // Simple ack
        sendResponse({ status: 'Ready' });
    }
});

function broadcastToContentScripts(prompt, images) {
    // Broadcast to all active tabs
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            // Send to all frames in the tab
            try {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'type_and_send',
                    prompt: prompt,
                    images: images
                });
            } catch (e) {
                // Ignore errors for tabs that don't have content script
            }
        });
    });
}
