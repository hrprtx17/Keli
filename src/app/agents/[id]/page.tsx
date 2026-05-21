'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Bot, Loader2, Sparkles, Send, RefreshCw, Cpu, 
  Zap, Command, ShieldCheck
} from 'lucide-react';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function AgentPlaygroundPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!id
  });

  const [messages, setMessages] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isChatLoading]);

  const handleChatSubmit = async (e?: React.FormEvent, forcedText?: string) => {
    e?.preventDefault();
    const text = forcedText || inputValue;
    if (!text.trim() || isChatLoading) return;
    
    const userMsg = { role: 'user', parts: [{ type: 'text', text }] };
    setMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);
    if (!forcedText) setInputValue("");

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          agentId: id,
          conversationId
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chat engine offline');

      setMessages(prev => [...prev, { role: 'assistant', parts: [{ type: 'text', text: data.reply }] }]);
      if (data.conversationId) setConversationId(data.conversationId);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Connection failure');
    } finally {
      setIsChatLoading(false);
    }
  };

  const resetConversation = () => {
    setConversationId(null);
    setMessages([]);
    toast.success("Conversation history reset");
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[70vh] w-full items-center justify-center font-jakarta">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-zinc-500 text-xs font-bold">Loading assistant playground...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-gray-500 font-jakarta">Agent not initialized.</div>
      </DashboardLayout>
    );
  }

  const primaryColor = agent.widgetConfig?.primaryColor || '#F97316';
  const welcomeMessage = agent.widgetConfig?.welcomeMessage || 'Hi! I’m your AI assistant. Ask me anything about your business, services, or support.';

  const capitalizedAgentName = agent.name
    ? agent.name.trim().split(' ').map((w: string) => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '').join(' ')
    : 'Agent';

  const suggestions = [
    "What services do you offer?",
    "Explain pricing models",
    "How do I reach human support?"
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto pb-24 px-4 font-jakarta">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-orange-500 dark:text-orange-400 tracking-wider uppercase mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> LIVE PLAYGROUND
            </div>
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">AI Agent Preview</h1>
            <p className="text-[14.5px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl leading-relaxed">
              Test your custom trained agent <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{capitalizedAgentName}</span> in a real-time conversational simulation.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-zinc-100/60 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 rounded-xl p-2 shrink-0">
            <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-200/20 shadow-xs">
              <Cpu className="w-3.5 h-3.5 text-orange-500" /> GPT-4o
            </span>
            <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-200/20 shadow-xs">
              <Zap className="w-3.5 h-3.5 text-blue-500" /> Vector Latency: 42ms
            </span>
          </div>
        </div>

        {/* PLAYGROUND WRAPPER: UPSCALED, GRAPH/PATTERN BACKDROP */}
        <div className="relative rounded-[32px] border border-zinc-200/50 dark:border-zinc-800/60 p-4 sm:p-8 bg-zinc-50/40 dark:bg-zinc-900/10 backdrop-blur-xl shadow-xs overflow-hidden min-h-[680px] flex items-center justify-center">
          
          {/* Neon Glow Highlights */}
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

          {/* SaaS Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.08] pointer-events-none" 
               style={{ 
                 backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`, 
                 backgroundSize: '24px 24px' 
               }} 
          />

          {/* MAIN CHATBOX SYSTEM - UPSCALED TO max-w-[760px] */}
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="relative z-10 w-full max-w-[780px] h-[640px] bg-white/90 dark:bg-zinc-950/85 backdrop-blur-md rounded-[28px] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.06)] dark:shadow-[0_24px_60px_-16px_rgba(0,0,0,0.55)] border border-zinc-200/60 dark:border-zinc-850/80 flex flex-col overflow-hidden"
          >
            {/* Elegant Header with Controls */}
            <div className="px-6 py-4.5 flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 bg-zinc-50/40 dark:bg-zinc-900/30 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-xs shrink-0">
                  <Bot className="h-5.5 w-5.5 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">

                    <span className="text-[14.5px] font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">{capitalizedAgentName}</span>
                    <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-md">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Sandbox Live
                    </span>
                  </div>
                  <p className="text-[11.5px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5 truncate max-w-[320px]">
                    Custom intelligence rules active
                  </p>
                </div>
              </div>
              
              <button 
                onClick={resetConversation}
                title="Reset session history"
                className="h-9 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[12.5px] font-bold text-zinc-500 hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/20 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-950/20 dark:hover:border-red-950/40 flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset Chat</span>
              </button>
            </div>

            {/* Chat Thread Messaging Section */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-zinc-50/10 dark:bg-zinc-950/10 custom-scrollbar"
            >
              {/* Agent Welcome Bubble */}
              <div className="flex gap-3.5 items-start max-w-[85%] animate-in fade-in duration-300">
                <div className="h-8.5 w-8.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4.5 w-4.5 text-zinc-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="px-4.5 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/30 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-200 text-[14px] font-medium leading-relaxed rounded-2xl rounded-tl-xs shadow-xs">
                    {welcomeMessage}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-bold px-1.5">Assistant</span>
                </div>
              </div>

              {/* Dynamic Conversation Bubble Loop */}
              <AnimatePresence initial={false}>
                {messages.map((m, idx) => {
                  const isUser = m.role === 'user';
                  return (
                    <motion.div 
                      key={m.id || idx}
                      initial={{ opacity: 0, y: 10, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex gap-3.5 max-w-[85%] ${isUser ? 'ml-auto justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="h-8.5 w-8.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center shrink-0">
                          <Bot className="h-4.5 w-4.5 text-zinc-500" />
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-1 max-w-full">
                        <div 
                          className={`px-4.5 py-3 text-[14px] font-medium leading-relaxed whitespace-pre-wrap ${
                            isUser 
                              ? 'text-white rounded-2xl rounded-tr-xs shadow-xs font-medium' 
                              : 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/30 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-200 rounded-2xl rounded-tl-xs shadow-xs'
                          }`}
                          style={isUser ? { backgroundColor: primaryColor } : {}}
                        >
                          {m.parts && Array.isArray(m.parts) ? (
                            m.parts.map((part: any, pIdx: number) => 
                              part.type === 'text' ? <span key={pIdx}>{part.text}</span> : null
                            )
                          ) : (
                            <span>{m.content || (m as any).text || ''}</span>
                          )}
                        </div>
                        <span className={`text-[10px] text-zinc-400 font-bold px-1.5 ${isUser ? 'text-right' : ''}`}>
                          {isUser ? 'You' : 'Assistant'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Typing bubble */}
              {isChatLoading && (
                <div className="flex gap-3.5 items-start max-w-[85%] animate-in fade-in">
                  <div className="h-8.5 w-8.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center shrink-0">
                    <Bot className="h-4.5 w-4.5 text-zinc-500" />
                  </div>
                  <div className="px-4 py-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/30 dark:border-zinc-800/80 rounded-2xl rounded-tl-xs shadow-xs flex items-center">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Float Input bar with quick suggestions */}
            <div className="bg-zinc-50/40 dark:bg-zinc-900/30 backdrop-blur-md px-5 pt-3 pb-5 border-t border-zinc-200/40 dark:border-zinc-850 shrink-0">
              
              {/* Suggestion Bubbles */}
              {messages.length === 0 && (
                <div className="flex gap-2 overflow-x-auto pb-3.5 mb-2 -mx-1 px-1 custom-scrollbar">
                  {suggestions.map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleChatSubmit(undefined, s)}
                      className="shrink-0 px-3.5 py-2 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-300 text-[12px] font-bold rounded-xl transition-all active:scale-[0.97] whitespace-nowrap shadow-2xs hover:shadow-xs cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Text Input Form */}
              <form 
                onSubmit={handleChatSubmit}
                className="relative flex items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-xl px-2 py-1.5 focus-within:ring-4 focus-within:ring-orange-500/5 focus-within:border-orange-500/40 dark:focus-within:ring-orange-500/10 dark:focus-within:border-orange-500/30 transition-all duration-200"
              >
                <input 
                  type="text" 
                  placeholder="Ask your assistant anything..."
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  disabled={isChatLoading}
                  className="flex-1 bg-transparent border-0 outline-none px-3.5 py-1.5 text-[14px] font-medium text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                />
                
                <div className="flex items-center gap-1.5 shrink-0 px-1">
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md border border-zinc-200/20">
                    <Command className="w-2.5 h-2.5" /> ENTER
                  </span>
                  <button 
                    type="submit"
                    disabled={!inputValue.trim() || isChatLoading}
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-xs disabled:opacity-40 disabled:scale-100 hover:brightness-105 active:scale-[0.96] transition-all cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>

          </motion.div>

        </div>
      </div>
    </DashboardLayout>
  );
}
