# AI Council

A powerful Chrome extension that provides a unified split-screen interface to interact with multiple AI chatbots simultaneously.

<img width="1921" height="935" alt="image" src="https://github.com/user-attachments/assets/7e074077-c36e-4094-8e43-d07262cd92a9" />


## Features

- **Multi-AI Interface**: Chat with up to 4 AI bots at once in a 2x2 grid layout
- **Supported Bots**:
  - ChatGPT (OpenAI)
  - Claude (Anthropic)
  - Gemini (Google)
  - Grok (xAI)
  - Perplexity
  - Meta AI
  - DeepSeek
  - Mistral
  - Microsoft Copilot
- **Focus Mode**: Maximize any bot to full-screen with a single click
- **Tabbed View**: Switch between Grid View (2x2) and Tabbed View (one at a time)
- **Resizable Grid**: Drag the dividers to resize bot panels
- **Global Prompt**: Send the same message to all bots simultaneously
- **Configurable Slots**: Choose which 4 bots appear in your layout via Settings
- **Restart All**: Clear all chats with a single button

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked** and select the extension folder
5. Click the extension icon to open AI Council in a new tab

## Usage

1. **Open**: Click the AI Council extension icon in Chrome
2. **Chat**: Type your prompt in the bottom input bar and click Send
3. **Focus**: Click the ⛶ button on any bot to maximize it
4. **Switch Views**: Use ⊞ for Grid View or ❐ for Tabbed View
5. **Configure**: Click ⚙️ to select which bots appear in your layout
6. **Restart**: Click 🗑️ to reload all bots and clear chats

## Tech Stack

- Chrome Extension Manifest V3
- Vanilla JavaScript, HTML, CSS
- `declarativeNetRequest` for iframe embedding
- Content scripts for bot interaction

## Project Structure

```
AI Council/
├── manifest.json          # Extension configuration
├── icons/                 # Extension icons
├── src/
│   ├── app/              # Main interface (HTML/CSS/JS)
│   ├── background/       # Service worker
│   ├── content/          # Bot-specific content scripts
│   ├── options/          # Settings page
│   └── rules/            # Network rules for iframe embedding
└── README.md
```

## Permissions

- `declarativeNetRequest`: To strip X-Frame-Options headers for iframe embedding
- `storage`: To save user preferences
- `scripting`: To inject content scripts into bot pages
- `activeTab`: For current tab interactions

## License

MIT License

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

**Note**: This extension requires you to be logged into the respective AI services for them to work within the iframe panels.
