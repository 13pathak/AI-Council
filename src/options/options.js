const BOTS = [
    { id: 'chatgpt', name: 'ChatGPT' },
    { id: 'claude', name: 'Claude' },
    { id: 'gemini', name: 'Gemini' },
    { id: 'grok', name: 'Grok' },
    { id: 'perplexity', name: 'Perplexity' },
    { id: 'meta', name: 'Meta AI' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'mistral', name: 'Mistral' },
    { id: 'copilot', name: 'Microsoft Copilot' }
];

const DEFAULTS = ['chatgpt', 'gemini', 'grok', 'perplexity'];

document.addEventListener('DOMContentLoaded', () => {
    const selectors = [
        document.getElementById('slot1'),
        document.getElementById('slot2'),
        document.getElementById('slot3'),
        document.getElementById('slot4')
    ];

    // Populate Selects
    selectors.forEach(sel => {
        BOTS.forEach(bot => {
            const opt = document.createElement('option');
            opt.value = bot.id;
            opt.textContent = bot.name;
            sel.appendChild(opt);
        });
    });

    // Load Settings
    chrome.storage.local.get(['botSlots'], (result) => {
        const slots = result.botSlots || DEFAULTS;
        selectors.forEach((sel, index) => {
            if (slots[index]) sel.value = slots[index];
        });
    });

    // Save Settings
    document.getElementById('save').addEventListener('click', () => {
        const newSlots = selectors.map(sel => sel.value);
        chrome.storage.local.set({ botSlots: newSlots }, () => {
            const status = document.getElementById('status');
            status.style.display = 'inline';
            setTimeout(() => status.style.display = 'none', 3000);
        });
    });
});
