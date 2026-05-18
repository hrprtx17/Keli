(function() {
  'use strict';

  // Capture script attributes for configuration
  const script = document.currentScript || document.querySelector('script[data-agent-id]') || document.querySelector('script[data-agent]');
  if (!script) {
    console.error('[AgentDesk Widget Error]: Script tag could not be identified.');
    return;
  }

  const agentId = script.getAttribute('data-agent-id') || script.getAttribute('data-agent') || '';
  const primaryColor = script.getAttribute('data-color') || '#F97316';

  // Inject optimized and self-contained CSS styles into parent document
  const style = document.createElement('style');
  style.id = 'agentdesk-widget-styles';
  style.textContent = `
    #agentdesk-launcher {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      cursor: pointer;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.12), 0 8px 30px rgba(249,115,22,0.15);
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease, background-color 0.2s;
      border: 1px solid rgba(255,255,255,0.1);
      outline: none;
    }
    #agentdesk-launcher:hover {
      transform: scale(1.08);
    }
    #agentdesk-launcher:active {
      transform: scale(0.95);
    }
    #agentdesk-window {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 380px;
      height: 600px;
      max-height: calc(100vh - 128px);
      z-index: 2147483646;
      background: transparent;
      border: none;
      border-radius: 20px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.16);
      opacity: 0;
      pointer-events: none;
      transform: translateY(24px) scale(0.95);
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
    @media (max-width: 640px) {
      #agentdesk-window {
        bottom: 0;
        right: 0;
        width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
        transform: translateY(100%);
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
    }
  `;
  document.head.appendChild(style);

  // Define launcher buttons SVG Icons
  const sparkleIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #FFFFFF;">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  `;
  const closeIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #FFFFFF;">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;

  // Create Launcher Button
  const launcher = document.createElement('button');
  launcher.id = 'agentdesk-launcher';
  launcher.setAttribute('aria-label', 'Open Support Chat');
  launcher.style.backgroundColor = primaryColor;
  launcher.innerHTML = sparkleIcon;

  // Create Iframe Container
  const chatWindow = document.createElement('div');
  chatWindow.id = 'agentdesk-window';

  const iframe = document.createElement('iframe');
  iframe.id = 'agentdesk-iframe';
  
  // Resolve host automatically
  let host = 'http://localhost:3000';
  try {
    host = new URL(script.src).origin;
  } catch (e) {}

  iframe.src = `${host}/widget/chat?agent=${agentId}`;
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allow', 'microphone; clipboard-write');
  chatWindow.appendChild(iframe);

  // Widget visibility state controls
  let isOpen = false;
  const toggleWidget = (forceState) => {
    isOpen = typeof forceState === 'boolean' ? forceState : !isOpen;
    if (isOpen) {
      chatWindow.classList.add('is-open');
      launcher.innerHTML = closeIcon;
      if (window.innerWidth <= 640) {
        launcher.classList.add('agentdesk-launcher-hidden');
      }
    } else {
      chatWindow.classList.remove('is-open');
      launcher.innerHTML = sparkleIcon;
      launcher.classList.remove('agentdesk-launcher-hidden');
    }
  };

  // Wire event handlers
  launcher.addEventListener('click', () => toggleWidget());

  // Listen for iframe action triggers (e.g. Close Event)
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'AGENTDESK_WIDGET_CLOSE') {
      toggleWidget(false);
    }
    if (event.data && event.data.type === 'AGENTDESK_WIDGET_EXPAND') {
      window.open(`${host}/widget/chat?agent=${agentId}`, '_blank');
    }
  });

  // Inject elements
  document.body.appendChild(chatWindow);
  document.body.appendChild(launcher);
})();
