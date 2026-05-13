(function() {
  // Capture execution environment parameters
  const script = document.currentScript;
  const agentId = script.getAttribute('data-agent');
  const primaryColor = script.getAttribute('data-color') || '#F97316';
  
  if (!agentId) {
    console.error('[AgentDesk Embed Error]: Missing data-agent configuration attribute.');
    return;
  }

  // 1. Setup Absolute Frame Container and Styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    #agentdesk-launcher {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      cursor: pointer;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 8px 32px rgba(249,115,22,0.1);
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
      border: 1px solid rgba(255,255,255,0.1);
    }
    #agentdesk-launcher:hover {
      transform: scale(1.08);
    }
    #agentdesk-launcher:active {
      transform: scale(0.95);
    }
    #agentdesk-launcher-pulse {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      background-color: #EF4444;
      border: 2px solid #FFFFFF;
      border-radius: 50%;
      animation: ad-badge-pulse 1.8s infinite ease-in-out;
    }
    @keyframes ad-badge-pulse {
      0% { box-shadow: 0 0 0 0px rgba(239,68,68,0.5); }
      70% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
      100% { box-shadow: 0 0 0 0px rgba(239,68,68,0); }
    }
    #agentdesk-window {
      position: fixed;
      bottom: 100px;
      right: 24px;
      width: 380px;
      height: 620px;
      max-height: calc(100vh - 140px);
      z-index: 2147483646;
      background: transparent;
      border: none;
      border-radius: 20px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.16);
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px) scale(0.96);
      transition: opacity 0.25s cubic-bezier(0.23, 1, 0.32, 1), transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
      overflow: hidden;
    }
    #agentdesk-window.is-open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }
    #agentdesk-iframe {
      width: 100%;
      height: 100%;
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 20px;
      background-color: #FFFFFF;
    }

    /* Advanced Mobile Overrides - Full Screen Touch Orientation */
    @media (max-width: 640px) {
      #agentdesk-window {
        bottom: 0;
        right: 0;
        width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
        transform: translateY(100%) scale(1);
        transition: transform 0.35s cubic-bezier(0.23, 1, 0.32, 1);
        box-shadow: none;
      }
      #agentdesk-window.is-open {
        transform: translateY(0);
      }
      #agentdesk-iframe {
        border: none;
        border-radius: 0;
      }
      .agentdesk-launcher-hidden {
        opacity: 0;
        pointer-events: none;
        transform: scale(0.8) !important;
      }
      #agentdesk-mobile-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: rgba(0,0,0,0.15);
        backdrop-filter: blur(8px);
        color: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 99;
        border: none;
      }
    }
    
    @media (min-width: 641px) {
      #agentdesk-mobile-close {
        display: none;
      }
    }
  `;
  document.head.appendChild(styleSheet);

  // 2. Build Launcher Button
  const launcher = document.createElement('div');
  launcher.id = 'agentdesk-launcher';
  launcher.style.backgroundColor = primaryColor;
  
  // SVG assets
  const iconSparkle = `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#FFFFFF">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  `;
  const iconClose = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#FFFFFF">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  
  launcher.innerHTML = iconSparkle;

  // Badge indicator for active session hook
  const pulseBadge = document.createElement('div');
  pulseBadge.id = 'agentdesk-launcher-pulse';
  launcher.appendChild(pulseBadge);

  // 3. Build Responsive Chat Window and Iframe Source
  const chatWindow = document.createElement('div');
  chatWindow.id = 'agentdesk-window';

  // Add unique floating mobile-close element for overlay mode
  const mobileClose = document.createElement('button');
  mobileClose.id = 'agentdesk-mobile-close';
  mobileClose.innerHTML = iconClose;
  chatWindow.appendChild(mobileClose);

  const iframe = document.createElement('iframe');
  iframe.id = 'agentdesk-iframe';
  
  // Detect parent domain location correctly
  let host = 'https://agentdesk.vercel.app'; // default production fallback
  try {
    host = new URL(script.src).origin;
  } catch (e) {}
  
  iframe.src = `${host}/widget/chat?agent=${agentId}`;
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allow', 'microphone; clipboard-write');
  chatWindow.appendChild(iframe);

  // 4. Wire Toggle Interactivity
  let isOpen = false;
  
  const toggleWidget = (forceState) => {
    isOpen = typeof forceState === 'boolean' ? forceState : !isOpen;
    
    if (isOpen) {
      chatWindow.classList.add('is-open');
      pulseBadge.style.display = 'none'; // Remove badge permanently on first interaction
      launcher.innerHTML = iconClose;
      
      // Enforce mobile full overlay hide state
      if (window.innerWidth <= 640) {
        launcher.classList.add('agentdesk-launcher-hidden');
      }
    } else {
      chatWindow.classList.remove('is-open');
      launcher.innerHTML = iconSparkle;
      launcher.classList.remove('agentdesk-launcher-hidden');
    }
  };

  launcher.addEventListener('click', () => toggleWidget());
  mobileClose.addEventListener('click', () => toggleWidget(false));

  // 5. Inject onto Client Domain Root Tree
  document.body.appendChild(chatWindow);
  document.body.appendChild(launcher);
})();
