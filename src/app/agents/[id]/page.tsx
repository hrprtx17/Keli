'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Bot, Loader2, Sparkles, Send, RefreshCw
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
        <div className="flex h-[70vh] w-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-zinc-500 text-xs font-semibold">Loading assistant preview...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-gray-500">Agent not initialized.</div>
      </DashboardLayout>
    );
  }

  const primaryColor = agent.widgetConfig?.primaryColor || '#F97316';
  const welcomeMessage = agent.widgetConfig?.welcomeMessage || 'Hi! I’m your AI assistant. Ask me anything about your business, services, or support.';

  const suggestions = [
    "What services do you offer?",
    "Explain pricing",
    "How can I contact support?"
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-16 px-4">
        
        {/* HEADER */}
        <div className="text-center sm:text-left mb-8">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] font-bold text-orange-600 dark:text-orange-400 tracking-wider uppercase mb-1.5">
            <Sparkles className="w-3.5 h-3.5 fill-current" /> Live Agent Sandbox
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-50 tracking-tight">AI Preview</h1>
          <p className="text-[14px] text-gray-500 dark:text-zinc-400 mt-1">Interact with <span className="font-bold text-zinc-800 dark:text-zinc-200">{agent.name}</span> in real-time to test its knowledge base and training.</p>
        </div>

        {/* CENTERED PLAYGROUND CHAT BOX */}
        <div className="flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-200/50 dark:border-zinc-850 rounded-[28px] p-3 sm:p-6 md:p-10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.01)] min-h-[500px]">
          
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="w-full max-w-[500px] h-[550px] sm:h-[620px] bg-white dark:bg-zinc-900 rounded-[24px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] border border-gray-150 dark:border-zinc-800 flex flex-col overflow-hidden relative"
          >
            {/* Header */}
            <div 
              className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 shrink-0 text-white shadow-sm transition-colors duration-500"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-sm shrink-0">
                  <Bot className="h-4.5 w-4.5 fill-current" />
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold truncate leading-tight">{agent.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-semibold text-white/95">Active Preview</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={resetConversation}
                title="Reset chat memory"
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-95 shrink-0"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-zinc-50/20 dark:bg-zinc-950/20 custom-scrollbar"
            >
              {/* Welcome Message */}
              <div className="flex flex-col gap-1 items-start max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="px-4 py-3 bg-white dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800 text-gray-800 dark:text-zinc-100 text-[13.5px] font-medium leading-relaxed rounded-2xl rounded-tl-sm shadow-xs">
                  {welcomeMessage}
                </div>
              </div>

              {/* Chat Thread */}
              <AnimatePresence initial={false}>
                {messages.map((m, idx) => {
                  const isUser = m.role === 'user';
                  return (
                    <motion.div 
                      key={m.id || idx}
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto items-end' : 'items-start'}`}
                    >
                      <div 
                        className={`px-4 py-2.5 text-[13.5px] font-medium leading-relaxed whitespace-pre-wrap ${
                          isUser 
                            ? 'text-white rounded-2xl rounded-tr-sm shadow-xs' 
                            : 'bg-white dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800 text-gray-800 dark:text-zinc-100 rounded-2xl rounded-tl-sm shadow-xs'
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
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Loading indicator */}
              {isChatLoading && (
                <div className="flex items-start max-w-[85%] animate-in fade-in">
                  <div className="px-4 py-3 bg-white dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800 rounded-2xl rounded-tl-sm shadow-xs flex items-center">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-zinc-500 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input / Suggestions bar */}
            <div className="bg-white dark:bg-zinc-900 px-4 pt-2 pb-4 border-t border-gray-100 dark:border-zinc-800 shrink-0">
              {/* Suggestions */}
              {messages.length === 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 -mx-1 px-1 custom-scrollbar">
                  {suggestions.map((s, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleChatSubmit(undefined, s)}
                      className="shrink-0 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-[11.5px] font-semibold rounded-full transition-all active:scale-95 whitespace-nowrap"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Form Input */}
              <form 
                onSubmit={handleChatSubmit}
                className="relative flex items-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] rounded-xl px-2 py-1 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-all duration-200"
              >
                <input 
                  type="text" 
                  placeholder="Ask your AI assistant..."
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  disabled={isChatLoading}
                  className="flex-1 bg-transparent border-0 outline-none px-2.5 py-2 text-[13.5px] font-medium text-gray-800 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-650"
                />
                <button 
                  type="submit"
                  disabled={!inputValue.trim() || isChatLoading}
                  className="h-8.5 w-8.5 rounded-lg flex items-center justify-center text-white shadow-xs disabled:opacity-40 disabled:scale-100 hover:brightness-105 active:scale-95 transition-all shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </motion.div>

        </div>
      </div>
    </DashboardLayout>
  );
}
