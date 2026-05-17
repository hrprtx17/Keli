(function() {
  'use strict';

  var DOMAIN = 'https://agentdeskk.netlify.app';
  var agentId = null;
  var sessionId = null;
  var chatHistory = [];
  var isOpen = false;
  var agentData = null;

  // Capture script tag SYNCHRONOUSLY before anything async
  var currentScript = document.currentScript;
  if (!currentScript) {
    var scripts = document.querySelectorAll('script[data-agent-id]');
    if (scripts && scripts.length > 0) {
      currentScript = scripts[scripts.length - 1];
    }
  }

  if (!currentScript) {
    console.error('[AgentDesk] Could not find script tag');
    return;
  }

  agentId = currentScript.getAttribute('data-agent-id');
  if (!agentId || agentId === 'TEST_AGENT_ID_REPLACE_ME') {
    console.error('[AgentDesk] Invalid or missing data-agent-id:', agentId);
    return;
  }

  // Session ID
  try {
    sessionId = sessionStorage.getItem('agd_' + agentId);
    if (!sessionId) {
      sessionId = 'agd_' + Math.random().toString(36).slice(2) + Date.now();
      sessionStorage.setItem('agd_' + agentId, sessionId);
    }
  } catch(e) {
    sessionId = 'agd_' + Math.random().toString(36).slice(2);
  }

  // Safe helper — never crashes even if element missing
  function el(id) {
    return document.getElementById(id);
  }

  function safeStyle(id, prop, val) {
    var element = el(id);
    if (element && element.style) {
      element.style[prop] = val;
    }
  }

  // Inject CSS
  function injectStyles(color) {
    if (el('agd-css')) return;
    var c = color || '#FF6B35';
    var css = '\
      #agd-launcher{\
        position:fixed;bottom:24px;right:24px;width:60px;height:60px;\
        border-radius:50%;background:' + c + ';cursor:pointer;\
        display:flex;align-items:center;justify-content:center;\
        z-index:2147483647;border:none;box-shadow:0 4px 16px rgba(0,0,0,0.2);\
        transition:transform 0.2s ease;opacity:0;\
        animation:agd-fadein 0.4s ease 0.2s forwards;\
      }\
      #agd-launcher:hover{transform:scale(1.1);}\
      @keyframes agd-fadein{to{opacity:1;}}\
      #agd-panel{\
        position:fixed;bottom:96px;right:24px;width:380px;height:560px;\
        background:#fff;border-radius:16px;z-index:2147483646;\
        box-shadow:0 8px 40px rgba(0,0,0,0.15);\
        display:flex;flex-direction:column;overflow:hidden;\
        opacity:0;transform:translateY(16px) scale(0.97);\
        pointer-events:none;\
        transition:opacity 0.2s ease,transform 0.2s ease;\
      }\
      #agd-panel.agd-open{\
        opacity:1;transform:translateY(0) scale(1);pointer-events:all;\
      }\
      @media(max-width:480px){\
        #agd-panel{width:100%;height:100%;bottom:0;right:0;border-radius:0;top:0;left:0;}\
      }\
      #agd-header{\
        background:' + c + ';padding:14px 16px;\
        display:flex;align-items:center;justify-content:space-between;\
        flex-shrink:0;\
      }\
      #agd-avatar{\
        width:36px;height:36px;border-radius:50%;\
        background:rgba(255,255,255,0.25);\
        display:flex;align-items:center;justify-content:center;\
        color:#fff;font-weight:700;font-size:15px;margin-right:10px;flex-shrink:0;\
      }\
      #agd-name{color:#fff;font-weight:600;font-size:14px;}\
      #agd-status{color:rgba(255,255,255,0.8);font-size:11px;margin-top:1px;}\
      .agd-hbtn{\
        background:rgba(255,255,255,0.2);border:none;color:#fff;\
        width:30px;height:30px;border-radius:50%;cursor:pointer;\
        font-size:16px;display:flex;align-items:center;justify-content:center;\
        transition:background 0.15s;margin-left:6px;\
      }\
      .agd-hbtn:hover{background:rgba(255,255,255,0.35);}\
      #agd-msgs{\
        flex:1;overflow-y:auto;padding:14px;\
        display:flex;flex-direction:column;gap:8px;\
      }\
      #agd-msgs::-webkit-scrollbar{width:4px;}\
      #agd-msgs::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px;}\
      .agd-bbl{\
        max-width:82%;padding:10px 13px;font-size:14px;\
        line-height:1.5;word-break:break-word;\
        font-family:-apple-system,BlinkMacSystemFont,sans-serif;\
        border-radius:16px;\
      }\
      .agd-usr{background:' + c + ';color:#fff;align-self:flex-end;\
               border-radius:16px 16px 4px 16px;margin-left:18%;}\
      .agd-ai{background:#F3F4F6;color:#111;align-self:flex-start;\
              border-radius:16px 16px 16px 4px;margin-right:18%;}\
      .agd-err{background:#FEF2F2;color:#991B1B;align-self:flex-start;\
               border-radius:16px;margin-right:18%;}\
      #agd-typing{\
        padding:10px 16px;display:none;align-items:center;gap:4px;flex-shrink:0;\
      }\
      .agd-dot{\
        width:7px;height:7px;border-radius:50%;background:#ccc;\
        animation:agd-bounce 1.2s infinite ease-in-out;\
      }\
      .agd-dot:nth-child(2){animation-delay:0.2s;}\
      .agd-dot:nth-child(3){animation-delay:0.4s;}\
      @keyframes agd-bounce{\
        0%,60%,100%{transform:translateY(0)}\
        30%{transform:translateY(-6px)}\
      }\
      #agd-bar{\
        padding:10px 12px;border-top:1px solid #f0f0f0;\
        display:flex;align-items:center;gap:8px;flex-shrink:0;\
      }\
      #agd-input{\
        flex:1;border:1.5px solid #e5e7eb;border-radius:22px;\
        padding:9px 14px;font-size:16px;outline:none;background:#fff;\
        font-family:-apple-system,BlinkMacSystemFont,sans-serif;\
        transition:border-color 0.15s;color:#111;\
      }\
      #agd-input:focus{border-color:' + c + ';}\
      #agd-send{\
        width:38px;height:38px;border-radius:50%;background:' + c + ';\
        border:none;cursor:pointer;display:flex;align-items:center;\
        justify-content:center;flex-shrink:0;transition:opacity 0.15s;\
      }\
      #agd-send:hover{opacity:0.85;}\
      #agd-send:disabled{opacity:0.5;cursor:not-allowed;}\
      #agd-powered{\
        text-align:center;font-size:10px;color:#bbb;padding:5px;\
        font-family:-apple-system,BlinkMacSystemFont,sans-serif;flex-shrink:0;\
      }\
    ';
    var style = document.createElement('style');
    if (style) {
      style.id = 'agd-css';
      style.textContent = css;
      var target = document.head || document.documentElement || document.body;
      if (target) {
        target.appendChild(style);
      }
    }
  }

  // Build widget HTML and inject into body
  function buildWidget() {
    if (el('agd-launcher')) return; // already built

    var color = (agentData && agentData.themeColor) || '#FF6B35';
    var name = (agentData && agentData.name) || 'Support';
    var letter = name.charAt(0).toUpperCase();

    // Launcher
    var launcher = document.createElement('button');
    if (launcher) {
      launcher.id = 'agd-launcher';
      launcher.setAttribute('aria-label', 'Open chat');
      launcher.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
      launcher.onclick = togglePanel;
    }

    // Panel
    var panel = document.createElement('div');
    if (panel) {
      panel.id = 'agd-panel';
      panel.innerHTML = [
        '<div id="agd-header">',
          '<div id="agd-avatar">' + letter + '</div>',
          '<div style="flex:1;">',
            '<div id="agd-name">' + name.replace(/</g,'&lt;') + '</div>',
            '<div id="agd-status">● Online</div>',
          '</div>',
          '<button class="agd-hbtn" id="agd-human-btn" title="Talk to human">👤</button>',
          '<button class="agd-hbtn" id="agd-close-btn" aria-label="Close">✕</button>',
        '</div>',
        '<div id="agd-msgs"></div>',
        '<div id="agd-typing">',
          '<div class="agd-dot"></div>',
          '<div class="agd-dot"></div>',
          '<div class="agd-dot"></div>',
        '</div>',
        '<div id="agd-bar">',
          '<input id="agd-input" type="text" placeholder="Type a message..." autocomplete="off"/>',
          '<button id="agd-send" aria-label="Send">',
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
          '</button>',
        '</div>',
        '<div id="agd-powered">Powered by AgentDesk</div>',
      ].join('');
    }

    if (document.body) {
      if (launcher) document.body.appendChild(launcher);
      if (panel) document.body.appendChild(panel);
    }

    // Wire up events AFTER elements are in DOM
    var closeBtn = el('agd-close-btn');
    var humanBtn = el('agd-human-btn');
    var sendBtn  = el('agd-send');
    var input    = el('agd-input');

    if (closeBtn) closeBtn.onclick = togglePanel;
    if (humanBtn) humanBtn.onclick = showTicketForm;
    if (sendBtn)  sendBtn.onclick  = handleSend;
    if (input) {
      input.onkeydown = function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      };
    }
  }

  // Toggle panel open/close
  function togglePanel() {
    isOpen = !isOpen;
    var panel    = el('agd-panel');
    var launcher = el('agd-launcher');
    if (!panel || !launcher) return;

    if (isOpen) {
      panel.classList.add('agd-open');
      if (launcher.style) {
        launcher.style.display = 'none';
      }
      // Show welcome message only once
      var msgs = el('agd-msgs');
      if (msgs && msgs.children && msgs.children.length === 0 && agentData) {
        addBubble('ai', agentData.welcomeMessage || 'Hi! 👋 How can I help you today?');
      }
      setTimeout(function() {
        var input = el('agd-input');
        if (input) input.focus();
      }, 250);
    } else {
      panel.classList.remove('agd-open');
      if (launcher.style) {
        launcher.style.display = '';
      }
    }
  }

  // Add a chat bubble safely
  function addBubble(type, text) {
    var msgs = el('agd-msgs');
    if (!msgs) return null;
    var b = document.createElement('div');
    if (b) {
      b.className = 'agd-bbl agd-' + type;
      b.textContent = text;
      msgs.appendChild(b);
      msgs.scrollTop = msgs.scrollHeight;
    }
    return b;
  }

  // Set input/send disabled state safely
  function setDisabled(disabled) {
    var input = el('agd-input');
    var send  = el('agd-send');
    if (input) input.disabled = disabled;
    if (send)  send.disabled  = disabled;
  }

  // Show/hide typing indicator safely
  function showTyping(show) {
    var typing = el('agd-typing');
    if (typing && typing.style) {
      typing.style.display = show ? 'flex' : 'none';
    }
  }

  // Handle send
  function handleSend() {
    var input = el('agd-input');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    addBubble('usr', text);
    setDisabled(true);
    showTyping(true);
    chatHistory.push({ role: 'user', content: text });
    streamResponse(text);
  }

  // Stream response from API
  function streamResponse(text) {
    fetch(DOMAIN + '/api/widget-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: agentId,
        message: text,
        sessionId: sessionId,
        history: chatHistory.slice(-10)
      })
    })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      showTyping(false);

      var bubble = addBubble('ai', '');
      var fullText = '';
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buf = '';

      function pump() {
        reader.read().then(function(result) {
          if (result.done) {
            chatHistory.push({ role: 'assistant', content: fullText });
            setDisabled(false);
            var input = el('agd-input');
            if (input) input.focus();
            // Check if escalation needed
            if (shouldSuggestEscalation(fullText, text)) {
              showEscalationBanner();
            }
            return;
          }
          buf += decoder.decode(result.value, { stream: true });
          var lines = buf.split('\n');
          buf = lines.pop();
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line.startsWith('data: ')) continue;
            try {
              var data = JSON.parse(line.slice(6));
              if (data.token && bubble) {
                fullText += data.token;
                bubble.textContent = fullText;
                var msgs = el('agd-msgs');
                if (msgs) msgs.scrollTop = msgs.scrollHeight;
              }
            } catch(e) {}
          }
          pump();
        }).catch(function() {
          showTyping(false);
          addBubble('err', 'Sorry, something went wrong. Please try again.');
          setDisabled(false);
        });
      }
      pump();
    })
    .catch(function(err) {
      console.error('[AgentDesk]', err);
      showTyping(false);
      addBubble('err', 'Could not connect. Please try again.');
      setDisabled(false);
    });
  }

  // Escalation detection
  function shouldSuggestEscalation(aiReply, userMsg) {
    try {
      var shown = sessionStorage.getItem('agd_esc_' + agentId);
      if (shown) return false;
    } catch(e) {}

    var aiL = (aiReply || '').toLowerCase();
    var uL  = (userMsg  || '').toLowerCase();
    var aiTriggers  = ["don't have that","not sure","contact support","cannot help","don't know","unable to assist","outside my knowledge"];
    var userTriggers = ["useless","not helpful","real person","speak to human","talk to human","you're wrong","wrong answer","terrible"];

    var triggered = aiTriggers.some(function(p){ return aiL.indexOf(p) > -1; }) ||
                    userTriggers.some(function(p){ return uL.indexOf(p) > -1; }) ||
                    chatHistory.length >= 10;
    return triggered;
  }

  function showEscalationBanner() {
    try { sessionStorage.setItem('agd_esc_' + agentId, '1'); } catch(e) {}
    var msgs = el('agd-msgs');
    if (!msgs) return;

    var banner = document.createElement('div');
    if (banner) {
      if (banner.style) {
        banner.style.cssText = 'background:#FFF3EF;border:1.5px solid #FF6B35;border-radius:12px;padding:12px 14px;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;';
      }
    }

    var title = document.createElement('div');
    if (title) {
      if (title.style) {
        title.style.cssText = 'font-weight:600;color:#7C2D00;margin-bottom:6px;';
      }
      title.textContent = '🙋 Need more help?';
    }

    var msg = document.createElement('div');
    if (msg) {
      if (msg.style) {
        msg.style.cssText = 'color:#92400E;font-size:12px;margin-bottom:10px;line-height:1.4;';
      }
      msg.textContent = 'Would you like to create a support ticket for a human agent?';
    }

    var yesBtn = document.createElement('button');
    if (yesBtn) {
      if (yesBtn.style) {
        yesBtn.style.cssText = 'background:#FF6B35;color:white;border:none;padding:7px 14px;border-radius:20px;font-size:12px;cursor:pointer;font-weight:500;margin-right:8px;';
      }
      yesBtn.textContent = 'Create a Ticket';
      yesBtn.onclick = function() {
        if (banner) banner.remove();
        showTicketForm();
      };
    }

    var noBtn = document.createElement('button');
    if (noBtn) {
      if (noBtn.style) {
        noBtn.style.cssText = 'background:transparent;color:#7C2D00;border:1.5px solid #FF6B35;padding:7px 14px;border-radius:20px;font-size:12px;cursor:pointer;';
      }
      noBtn.textContent = 'No thanks';
      noBtn.onclick = function() {
        if (banner) banner.remove();
      };
    }

    if (banner) {
      if (title) banner.appendChild(title);
      if (msg) banner.appendChild(msg);
      if (yesBtn) banner.appendChild(yesBtn);
      if (noBtn) banner.appendChild(noBtn);
      msgs.appendChild(banner);
      msgs.scrollTop = msgs.scrollHeight;
    }
  }

  // Ticket form
  function showTicketForm() {
    var bar  = el('agd-bar');
    var msgs = el('agd-msgs');
    if (!msgs) return;
    if (bar && bar.style) {
      bar.style.display = 'none';
    }

    var lastAI = '';
    var bubbles = msgs.querySelectorAll('.agd-ai');
    if (bubbles && bubbles.length > 0) {
      var lastBubble = bubbles[bubbles.length - 1];
      if (lastBubble) {
        lastAI = (lastBubble.textContent || '').slice(0, 80);
      }
    }

    var form = document.createElement('div');
    if (form) {
      form.id = 'agd-tform';
      if (form.style) {
        form.style.cssText = 'background:#F9F9F9;border:1.5px solid #e5e7eb;border-radius:14px;padding:16px;margin:8px 0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;';
      }
    }

    function row(id, label, type, ph) {
      return '<div style="margin-bottom:10px;">' +
        '<label style="font-size:12px;font-weight:500;color:#374151;display:block;margin-bottom:3px;">' + label + '</label>' +
        (type === 'textarea'
          ? '<textarea id="' + id + '" rows="3" placeholder="' + ph + '" style="width:100%;border:1.5px solid #e5e7eb;border-radius:8px;padding:8px 12px;font-size:14px;outline:none;resize:none;box-sizing:border-box;font-family:inherit;background:white;color:#111;"></textarea>'
          : '<input id="' + id + '" type="' + type + '" placeholder="' + ph + '" style="width:100%;border:1.5px solid #e5e7eb;border-radius:8px;padding:8px 12px;font-size:14px;outline:none;box-sizing:border-box;font-family:inherit;background:white;color:#111;">'
        ) + '</div>';
    }

    if (form) {
      form.innerHTML = [
        '<div style="font-weight:600;font-size:14px;color:#111;margin-bottom:3px;">Create a Support Ticket</div>',
        '<div style="font-size:12px;color:#6b7280;margin-bottom:12px;">A human agent will follow up via email.</div>',
        row('agd-tname',  'Your name',     'text',     'John Smith'),
        row('agd-temail', 'Email address', 'email',    'you@example.com'),
        row('agd-tdesc',  'Describe your issue', 'textarea', 'What do you need help with?'),
        '<div id="agd-terr" style="color:#DC2626;font-size:12px;margin-bottom:8px;display:none;"></div>',
        '<div style="display:flex;gap:8px;">',
          '<button id="agd-tsub" style="flex:1;background:#FF6B35;color:white;border:none;padding:10px;border-radius:8px;font-size:14px;cursor:pointer;font-weight:500;font-family:inherit;">Submit Ticket</button>',
          '<button id="agd-tcan" style="background:transparent;color:#6b7280;border:1.5px solid #e5e7eb;padding:10px 14px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit;">Cancel</button>',
        '</div>'
      ].join('');

      msgs.appendChild(form);
      msgs.scrollTop = msgs.scrollHeight;
    }

    var subBtn = el('agd-tsub');
    var canBtn = el('agd-tcan');

    setTimeout(function(){
      var emailIn = el('agd-temail');
      if (emailIn) {
        emailIn.focus();
      }
    }, 100);

    if (canBtn) {
      canBtn.onclick = function() {
        var f = el('agd-tform');
        if (f) f.remove();
        var bar = el('agd-bar');
        if (bar && bar.style) {
          bar.style.display = 'flex';
        }
      };
    }

    if (subBtn) {
      subBtn.onclick = function() {
        var nameEl  = el('agd-tname');
        var emailEl = el('agd-temail');
        var descEl  = el('agd-tdesc');
        var errEl   = el('agd-terr');
        var subEl   = el('agd-tsub');

        var name  = nameEl  ? nameEl.value.trim()  : '';
        var email = emailEl ? emailEl.value.trim()  : '';
        var desc  = descEl  ? descEl.value.trim()   : '';

        if (!email || email.indexOf('@') === -1) {
          if (errEl) {
            errEl.textContent = 'Valid email required.';
            if (errEl.style) {
              errEl.style.display = 'block';
            }
          }
          return;
        }
        if (!desc) {
          if (errEl) {
            errEl.textContent = 'Please describe your issue.';
            if (errEl.style) {
              errEl.style.display = 'block';
            }
          }
          return;
        }
        if (errEl && errEl.style) {
          errEl.style.display = 'none';
        }
        if (subEl) {
          subEl.textContent = 'Submitting...';
          subEl.disabled = true;
          if (subEl.style) {
            subEl.style.opacity = '0.7';
          }
        }

        fetch(DOMAIN + '/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: agentId,
            sessionId: sessionId,
            visitorName: name || 'Anonymous',
            visitorEmail: email,
            subject: lastAI || 'Support request',
            description: desc,
            conversationHistory: chatHistory.slice(-20)
          })
        })
        .then(function(r) {
          if (!r.ok) throw new Error('Failed');
          return r.json();
        })
        .then(function() {
          var f = el('agd-tform');
          if (f) f.remove();
          var bar = el('agd-bar');
          if (bar && bar.style) {
            bar.style.display = 'flex';
          }

          var success = document.createElement('div');
          if (success) {
            success.className = 'agd-bbl agd-ai';
            if (success.style) {
              success.style.cssText = 'background:#F0FDF4;color:#166534;border:1.5px solid #BBF7D0;border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;';
            }
            success.innerHTML = '<strong>✓ Ticket created!</strong><br><span style="font-size:13px;">We\'ll follow up at ' + email.replace(/</g,'&lt;') + ' shortly.</span>';
          }
          var msgs = el('agd-msgs');
          if (msgs && success) {
            msgs.appendChild(success);
            msgs.scrollTop = msgs.scrollHeight;
          }
        })
        .catch(function() {
          var subEl = el('agd-tsub');
          if (subEl) {
            subEl.textContent = 'Submit Ticket';
            subEl.disabled = false;
            if (subEl.style) {
              subEl.style.opacity = '1';
            }
          }
          var errEl = el('agd-terr');
          if (errEl) {
            errEl.textContent = 'Failed to submit. Try again.';
            if (errEl.style) {
              errEl.style.display = 'block';
            }
          }
        });
      };
    }
  }

  // Init: fetch agent info then build widget
  function init() {
    fetch(DOMAIN + '/api/agents/public/' + agentId)
      .then(function(r) {
        if (!r.ok) throw new Error('Agent fetch failed: ' + r.status);
        return r.json();
      })
      .then(function(data) {
        if (!data.isActive) {
          console.log('[AgentDesk] Agent inactive');
          return;
        }
        agentData = data;
        injectStyles(data.themeColor);
        if (document.body) {
          buildWidget();
        } else {
          document.addEventListener('DOMContentLoaded', buildWidget);
        }
      })
      .catch(function(err) {
        console.error('[AgentDesk] Init failed:', err.message);
      });
  }

  // Start after page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
