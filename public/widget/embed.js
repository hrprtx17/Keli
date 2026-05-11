(function() {
  const script = document.currentScript;
  const agentId = script.getAttribute('data-agent');
  const primaryColor = script.getAttribute('data-color') || '#F97316';
  
  if (!agentId) {
    console.error('AgentDesk: Missing data-agent attribute on embed script.');
    return;
  }

  const container = document.createElement('div');
  container.id = 'agentdesk-widget-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '999999';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'flex-end';

  const button = document.createElement('button');
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;
  button.style.width = '60px';
  button.style.height = '60px';
  button.style.borderRadius = '30px';
  button.style.backgroundColor = primaryColor;
  button.style.color = '#fff';
  button.style.border = 'none';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.transition = 'transform 0.2s ease';

  button.addEventListener('mouseover', () => button.style.transform = 'scale(1.05)');
  button.addEventListener('mouseout', () => button.style.transform = 'scale(1)');

  const iframe = document.createElement('iframe');
  const host = new URL(script.src).origin;
  iframe.src = `${host}/widget/chat?agent=${agentId}`;
  iframe.style.width = '350px';
  iframe.style.height = '500px';
  iframe.style.border = '1px solid #e5e7eb';
  iframe.style.borderRadius = '12px';
  iframe.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
  iframe.style.marginBottom = '16px';
  iframe.style.display = 'none';
  iframe.style.backgroundColor = '#fff';

  let isOpen = false;

  button.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      iframe.style.display = 'block';
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    } else {
      iframe.style.display = 'none';
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
    }
  });

  container.appendChild(iframe);
  container.appendChild(button);
  document.body.appendChild(container);
})();
