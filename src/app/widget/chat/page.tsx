'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Sparkles, X, Maximize2, MoreHorizontal } from 'lucide-react';

interface ChatConfig {
  agentName: string;
  welcomeMessage: string;
  primaryColor: string;
  showBranding: boolean;
}

function ChatWidgetContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agent');
  
  const [config, setConfig] = useState<ChatConfig>({
    agentName: 'AI Assistant',
    welcomeMessage: "Hey 👋\nI'm here to answer questions about this website.",
    primaryColor: '#F97316',
    showBranding: true
  });

  const [messages, setMessages] = useState<{role: 'user'|'agent', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (agentId) {
      fetch(`/api/widget/config?agent=${agentId}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            const derivedConfig = {
              agentName: data.agentName || 'AI Assistant',
              welcomeMessage: data.welcomeMessage || "Hey 👋\nI'm here to answer questions about this website.",
              primaryColor: data.primaryColor || '#F97316',
              showBranding: data.showBranding !== false
            };
            setConfig(derivedConfig);
            setMessages([{ role: 'agent', text: derivedConfig.welcomeMessage }]);
          }
        })
        .catch(() => {
          setMessages([{ role: 'agent', text: "Hey 👋\nI'm here to answer questions about this website." }]);
        });
    }
  }, [agentId]);

  const handleSend = async (explicitText?: string) => {
    const finalInput = (explicitText || input).trim();
    if (!finalInput || !agentId || loading) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: finalInput }]);
    setLoading(true);

    try {
      const response = await fetch('/api/widget/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agentId, 
          message: finalInput,
          conversationId
        })
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';
      
      // Add empty agent message that we will populate
      setMessages(prev => [...prev, { role: 'agent', text: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.conversationId) setConversationId(data.conversationId);
              if (data.token) {
                aiText += data.token;
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last && last.role === 'agent') {
                    return [...prev.slice(0, -1), { role: 'agent', text: aiText }];
                  }
                  return prev;
                });
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'agent', text: 'Connection failure. Please check network state and try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = [
    { label: 'Pricing', val: 'What are your pricing plans?' },
    { label: 'Features', val: 'What features do you offer?' },
    { label: 'Contact Support', val: 'How can I contact support?' },
    { label: 'Create AI Agent', val: 'How do I create my own AI agent?' }
  ];

  const handleClose = () => {
    window.parent.postMessage({ type: 'AGENTDESK_WIDGET_CLOSE' }, '*');
  };

  const handleExpand = () => {
     window.parent.postMessage({ type: 'AGENTDESK_WIDGET_EXPAND' }, '*');
  };

  const styles = `
    @keyframes typing {
      0%, 100% { transform: translateY(0); opacity: 0.4; }
      50% { transform: translateY(-4px); opacity: 1; }
    }
    .typing-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: currentColor;
      animation: typing 1.4s infinite ease-in-out;
    }
    .typing-dot:nth-child(1) { animation-delay: 0s; }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    
    .message-bubble {
      animation: message-in 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    @keyframes message-in {
      from { opacity: 0; transform: translateY(8px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    ::-webkit-scrollbar {
      width: 5px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 10px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #cbd5e1;
    }
  `;

  return (
    <div className="flex flex-col h-screen bg-white text-[#1e293b] font-sans antialiased select-none overflow-hidden border border-zinc-200/50">
      <style>{styles}</style>
      
      {/* Premium Header */}
      <header className="px-5 py-4 flex items-center justify-between bg-white border-b border-zinc-100 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div 
            style={{ backgroundColor: config.primaryColor }}
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-black/[0.05]"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[14px] font-bold tracking-tight text-zinc-900">{config.agentName}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-zinc-500">Active now</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleExpand}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button 
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
        {messages.map((m, i) => (
          <div 
            key={i} 
            className={`flex w-full message-bubble ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'agent' && (
              <div 
                style={{ backgroundColor: config.primaryColor + '10' }}
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mr-2.5 mt-0.5 border border-zinc-100"
              >
                <Sparkles style={{ color: config.primaryColor }} className="w-3.5 h-3.5" />
              </div>
            )}
            
            <div 
              style={{
                backgroundColor: m.role === 'user' ? config.primaryColor : '#f8fafc',
                color: m.role === 'user' ? '#ffffff' : '#334155'
              }}
              className={`max-w-[85%] text-[13px] leading-relaxed px-4 py-2.5 shadow-sm ${
                m.role === 'user' 
                  ? 'rounded-2xl rounded-tr-none font-medium' 
                  : 'border border-zinc-100 rounded-2xl rounded-tl-none font-medium'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
          </div>
        ))}

        {/* Suggested Chips Panel */}
        {messages.length === 1 && !loading && (
          <div className="flex flex-wrap gap-2 mt-4 ml-9">
            {suggestedPrompts.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.val)}
                className="text-[12px] font-semibold text-zinc-600 bg-white hover:bg-zinc-50 border border-zinc-200 py-1.5 px-3 rounded-full transition-all active:scale-[0.97] shadow-sm"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Typing Indicator */}
        {loading && messages[messages.length-1]?.role === 'user' && (
          <div className="flex justify-start items-center ml-9">
            <div className="bg-[#f8fafc] border border-zinc-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1 h-[30px]">
              <div className="typing-dot text-zinc-400"></div>
              <div className="typing-dot text-zinc-400"></div>
              <div className="typing-dot text-zinc-400"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-white border-t border-zinc-100 shrink-0">
        <form 
          onSubmit={e => { e.preventDefault(); handleSend(); }} 
          className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2 focus-within:border-zinc-300 focus-within:bg-white transition-all shadow-inner"
        >
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent border-none text-[13px] text-zinc-800 placeholder:text-zinc-400 outline-none py-1.5"
            disabled={loading || !agentId}
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim() || !agentId}
            style={{ 
                backgroundColor: input.trim() ? config.primaryColor : '#e2e8f0',
                opacity: input.trim() ? 1 : 0.6 
            }}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all shrink-0 active:scale-[0.9] shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        
        {config.showBranding && (
          <div className="flex items-center justify-center gap-1.5 mt-3 opacity-50 hover:opacity-100 transition-opacity">
            <a 
              href="https://agentdesk.ai" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 tracking-tight"
            >
              Powered by <span className="text-zinc-900 font-extrabold tracking-tighter">AgentDesk</span>
            </a>
          </div>
        )}
      </footer>
    </div>
  );
}

export default function WidgetChatPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-screen items-center justify-center bg-white gap-3 text-zinc-400 font-semibold text-[10px] uppercase tracking-widest">
         <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
         Initializing
      </div>
    }>
      <ChatWidgetContent />
    </Suspense>
  );
}
