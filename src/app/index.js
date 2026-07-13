console.log('%c[AI Council] index.js v3.0 loaded', 'color: lime; font-size: 14px; font-weight: bold;');

const BOT_URLS = {
  'chatgpt': 'https://chatgpt.com/',
  'claude': 'https://claude.ai/',
  'gemini': 'https://gemini.google.com/',
  'grok': 'https://grok.com/',
  'perplexity': 'https://www.perplexity.ai/',
  'meta': 'https://www.meta.ai/',
  'deepseek': 'https://chat.deepseek.com/',
  'mistral': 'https://chat.mistral.ai/',
  'copilot': 'https://copilot.microsoft.com/'
};

const DEFAULTS = ['chatgpt', 'gemini', 'grok', 'perplexity'];
let CURRENT_SLOTS = [];
let CURRENT_VIEW = 'grid'; // 'grid' | 'tab'
let ACTIVE_TAB_INDEX = 0;

document.addEventListener('DOMContentLoaded', () => {
  // Load config
  chrome.storage.local.get(['botSlots'], (result) => {
    CURRENT_SLOTS = result.botSlots || DEFAULTS;
    renderGrid(CURRENT_SLOTS);
    updateTabSelector();
  });

  // View Toggles
  document.getElementById('view-grid').addEventListener('click', () => switchView('grid'));
  document.getElementById('view-tab').addEventListener('click', () => switchView('tab'));

  // Restart All
  document.getElementById('restart-all').addEventListener('click', () => {
    const frames = document.querySelectorAll('iframe.bot-iframe');
    frames.forEach(frame => {
      // Force reload by resetting src
      const currentSrc = frame.src;
      frame.src = 'about:blank';
      setTimeout(() => {
        frame.src = currentSrc;
      }, 50);
    });
  });

  // Input Logic
  const sendBtn = document.getElementById('send-btn');
  const promptInput = document.getElementById('prompt-input');

  // File Upload Logic
  const fileInput = document.getElementById('file-input');
  const attachBtn = document.getElementById('attach-btn');
  const previewContainer = document.getElementById('preview-container');

  // ====================================================================
  // PERSISTENT FILE STORE — survives page re-initializations
  // ====================================================================
  let currentFiles = [];

  /** Save currentFiles to chrome.storage.local (without the heavy base64 data for the preview key) */
  function persistFiles() {
    // We store the full data under 'stagedFiles'
    chrome.storage.local.set({ 'stagedFiles': currentFiles });
  }

  /** Restore currentFiles from chrome.storage.local on page load */
  function restoreFiles(callback) {
    chrome.storage.local.get(['stagedFiles'], (result) => {
      if (result.stagedFiles && result.stagedFiles.length > 0) {
        currentFiles = result.stagedFiles;
        console.log('[AI Council] Restored', currentFiles.length, 'staged files from storage');
      }
      if (callback) callback();
    });
  }

  function renderPreviews() {
    previewContainer.innerHTML = '';
    if (currentFiles.length === 0) {
      previewContainer.style.display = 'none';
      return;
    }
    
    previewContainer.style.display = 'flex';
    currentFiles.forEach((f, index) => {
      const badge = document.createElement('div');
      badge.style.display = 'flex';
      badge.style.alignItems = 'center';
      badge.style.gap = '5px';
      badge.style.background = '#333';
      badge.style.padding = '2px 5px';
      badge.style.borderRadius = '4px';

      const nameSpan = document.createElement('span');
      nameSpan.style.fontSize = '10px';
      nameSpan.style.maxWidth = '80px';
      nameSpan.style.overflow = 'hidden';
      nameSpan.style.whiteSpace = 'nowrap';
      nameSpan.style.textOverflow = 'ellipsis';
      nameSpan.textContent = f.name;

      const rmBtn = document.createElement('button');
      rmBtn.textContent = '×';
      rmBtn.style.background = 'none';
      rmBtn.style.border = 'none';
      rmBtn.style.color = '#ff6b6b';
      rmBtn.style.cursor = 'pointer';
      rmBtn.style.fontSize = '12px';
      rmBtn.style.padding = '0';
      rmBtn.onclick = (e) => {
        e.preventDefault();
        currentFiles.splice(index, 1);
        persistFiles();
        renderPreviews();
      };

      badge.appendChild(nameSpan);
      badge.appendChild(rmBtn);
      previewContainer.appendChild(badge);
    });
  }

  // Restore any previously staged files on page load, then render
  restoreFiles(() => {
    renderPreviews();
  });

  attachBtn.addEventListener('click', () => {
    console.log('[AI Council] Attach clicked. Current files:', currentFiles.length);
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    console.log('[AI Council] File input changed. New files:', fileInput.files.length, 'Existing:', currentFiles.length);
    if (fileInput.files.length > 0) {
      const newFiles = Array.from(fileInput.files);
      let loadedCount = 0;

      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          currentFiles.push({
            name: file.name,
            type: file.type,
            data: e.target.result
          });
          loadedCount++;
          console.log('[AI Council] Read file:', file.name, '— Total staged:', currentFiles.length);
          if (loadedCount === newFiles.length) {
             persistFiles(); // Save to storage so they survive reloads
             renderPreviews();
             fileInput.value = ''; // Clear so same file can be re-selected
          }
        };
        reader.readAsDataURL(file);
      });
    }
  });

  // Paste Event Listener
  promptInput.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    let pastedFiles = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = (ev) => {
          currentFiles.push({
            name: file.name,
            type: file.type,
            data: ev.target.result
          });
          persistFiles();
          renderPreviews();
        };
        reader.readAsDataURL(file);
        pastedFiles = true;
      }
    }
    if (pastedFiles) {
        e.preventDefault(); // Prevent pasting the binary data code into text area
    }
  });

  sendBtn.addEventListener('click', () => {
    const prompt = promptInput.value.trim();
    if (!prompt && currentFiles.length === 0) return;

    // Reset UI immediately
    promptInput.value = '';
    const filesToSend = [...currentFiles]; // Capture current ref

    // Clear attachment state
    currentFiles = [];
    persistFiles(); // Clear storage too
    renderPreviews();

    // Store files for content scripts to pick up, then broadcast
    chrome.storage.local.set({ 'pendingImages': filesToSend }, () => {
      chrome.runtime.sendMessage({
        action: 'broadcast_prompt',
        prompt: prompt
      });
    });
  });

  // Settings
  document.getElementById('settings-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/options/options.html') });
  });

  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  // Resizer Logic (Only active in Grid mode)
  initGridResizer();
});

function switchView(mode) {
  const grid = document.getElementById('bot-grid');
  const tabSelector = document.getElementById('tab-selector');

  CURRENT_VIEW = mode;

  // UI Updates
  document.getElementById('view-grid').classList.toggle('active', mode === 'grid');
  document.getElementById('view-tab').classList.toggle('active', mode === 'tab');

  if (mode === 'grid') {
    grid.classList.remove('tab-mode');
    tabSelector.style.display = 'none';
    // Remove any maximize states to avoid confusion
    document.querySelectorAll('.bot-wrapper').forEach(el => el.classList.remove('maximized'));
  } else {
    grid.classList.add('tab-mode');
    tabSelector.style.display = 'flex';
    activateTab(ACTIVE_TAB_INDEX);
  }
}

function activateTab(index) {
  ACTIVE_TAB_INDEX = index;
  // Update Tab Buttons
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach((btn, i) => btn.classList.toggle('active', i === index));

  // Show correct wrapper
  const wrappers = document.querySelectorAll('.bot-wrapper');
  wrappers.forEach((el, i) => {
    el.classList.toggle('active-tab', i === index);
  });
}

function renderGrid(botIds) {
  const container = document.getElementById('bot-grid');
  container.innerHTML = '';

  botIds.forEach((botId, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'bot-wrapper';
    wrapper.id = `wrapper-${index}`; // Indexed ID for tab logic

    // --- HEADER ---
    const header = document.createElement('div');
    header.className = 'bot-header';

    const title = document.createElement('span');
    title.className = 'bot-title';
    title.textContent = botId.charAt(0).toUpperCase() + botId.slice(1);

    const controls = document.createElement('div');
    controls.className = 'bot-controls';

    // Reload Btn
    const reloadBtn = document.createElement('button');
    reloadBtn.textContent = '⟳';
    reloadBtn.title = 'Reload';
    reloadBtn.onclick = () => {
      const frame = wrapper.querySelector('iframe');
      frame.src = frame.src;
    };

    // Maximize Btn
    const maxBtn = document.createElement('button');
    maxBtn.textContent = '⛶'; // Square
    maxBtn.title = 'Maximize';
    maxBtn.className = 'max-btn'; // Add class for easy selection if needed
    maxBtn.onclick = () => toggleMaximize(wrapper, maxBtn);

    controls.appendChild(reloadBtn);
    controls.appendChild(maxBtn);
    header.appendChild(title);
    header.appendChild(controls);
    wrapper.appendChild(header);

    // --- Hover Logic (Debounced for smoothness) ---
    let hoverTimeout;

    wrapper.addEventListener('mouseenter', () => {
      // Clear any pending remove
      if (wrapper._leaveTimeout) {
        clearTimeout(wrapper._leaveTimeout);
        wrapper._leaveTimeout = null;
      }

      // Debounce the maximize action to prevent flashing
      hoverTimeout = setTimeout(() => {
        if (CURRENT_VIEW === 'grid') {
          setMaximize(wrapper, maxBtn, true);
        }
      }, 150); // 150ms delay for intentionality
    });

    wrapper.addEventListener('mouseleave', () => {
      // Cancel maximize if it hasn't happened yet
      if (hoverTimeout) clearTimeout(hoverTimeout);

      if (CURRENT_VIEW === 'grid') {
        // Increased buffer to 500ms to cover the entire 0.4s animation duration.
        // This prevents spurious mouseleave events caused by the transform:scale() gap.
        wrapper._leaveTimeout = setTimeout(() => {
          // CRITICAL FIX: explicit check if still hovering
          if (!wrapper.matches(':hover')) {
            setMaximize(wrapper, maxBtn, false);
          }
        }, 500);
      }
    });

    // --- IFRAME ---
    const iframe = document.createElement('iframe');
    iframe.src = BOT_URLS[botId];
    iframe.className = 'bot-iframe';
    iframe.allow = "clipboard-read; clipboard-write; microphone; camera; geolocation; fullscreen";

    wrapper.appendChild(iframe);
    container.appendChild(wrapper);
  });
}

function updateTabSelector() {
  const selector = document.getElementById('tab-selector');
  selector.innerHTML = '';
  CURRENT_SLOTS.forEach((botId, index) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.textContent = botId.charAt(0).toUpperCase() + botId.slice(1); // Name
    btn.onclick = () => activateTab(index);
    selector.appendChild(btn);
  });
}

function toggleMaximize(wrapper, btn) {
  const isMax = wrapper.classList.contains('maximized');
  setMaximize(wrapper, btn, !isMax);
}

function setMaximize(wrapper, btn, shouldMaximize) {
  if (shouldMaximize) {
    wrapper.classList.add('maximized');
    btn.textContent = '_'; // Minimize symbol
    btn.title = 'Minimize';
  } else {
    wrapper.classList.remove('maximized');
    btn.textContent = '⛶';
    btn.title = 'Maximize';
  }
}


function initGridResizer() {
  const grid = document.getElementById('bot-grid');
  let isResizing = false;
  let resizeDir = null;
  let colPercent = 50;
  let rowPercent = 50;

  grid.addEventListener('mousemove', (e) => {
    if (isResizing || CURRENT_VIEW === 'tab') return; // No resize in tab mode

    const rect = grid.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Avoid resize triggering when hovering over maximized element 
    // (Maximized element covers grid gaps conceptually)
    if (document.querySelector('.maximized')) return;

    const colSplit = (rect.width * colPercent) / 100;
    const rowSplit = (rect.height * rowPercent) / 100;
    const tolerance = 8;

    const nearCol = Math.abs(x - colSplit) < tolerance;
    const nearRow = Math.abs(y - rowSplit) < tolerance;

    if (nearCol && nearRow) { grid.style.cursor = 'move'; resizeDir = 'both'; }
    else if (nearCol) { grid.style.cursor = 'col-resize'; resizeDir = 'col'; }
    else if (nearRow) { grid.style.cursor = 'row-resize'; resizeDir = 'row'; }
    else { grid.style.cursor = 'default'; resizeDir = null; }
  });

  grid.addEventListener('mousedown', (e) => {
    if (resizeDir && !document.querySelector('.maximized')) {
      isResizing = true;
      e.preventDefault();
      const overlay = document.createElement('div');
      overlay.id = 'resize-overlay';
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.zIndex = '99999';
      overlay.style.cursor = grid.style.cursor;
      document.body.appendChild(overlay);
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const rect = grid.getBoundingClientRect();

    if (resizeDir === 'col' || resizeDir === 'both') {
      const x = e.clientX - rect.left;
      colPercent = (x / rect.width) * 100;
      colPercent = Math.max(10, Math.min(90, colPercent));
    }

    if (resizeDir === 'row' || resizeDir === 'both') {
      const y = e.clientY - rect.top;
      rowPercent = (y / rect.height) * 100;
      rowPercent = Math.max(10, Math.min(90, rowPercent));
    }

    grid.style.gridTemplateColumns = `${colPercent}% ${100 - colPercent}%`;
    grid.style.gridTemplateRows = `${rowPercent}% ${100 - rowPercent}%`;
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      const overlay = document.getElementById('resize-overlay');
      if (overlay) overlay.remove();
    }
  });
}
