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
      '#agd-launcher{position:fixed;bottom:24px;right:24px;width:60px;height:60px;',
      'border-radius:50%;background:#FF6B35;cursor:pointer;display:flex;',
      'align-items:center;justify-content:center;z-index:2147483647;',
      'box-shadow:0 4px 20px rgba(255,107,53,0.4);',
      'transition:transform 0.2s ease,box-shadow 0.2s ease;border:none;',
      'animation:agd-pop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards;}',
      
      '#agd-launcher:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(255,107,53,0.5);}',
      
      '@keyframes agd-pop{from{transform:scale(0);opacity:0;}to{transform:scale(1);opacity:1;}}',
      
      '#agd-panel{position:fixed;bottom:96px;right:24px;width:380px;height:560px;',
      'background:#ffffff;border-radius:16px;z-index:2147483646;',
      'box-shadow:0 20px 60px rgba(0,0,0,0.15),0 4px 20px rgba(0,0,0,0.1);',
      'display:flex;flex-direction:column;overflow:hidden;',
      'transition:opacity 0.25s ease,transform 0.25s ease;',
      'opacity:0;transform:translateY(20px) scale(0.95);pointer-events:none;}',
      
      '#agd-panel.agd-open{opacity:1;transform:translateY(0) scale(1);pointer-events:all;}',
      
      // Mobile fullscreen
      '@media(max-width:480px){#agd-panel{width:100%;height:100%;bottom:0;right:0;',
      'border-radius:0;top:0;left:0;}}',
      
      '#agd-header{background:#FF6B35;padding:16px 20px;display:flex;',
      'align-items:center;justify-content:space-between;flex-shrink:0;min-height:68px;}',
      
      '#agd-agent-avatar{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.25);',
      'display:flex;align-items:center;justify-content:center;font-weight:700;',
      'font-size:16px;color:#fff;margin-right:12px;flex-shrink:0;}',
      
      '#agd-agent-name{font-weight:700;font-size:15px;color:#fff;line-height:1.2;}',
      '#agd-agent-status{font-size:12px;color:rgba(255,255,255,0.85);margin-top:2px;}',
      
      '#agd-close-btn{background:rgba(255,255,255,0.2);border:none;color:#fff;',
      'width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;',
      'display:flex;align-items:center;justify-content:center;',
      'transition:background 0.15s;flex-shrink:0;}',
      '#agd-close-btn:hover{background:rgba(255,255,255,0.35);}',
      
      '#agd-messages{flex:1;overflow-y:auto;padding:16px;display:flex;',
      'flex-direction:column;gap:10px;scroll-behavior:smooth;}',
      
      '#agd-messages::-webkit-scrollbar{width:4px;}',
      '#agd-messages::-webkit-scrollbar-track{background:transparent;}',
      '#agd-messages::-webkit-scrollbar-thumb{background:#e0e0e0;border-radius:4px;}',
      
      '.agd-bubble{max-width:82%;padding:10px 14px;font-size:14px;line-height:1.5;',
      'word-wrap:break-word;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
      
      '.agd-bubble-user{background:#FF6B35;color:#fff;border-radius:16px 16px 4px 16px;',
      'align-self:flex-end;margin-left:18%;}',
      
      '.agd-bubble-ai{background:#F3F4F6;color:#111;border-radius:16px 16px 16px 4px;',
      'align-self:flex-start;margin-right:18%;}',
      
      '.agd-bubble-error{background:#FEF2F2;color:#991B1B;border-radius:16px;}',
      
      '.agd-bubble-time{font-size:10px;margin-top:4px;opacity:0.6;}',
      
      '#agd-typing{padding:12px 20px;display:flex;align-items:center;',
      'gap:4px;flex-shrink:0;}',
      
      '.agd-dot{width:8px;height:8px;border-radius:50%;background:#bbb;',
      'animation:agd-bounce 1.2s infinite ease-in-out;}',
      '.agd-dot:nth-child(2){animation-delay:0.2s;}',
      '.agd-dot:nth-child(3){animation-delay:0.4s;}',
      '@keyframes agd-bounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-8px);}}',
      
      '#agd-inputbar{padding:12px 16px;border-top:1px solid #f0f0f0;',
      'display:flex;align-items:center;gap:8px;flex-shrink:0;background:#fff;}',
      
      '#agd-input{flex:1;border:1.5px solid #e5e7eb;border-radius:24px;',
      'padding:10px 16px;font-size:16px;outline:none;',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
      'transition:border-color 0.15s;background:#fff;color:#111;}',
      '#agd-input:focus{border-color:#FF6B35;}',
      '#agd-input::placeholder{color:#9ca3af;}',
      '#agd-input:disabled{background:#f9f9f9;cursor:not-allowed;}',
      
      '#agd-send-btn{width:42px;height:42px;border-radius:50%;background:#FF6B35;',
      'border:none;cursor:pointer;display:flex;align-items:center;',
      'justify-content:center;flex-shrink:0;transition:background 0.15s,transform 0.1s;}',
      '#agd-send-btn:hover{background:#e85d2a;}',
      '#agd-send-btn:active{transform:scale(0.93);}',
      '#agd-send-btn:disabled{background:#f0a080;cursor:not-allowed;}',
      
      '#agd-powered{text-align:center;font-size:10px;color:#bbb;padding:6px;',
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif;flex-shrink:0;}',
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
    launcher.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
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
            '<div id="agd-agent-status">● Online</div>',
          '</div>',
        '</div>',
        '<button id="agd-close-btn" aria-label="Close chat">✕</button>',
      '</div>',
      // Messages
      '<div id="agd-messages"></div>',
      // Typing indicator (hidden by default)
      '<div id="agd-typing" style="display:none;">',
        '<div class="agd-dot"></div>',
        '<div class="agd-dot"></div>',
        '<div class="agd-dot"></div>',
      '</div>',
      // Input bar
      '<div id="agd-inputbar">',
        '<input id="agd-input" type="text" placeholder="Type a message..." autocomplete="off" />',
        '<button id="agd-send-btn" aria-label="Send">',
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
        '</button>',
      '</div>',
      '<div id="agd-powered">Powered by AgentDesk</div>',
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
