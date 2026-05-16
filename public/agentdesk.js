(function() {
  'use strict';
  
  var DOMAIN = 'https://agentdeskk.netlify.app';
  var agentId = null;
  var sessionId = null;
  var history = [];
  var isOpen = false;
  var agentInfo = null;

  // MUST capture currentScript synchronously - it becomes null after async
  var scriptTag = document.currentScript;
  if (!scriptTag) {
    // Fallback for older browsers
    var scripts = document.getElementsByTagName('script');
    scriptTag = scripts[scripts.length - 1];
  }
  agentId = scriptTag ? scriptTag.getAttribute('data-agent-id') : null;
  
  if (!agentId) {
    console.error('[AgentDesk] No data-agent-id found on script tag');
    return;
  }

  // Generate or restore session ID
  try {
    sessionId = sessionStorage.getItem('agd_sid_' + agentId);
    if (!sessionId) {
      sessionId = 'agd_' + Date.now() + '_' + Math.random().toString(36).substr(2,9);
      sessionStorage.setItem('agd_sid_' + agentId, sessionId);
    }
  } catch(e) {
    sessionId = 'agd_' + Date.now();
  }

  function injectCSS() {
    var css = [
      '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");',
      
      '#agd-launcher{position:fixed;bottom:24px;right:24px;width:64px;height:64px;',
      'border-radius:50%;background:#FF6B35;cursor:pointer;display:flex;',
      'align-items:center;justify-content:center;z-index:2147483647;',
      'box-shadow:0 8px 32px rgba(255,107,53,0.35);',
      'transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);border:none;',
      'animation:agd-pop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards;}',
      
      '#agd-launcher:hover{transform:scale(1.08) rotate(5deg);box-shadow:0 12px 40px rgba(255,107,53,0.45);}',
      '#agd-launcher:active{transform:scale(0.92);}',
      
      '.agd-pulse{position:absolute;top:0;right:0;width:14px;height:14px;background:#ef4444;',
      'border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(239,68,68,0.4);',
      'animation:agd-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;}',
      '@keyframes agd-ping{0%{transform:scale(1);opacity:1;}75%,100%{transform:scale(1.8);opacity:0;}}',
      
      '@keyframes agd-pop{from{transform:scale(0.4) translateY(40px);opacity:0;}to{transform:scale(1) translateY(0);opacity:1;}}',
      
      '#agd-panel{position:fixed;bottom:104px;right:24px;width:400px;height:640px;',
      'background:rgba(255,255,255,0.9);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);',
      'border-radius:24px;z-index:2147483646;border:1px solid rgba(255,255,255,0.4);',
      'box-shadow:0 24px 64px rgba(0,0,0,0.12),0 8px 24px rgba(0,0,0,0.06);',
      'display:flex;flex-direction:column;overflow:hidden;font-family:"Inter",-apple-system,sans-serif;',
      'transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1);',
      'opacity:0;transform:translateY(30px) scale(0.92);pointer-events:none;transform-origin:bottom right;}',
      
      '#agd-panel.agd-open{opacity:1;transform:translateY(0) scale(1);pointer-events:all;}',
      
      '@media(max-width:480px){#agd-panel{width:100%;height:100%;bottom:0;right:0;',
      'border-radius:0;top:0;left:0;border:none;}}',
      
      '#agd-header{background:#FF6B35;padding:20px 24px;display:flex;',
      'align-items:center;justify-content:space-between;flex-shrink:0;box-shadow:0 4px 12px rgba(0,0,0,0.05);}',
      
      '#agd-agent-avatar{width:44px;height:44px;border-radius:14px;background:rgba(255,255,255,0.2);',
      'display:flex;align-items:center;justify-content:center;font-weight:700;',
      'font-size:18px;color:#fff;margin-right:14px;flex-shrink:0;border:1px solid rgba(255,255,255,0.2);}',
      
      '#agd-agent-name{font-weight:700;font-size:16px;color:#fff;line-height:1.2;letter-spacing:-0.01em;}',
      '#agd-agent-status{font-size:12px;color:rgba(255,255,255,0.8);margin-top:3px;display:flex;align-items:center;gap:4px;}',
      '.agd-status-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;}',
      
      '#agd-close-btn{background:rgba(0,0,0,0.1);border:none;color:#fff;',
      'width:32px;height:32px;border-radius:10px;cursor:pointer;font-size:14px;',
      'display:flex;align-items:center;justify-content:center;',
      'transition:all 0.2s;flex-shrink:0;}',
      '#agd-close-btn:hover{background:rgba(0,0,0,0.2);transform:rotate(90deg);}',
      
      '#agd-messages{flex:1;overflow-y:auto;padding:24px;display:flex;',
      'flex-direction:column;gap:16px;scroll-behavior:smooth;}',
      
      '#agd-messages::-webkit-scrollbar{width:5px;}',
      '#agd-messages::-webkit-scrollbar-track{background:transparent;}',
      '#agd-messages::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.05);border-radius:10px;}',
      
      '.agd-bubble{max-width:85%;padding:12px 16px;font-size:14.5px;line-height:1.6;',
      'word-wrap:break-word;box-shadow:0 2px 8px rgba(0,0,0,0.03);}',
      
      '.agd-bubble-user{background:#FF6B35;color:#fff;border-radius:20px 20px 4px 20px;',
      'align-self:flex-end;margin-left:12%;box-shadow:0 4px 12px rgba(255,107,53,0.2);}',
      
      '.agd-bubble-ai{background:#fff;color:#1e293b;border-radius:20px 20px 20px 4px;',
      'align-self:flex-start;margin-right:12%;border:1px solid #f1f5f9;}',
      
      '.agd-bubble-error{background:#fef2f2;color:#991b1b;border:1px solid #fee2e2;border-radius:12px;font-size:13px;}',
      
      '#agd-typing{padding:0 24px 16px;display:flex;align-items:center;gap:6px;flex-shrink:0;}',
      '.agd-typing-bubble{background:#f8fafc;padding:12px 16px;border-radius:16px;display:flex;gap:4px;}',
      '.agd-dot{width:6px;height:6px;border-radius:50%;background:#cbd5e1;',
      'animation:agd-bounce 1.4s infinite ease-in-out;}',
      '.agd-dot:nth-child(2){animation-delay:0.2s;}',
      '.agd-dot:nth-child(3){animation-delay:0.4s;}',
      '@keyframes agd-bounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-5px);}}',
      
      '#agd-inputbar-container{padding:16px 20px;background:#fff;border-top:1px solid #f1f5f9;flex-shrink:0;}',
      '#agd-inputbar{display:flex;align-items:center;gap:12px;}',
      
      '#agd-input{flex:1;border:1.5px solid #e2e8f0;border-radius:16px;',
      'padding:12px 16px;font-size:15px;outline:none;background:#f8fafc;',
      'transition:all 0.2s;color:#1e293b;}',
      '#agd-input:focus{border-color:#FF6B35;background:#fff;box-shadow:0 0 0 4px rgba(255,107,53,0.1);}',
      '#agd-input::placeholder{color:#94a3b8;}',
      
      '#agd-send-btn{width:46px;height:46px;border-radius:14px;background:#FF6B35;',
      'border:none;cursor:pointer;display:flex;align-items:center;',
      'justify-content:center;flex-shrink:0;transition:all 0.2s;box-shadow:0 4px 12px rgba(255,107,53,0.25);}',
      '#agd-send-btn:hover{background:#e85d2a;transform:translateY(-2px);box-shadow:0 6px 16px rgba(255,107,53,0.35);}',
      '#agd-send-btn:active{transform:translateY(0);}',
      '#agd-send-btn:disabled{background:#cbd5e1;cursor:not-allowed;box-shadow:none;}',
      
      '#agd-powered{text-align:center;font-size:10px;color:#94a3b8;padding:8px 0 0;font-weight:600;letter-spacing:0.02em;}',
      '#agd-powered a{color:#64748b;text-decoration:none;}',
      '#agd-powered span{color:#FF6B35;font-weight:800;letter-spacing:-0.02em;}',
    ].join('');
    ].join('');
    
    var style = document.createElement('style');
    style.id = 'agd-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildWidget(info) {
    agentInfo = info;
    var color = info.themeColor || '#FF6B35';
    
    // Update CSS with actual theme color
    var styleEl = document.getElementById('agd-styles');
    if (styleEl && color !== '#FF6B35') {
      styleEl.textContent = styleEl.textContent.split('#FF6B35').join(color);
    }
    
    // LAUNCHER BUTTON
    var launcher = document.createElement('div');
    launcher.id = 'agd-launcher';
    launcher.setAttribute('aria-label', 'Open chat');
    launcher.innerHTML = [
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
      '<div class="agd-pulse"></div>'
    ].join('');
    launcher.onclick = togglePanel;
    
    // PANEL
    var panel = document.createElement('div');
    panel.id = 'agd-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat with ' + info.name);
    
    var firstLetter = (info.name || 'A').charAt(0).toUpperCase();
    
    panel.innerHTML = [
      // Header
      '<div id="agd-header">',
        '<div style="display:flex;align-items:center;flex:1;">',
          '<div id="agd-agent-avatar">' + firstLetter + '</div>',
          '<div>',
            '<div id="agd-agent-name">' + escapeHTML(info.name) + '</div>',
            '<div id="agd-agent-status"><div class="agd-status-dot"></div> Always active</div>',
          '</div>',
        '</div>',
        '<button id="agd-close-btn" aria-label="Close chat">✕</button>',
      '</div>',
      // Messages
      '<div id="agd-messages"></div>',
      // Typing indicator (hidden by default)
      '<div id="agd-typing" style="display:none;">',
        '<div class="agd-typing-bubble">',
          '<div class="agd-dot"></div>',
          '<div class="agd-dot"></div>',
          '<div class="agd-dot"></div>',
        '</div>',
      '</div>',
      // Input bar
      '<div id="agd-inputbar-container">',
        '<div id="agd-inputbar">',
          '<input id="agd-input" type="text" placeholder="Type a message..." autocomplete="off" />',
          '<button id="agd-send-btn" aria-label="Send">',
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
          '</button>',
        '</div>',
        '<div id="agd-powered">Powered by <span>AgentDesk</span></div>',
      '</div>',
    ].join('');
    
    document.body.appendChild(launcher);
    document.body.appendChild(panel);
    
    // Event listeners
    document.getElementById('agd-close-btn').onclick = togglePanel;
    document.getElementById('agd-send-btn').onclick = handleSend;
    document.getElementById('agd-input').onkeydown = function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };
  }

  function togglePanel() {
    var panel = document.getElementById('agd-panel');
    var launcher = document.getElementById('agd-launcher');
    isOpen = !isOpen;
    
    if (isOpen) {
      panel.classList.add('agd-open');
      launcher.style.display = 'none';
      // Show welcome message only on first open
      var msgs = document.getElementById('agd-messages');
      if (msgs && msgs.children.length === 0) {
        addBubble('ai', agentInfo.welcomeMessage || 'Hi! 👋 How can I help you today?');
      }
      setTimeout(function() {
        document.getElementById('agd-input').focus();
      }, 300);
    } else {
      panel.classList.remove('agd-open');
      launcher.style.display = 'flex';
    }
  }

  function addBubble(type, text) {
    var msgs = document.getElementById('agd-messages');
    var bubble = document.createElement('div');
    bubble.className = 'agd-bubble agd-bubble-' + type;
    bubble.textContent = text;
    msgs.appendChild(bubble);
    msgs.scrollTop = msgs.scrollHeight;
    return bubble;
  }
  
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  function handleSend() {
    var input = document.getElementById('agd-input');
    var text = input.value.trim();
    if (!text) return;
    
    input.value = '';
    setInputDisabled(true);
    
    addBubble('user', text);
    showTyping(true);
    
    history.push({ role: 'user', content: text });
    
    // Stream the response
    streamResponse(text);
  }
  
  function setInputDisabled(disabled) {
    var input = document.getElementById('agd-input');
    var btn = document.getElementById('agd-send-btn');
    if (input) input.disabled = disabled;
    if (btn) btn.disabled = disabled;
  }
  
  function showTyping(show) {
    var typing = document.getElementById('agd-typing');
    if (typing) typing.style.display = show ? 'flex' : 'none';
  }
  
  function streamResponse(userMessage) {
    var msgs = document.getElementById('agd-messages');
    
    fetch(DOMAIN + '/api/widget-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: agentId,
        message: userMessage,
        sessionId: sessionId,
        history: history.slice(-10)
      })
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('API returned ' + response.status);
      }
      
      showTyping(false);
      
      // Create empty AI bubble to stream into
      var aiBubble = addBubble('ai', '');
      var fullText = '';
      
      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';
      
      function read() {
        reader.read().then(function(result) {
          if (result.done) {
            // Stream complete
            history.push({ role: 'assistant', content: fullText });
            setInputDisabled(false);
            document.getElementById('agd-input').focus();
            return;
          }
          
          buffer += decoder.decode(result.value, { stream: true });
          var lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete line
          
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line.startsWith('data: ')) continue;
            var raw = line.slice(6);
            if (raw === '[DONE]') continue;
            try {
              var data = JSON.parse(raw);
              if (data.token) {
                fullText += data.token;
                aiBubble.textContent = fullText;
                msgs.scrollTop = msgs.scrollHeight;
              }
              if (data.done) {
                history.push({ role: 'assistant', content: fullText });
                setInputDisabled(false);
                document.getElementById('agd-input').focus();
                return;
              }
            } catch(e) {}
          }
          
          read(); // continue reading
        });
      }
      
      read();
    })
    .catch(function(err) {
      console.error('[AgentDesk] Error:', err);
      showTyping(false);
      var errBubble = addBubble('ai', 'Sorry, I\'m having trouble right now. Please try again in a moment.');
      errBubble.classList.add('agd-bubble-error');
      setInputDisabled(false);
    });
  }

  function init() {
    console.log('[AgentDesk] Initializing widget for agent:', agentId);
    fetch(DOMAIN + '/api/agents/public/' + agentId)
      .then(function(res) {
        if (!res.ok) throw new Error('Agent not found: ' + res.status);
        return res.json();
      })
      .then(function(info) {
        console.log('[AgentDesk] Agent info loaded:', info.name);
        if (!info.isActive) {
          console.log('[AgentDesk] Agent is not active');
          return;
        }
        injectCSS();
        buildWidget(info);
      })
      .catch(function(err) {
        console.error('[AgentDesk] Failed to load agent:', err);
      });
  }

  // Start after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

})();
