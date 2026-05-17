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
      
      '#agd-launcher{position:fixed;bottom:24px;right:24px;width:66px;height:66px;',
      'border-radius:22px;background:linear-gradient(135deg, #FF6B35, #FF8E64);cursor:pointer;display:flex;',
      'align-items:center;justify-content:center;z-index:2147483647;',
      'box-shadow:0 12px 32px rgba(255,107,53,0.3);',
      'transition:all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);border:none;',
      'animation:agd-pop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards;}',
      
      '#agd-launcher:hover{transform:translateY(-5px) scale(1.05);box-shadow:0 16px 40px rgba(255,107,53,0.4);}',
      '#agd-launcher:active{transform:scale(0.92);}',
      
      '.agd-pulse{position:absolute;-top:2px;-right:2px;width:16px;height:16px;background:#ef4444;',
      'border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 rgba(239,68,68,0.4);',
      'animation:agd-ping 2s ease-out infinite;}',
      '@keyframes agd-ping{0%{box-shadow:0 0 0 0 rgba(239,68,68,0.7);}70%{box-shadow:0 0 0 10px rgba(239,68,68,0);}100%{box-shadow:0 0 0 0 rgba(239,68,68,0);}}',
      
      '@keyframes agd-pop{from{transform:translateY(80px) scale(0.5);opacity:0;}to{transform:translateY(0) scale(1);opacity:1;}}',
      
      '#agd-panel{position:fixed;bottom:108px;right:24px;width:420px;height:680px;',
      'background:rgba(255,255,255,0.96);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);',
      'border-radius:32px;z-index:2147483646;border:1px solid rgba(0,0,0,0.05);',
      'box-shadow:0 32px 80px rgba(0,0,0,0.12),0 8px 24px rgba(0,0,0,0.04);',
      'display:flex;flex-direction:column;overflow:hidden;font-family:"Inter",-apple-system,sans-serif;',
      'transition:all 0.5s cubic-bezier(0.19, 1, 0.22, 1);',
      'opacity:0;transform:translateY(40px) scale(0.95);pointer-events:none;transform-origin:bottom right;}',
      
      '#agd-panel.agd-open{opacity:1;transform:translateY(0) scale(1);pointer-events:all;}',
      
      '@media(max-width:480px){',
        '#agd-panel{width:100% !important;height:100% !important;height:100dvh !important;bottom:0 !important;right:0 !important;',
        'border-radius:0 !important;top:0 !important;left:0 !important;border:none !important;}',
        '#agd-inputbar-container{padding-bottom:calc(20px + env(safe-area-inset-bottom)) !important;}',
        '#agd-launcher{bottom:20px !important;right:20px !important;width:60px !important;height:60px !important;}',
      '}',
      
      '#agd-header{background:#fff;padding:24px 28px;display:flex;',
      'align-items:center;justify-content:space-between;flex-shrink:0;',
      'border-bottom:1px solid rgba(0,0,0,0.03);position:relative;}',
      '#agd-header::after{content:"";position:absolute;bottom:-1px;left:0;width:100%;height:2px;background:linear-gradient(90deg, #FF6B35, transparent);opacity:0.6;}',
      
      '#agd-agent-avatar{width:48px;height:48px;border-radius:16px;background:#f8fafc;',
      'display:flex;align-items:center;justify-content:center;font-weight:800;',
      'font-size:20px;color:#FF6B35;margin-right:16px;flex-shrink:0;border:1.5px solid #f1f5f9;}',
      
      '#agd-agent-name{font-weight:800;font-size:18px;color:#0f172a;line-height:1.1;letter-spacing:-0.02em;}',
      '#agd-agent-status{font-size:12px;color:#64748b;margin-top:4px;display:flex;align-items:center;gap:5px;font-weight:600;}',
      '.agd-status-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 10px rgba(34,197,94,0.4);}',
      
      '#agd-close-btn{background:#f1f5f9;border:none;color:#64748b;',
      'width:36px;height:36px;border-radius:12px;cursor:pointer;',
      'display:flex;align-items:center;justify-content:center;',
      'transition:all 0.3s;flex-shrink:0;}',
      '#agd-close-btn:hover{background:#e2e8f0;color:#0f172a;transform:rotate(90deg);}',
      
      '#agd-messages{flex:1;overflow-y:auto;padding:28px;display:flex;',
      'flex-direction:column;gap:20px;scroll-behavior:smooth;background:linear-gradient(180deg, rgba(255,255,255,0), rgba(248,250,252,0.5));}',
      
      '#agd-messages::-webkit-scrollbar{width:6px;}',
      '#agd-messages::-webkit-scrollbar-track{background:transparent;}',
      '#agd-messages::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.06);border-radius:10px;}',
      
      '.agd-bubble{max-width:88%;padding:14px 18px;font-size:15px;line-height:1.6;',
      'word-wrap:break-word;box-shadow:0 4px 12px rgba(0,0,0,0.02);transition:all 0.3s;}',
      
      '.agd-bubble-user{background:linear-gradient(135deg, #FF6B35, #FF8E64);color:#fff;border-radius:24px 24px 4px 24px;',
      'align-self:flex-end;margin-left:10%;box-shadow:0 8px 20px rgba(255,107,53,0.2);font-weight:500;}',
      
      '.agd-bubble-ai{background:#fff;color:#334155;border-radius:24px 24px 24px 4px;',
      'align-self:flex-start;margin-right:10%;border:1px solid rgba(0,0,0,0.04);}',
      
      '.agd-bubble-error{background:#fff1f2;color:#9f1239;border:1px solid #fda4af;border-radius:16px;font-size:13px;}',
      
      '#agd-typing{padding:0 28px 20px;display:flex;align-items:center;gap:8px;flex-shrink:0;}',
      '.agd-typing-bubble{background:rgba(255,255,255,0.8);padding:14px 20px;border-radius:20px;display:flex;gap:5px;border:1px solid rgba(0,0,0,0.03);}',
      '.agd-dot{width:7px;height:7px;border-radius:50%;background:#cbd5e1;',
      'animation:agd-bounce 1.4s infinite ease-in-out;}',
      '.agd-dot:nth-child(2){animation-delay:0.2s;}',
      '.agd-dot:nth-child(3){animation-delay:0.4s;}',
      '@keyframes agd-bounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-6px);}}',
      
      '#agd-inputbar-container{padding:20px 28px 24px;background:#fff;border-top:1px solid rgba(0,0,0,0.03);flex-shrink:0;}',
      '#agd-inputbar{display:flex;align-items:center;gap:14px;background:#f8fafc;padding:6px;border-radius:22px;border:1.5px solid #f1f5f9;transition:all 0.3s;}',
      '#agd-inputbar:focus-within{border-color:#FF6B35;background:#fff;box-shadow:0 0 0 4px rgba(255,107,53,0.08);}',
      
      '#agd-input{flex:1;border:none;background:transparent;',
      'padding:10px 14px;font-size:15px;outline:none;color:#1e293b;font-weight:500;}',
      '#agd-input::placeholder{color:#94a3b8;}',
      
      '#agd-send-btn{width:48px;height:48px;border-radius:16px;background:linear-gradient(135deg, #FF6B35, #FF8E64);',
      'border:none;cursor:pointer;display:flex;align-items:center;',
      'justify-content:center;flex-shrink:0;transition:all 0.3s;box-shadow:0 4px 12px rgba(255,107,53,0.2);}',
      '#agd-send-btn:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(255,107,53,0.3);}',
      '#agd-send-btn:active{transform:translateY(0) scale(0.95);}',
      '#agd-send-btn:disabled{background:#e2e8f0;cursor:not-allowed;box-shadow:none;}',
      
      '#agd-powered{text-align:center;font-size:11px;color:#94a3b8;padding:12px 0 0;font-weight:600;letter-spacing:0.02em;font-family:"Inter",sans-serif;}',
      '#agd-powered a{color:#64748b;text-decoration:none;}',
      '#agd-powered span{color:#FF6B35;font-weight:800;letter-spacing:-0.01em;}',
    ].join('');
    
    var style = document.createElement('style');
    style.id = 'agd-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function checkEscalationNeeded(aiResponse, userMessage, historyLength) {
    // Detect if escalation should be suggested
    var triggerPhrases = [
      'i don\'t have that information',
      'i\'m not sure',
      'please contact support',
      'cannot help with',
      'outside my knowledge',
      'i don\'t know',
      'unable to assist'
    ]
    
    var frustrationPhrases = [
      'this is useless', 'not helpful', 'terrible', 'awful',
      'speak to human', 'talk to person', 'real person',
      'this doesn\'t work', 'wrong answer', 'that\'s wrong',
      'you\'re wrong', 'not what i asked', 'human please'
    ]
    
    var aiLower = aiResponse.toLowerCase()
    var userLower = userMessage.toLowerCase()
    
    var aiTriggered = triggerPhrases.some(p => aiLower.includes(p))
    var userFrustrated = frustrationPhrases.some(p => userLower.includes(p))
    
    // Also trigger if user has asked 4+ messages with no resolution (history length >= 8)
    var longConversation = historyLength >= 8
    
    return aiTriggered || userFrustrated || longConversation
  }

  function showEscalationSuggestion() {
    // Don't show if already shown in this session
    if (sessionStorage.getItem('agd_esc_shown_' + agentId)) return
    sessionStorage.setItem('agd_esc_shown_' + agentId, '1')
    
    var msgs = document.getElementById('agd-messages')
    
    // Create a special suggestion bubble
    var suggestionEl = document.createElement('div')
    suggestionEl.id = 'agd-escalation-suggestion'
    suggestionEl.style.cssText = [
      'margin:8px 0;padding:12px 14px;',
      'background:var(--agd-theme, #FF6B35);',
      'opacity:0.08;',
      'border-radius:12px;',
      'border:1.5px solid var(--agd-theme, #FF6B35);',
      'font-size:13px;'
    ].join('')
    
    // Use proper contrast colors
    suggestionEl.style.background = '#FFF3EF'
    suggestionEl.style.borderColor = '#FF6B35'
    suggestionEl.style.color = '#7C2D00'
    
    suggestionEl.innerHTML = [
      '<div style="font-weight:500;margin-bottom:8px;">',
      '🙋 Need more help?',
      '</div>',
      '<div style="font-size:12px;margin-bottom:10px;opacity:0.85;">',
      'It looks like I might not have fully resolved your issue. ',
      'Would you like to create a support ticket for a human agent?',
      '</div>',
      '<div style="display:flex;gap:8px;">',
      '<button id="agd-esc-yes" style="',
      'background:#FF6B35;color:white;border:none;padding:7px 14px;',
      'border-radius:20px;font-size:12px;cursor:pointer;font-weight:500;">',
      'Create a Ticket',
      '</button>',
      '<button id="agd-esc-no" style="',
      'background:transparent;color:#7C2D00;border:1.5px solid #FF6B35;',
      'padding:7px 14px;border-radius:20px;font-size:12px;cursor:pointer;">',
      'No thanks',
      '</button>',
      '</div>'
    ].join('')
    
    msgs.appendChild(suggestionEl)
    msgs.scrollTop = msgs.scrollHeight
    
    document.getElementById('agd-esc-yes').onclick = function() {
      suggestionEl.remove()
      showTicketForm()
    }
    document.getElementById('agd-esc-no').onclick = function() {
      suggestionEl.remove()
    }
  }

  function showTicketForm() {
    var msgs = document.getElementById('agd-messages')
    var inputBar = document.getElementById('agd-inputbar')
    
    // Hide normal input bar
    inputBar.style.display = 'none'
    
    // Build last AI message as subject hint
    var bubbles = msgs.querySelectorAll('.agd-bubble-ai')
    var lastAiText = bubbles.length > 0 
      ? bubbles[bubbles.length-1].textContent.slice(0,80) + '...'
      : 'Support request from chat'
    
    // Inject form as a bubble
    var formEl = document.createElement('div')
    formEl.id = 'agd-ticket-form'
    formEl.style.cssText = [
      'background:#F8F8F8;border:1.5px solid #e5e7eb;',
      'border-radius:14px;padding:16px;margin:8px 0;',
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif;'
    ].join('')
    
    formEl.innerHTML = [
      '<div style="font-weight:600;font-size:14px;color:#111;margin-bottom:4px;">',
      'Create a Support Ticket',
      '</div>',
      '<div style="font-size:12px;color:#6b7280;margin-bottom:14px;">',
      'A human agent will follow up via email.',
      '</div>',
      
      // Name field
      '<div style="margin-bottom:10px;">',
      '<label style="font-size:12px;font-weight:500;color:#374151;display:block;margin-bottom:4px;">',
      'Your name</label>',
      '<input id="agd-ticket-name" type="text" placeholder="John Smith"',
      ' style="width:100%;border:1.5px solid #e5e7eb;border-radius:8px;',
      'padding:8px 12px;font-size:14px;outline:none;box-sizing:border-box;',
      'font-family:inherit;background:white;color:#111;">',
      '</div>',
      
      // Email field
      '<div style="margin-bottom:10px;">',
      '<label style="font-size:12px;font-weight:500;color:#374151;display:block;margin-bottom:4px;">',
      'Email address *</label>',
      '<input id="agd-ticket-email" type="email" placeholder="you@example.com"',
      ' style="width:100%;border:1.5px solid #e5e7eb;border-radius:8px;',
      'padding:8px 12px;font-size:14px;outline:none;box-sizing:border-box;',
      'font-family:inherit;background:white;color:#111;">',
      '</div>',
      
      // Description field
      '<div style="margin-bottom:14px;">',
      '<label style="font-size:12px;font-weight:500;color:#374151;display:block;margin-bottom:4px;">',
      'Describe your issue</label>',
      '<textarea id="agd-ticket-desc" rows="3" placeholder="What do you need help with?"',
      ' style="width:100%;border:1.5px solid #e5e7eb;border-radius:8px;',
      'padding:8px 12px;font-size:14px;outline:none;resize:none;box-sizing:border-box;',
      'font-family:inherit;background:white;color:#111;"></textarea>',
      '</div>',
      
      // Error message
      '<div id="agd-ticket-error" style="color:#DC2626;font-size:12px;',
      'margin-bottom:8px;display:none;"></div>',
      
      // Buttons
      '<div style="display:flex;gap:8px;">',
      '<button id="agd-ticket-submit"',
      ' style="flex:1;background:#FF6B35;color:white;border:none;padding:10px;',
      'border-radius:8px;font-size:14px;cursor:pointer;font-weight:500;',
      'font-family:inherit;transition:background 0.15s;">',
      'Submit Ticket',
      '</button>',
      '<button id="agd-ticket-cancel"',
      ' style="background:transparent;color:#6b7280;border:1.5px solid #e5e7eb;',
      'padding:10px 14px;border-radius:8px;font-size:14px;cursor:pointer;',
      'font-family:inherit;">',
      'Cancel',
      '</button>',
      '</div>'
    ].join('')
    
    msgs.appendChild(formEl)
    msgs.scrollTop = msgs.scrollHeight
    
    // Focus email field
    setTimeout(function() {
      var emailInput = document.getElementById('agd-ticket-email');
      if (emailInput) emailInput.focus()
    }, 100)
    
    // Focus border on inputs
    formEl.querySelectorAll('input, textarea').forEach(function(el) {
      el.addEventListener('focus', function() {
        this.style.borderColor = '#FF6B35'
      })
      el.addEventListener('blur', function() {
        this.style.borderColor = '#e5e7eb'
      })
    })
    
    document.getElementById('agd-ticket-cancel').onclick = function() {
      formEl.remove()
      inputBar.style.display = 'flex'
    }
    
    document.getElementById('agd-ticket-submit').onclick = function() {
      submitTicket(lastAiText)
    }
  }

  function submitTicket(subjectHint) {
    var name = document.getElementById('agd-ticket-name').value.trim()
    var email = document.getElementById('agd-ticket-email').value.trim()
    var desc = document.getElementById('agd-ticket-desc').value.trim()
    var errorEl = document.getElementById('agd-ticket-error')
    var submitBtn = document.getElementById('agd-ticket-submit')
    
    // Validate
    if (!email || !email.includes('@')) {
      errorEl.textContent = 'Please enter a valid email address.'
      errorEl.style.display = 'block'
      return
    }
    if (!desc) {
      errorEl.textContent = 'Please describe your issue.'
      errorEl.style.display = 'block'
      return
    }
    errorEl.style.display = 'none'
    
    // Loading state
    submitBtn.textContent = 'Submitting...'
    submitBtn.disabled = true
    submitBtn.style.background = '#f0a080'
    
    fetch(DOMAIN + '/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: agentId,
        sessionId: sessionId,
        visitorName: name || 'Anonymous',
        visitorEmail: email,
        subject: subjectHint || 'Support request',
        description: desc,
        conversationHistory: history.slice(-20)
      })
    })
    .then(function(res) {
      if (!res.ok) throw new Error('Failed to submit')
      return res.json()
    })
    .then(function(data) {
      // Remove form
      var formEl = document.getElementById('agd-ticket-form')
      if (formEl) formEl.remove()
      
      // Show input bar again
      var inputBar = document.getElementById('agd-inputbar')
      if (inputBar) inputBar.style.display = 'flex'
      
      // Show success message as AI bubble
      var msgs = document.getElementById('agd-messages')
      var successEl = document.createElement('div')
      successEl.className = 'agd-bubble agd-bubble-ai'
      successEl.style.background = '#F0FDF4'
      successEl.style.color = '#166534'
      successEl.style.border = '1.5px solid #BBF7D0'
      successEl.innerHTML = [
        '<div style="font-weight:600;margin-bottom:4px;">✓ Ticket created!</div>',
        '<div style="font-size:13px;opacity:0.85;">',
        'We\'ve received your request and will follow up at <strong>' + email + '</strong> shortly.',
        '</div>'
      ].join('')
      msgs.appendChild(successEl)
      msgs.scrollTop = msgs.scrollHeight
    })
    .catch(function() {
      var submitBtn = document.getElementById('agd-ticket-submit')
      if (submitBtn) {
        submitBtn.textContent = 'Submit Ticket'
        submitBtn.disabled = false
        submitBtn.style.background = '#FF6B35'
      }
      var errorEl = document.getElementById('agd-ticket-error')
      if (errorEl) {
        errorEl.textContent = 'Something went wrong. Please try again.'
        errorEl.style.display = 'block'
      }
    })
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
      '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.4876 3.36093 14.891 4 16.1272L3 21L7.8728 20C9.10896 20.6391 10.5124 21 12 21Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
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
            '<div id="agd-agent-status"><div class="agd-status-dot"></div> Active Now</div>',
          '</div>',
        '</div>',
        // Human Escalation button
        '<button id="agd-human-btn" title="Create support ticket" style="background:rgba(0,0,0,0.05);border:none;color:' + color + ';width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;margin-right:6px;transition:background 0.15s;">👤</button>',
        // Close button
        '<button id="agd-close-btn" aria-label="Close chat">',
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
        '</button>',
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
    document.getElementById('agd-human-btn').onclick = showTicketForm;
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
        var inputEl = document.getElementById('agd-input');
        if (inputEl) inputEl.focus();
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
            var inputEl = document.getElementById('agd-input');
            if (inputEl) inputEl.focus();
            
            // Check escalation
            if (checkEscalationNeeded(fullText, userMessage, history.length)) {
              showEscalationSuggestion();
            }
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
                var inputEl = document.getElementById('agd-input');
                if (inputEl) inputEl.focus();
                
                // Check escalation
                if (checkEscalationNeeded(fullText, userMessage, history.length)) {
                  showEscalationSuggestion();
                }
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
