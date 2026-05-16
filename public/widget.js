(function() {
    const BASE_URL = 'https://agentdeskk.netlify.app';
    // Capture agentId IMMEDIATELY to avoid timing issues with async script loading
    const scriptTag = document.currentScript;
    const agentId = scriptTag ? scriptTag.getAttribute('data-agent-id') : null;

    if (!agentId) {
        console.error('AgentDesk: missing data-agent-id attribute on script tag');
        return;
    }

    // Session Management
    const sessionKey = 'agd-session-' + agentId;
    let sessionId = sessionStorage.getItem(sessionKey);
    if (!sessionId) {
        sessionId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem(sessionKey, sessionId);
    }

    let agentData = null;
    let chatHistory = [];

    async function init() {
        try {
            const res = await fetch(`${BASE_URL}/api/agents/public/${agentId}`);
            if (!res.ok) throw new Error('Agent not found');
            agentData = await res.json();

            if (agentData.isActive === false) return;

            injectStyles();
            injectHTML();
            
            setTimeout(() => {
                const launcher = document.getElementById('agd-launcher');
                if (launcher) launcher.style.display = 'flex';
            }, 1500);
        } catch (err) {
            console.error('AgentDesk initialization failed:', err);
        }
    }

    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'agd-styles';
        style.textContent = `
            .agd-reset *, .agd-reset *::before, .agd-reset *::after {
                box-sizing: border-box;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin: 0; padding: 0;
            }
            #agd-launcher {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 60px;
                height: 60px;
                background: #FF6B35;
                border-radius: 50%;
                display: none;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 9999999;
                transition: transform 0.2s ease;
                animation: agd-pulse 2s infinite;
                border: none;
                outline: none;
            }
            #agd-launcher:hover { transform: scale(1.08); }
            @keyframes agd-pulse {
                0% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.4); }
                70% { box-shadow: 0 0 0 15px rgba(255, 107, 53, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0); }
            }
            #agd-panel {
                position: fixed;
                bottom: 96px;
                right: 24px;
                width: 380px;
                height: 560px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                z-index: 9999999;
                display: none;
                flex-direction: column;
                overflow: hidden;
                transform: translateY(20px);
                opacity: 0;
                transition: transform 0.25s ease, opacity 0.25s ease;
            }
            #agd-panel.agd-open {
                display: flex;
                transform: translateY(0);
                opacity: 1;
            }
            @media (max-width: 768px) {
                #agd-panel {
                    width: 100vw;
                    height: 100vh;
                    bottom: 0;
                    right: 0;
                    top: 0;
                    border-radius: 0;
                }
            }
            .agd-header {
                height: 60px;
                background: #FF6B35;
                padding: 0 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                color: white;
                flex-shrink: 0;
            }
            .agd-header-left { display: flex; align-items: center; gap: 10px; }
            .agd-avatar {
                width: 32px;
                height: 32px;
                background: rgba(255,255,255,0.2);
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-weight: bold; font-size: 14px;
            }
            .agd-header-right { display: flex; gap: 4px; }
            .agd-header-btn {
                background: none; border: none; color: white; cursor: pointer;
                font-size: 20px; padding: 8px; display: flex; align-items: center; justify-content: center;
            }
            .agd-powered {
                font-size: 10px; padding: 6px 16px; background: #F9FAFB;
                color: #9CA3AF; border-bottom: 1px solid #F3F4F6;
            }
            .agd-messages {
                flex-grow: 1; overflow-y: auto; padding: 16px;
                display: flex; flex-direction: column; gap: 16px; background: #ffffff;
            }
            .agd-message {
                max-width: 85%; padding: 10px 14px; font-size: 14px;
                line-height: 1.5; position: relative;
            }
            .agd-msg-user {
                align-self: flex-end; background: #FF6B35; color: white;
                border-radius: 12px 12px 4px 12px;
            }
            .agd-msg-ai {
                align-self: flex-start; background: #F3F4F6; color: #111827;
                border-radius: 12px 12px 12px 4px;
            }
            .agd-msg-error {
                background: #FEE2E2 !important; color: #991B1B !important;
                border: 1px solid #FECACA;
            }
            .agd-timestamp { font-size: 10px; color: #9CA3AF; margin-top: 4px; display: block; }
            .agd-msg-user .agd-timestamp { text-align: right; color: rgba(255,255,255,0.8); }
            
            .agd-input-bar {
                height: 60px; border-top: 1px solid #F3F4F6;
                display: flex; align-items: center; padding: 0 12px; gap: 8px; background: white;
            }
            .agd-input { flex-grow: 1; border: none; outline: none; font-size: 14px; padding: 8px; }
            .agd-send-btn {
                width: 36px; height: 36px; background: #FF6B35; border-radius: 50%;
                border: none; display: flex; align-items: center; justify-content: center;
                cursor: pointer; color: white; flex-shrink: 0;
            }
            .agd-typing {
                display: flex; gap: 4px; padding: 12px 16px; background: #F3F4F6;
                border-radius: 12px 12px 12px 4px; width: fit-content; align-self: flex-start;
            }
            .agd-dot {
                width: 6px; height: 6px; background: #9CA3AF; border-radius: 50%;
                animation: agd-bounce 1.4s infinite ease-in-out both;
            }
            .agd-dot:nth-child(1) { animation-delay: -0.32s; }
            .agd-dot:nth-child(2) { animation-delay: -0.16s; }
            @keyframes agd-bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1.0); }
            }
        `;
        document.head.appendChild(style);
    }

    function injectHTML() {
        const initials = agentData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        const container = document.createElement('div');
        container.className = 'agd-reset';
        container.innerHTML = `
            <button id="agd-launcher">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </button>
            <div id="agd-panel">
                <div class="agd-header">
                    <div class="agd-header-left">
                        <div class="agd-avatar">${initials}</div>
                        <div class="agd-agent-name">${agentData.name}</div>
                    </div>
                    <div class="agd-header-right">
                        <button class="agd-header-btn" id="agd-minimize">—</button>
                        <button class="agd-header-btn" id="agd-close">×</button>
                    </div>
                </div>
                <div class="agd-powered">Powered by AgentDesk</div>
                <div class="agd-messages" id="agd-messages"></div>
                <div class="agd-input-bar">
                    <input type="text" class="agd-input" id="agd-input" placeholder="Type a message..." autocomplete="off">
                    <button class="agd-send-btn" id="agd-send">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        const launcher = document.getElementById('agd-launcher');
        const panel = document.getElementById('agd-panel');
        const input = document.getElementById('agd-input');
        const send = document.getElementById('agd-send');

        let isFirstOpen = true;

        launcher.onclick = () => {
            panel.style.display = 'flex';
            setTimeout(() => {
                panel.classList.add('agd-open');
                launcher.style.display = 'none';
                if (isFirstOpen) {
                    addMessage('assistant', agentData.welcomeMessage || "Hi! 👋 How can I help you today?");
                    isFirstOpen = false;
                }
                input.focus();
            }, 10);
        };

        const closePanel = () => {
            panel.classList.remove('agd-open');
            setTimeout(() => {
                if (!panel.classList.contains('agd-open')) {
                    panel.style.display = 'none';
                    launcher.style.display = 'flex';
                }
            }, 250);
        };

        document.getElementById('agd-minimize').onclick = closePanel;
        document.getElementById('agd-close').onclick = closePanel;

        const handleSend = () => {
            const text = input.value.trim();
            if (!text) return;
            input.value = '';
            sendMessage(text);
        };

        send.onclick = handleSend;
        input.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
    }

    function addMessage(role, content, isError = false) {
        const messagesDiv = document.getElementById('agd-messages');
        const msgEl = document.createElement('div');
        msgEl.className = `agd-message agd-msg-${role === 'user' ? 'user' : 'ai'} ${isError ? 'agd-msg-error' : ''}`;
        msgEl.innerHTML = `
            <div class="agd-content">${content}</div>
            <span class="agd-timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        `;
        messagesDiv.appendChild(msgEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        return msgEl;
    }

    function showTyping() {
        const messagesDiv = document.getElementById('agd-messages');
        const typingEl = document.createElement('div');
        typingEl.id = 'agd-typing-indicator';
        typingEl.className = 'agd-typing';
        typingEl.innerHTML = '<div class="agd-dot"></div><div class="agd-dot"></div><div class="agd-dot"></div>';
        messagesDiv.appendChild(typingEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function hideTyping() {
        const el = document.getElementById('agd-typing-indicator');
        if (el) el.remove();
    }

    async function sendMessage(text) {
        addMessage('user', text);
        const historyToSend = chatHistory.slice(-10);
        chatHistory.push({ role: 'user', content: text });
        showTyping();

        try {
            const response = await fetch(`${BASE_URL}/api/widget-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentId, message: text, sessionId, history: historyToSend })
            });

            if (!response.ok) throw new Error('Network error');

            hideTyping();
            const aiMsgEl = addMessage('assistant', '');
            const contentEl = aiMsgEl.querySelector('.agd-content');
            const messagesDiv = document.getElementById('agd-messages');
            let fullText = '';

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Robust SSE Parsing: Handle multiple data: lines in one chunk and partial lines
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Save last partial line to buffer

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;
                    
                    try {
                        const data = JSON.parse(trimmed.slice(6));
                        if (data.token) {
                            fullText += data.token;
                            contentEl.innerText = fullText;
                            messagesDiv.scrollTop = messagesDiv.scrollHeight;
                        }
                        if (data.done) {
                            chatHistory.push({ role: 'assistant', content: fullText });
                        }
                    } catch (e) {}
                }
            }
        } catch (err) {
            hideTyping();
            addMessage('assistant', "Sorry, I'm having trouble right now. Please try again in a moment.", true);
        }
    }

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);
})();
