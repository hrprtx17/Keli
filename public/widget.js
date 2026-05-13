(function() {
  // Capture configuration parameters
  const script = document.currentScript || document.querySelector('script[data-agent-id]');
  const agentId = script.getAttribute('data-agent-id');
  
  if (!agentId) {
    console.warn('[AgentDesk]: Missing data-agent-id on script tag.');
    return;
  }

  // 1. Inject Styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    #agentdesk-widget-launcher {
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
      background-color: #F97316;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 8px 32px rgba(249,115,22,0.2);
      transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1.2);
      border: 1px solid rgba(255,255,255,0.1);
    }
    #agentdesk-widget-launcher:hover {
      transform: scale(1.08) translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.2), 0 12px 40px rgba(249,115,22,0.3);
    }
    #agentdesk-widget-launcher svg {
      width: 28px;
      height: 28px;
      color: white;
      transition: transform 0.3s ease;
    }
    #agentdesk-widget-container {
      position: fixed;
      bottom: 100px;
      right: 24px;
      width: 400px;
      height: 600px;
      max-height: calc(100vh - 140px);
      z-index: 2147483646;
      background: white;
      border-radius: 24px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.15);
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px) scale(0.95);
      transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
      overflow: hidden;
      border: 1px solid rgba(0,0,0,0.05);
    }
    #agentdesk-widget-container.is-open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }
    #agentdesk-widget-container.is-expanded {
      width: 800px;
      height: 80vh;
    }
    #agentdesk-widget-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    @media (max-width: 640px) {
      #agentdesk-widget-container {
        bottom: 0;
        right: 0;
        width: 100%;
        height: 100%;
        max-height: 100%;
        border-radius: 0;
        transform: translateY(100%);
      }
      #agentdesk-widget-container.is-open {
        transform: translateY(0);
      }
      #agentdesk-widget-container.is-expanded {
        width: 100%;
        height: 100%;
      }
      #agentdesk-widget-launcher.is-hidden {
        opacity: 0;
        pointer-events: none;
        transform: scale(0.5);
      }
    }
  `;
  document.head.appendChild(styleSheet);

  // 2. Create Launcher
  const launcher = document.createElement('div');
  launcher.id = 'agentdesk-widget-launcher';
  launcher.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`;
  
  // 3. Create Container & Iframe
  const container = document.createElement('div');
  container.id = 'agentdesk-widget-container';
  
  const iframe = document.createElement('iframe');
  iframe.id = 'agentdesk-widget-iframe';
  
  let host = 'https://agentdesk.ai'; // Production fallback
  try {
    host = new URL(script.src).origin;
  } catch (e) {}
  
  iframe.src = `${host}/widget/chat?agent=${agentId}`;
  iframe.allow = "clipboard-write";
  container.appendChild(iframe);

  // 4. State Management
  let isOpen = false;
  let isExpanded = false;
  const toggle = (force) => {
    isOpen = force !== undefined ? force : !isOpen;
    if (isOpen) {
      container.classList.add('is-open');
      launcher.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      if (window.innerWidth <= 640) launcher.classList.add('is-hidden');
    } else {
      container.classList.remove('is-open');
      container.classList.remove('is-expanded');
      isExpanded = false;
      launcher.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`;
      launcher.classList.remove('is-hidden');
    }
  };

  launcher.addEventListener('click', () => toggle());

  // 5. Message Bridge
  window.addEventListener('message', (event) => {
    if (event.data.type === 'AGENTDESK_WIDGET_CLOSE') {
      toggle(false);
    }
    if (event.data.type === 'AGENTDESK_WIDGET_EXPAND') {
      isExpanded = !isExpanded;
      if (isExpanded) {
        container.classList.add('is-expanded');
      } else {
        container.classList.remove('is-expanded');
      }
    }
  });

  // 6. Append to Body
  document.body.appendChild(container);
  document.body.appendChild(launcher);

})();
