'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Bot, Loader2, Sparkles, Send, RefreshCw, Cpu, 
  Zap, Command
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
            <p className="text-zinc-500 text-[13px] font-bold tracking-wide">Initializing agent connection...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-zinc-500 font-jakarta font-medium text-[14px]">Agent not found or initialized.</div>
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
      <div className="max-w-4xl mx-auto pb-24 px-4 font-jakarta pt-6 antialiased">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-extrabold text-orange-500 tracking-widest uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Live Sandbox
            </div>
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-3">
              {capitalizedAgentName} Preview
            </h1>
            <p className="text-[14px] text-zinc-500 dark:text-zinc-400 mt-2 max-w-xl leading-relaxed font-medium">
              Interact with your custom trained agent in a real-time conversational simulation.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl shadow-xs">
              <Cpu className="w-3.5 h-3.5 text-orange-500" /> GPT-4o
            </div>
            <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl shadow-xs">
              <Zap className="w-3.5 h-3.5 text-emerald-500" /> &lt;50ms Response
            </div>
          </div>
        </div>

        {/* PLAYGROUND WRAPPER: CLEAN, ELEGANT, NATIVE-LIKE */}
        <div className="relative rounded-[32px] bg-white dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col overflow-hidden h-[720px]">
          
          {/* Elegant Header */}
          <div className="px-6 py-4.5 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-11 w-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-xs shrink-0 relative">
                <Bot className="h-6 w-6 text-orange-500" />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-zinc-950 rounded-full" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-extrabold text-zinc-900 dark:text-zinc-100 truncate leading-tight tracking-tight">
                    {capitalizedAgentName}
                  </span>
                </div>
                <p className="text-[12.5px] font-medium text-zinc-500 mt-0.5 truncate flex items-center gap-1.5">
                   Assistant is online and ready
                </p>
              </div>
            </div>
            
            <button 
              onClick={resetConversation}
              title="Reset session history"
              className="h-10 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[13px] font-bold text-zinc-600 bg-white dark:bg-zinc-900 shadow-sm hover:text-red-500 hover:border-red-500/30 dark:text-zinc-300 dark:hover:text-red-400 dark:hover:border-red-500/30 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>

          {/* Chat Thread */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30 dark:bg-zinc-950/20 custom-scrollbar relative"
          >
            {/* Agent Welcome Bubble */}
            <div className="flex gap-3 items-end max-w-[85%] animate-in fade-in duration-300">
              <div className="h-8 w-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 mb-5">
                <Bot className="h-4.5 w-4.5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-extrabold px-2 uppercase tracking-widest">Assistant</span>
                <div className="px-5 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 text-[14.5px] font-medium leading-relaxed rounded-[20px] rounded-bl-sm shadow-sm">
                  {welcomeMessage}
                </div>
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
                    className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto justify-end items-end' : 'justify-start items-end'}`}
                  >
                    {!isUser && (
                      <div className="h-8 w-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 mb-5">
                        <Bot className="h-4.5 w-4.5 text-orange-600 dark:text-orange-400" />
                      </div>
                    )}
                    
                    <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-extrabold px-2 uppercase tracking-widest">
                        {isUser ? 'You' : 'Assistant'}
                      </span>
                      <div 
                        className={`px-5 py-3.5 text-[14.5px] font-medium leading-relaxed whitespace-pre-wrap shadow-sm ${
                          isUser 
                            ? 'text-white rounded-[20px] rounded-br-sm' 
                            : 'bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 text-zinc-800 dark:text-zinc-200 rounded-[20px] rounded-bl-sm'
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
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Typing indicator */}
            {isChatLoading && (
              <div className="flex gap-3 items-end max-w-[85%] animate-in fade-in">
                <div className="h-8 w-8 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 mb-5">
                  <Bot className="h-4.5 w-4.5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-zinc-400 font-extrabold px-2 uppercase tracking-widest">Assistant</span>
                  <div className="px-5 py-4 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-[20px] rounded-bl-sm shadow-sm flex items-center h-[52px]">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-6 pt-4 pb-6 border-t border-zinc-100 dark:border-zinc-800/60 shrink-0">
            
            {/* Suggestions */}
            {messages.length === 0 && (
              <div className="flex gap-2.5 overflow-x-auto pb-4 mb-1 -mx-2 px-2 custom-scrollbar">
                {suggestions.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleChatSubmit(undefined, s)}
                    className="shrink-0 px-4 py-2 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-[13px] font-bold rounded-xl transition-all active:scale-[0.98] whitespace-nowrap shadow-sm cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input */}
            <form 
              onSubmit={handleChatSubmit}
              className="relative flex items-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl p-1.5 focus-within:ring-4 focus-within:ring-orange-500/10 focus-within:border-orange-500/40 dark:focus-within:ring-orange-500/10 dark:focus-within:border-orange-500/30 transition-all duration-200"
            >
              <input 
                type="text" 
                placeholder="Message your agent..."
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={isChatLoading}
                className="flex-1 bg-transparent border-0 outline-none px-4 py-3 text-[14.5px] font-medium text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
              />
              
              <div className="flex items-center gap-2 shrink-0 px-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-extrabold text-zinc-400 bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800 shadow-xs">
                  <Command className="w-3 h-3" /> ENTER
                </span>
                <button 
                  type="submit"
                  disabled={!inputValue.trim() || isChatLoading}
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md disabled:opacity-50 disabled:scale-100 hover:brightness-105 active:scale-[0.96] transition-all cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
