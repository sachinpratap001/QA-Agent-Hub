/**
 * QA Agent Hub | BLAST Framework — Frontend Orchestrator Application
 * File: app.js
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Constants & Default Agent Configurations
  // ---------------------------------------------------------------------------
  const STORAGE_KEY = 'blast_qa_chat_history_v1';
  const MAX_HISTORY_ITEMS = 50;

  const DEFAULT_AGENTS = {
    BlueprintAgent: {
      name: 'BlueprintAgent',
      phase: 'Phase B',
      phaseClass: 'phase-b',
      emoji: '🏗️',
      title: 'Test Strategy & System Architecture',
      description: 'Test Strategy, Architecture & Data Schemas',
      welcomeMessage: 'Greetings! I am **BlueprintAgent** (Phase B). I define test strategies, data schemas, and architecture contracts for our Medusa.js eCommerce SUT. How can I assist your test planning today?'
    },
    SentinelAgent: {
      name: 'SentinelAgent',
      phase: 'Phase L',
      phaseClass: 'phase-l',
      emoji: '🛡️',
      title: 'API & Invariant Protection',
      description: 'API Validation, Schema & Invariant Protection',
      welcomeMessage: 'Hello, I am **SentinelAgent** (Phase L). I guard your REST API endpoints, enforce data schema invariants, and ensure HTTP contract integrity across all microservices.'
    },
    NavigatorAgent: {
      name: 'NavigatorAgent',
      phase: 'Phase A',
      phaseClass: 'phase-a',
      emoji: '🧭',
      title: 'E2E & User Journey Explorer',
      description: 'E2E Playwright Journeys & UI Checkout Flow',
      welcomeMessage: 'Welcome! I am **NavigatorAgent** (Phase A). I execute Playwright end-to-end user journeys: Customer Login &rarr; Product Catalog Browse &rarr; Shopping Cart &rarr; Checkout Completion.'
    },
    TriageAgent: {
      name: 'TriageAgent',
      phase: 'Phase S',
      phaseClass: 'phase-s',
      emoji: '🔬',
      title: 'Failure Diagnostics & Triage',
      description: 'Failure Diagnostics, Stack Traces & Root Cause',
      welcomeMessage: 'Standing by. I am **TriageAgent** (Phase S). Provide me with stack traces, test failure logs, or error responses and I will isolate root causes and assign P1-P4 defect severity.'
    },
    VerdictAgent: {
      name: 'VerdictAgent',
      phase: 'Phase T',
      phaseClass: 'phase-t',
      emoji: '⚖️',
      title: 'Quality Gatekeeper & Sign-off',
      description: 'Quality Gatekeeper, Thresholds & Sign-off',
      welcomeMessage: 'Greetings. I am **VerdictAgent** (Phase T). I evaluate comprehensive test coverage, threshold adherence, and blast invariants to issue the final production release verdict.'
    }
  };

  // ---------------------------------------------------------------------------
  // 2. Application State
  // ---------------------------------------------------------------------------
  const state = {
    selectedAgent: 'BlueprintAgent',
    agents: { ...DEFAULT_AGENTS },
    chatHistory: [],
    isSending: false,
    ollamaStatus: 'connecting' // 'online' | 'offline' | 'connecting'
  };

  // ---------------------------------------------------------------------------
  // 3. DOM Element References
  // ---------------------------------------------------------------------------
  const DOM = {
    loadingOverlay: document.getElementById('loading-overlay'),
    toast: document.getElementById('toast-notification'),
    toastIcon: document.getElementById('toast-icon'),
    toastMessage: document.getElementById('toast-message'),
    toastCloseBtn: document.getElementById('toast-close-btn'),

    // Ollama Status
    ollamaDot: document.getElementById('ollama-status-dot'),
    ollamaText: document.getElementById('ollama-status-text'),
    ollamaModel: document.getElementById('ollama-model-text'),
    headerDot: document.getElementById('header-status-dot'),
    headerText: document.getElementById('header-status-text'),

    // Agents
    agentList: document.getElementById('agent-list'),
    agentCards: document.querySelectorAll('.agent-card'),

    // Header Meta
    headerEmoji: document.getElementById('active-agent-emoji'),
    headerName: document.getElementById('active-agent-name'),
    headerPhase: document.getElementById('active-agent-phase'),
    headerRole: document.getElementById('active-agent-role'),

    // Chat
    chatContainer: document.getElementById('chat-messages-container'),
    chatMessages: document.getElementById('chat-messages'),
    btnClearHistory: document.getElementById('btn-clear-history'),

    // Input & Quick Actions
    textarea: document.getElementById('chat-textarea'),
    sendBtn: document.getElementById('send-btn'),
    charCounter: document.getElementById('char-counter'),
    actionChips: document.querySelectorAll('.action-chip')
  };

  let toastTimer = null;

  // ---------------------------------------------------------------------------
  // 4. Utility Functions: HTML Escaping & Markdown Rendering
  // ---------------------------------------------------------------------------
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderMarkdown(text) {
    if (!text) return '';

    // Step 1: Temporarily extract code blocks ```lang ... ```
    const codeBlocks = [];
    let processed = text.replace(/```([a-zA-Z0-9_\-]*)\n([\s\S]*?)```/g, function (_, lang, code) {
      const index = codeBlocks.length;
      const cleanLang = lang.trim() || 'code';
      const escapedCode = escapeHtml(code.trim());
      codeBlocks.push(
        `<pre><div class="code-header"><span>${escapeHtml(cleanLang)}</span><button class="copy-code-btn" type="button" onclick="window.copyToClipboard(this)">Copy</button></div><code>${escapedCode}</code></pre>`
      );
      return `@@CODE_BLOCK_${index}@@`;
    });

    // Step 2: Escape raw HTML in regular text
    processed = escapeHtml(processed);

    // Step 3: Inline code `code`
    processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Step 4: Bold **text** or __text__
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Step 5: Italics *text* or _text_
    processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    processed = processed.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Step 6: Bullet list items
    const lines = processed.split('\n');
    let inList = false;
    const formattedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);

      if (bulletMatch) {
        if (!inList) {
          formattedLines.push('<ul>');
          inList = true;
        }
        formattedLines.push(`<li>${bulletMatch[2]}</li>`);
      } else {
        if (inList) {
          formattedLines.push('</ul>');
          inList = false;
        }
        formattedLines.push(line);
      }
    }
    if (inList) {
      formattedLines.push('</ul>');
    }

    processed = formattedLines.join('\n');

    // Step 7: Paragraphs & Line Breaks
    processed = processed.replace(/\n\n+/g, '</p><p>');
    processed = processed.replace(/\n/g, '<br>');
    processed = `<p>${processed}</p>`;

    // Clean up empty paragraphs
    processed = processed.replace(/<p>\s*<\/p>/g, '');
    processed = processed.replace(/<p><br><\/p>/g, '');

    // Step 8: Re-insert extracted code blocks
    processed = processed.replace(/@@CODE_BLOCK_(\d+)@@/g, function (_, idx) {
      return codeBlocks[parseInt(idx, 10)];
    });

    return processed;
  }

  // Global helper for copying code snippets
  window.copyToClipboard = function (btn) {
    try {
      const pre = btn.closest('pre');
      const codeElem = pre ? pre.querySelector('code') : null;
      if (!codeElem) return;

      const codeText = codeElem.innerText;
      navigator.clipboard.writeText(codeText).then(() => {
        const origText = btn.innerText;
        btn.innerText = 'Copied!';
        setTimeout(() => {
          btn.innerText = origText;
        }, 2000);
      });
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. Toast Notifications
  // ---------------------------------------------------------------------------
  function showToast(message, type = 'info', duration = 4000) {
    if (!DOM.toast) return;

    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }

    DOM.toast.className = `toast-notification ${type} show`;
    DOM.toastMessage.textContent = message;

    if (type === 'success') {
      DOM.toastIcon.textContent = '✅';
    } else if (type === 'error') {
      DOM.toastIcon.textContent = '⚠️';
    } else if (type === 'warning') {
      DOM.toastIcon.textContent = '🔔';
    } else {
      DOM.toastIcon.textContent = '✨';
    }

    toastTimer = setTimeout(() => {
      hideToast();
    }, duration);
  }

  function hideToast() {
    if (!DOM.toast) return;
    DOM.toast.classList.remove('show');
  }

  if (DOM.toastCloseBtn) {
    DOM.toastCloseBtn.addEventListener('click', hideToast);
  }

  // ---------------------------------------------------------------------------
  // 6. UI Updates: Active Agent Header & Cards
  // ---------------------------------------------------------------------------
  function updateActiveAgentUI(agentKey) {
    const agent = state.agents[agentKey] || DEFAULT_AGENTS[agentKey] || DEFAULT_AGENTS.BlueprintAgent;
    state.selectedAgent = agentKey;

    // Update Header
    if (DOM.headerEmoji) DOM.headerEmoji.textContent = agent.emoji;
    if (DOM.headerName) DOM.headerName.textContent = agent.name;
    if (DOM.headerRole) DOM.headerRole.textContent = agent.title || agent.description;

    if (DOM.headerPhase) {
      DOM.headerPhase.textContent = agent.phase;
      DOM.headerPhase.className = `agent-phase-badge ${agent.phaseClass || 'phase-b'}`;
    }

    // Update Placeholder
    if (DOM.textarea) {
      DOM.textarea.placeholder = `Ask ${agent.name} a question or type a QA directive... (Press Enter to send, Shift+Enter for newline)`;
    }

    // Update Sidebar Cards Selection
    const cards = document.querySelectorAll('.agent-card');
    cards.forEach((card) => {
      const cardAgent = card.getAttribute('data-agent');
      if (cardAgent === agentKey) {
        card.classList.add('active');
        card.setAttribute('aria-checked', 'true');
      } else {
        card.classList.remove('active');
        card.setAttribute('aria-checked', 'false');
      }
    });
  }

  function renderAgentList(agentsData) {
    if (!DOM.agentList) return;

    // If agentsData is provided from backend, merge into state
    if (agentsData && typeof agentsData === 'object') {
      if (Array.isArray(agentsData)) {
        agentsData.forEach((ag) => {
          if (ag.name) {
            state.agents[ag.name] = { ...DEFAULT_AGENTS[ag.name], ...ag };
          }
        });
      } else {
        Object.keys(agentsData).forEach((key) => {
          state.agents[key] = { ...DEFAULT_AGENTS[key], ...agentsData[key] };
        });
      }
    }

    // Ensure click handlers are attached
    const cards = DOM.agentList.querySelectorAll('.agent-card');
    cards.forEach((card) => {
      card.onclick = () => {
        const agentKey = card.getAttribute('data-agent');
        if (agentKey && agentKey !== state.selectedAgent) {
          updateActiveAgentUI(agentKey);
          showToast(`Switched active agent to ${agentKey}`, 'info', 2000);
        }
      };
    });
  }

  // ---------------------------------------------------------------------------
  // 7. Ollama Status & Connection Checker
  // ---------------------------------------------------------------------------
  async function checkOllamaHealth() {
    updateOllamaIndicator('connecting', 'Connecting...');

    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Health check HTTP ${response.status}`);
      }

      const data = await response.json();
      const isOnline = data.ollama === true || data.status === 'ok' || data.connected === true;
      const model = data.model || 'llama3.2';

      if (isOnline) {
        updateOllamaIndicator('online', 'Ollama Online', `Model: ${model}`);
        state.ollamaStatus = 'online';
      } else {
        updateOllamaIndicator('offline', 'Ollama Offline', 'Service unreachable');
        state.ollamaStatus = 'offline';
      }
    } catch (err) {
      console.warn('Ollama health check unreachable:', err.message);
      updateOllamaIndicator('offline', 'Ollama Offline', 'localhost:11434 unreachable');
      state.ollamaStatus = 'offline';
    }
  }

  function updateOllamaIndicator(status, text, meta) {
    if (DOM.ollamaDot) {
      DOM.ollamaDot.className = `status-dot ${status}`;
    }
    if (DOM.ollamaText) {
      DOM.ollamaText.textContent = text;
    }
    if (DOM.ollamaModel && meta) {
      DOM.ollamaModel.textContent = meta;
    }

    if (DOM.headerDot) {
      DOM.headerDot.className = `status-dot ${status}`;
    }
    if (DOM.headerText) {
      DOM.headerText.textContent = status === 'online' ? 'Online' : (status === 'offline' ? 'Offline' : 'Connecting');
    }
  }

  async function fetchAgentsConfig() {
    try {
      const response = await fetch('/api/agents', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000)
      });

      if (response.ok) {
        const data = await response.json();
        renderAgentList(data);
      }
    } catch (err) {
      console.log('Using default local agent definitions:', err.message);
      renderAgentList(DEFAULT_AGENTS);
    }
  }

  // ---------------------------------------------------------------------------
  // 8. Chat Messages & Rendering
  // ---------------------------------------------------------------------------
  function formatTimestamp(ts) {
    const date = ts ? new Date(ts) : new Date();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function appendUserMessage(text, timestamp = Date.now()) {
    const row = document.createElement('div');
    row.className = 'chat-message-row user';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble user';
    bubble.textContent = text; // Plain text prevents XSS in user input

    row.appendChild(bubble);
    DOM.chatMessages.appendChild(row);
    scrollToBottom();

    // Save to history
    saveMessageToHistory({
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      role: 'user',
      text: text,
      timestamp: timestamp
    });
  }

  function appendAgentMessage(text, agentKey, timestamp = Date.now(), save = true) {
    const agent = state.agents[agentKey] || DEFAULT_AGENTS[agentKey] || DEFAULT_AGENTS.BlueprintAgent;

    const row = document.createElement('div');
    row.className = 'chat-message-row agent';

    // Avatar
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = agent.emoji || '🤖';

    // Bubble
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble agent';

    // Header
    const header = document.createElement('div');
    header.className = 'agent-message-header';

    const meta = document.createElement('div');
    meta.className = 'message-agent-meta';

    const name = document.createElement('span');
    name.className = 'message-agent-name';
    name.textContent = agent.name;

    const badge = document.createElement('span');
    badge.className = `agent-phase-badge ${agent.phaseClass || 'phase-b'}`;
    badge.textContent = agent.phase;

    meta.appendChild(name);
    meta.appendChild(badge);

    const time = document.createElement('span');
    time.className = 'message-timestamp';
    time.textContent = formatTimestamp(timestamp);

    header.appendChild(meta);
    header.appendChild(time);

    // Body
    const body = document.createElement('div');
    body.className = 'message-body';
    body.innerHTML = renderMarkdown(text);

    bubble.appendChild(header);
    bubble.appendChild(body);

    row.appendChild(avatar);
    row.appendChild(bubble);

    DOM.chatMessages.appendChild(row);
    scrollToBottom();

    if (save) {
      saveMessageToHistory({
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        role: 'agent',
        agentName: agentKey,
        text: text,
        timestamp: timestamp
      });
    }
  }

  // Typing Indicator
  function showTypingIndicator(agentKey) {
    removeTypingIndicator();

    const agent = state.agents[agentKey] || DEFAULT_AGENTS[agentKey] || DEFAULT_AGENTS.BlueprintAgent;

    const row = document.createElement('div');
    row.id = 'typing-indicator-row';
    row.className = 'chat-message-row agent typing-indicator-row';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = agent.emoji || '🤖';

    const bubble = document.createElement('div');
    bubble.className = 'typing-bubble';

    const dot1 = document.createElement('span');
    dot1.className = 'typing-dot';
    const dot2 = document.createElement('span');
    dot2.className = 'typing-dot';
    const dot3 = document.createElement('span');
    dot3.className = 'typing-dot';

    const text = document.createElement('span');
    text.className = 'typing-text';
    text.textContent = `${agent.name} is thinking...`;

    bubble.appendChild(dot1);
    bubble.appendChild(dot2);
    bubble.appendChild(dot3);
    bubble.appendChild(text);

    row.appendChild(avatar);
    row.appendChild(bubble);

    DOM.chatMessages.appendChild(row);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const existing = document.getElementById('typing-indicator-row');
    if (existing) {
      existing.remove();
    }
  }

  function scrollToBottom() {
    if (!DOM.chatContainer) return;
    requestAnimationFrame(() => {
      DOM.chatContainer.scrollTop = DOM.chatContainer.scrollHeight;
    });
  }

  // ---------------------------------------------------------------------------
  // 9. Local Storage & Chat Persistence
  // ---------------------------------------------------------------------------
  function loadChatHistory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        state.chatHistory = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse chat history:', e);
      state.chatHistory = [];
    }

    if (state.chatHistory.length > 0) {
      state.chatHistory.forEach((msg) => {
        if (msg.role === 'user') {
          appendUserMessage(msg.text, msg.timestamp);
        } else {
          appendAgentMessage(msg.text, msg.agentName || 'BlueprintAgent', msg.timestamp, false);
        }
      });
    } else {
      // Show default greeting
      const activeAgent = state.agents[state.selectedAgent] || DEFAULT_AGENTS.BlueprintAgent;
      appendAgentMessage(activeAgent.welcomeMessage, state.selectedAgent, Date.now(), true);
    }
  }

  function saveMessageToHistory(msg) {
    state.chatHistory.push(msg);
    if (state.chatHistory.length > MAX_HISTORY_ITEMS) {
      state.chatHistory = state.chatHistory.slice(-MAX_HISTORY_ITEMS);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.chatHistory));
    } catch (e) {
      console.warn('Failed to save chat history:', e);
    }
  }

  function clearChatHistory() {
    if (!confirm('Are you sure you want to clear your conversation history?')) {
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
    state.chatHistory = [];
    DOM.chatMessages.innerHTML = '';

    const activeAgent = state.agents[state.selectedAgent] || DEFAULT_AGENTS.BlueprintAgent;
    appendAgentMessage(activeAgent.welcomeMessage, state.selectedAgent, Date.now(), true);
    showToast('Chat history cleared', 'info', 2500);
  }

  if (DOM.btnClearHistory) {
    DOM.btnClearHistory.addEventListener('click', clearChatHistory);
  }

  // ---------------------------------------------------------------------------
  // 10. Message Dispatcher & Ollama API Client
  // ---------------------------------------------------------------------------
  async function sendMessage() {
    if (state.isSending) return;

    const messageText = DOM.textarea.value.trim();
    if (!messageText) return;

    const targetAgent = state.selectedAgent;

    // 1. Render User Message
    appendUserMessage(messageText);

    // 2. Clear input & reset size
    DOM.textarea.value = '';
    autoResizeTextarea();
    updateCharCounter();

    // 3. Set Sending State
    state.isSending = true;
    DOM.sendBtn.disabled = true;
    showTypingIndicator(targetAgent);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          agentName: targetAgent
        })
      });

      removeTypingIndicator();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error || errorData.message || `Server responded with ${response.status}`;
        throw new Error(errMsg);
      }

      const data = await response.json();
      const reply = data.reply || data.message || data.output || 'Directive acknowledged.';
      const respondingAgent = data.agentName || targetAgent;

      appendAgentMessage(reply, respondingAgent);
    } catch (err) {
      removeTypingIndicator();
      console.error('Failed to send message:', err);

      const isOfflineError = state.ollamaStatus === 'offline' || err.message.includes('Failed to fetch');
      const errNotice = isOfflineError
        ? `⚠️ **Ollama Offline**: Cannot reach LLM runtime on localhost:11434. Ensure Ollama is running (\`ollama serve\`) with model \`llama3.2\`.`
        : `⚠️ **Error**: ${err.message}`;

      appendAgentMessage(errNotice, targetAgent);
      showToast(err.message, 'error', 5000);
    } finally {
      state.isSending = false;
      DOM.sendBtn.disabled = false;
      DOM.textarea.focus();
    }
  }

  // ---------------------------------------------------------------------------
  // 11. Textarea Auto-Resize & Event Listeners
  // ---------------------------------------------------------------------------
  function autoResizeTextarea() {
    if (!DOM.textarea) return;
    DOM.textarea.style.height = 'auto';
    const newHeight = Math.min(DOM.textarea.scrollHeight, 160);
    DOM.textarea.style.height = `${Math.max(newHeight, 42)}px`;
  }

  function updateCharCounter() {
    if (!DOM.charCounter || !DOM.textarea) return;
    const len = DOM.textarea.value.length;
    DOM.charCounter.textContent = `${len} char${len === 1 ? '' : 's'}`;
  }

  if (DOM.textarea) {
    DOM.textarea.addEventListener('input', () => {
      autoResizeTextarea();
      updateCharCounter();
    });

    DOM.textarea.addEventListener('keydown', (e) => {
      // Enter without Shift sends
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
      // Escape clears textarea
      else if (e.key === 'Escape') {
        e.preventDefault();
        DOM.textarea.value = '';
        autoResizeTextarea();
        updateCharCounter();
        showToast('Input cleared', 'info', 1500);
      }
    });
  }

  if (DOM.sendBtn) {
    DOM.sendBtn.addEventListener('click', (e) => {
      e.preventDefault();
      sendMessage();
    });
  }

  // ---------------------------------------------------------------------------
  // 12. Quick Action Chips
  // ---------------------------------------------------------------------------
  if (DOM.actionChips) {
    DOM.actionChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const template = chip.getAttribute('data-template');
        if (!template) return;

        // Route template to appropriate agent based on chip type
        const chipId = chip.id;
        if (chipId === 'chip-login' && state.selectedAgent !== 'NavigatorAgent') {
          updateActiveAgentUI('NavigatorAgent');
        } else if (chipId === 'chip-api' && state.selectedAgent !== 'SentinelAgent') {
          updateActiveAgentUI('SentinelAgent');
        } else if (chipId === 'chip-classify' && state.selectedAgent !== 'TriageAgent') {
          updateActiveAgentUI('TriageAgent');
        } else if (chipId === 'chip-report' && state.selectedAgent !== 'VerdictAgent') {
          updateActiveAgentUI('VerdictAgent');
        }

        DOM.textarea.value = template;
        autoResizeTextarea();
        updateCharCounter();
        DOM.textarea.focus();

        showToast('Template populated. Press Enter or Send to execute.', 'info', 2500);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 13. Application Initialization
  // ---------------------------------------------------------------------------
  async function init() {
    try {
      // 1. Setup agent click listeners
      renderAgentList(DEFAULT_AGENTS);

      // 2. Set default active agent
      updateActiveAgentUI('BlueprintAgent');

      // 3. Load chat history from localStorage
      loadChatHistory();

      // 4. Concurrently check Ollama health & fetch remote agent config
      await Promise.allSettled([
        checkOllamaHealth(),
        fetchAgentsConfig()
      ]);

      // 5. Hide loading overlay
      setTimeout(() => {
        if (DOM.loadingOverlay) {
          DOM.loadingOverlay.classList.add('hidden');
        }
      }, 350);

      // 6. Periodically ping health every 30 seconds
      setInterval(checkOllamaHealth, 30000);

    } catch (err) {
      console.error('Initialization error:', err);
      if (DOM.loadingOverlay) {
        DOM.loadingOverlay.classList.add('hidden');
      }
      showToast('Initialized with local defaults', 'warning', 3000);
    }
  }

  // Trigger init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
