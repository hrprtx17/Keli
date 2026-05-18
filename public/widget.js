(function() {
  try {
    'use strict';

    var DOMAIN = 'https://agentdeskk.netlify.app';
    try {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.indexOf('192.168.') === 0) {
        DOMAIN = window.location.origin;
      }
    } catch(e) {}

    var agentId = null;
    var sessionId = null;
    var chatHistory = [];
    var isOpen = false;
    var isClosing = false;
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

    // Inject CSS
    function injectStyles(color) {
      if (el('agd-css')) return;
      var c = color || '#FF6B35';
      var css = '\
        #agd-container * {\
          box-sizing: border-box !important;\
          margin: 0;\
          padding: 0;\
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;\
        }\
        #agd-launcher {\
          position: fixed;\
          bottom: 28px;\
          right: 28px;\
          width: 60px;\
          height: 60px;\
          border-radius: 50%;\
          background: ' + c + ';\
          cursor: pointer;\
          display: flex;\
          align-items: center;\
          justify-content: center;\
          z-index: 2147483647;\
          border: none;\
          box-shadow: 0 8px 32px rgba(255, 107, 53, 0.35);\
          opacity: 0;\
          transform: scale(0) rotate(-180deg);\
          animation: agd-launcher-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 1.5s forwards;\
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);\
        }\
        #agd-launcher:hover {\
          transform: scale(1.12) !important;\
          box-shadow: 0 12px 40px rgba(255, 107, 53, 0.5) !important;\
        }\
        #agd-pulse-ring {\
          position: fixed;\
          bottom: 28px;\
          right: 28px;\
          width: 60px;\
          height: 60px;\
          border: 2px solid ' + c + ';\
          border-radius: 50%;\
          z-index: 2147483646;\
          pointer-events: none;\
          transform-origin: center;\
          opacity: 0;\
          animation: agd-launcher-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 1.5s forwards, agd-pulse 2s ease-out 2.1s infinite;\
        }\
        @keyframes agd-launcher-in {\
          0%   { transform: scale(0) rotate(-180deg); opacity: 0; }\
          60%  { transform: scale(1.15) rotate(10deg); opacity: 1; }\
          80%  { transform: scale(0.95) rotate(-5deg); }\
          100% { transform: scale(1) rotate(0deg); opacity: 1; }\
        }\
        @keyframes agd-pulse {\
          0%   { transform: scale(1); opacity: 0.6; }\
          100% { transform: scale(1.8); opacity: 0; }\
        }\
        #agd-launcher .agd-icon {\
          position: absolute;\
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;\
        }\
        #agd-launcher #agd-icon-chat {\
          opacity: 1;\
          transform: scale(1) rotate(0deg);\
        }\
        #agd-launcher #agd-icon-close {\
          opacity: 0;\
          transform: scale(0.6) rotate(-90deg);\
        }\
        #agd-launcher.agd-open #agd-icon-chat {\
          opacity: 0;\
          transform: scale(0.6) rotate(90deg);\
        }\
        #agd-launcher.agd-open #agd-icon-close {\
          opacity: 1;\
          transform: scale(1) rotate(0deg);\
        }\
        #agd-panel {\
          position: fixed;\
          bottom: 100px;\
          right: 28px;\
          width: 380px;\
          height: 580px;\
          background: #ffffff;\
          border-radius: 20px;\
          z-index: 2147483645;\
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.12), 0 4px 24px rgba(0, 0, 0, 0.08);\
          display: flex;\
          flex-direction: column;\
          overflow: hidden;\
          opacity: 0;\
          transform: translateY(24px) scale(0.96);\
          pointer-events: none;\
          transition: opacity 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);\
        }\
        #agd-panel.agd-open {\
          opacity: 1;\
          pointer-events: all;\
          animation: agd-panel-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;\
        }\
        #agd-panel.agd-closing {\
          animation: agd-panel-out 0.2s ease-in forwards;\
        }\
        @keyframes agd-panel-in {\
          0%   { opacity: 0; transform: translateY(24px) scale(0.96); }\
          100% { opacity: 1; transform: translateY(0) scale(1); }\
        }\
        @keyframes agd-panel-out {\
          0%   { opacity: 1; transform: translateY(0) scale(1); }\
          100% { opacity: 0; transform: translateY(16px) scale(0.97); }\
        }\
        @media (max-width: 500px) {\
          #agd-panel {\
            width: 100% !important;\
            height: 100% !important;\
            bottom: 0 !important;\
            right: 0 !important;\
            top: 0 !important;\
            left: 0 !important;\
            border-radius: 0 !important;\
          }\
          #agd-header {\
            border-radius: 0 !important;\
          }\
          #agd-bar {\
            border-radius: 0 !important;\
          }\
        }\
        #agd-header {\
          height: 70px;\
          background: ' + c + ';\
          border-radius: 20px 20px 0 0;\
          padding: 0 16px;\
          display: flex;\
          align-items: center;\
          justify-content: space-between;\
          flex-shrink: 0;\
        }\
        #agd-header-left {\
          display: flex;\
          align-items: center;\
          gap: 12px;\
          min-w-0;\
        }\
        #agd-avatar-container {\
          position: relative;\
          width: 40px;\
          height: 40px;\
          flex-shrink: 0;\
        }\
        #agd-avatar {\
          width: 40px;\
          height: 40px;\
          border-radius: 50%;\
          background: rgba(255, 255, 255, 0.2);\
          display: flex;\
          align-items: center;\
          justify-content: center;\
          color: #ffffff;\
          font-weight: 700;\
          font-size: 16px;\
        }\
        #agd-online-dot {\
          position: absolute;\
          bottom: 0;\
          right: 0;\
          width: 10px;\
          height: 10px;\
          border-radius: 50%;\
          background: #22C55E;\
          border: 2px solid #ffffff;\
        }\
        #agd-header-info {\
          text-align: left;\
          min-w-0;\
        }\
        #agd-name {\
          color: #ffffff;\
          font-size: 15px;\
          font-weight: 600;\
          white-space: nowrap;\
          overflow: hidden;\
          text-overflow: ellipsis;\
        }\
        #agd-status {\
          color: rgba(255, 255, 255, 0.8);\
          font-size: 11px;\
          margin-top: 2px;\
        }\
        #agd-header-right {\
          display: flex;\
          align-items: center;\
          gap: 8px;\
        }\
        .agd-hbtn {\
          width: 30px;\
          height: 30px;\
          border-radius: 50%;\
          background: rgba(255, 255, 255, 0.15);\
          border: none;\
          color: #ffffff;\
          cursor: pointer;\
          display: flex;\
          align-items: center;\
          justify-content: center;\
          transition: background 0.15s ease;\
          position: relative;\
        }\
        .agd-hbtn:hover {\
          background: rgba(255, 255, 255, 0.3) !important;\
        }\
        .agd-hbtn[title]::after {\
          content: attr(title);\
          position: absolute;\
          bottom: -32px;\
          right: 0;\
          background: #374151;\
          color: #ffffff;\
          font-size: 10px;\
          padding: 4px 8px;\
          border-radius: 4px;\
          white-space: nowrap;\
          opacity: 0;\
          pointer-events: none;\
          transition: opacity 0.15s ease;\
          z-index: 10;\
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);\
        }\
        .agd-hbtn:hover[title]::after {\
          opacity: 1;\
        }\
        #agd-msgs {\
          flex: 1;\
          overflow-y: auto;\
          padding: 16px;\
          display: flex;\
          flex-direction: column;\
          gap: 12px;\
          background: #FDFDFD;\
        }\
        #agd-msgs::-webkit-scrollbar {\
          width: 3px;\
        }\
        #agd-msgs::-webkit-scrollbar-thumb {\
          background: #e0e0e0;\
          border-radius: 3px;\
        }\
        #agd-msgs::-webkit-scrollbar-track {\
          background: transparent;\
        }\
        .agd-bbl {\
          max-width: 78%;\
          padding: 10px 14px;\
          font-size: 14px;\
          line-height: 1.5;\
          word-break: break-word;\
          font-family: inherit;\
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);\
        }\
        .agd-usr {\
          background: ' + c + ';\
          color: #ffffff;\
          align-self: flex-end;\
          border-radius: 18px 18px 4px 18px;\
          margin-left: 22%;\
          text-align: left;\
          animation: agd-bubble-in-user 0.2s ease-out forwards;\
        }\
        .agd-ai {\
          background: #F3F4F6;\
          color: #111111;\
          align-self: flex-start;\
          border-radius: 18px 18px 18px 4px;\
          margin-right: 22%;\
          text-align: left;\
          animation: agd-bubble-in-ai 0.2s ease-out forwards;\
        }\
        .agd-err {\
          background: #FEF2F2;\
          color: #991B1B;\
          align-self: flex-start;\
          border-radius: 18px;\
          border: 1px solid #FCA5A5;\
          margin-right: 22%;\
          text-align: left;\
          animation: agd-bubble-in-ai 0.2s ease-out forwards;\
        }\
        @keyframes agd-bubble-in-user {\
          from { opacity: 0; transform: translateX(12px) scale(0.95); }\
          to   { opacity: 1; transform: translateX(0) scale(1); }\
        }\
        @keyframes agd-bubble-in-ai {\
          from { opacity: 0; transform: translateX(-12px) scale(0.95); }\
          to   { opacity: 1; transform: translateX(0) scale(1); }\
        }\
        #agd-typing {\
          align-self: flex-start;\
          background: #F3F4F6;\
          border-radius: 18px 18px 18px 4px;\
          padding: 12px 16px;\
          display: none;\
          align-items: center;\
          gap: 4px;\
          margin-left: 16px;\
          margin-bottom: 8px;\
          animation: agd-bubble-in-ai 0.2s ease-out forwards;\
        }\
        .agd-dot {\
          width: 7px;\
          height: 7px;\
          border-radius: 50%;\
          background: #9CA3AF;\
          animation: agd-dot-bounce 1.2s infinite ease-in-out;\
        }\
        .agd-dot:nth-child(1) { animation-delay: 0s; }\
        .agd-dot:nth-child(2) { animation-delay: 0.15s; }\
        .agd-dot:nth-child(3) { animation-delay: 0.3s; }\
        @keyframes agd-dot-bounce {\
          0%, 60%, 100% { transform: translateY(0); }\
          30% { transform: translateY(-8px); }\
        }\
        #agd-bar {\
          height: 68px;\
          border-top: 1px solid #F0F0F0;\
          background: #ffffff;\
          border-radius: 0 0 20px 20px;\
          padding: 14px 16px;\
          display: flex;\
          align-items: center;\
          gap: 12px;\
          flex-shrink: 0;\
        }\
        #agd-input {\
          flex: 1;\
          height: 40px;\
          border: 1.5px solid #E5E7EB;\
          border-radius: 22px;\
          padding: 0 16px;\
          font-size: 16px;\
          outline: none;\
          background: #ffffff;\
          transition: border-color 0.15s ease, box-shadow 0.15s ease;\
          color: #111111;\
        }\
        #agd-input:focus {\
          border-color: ' + c + ' !important;\
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1) !important;\
        }\
        #agd-send {\
          width: 40px;\
          height: 40px;\
          border-radius: 50%;\
          background: #E5E7EB;\
          border: none;\
          cursor: not-allowed;\
          display: flex;\
          align-items: center;\
          justify-content: center;\
          flex-shrink: 0;\
          transition: background 0.15s ease, transform 0.1s ease;\
        }\
        #agd-send.agd-active {\
          background: ' + c + ' !important;\
          cursor: pointer;\
          animation: agd-send-activate 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;\
        }\
        #agd-send:active:not(:disabled) {\
          transform: scale(0.9) !important;\
        }\
        @keyframes agd-send-activate {\
          from { transform: scale(0.8); }\
          to   { transform: scale(1); }\
        }\
        .agd-esc-bubble {\
          border: 1.5px solid ' + c + ';\
          background: #FFF8F5;\
          align-self: flex-start;\
          border-radius: 18px 18px 18px 4px;\
          padding: 16px;\
          margin-right: 18%;\
          text-align: left;\
          animation: agd-bubble-in-ai 0.25s ease-out forwards;\
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.05);\
        }\
        .agd-esc-title {\
          font-size: 14px;\
          font-weight: 700;\
          color: #7C2D00;\
          margin-bottom: 6px;\
        }\
        .agd-esc-desc {\
          font-size: 12px;\
          color: #92400E;\
          line-height: 1.45;\
          margin-bottom: 12px;\
        }\
        .agd-esc-btns {\
          display: flex;\
          gap: 8px;\
        }\
        .agd-esc-btn-yes {\
          background: ' + c + ';\
          color: #ffffff;\
          border: none;\
          border-radius: 20px;\
          padding: 8px 16px;\
          font-size: 13px;\
          font-weight: 500;\
          cursor: pointer;\
          transition: background 0.15s ease;\
        }\
        .agd-esc-btn-yes:hover {\
          background: #E85D2A !important;\
        }\
        .agd-esc-btn-no {\
          background: transparent;\
          color: #92400E;\
          border: 1.5px solid ' + c + ';\
          border-radius: 20px;\
          padding: 8px 12px;\
          font-size: 13px;\
          font-weight: 500;\
          cursor: pointer;\
          transition: background 0.15s ease;\
        }\
        .agd-esc-btn-no:hover {\
          background: rgba(255, 107, 53, 0.05) !important;\
        }\
        .agd-form-bubble {\
          background: #ffffff;\
          border: 1.5px solid #E5E7EB;\
          border-radius: 16px;\
          padding: 18px;\
          align-self: flex-start;\
          margin-right: 14%;\
          text-align: left;\
          animation: agd-bubble-in-ai 0.25s ease-out forwards;\
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);\
        }\
        .agd-form-title {\
          font-size: 15px;\
          font-weight: 700;\
          color: #111111;\
          margin-bottom: 2px;\
        }\
        .agd-form-sub {\
          font-size: 12px;\
          color: #6B7280;\
          margin-bottom: 14px;\
        }\
        .agd-form-group {\
          margin-bottom: 12px;\
        }\
        .agd-form-input {\
          width: 100%;\
          border: 1.5px solid #E5E7EB;\
          border-radius: 10px;\
          padding: 10px 12px;\
          font-size: 16px;\
          outline: none;\
          box-sizing: border-box;\
          transition: border-color 0.15s ease, box-shadow 0.15s ease;\
          background: #ffffff;\
          color: #111111;\
        }\
        .agd-form-input:focus {\
          border-color: ' + c + ' !important;\
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1) !important;\
        }\
        .agd-form-submit {\
          width: 100%;\
          background: ' + c + ';\
          color: #ffffff;\
          border: none;\
          border-radius: 10px;\
          padding: 11px;\
          font-size: 14px;\
          font-weight: 600;\
          cursor: pointer;\
          transition: background 0.15s ease, opacity 0.15s ease;\
          display: flex;\
          align-items: center;\
          justify-content: center;\
          gap: 6px;\
        }\
        .agd-form-submit:hover {\
          background: #E85D2A !important;\
        }\
        .agd-form-submit:disabled {\
          background: #E5E7EB !important;\
          color: #9CA3AF !important;\
          cursor: not-allowed;\
        }\
        .agd-form-cancel {\
          display: block;\
          background: none;\
          border: none;\
          color: #6B7280;\
          font-size: 12px;\
          cursor: pointer;\
          margin: 10px auto 0;\
          text-align: center;\
        }\
        .agd-form-cancel:hover {\
          text-decoration: underline;\
        }\
        .agd-success-bubble {\
          background: #F0FDF4;\
          border: 1.5px solid #BBF7D0;\
          border-radius: 16px;\
          padding: 18px;\
          align-self: flex-start;\
          margin-right: 18%;\
          text-align: center;\
          animation: agd-bubble-in-ai 0.25s ease-out forwards;\
        }\
        .agd-success-title {\
          font-size: 14px;\
          font-weight: 700;\
          color: #166534;\
          margin-bottom: 4px;\
        }\
        .agd-success-sub {\
          font-size: 12px;\
          color: #166534;\
          opacity: 0.95;\
          line-height: 1.4;\
        }\
        @keyframes agd-check-draw {\
          from { stroke-dashoffset: 100; }\
          to   { stroke-dashoffset: 0; }\
        }\
        #agd-powered {\
          text-align: center;\
          font-size: 10px;\
          color: #C0C0C0;\
          padding: 8px 0;\
          cursor: pointer;\
          text-decoration: none;\
          display: block;\
          flex-shrink: 0;\
          transition: color 0.15s ease;\
        }\
        #agd-powered:hover {\
          color: ' + c + ';\
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

      // Wrap in a custom container to separate scope resets
      var container = document.createElement('div');
      if (container) {
        container.id = 'agd-container';
      }

      // Launcher
      var launcher = document.createElement('button');
      if (launcher) {
        launcher.id = 'agd-launcher';
        launcher.setAttribute('aria-label', 'Open chat');
        launcher.innerHTML = '\
          <svg id="agd-icon-chat" class="agd-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">\
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>\
          </svg>\
          <svg id="agd-icon-close" class="agd-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">\
            <line x1="18" y1="6" x2="6" y2="18"></line>\
            <line x1="6" y1="6" x2="18" y2="18"></line>\
          </svg>';
        launcher.onclick = togglePanel;
      }

      // Pulse Ring (sibling ring that syncs entry animations and auto-pulses)
      var pulseRing = document.createElement('div');
      if (pulseRing) {
        pulseRing.id = 'agd-pulse-ring';
      }

      // Panel
      var panel = document.createElement('div');
      if (panel) {
        panel.id = 'agd-panel';
        panel.innerHTML = [
          '<div id="agd-header">',
            '<div id="agd-header-left">',
              '<div id="agd-avatar-container">',
                '<div id="agd-avatar">' + letter + '</div>',
                '<div id="agd-online-dot"></div>',
              '</div>',
              '<div id="agd-header-info">',
                '<div id="agd-name">' + name.replace(/</g,'&lt;') + '</div>',
                '<div id="agd-status">Online · Ready to help</div>',
              '</div>',
            '</div>',
            '<div id="agd-header-right">',
              '<button class="agd-hbtn" id="agd-ticket-header-btn" title="Create support ticket">',
                '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
                  '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.293 8.293a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828L12.586 2.586z"></path>',
                  '<line x1="7" y1="7" x2="7.01" y2="7"></line>',
                '</svg>',
              '</button>',
              '<button class="agd-hbtn" id="agd-close-btn" aria-label="Close">',
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
                  '<line x1="18" y1="6" x2="6" y2="18"></line>',
                  '<line x1="6" y1="6" x2="18" y2="18"></line>',
                '</svg>',
              '</button>',
            '</div>',
          '</div>',
          '<div id="agd-msgs"></div>',
          '<div id="agd-typing">',
            '<div class="agd-dot"></div>',
            '<div class="agd-dot"></div>',
            '<div class="agd-dot"></div>',
          '</div>',
          '<div id="agd-bar">',
            '<input id="agd-input" type="text" placeholder="Type a message..." autocomplete="off"/>',
            '<button id="agd-send" aria-label="Send" disabled>',
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">',
                '<line x1="22" y1="2" x2="11" y2="13"></line>',
                '<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>',
              '</svg>',
            '</button>',
          '</div>',
          '<a id="agd-powered" href="https://agentdeskk.netlify.app" target="_blank">Powered by AgentDesk</a>'
        ].join('');
      }

      if (document.body) {
        if (container) {
          document.body.appendChild(container);
          if (launcher) container.appendChild(launcher);
          if (pulseRing) container.appendChild(pulseRing);
          if (panel) container.appendChild(panel);
        }
      }

      // Automatically clean up the pulse ring element after 8 seconds
      setTimeout(function() {
        var ring = el('agd-pulse-ring');
        if (ring) ring.remove();
      }, 8000);

      // Wire up events safely
      var closeBtn = el('agd-close-btn');
      var ticketHeaderBtn = el('agd-ticket-header-btn');
      var sendBtn  = el('agd-send');
      var input    = el('agd-input');

      if (closeBtn) closeBtn.onclick = togglePanel;
      if (ticketHeaderBtn) ticketHeaderBtn.onclick = showTicketOption;
      if (sendBtn)  sendBtn.onclick  = handleSend;
      
      if (input) {
        input.onkeydown = function(e) {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        };

        // Text typing changes send button disabled-look/classes
        input.oninput = function() {
          var s = el('agd-send');
          var text = input.value.trim();
          if (s) {
            if (text.length > 0) {
              s.removeAttribute('disabled');
              s.classList.add('agd-active');
            } else {
              s.setAttribute('disabled', 'true');
              s.classList.remove('agd-active');
            }
          }
        };
      }
    }

    // Toggle panel open/close smoothly
    function togglePanel() {
      if (isClosing) return;
      var panel    = el('agd-panel');
      var launcher = el('agd-launcher');
      if (!panel || !launcher) return;

      isOpen = !isOpen;

      if (isOpen) {
        launcher.classList.add('agd-open');
        if (panel.style) {
          panel.style.display = 'flex';
        }
        // Force reflow for hardware acceleration trigger
        panel.offsetHeight;
        panel.classList.add('agd-open');

        // Show welcome message only once
        var msgs = el('agd-msgs');
        if (msgs && msgs.children && msgs.children.length === 0 && agentData) {
          addBubble('ai', agentData.welcomeMessage || 'Hi! 👋 How can I help you today?');
        }
        
        setTimeout(function() {
          var input = el('agd-input');
          if (input) input.focus();
        }, 300);
      } else {
        launcher.classList.remove('agd-open');
        panel.classList.remove('agd-open');
        panel.classList.add('agd-closing');
        isClosing = true;

        setTimeout(function() {
          panel.classList.remove('agd-closing');
          if (panel.style) {
            panel.style.display = 'none';
          }
          isClosing = false;
        }, 200); // matches CSS duration
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
      if (send) {
        send.disabled = disabled;
        if (disabled) {
          send.classList.remove('agd-active');
        } else {
          var txt = input ? input.value.trim() : '';
          if (txt.length > 0) {
            send.classList.add('agd-active');
          }
        }
      }
    }

    // Show/hide typing indicator safely
    function showTyping(show) {
      var typing = el('agd-typing');
      if (typing && typing.style) {
        typing.style.display = show ? 'flex' : 'none';
      }
      var msgs = el('agd-msgs');
      if (msgs && show) {
        msgs.scrollTop = msgs.scrollHeight;
      }
    }

    // Handle send
    function handleSend() {
      var input = el('agd-input');
      if (!input) return;
      var text = input.value.trim();
      if (!text) return;
      input.value = '';

      var s = el('agd-send');
      if (s) {
        s.setAttribute('disabled', 'true');
        s.classList.remove('agd-active');
      }

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

        function finalize() {
          chatHistory.push({ role: 'assistant', content: fullText });
          setDisabled(false);
          var input = el('agd-input');
          if (input) input.focus();
          if (shouldSuggestEscalation(fullText, text)) {
            showEscalationBanner();
          }
        }

        function pump() {
          reader.read().then(function(chunk) {
            if (chunk.done) {
              finalize();
              return;
            }
            buf += decoder.decode(chunk.value, { stream: true });
            var lines = buf.split('\n');
            buf = lines.pop(); // keep last incomplete line in buffer
            
            for (var i = 0; i < lines.length; i++) {
              var line = lines[i].trim();
              if (!line || !line.startsWith('data: ')) continue;
              var raw = line.slice(6).trim();
              if (raw === '[DONE]') continue;
              try {
                var parsed = JSON.parse(raw);
                if (parsed.token && bubble) {
                  fullText += parsed.token;
                  bubble.textContent = fullText;
                  var msgs = el('agd-msgs');
                  if (msgs) msgs.scrollTop = msgs.scrollHeight;
                }
                if (parsed.done) {
                  finalize();
                  return;
                }
              } catch(e) { /* skip malformed line */ }
            }
            pump(); // continue reading
          }).catch(function(err) {
            console.error('[AgentDesk] Stream error:', err);
            showTyping(false);
            addBubble('err', 'Connection lost. Please try again.');
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

    // Ticket suggestion slide-in bubble
    function showTicketOption() {
      // Avoid duplicate banners
      if (el('agd-esc-banner')) return;

      var msgs = el('agd-msgs');
      if (!msgs) return;

      var bubble = document.createElement('div');
      if (bubble) {
        bubble.id = 'agd-esc-banner';
        bubble.className = 'agd-esc-bubble';
        bubble.innerHTML = [
          '<div class="agd-esc-title">Want help from a human? 👋</div>',
          '<div class="agd-esc-desc">Create a ticket and our team will reply via email — usually within a few hours.</div>',
          '<div class="agd-esc-btns">',
            '<button class="agd-esc-btn-yes" id="agd-esc-yes-btn">Yes, create ticket</button>',
            '<button class="agd-esc-btn-no" id="agd-esc-no-btn">No thanks</button>',
          '</div>'
        ].join('');
        
        msgs.appendChild(bubble);
        msgs.scrollTop = msgs.scrollHeight;
      }

      var yes = el('agd-esc-yes-btn');
      var no = el('agd-esc-no-btn');

      if (yes) {
        yes.onclick = function() {
          var b = el('agd-esc-banner');
          if (b) b.remove();
          showTicketForm();
        };
      }

      if (no) {
        no.onclick = function() {
          var b = el('agd-esc-banner');
          if (b) b.remove();
        };
      }
    }

    function showEscalationBanner() {
      try { sessionStorage.setItem('agd_esc_' + agentId, '1'); } catch(e) {}
      showTicketOption();
    }

    // Inline support ticket form card bubble
    function showTicketForm() {
      var msgs = el('agd-msgs');
      if (!msgs) return;

      // Avoid rendering duplicate form bubbles
      if (el('agd-tform')) return;

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
        form.className = 'agd-form-bubble';
        form.innerHTML = [
          '<div class="agd-form-title">Create a support ticket</div>',
          '<div class="agd-form-sub">We\'ll reply to your email</div>',
          '<div class="agd-form-group">',
            '<input id="agd-tname" class="agd-form-input" type="text" placeholder="Your name" autocomplete="name">',
          '</div>',
          '<div class="agd-form-group">',
            '<input id="agd-temail" class="agd-form-input" type="email" placeholder="your@email.com" required autocomplete="email">',
          '</div>',
          '<div class="agd-form-group">',
            '<textarea id="agd-tdesc" class="agd-form-input" rows="3" placeholder="Describe what you need help with..." style="resize:none; font-family:inherit;"></textarea>',
          '</div>',
          '<div id="agd-terr" style="color:#DC2626; font-size:12px; margin-bottom:10px; display:none; text-align:left;"></div>',
          '<button id="agd-tsub" class="agd-form-submit">Submit Ticket</button>',
          '<button id="agd-tcan" class="agd-form-cancel">Cancel</button>'
        ].join('');

        msgs.appendChild(form);
        msgs.scrollTop = msgs.scrollHeight;
      }

      var subBtn = el('agd-tsub');
      var canBtn = el('agd-tcan');

      setTimeout(function(){
        var emailIn = el('agd-temail');
        if (emailIn) emailIn.focus();
      }, 100);

      if (canBtn) {
        canBtn.onclick = function() {
          var f = el('agd-tform');
          if (f) f.remove();
        };
      }

      if (subBtn) {
        subBtn.onclick = function() {
          // Re-query every element inside click handler for bulletproof safety
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
              errEl.style.display = 'block';
            }
            return;
          }
          if (!desc) {
            if (errEl) {
              errEl.textContent = 'Please describe your issue.';
              errEl.style.display = 'block';
            }
            return;
          }
          
          if (errEl) errEl.style.display = 'none';

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

            var success = document.createElement('div');
            if (success) {
              success.className = 'agd-success-bubble';
              success.innerHTML = [
                '<svg class="agd-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style="width:40px;height:40px;display:block;margin:0 auto 10px;">',
                  '<circle class="agd-checkmark__circle" cx="26" cy="26" r="25" fill="none" stroke="#22C55E" stroke-width="3"/>',
                  '<path class="agd-checkmark__check" fill="none" stroke="#22C55E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M14 27l7.5 7.5 16.5-16.5" style="stroke-dasharray: 100; stroke-dashoffset: 100; animation: agd-check-draw 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.3s forwards;"/>',
                '</svg>',
                '<div class="agd-success-title">Ticket created! ✓</div>',
                '<div class="agd-success-sub">We\'ll reply to ' + email.replace(/</g,'&lt;') + ' shortly.</div>'
              ].join('');
            }
            var msgs = el('agd-msgs');
            if (msgs && success) {
              msgs.appendChild(success);
              msgs.scrollTop = msgs.scrollHeight;
            }
          })
          .catch(function() {
            // Re-query elements inside promise catch
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
              errEl.style.display = 'block';
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

  } catch(fatalErr) {
    console.error('[AgentDesk] Fatal widget error:', fatalErr);
  }
})();
