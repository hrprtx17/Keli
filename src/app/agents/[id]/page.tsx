'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Bot, Save, Loader2, Sparkles, Zap, Trash2, Send,
  AlertTriangle, MessageSquare, RefreshCw
} from 'lucide-react';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function AgentPlaygroundPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '',
    systemPrompt: '',
    widgetConfig: {
      primaryColor: '#F97316',
      welcomeMessage: 'Hi! I’m your AI assistant. Ask me anything about your business, services, or support.',
      showBranding: false
    }
  });

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

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || '',
        systemPrompt: agent.systemPrompt || '',
        widgetConfig: {
          primaryColor: agent.widgetConfig?.primaryColor || '#F97316',
          welcomeMessage: agent.widgetConfig?.welcomeMessage || 'Hi! I’m your AI assistant. Ask me anything about your business, services, or support.',
          showBranding: false // Removing by mandate
        }
      });
    }
  }, [agent]);

  const [messages, setMessages] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Handle Scroll to bottom on new messages or status change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isChatLoading]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Changes saved successfully');
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
    } catch (err) {
      toast.error('Error saving changes');
    } finally {
      setIsSaving(false);
    }
  };

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

  const resetConversation = async () => {
     if(window.confirm("Reset current conversational session memory?")) {
        setConversationId(null);
        // Hard reload of local chat state is simpler to just re-mount route or call internal method. 
        // For immediate UI response:
        window.location.reload(); 
     }
  };

  if (isLoading) return <DashboardLayout><div className="p-12 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div></DashboardLayout>;
  if (!agent) return <DashboardLayout><div className="p-12 text-center text-gray-500">Agent not initialized.</div></DashboardLayout>;

  const suggestions = [
    "What services do you offer?",
    "Explain pricing",
    "How can I contact support?"
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pb-16">
        
        {/* HEADER */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">AI Preview</h1>
            <p className="text-[14px] text-gray-500 dark:text-zinc-400 mt-1">Test and customize your AI assistant in real time.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-lg text-[13px] font-medium flex items-center gap-2 hover:bg-zinc-800 dark:hover:bg-white hover:shadow-md shadow-sm transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* MOBILE ORDER HANDLING: Preview renders on TOP in mobile, right in desktop via css order classes */}
          
          {/* LEFT PANEL - Config (45% wide grid split) */}
          <div className="lg:col-span-5 space-y-6 order-2 lg:order-1">
            
            {/* Card 1: AI Model */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center gap-4 group hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
               <div className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-orange-500" />
               </div>
               <div>
                  <h3 className="text-[14px] font-semibold text-gray-900 dark:text-zinc-100">AI Model</h3>
                  <div className="text-[13px] font-medium text-gray-800 dark:text-zinc-200 mt-0.5">Llama 3.1 8B</div>
                  <p className="text-[12px] text-gray-500 dark:text-zinc-400 mt-0.5">Fast conversational responses</p>
               </div>
            </div>

            {/* Card 2: Appearance */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
               <h3 className="text-[15px] font-semibold text-gray-900 dark:text-zinc-100 mb-5">Appearance</h3>
               <div className="space-y-4">
                  <div>
                     <label className="text-[12px] font-medium text-gray-500 dark:text-zinc-400 block mb-1.5">Assistant Name</label>
                     <input 
                       type="text" 
                       value={formData.name}
                       onChange={e => setFormData({...formData, name: e.target.value})}
                       className="w-full bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-[13px] text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none"
                     />
                  </div>
                  <div>
                     <label className="text-[12px] font-medium text-gray-500 dark:text-zinc-400 block mb-1.5">Primary Color</label>
                     <div className="flex gap-3">
                        <div className="relative w-10 h-10 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden shrink-0 shadow-sm">
                           <input 
                             type="color" 
                             className="absolute inset-[-10px] w-[180%] h-[180%] cursor-pointer"
                             value={formData.widgetConfig.primaryColor}
                             onChange={e => setFormData({...formData, widgetConfig: {...formData.widgetConfig, primaryColor: e.target.value}})}
                           />
                        </div>
                        <input 
                          type="text"
                          value={formData.widgetConfig.primaryColor}
                          onChange={e => setFormData({...formData, widgetConfig: {...formData.widgetConfig, primaryColor: e.target.value}})}
                          className="flex-1 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-[13px] font-mono text-gray-700 dark:text-zinc-300 focus:bg-white dark:focus:bg-zinc-900 transition-all outline-none"
                        />
                     </div>
                  </div>
               </div>
            </div>

            {/* Card 3: AI Instructions */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
               <h3 className="text-[15px] font-semibold text-gray-900 dark:text-zinc-100">AI Instructions</h3>
               <p className="text-[12px] text-gray-500 dark:text-zinc-400 mt-1 mb-4">Define how your AI should respond and behave.</p>
               <textarea 
                  value={formData.systemPrompt}
                  onChange={e => setFormData({...formData, systemPrompt: e.target.value})}
                  placeholder="Example: You are a highly effective support agent. Always keep your answers short, friendly, and reference official docs..."
                  className="w-full min-h-[180px] bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl p-4 text-[13px] text-gray-800 dark:text-zinc-200 leading-relaxed focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-orange-500/10 focus:border-orange-400 transition-all outline-none resize-y custom-scrollbar"
               />
            </div>

            {/* Card 4: Danger Zone */}
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
               <h3 className="text-[14px] font-semibold text-gray-900 dark:text-zinc-100 mb-1">Danger Zone</h3>
               <p className="text-[12px] text-gray-500 dark:text-zinc-400 mb-4">Deletes temporary conversation memory and retrains fresh responses.</p>
               <button 
                 onClick={resetConversation}
                 className="w-full flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 bg-white dark:bg-zinc-950 hover:bg-red-50 dark:hover:bg-red-950/20 py-2.5 rounded-xl text-[13px] font-medium transition-all"
               >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset AI Memory
               </button>
            </div>

          </div>

          {/* RIGHT PANEL - Live Preview (55% wide grid split) */}
          <div className="lg:col-span-7 order-1 lg:order-2 flex items-center justify-center bg-[#fcfbfa] dark:bg-zinc-950 rounded-[32px] p-3 sm:p-8 md:p-12 border border-gray-200/50 dark:border-zinc-800/50 shadow-[inset_0_2px_10px_rgba(0,0,0,0.01)] min-h-[500px] sm:min-h-[650px]">
             
             {/* The Main Chat Box */}
             <motion.div 
               initial={{ opacity: 0, y: 20, scale: 0.98 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               transition={{ type: "spring", stiffness: 260, damping: 20 }}
               className="w-full max-w-[420px] h-[520px] sm:h-[680px] bg-white dark:bg-zinc-900 rounded-[24px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)] border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden relative"
             >
                {/* Preview Chat Header */}
                <div 
                  className="px-5 py-4 flex items-center gap-3 border-b border-gray-100 dark:border-zinc-800 shrink-0 text-white transition-colors duration-500"
                  style={{ backgroundColor: formData.widgetConfig.primaryColor }}
                >
                   <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-sm shrink-0">
                      <Bot className="h-5 w-5 fill-current" />
                   </div>
                   <div>
                      <div className="text-[15px] font-semibold leading-tight">{formData.name || 'Assistant'}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <div className="w-2 h-2 bg-white rounded-full animate-pulse opacity-90" />
                         <span className="text-[11px] font-medium text-white/90">Online</span>
                      </div>
                   </div>
                </div>

                {/* Chat Content Flow Area */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FAFAFA] dark:bg-zinc-950/30 custom-scrollbar"
                >
                   {/* Initial Welcome Prompt */}
                   <div className="flex flex-col gap-1 items-start max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="px-4 py-3.5 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-800 dark:text-zinc-100 text-[14px] font-medium leading-relaxed rounded-2xl rounded-tl-sm shadow-sm">
                         {formData.widgetConfig.welcomeMessage}
                      </div>
                   </div>

                   {/* Dynamic Messages Loop */}
                   <AnimatePresence initial={false}>
                      {messages.map((m, idx) => {
                         const isUser = m.role === 'user';
                         return (
                            <motion.div 
                               key={m.id || idx}
                               initial={{ opacity: 0, y: 10, scale: 0.96 }}
                               animate={{ opacity: 1, y: 0, scale: 1 }}
                               className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto items-end' : 'items-start'}`}
                            >
                               <div 
                                  className={`px-4 py-3 text-[14px] font-medium leading-relaxed whitespace-pre-wrap ${
                                    isUser 
                                      ? 'text-white rounded-2xl rounded-tr-sm shadow-md shadow-black/5' 
                                      : 'bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-800 dark:text-zinc-100 rounded-2xl rounded-tl-sm shadow-sm'
                                  }`}
                                  style={isUser ? { backgroundColor: formData.widgetConfig.primaryColor } : {}}
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
                         )
                      })}
                   </AnimatePresence>

                   {/* Typing Loading State */}
                   {isChatLoading && (
                      <div className="flex items-start max-w-[85%] animate-in fade-in">
                         <div className="px-4 py-3 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                            <div className="flex gap-1">
                               <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-zinc-600 rounded-full animate-bounce" />
                               <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                               <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                            </div>
                         </div>
                      </div>
                   )}
                </div>

                {/* Interactions Bar (Fixed Bottom) */}
                <div className="bg-white dark:bg-zinc-900 px-4 pt-2 pb-4 border-t border-gray-100 dark:border-zinc-800 shrink-0">
                   
                   {/* Suggestion Chips */}
                   <div className="flex gap-2 mb-3 overflow-x-auto custom-scrollbar pb-1 -mx-1 px-1">
                      {suggestions.map((s, i) => (
                         <button 
                           key={i} 
                           onClick={() => handleChatSubmit(undefined, s)}
                           className="shrink-0 px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 text-gray-600 dark:text-zinc-300 text-[12px] font-medium rounded-full transition-all shadow-sm whitespace-nowrap active:scale-95"
                         >
                            {s}
                         </button>
                      ))}
                   </div>

                   {/* Main Floating Input */}
                   <form 
                     onSubmit={handleChatSubmit}
                     className="relative flex items-center bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all rounded-2xl px-2 py-1.5 group focus-within:border-gray-300 dark:focus-within:border-zinc-700"
                   >
                      <input 
                        type="text" 
                        placeholder="Ask your AI assistant..."
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        disabled={isChatLoading}
                        className="flex-1 bg-transparent border-0 outline-none px-3 py-2 text-[14px] font-medium text-gray-800 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                      />
                      <button 
                        type="submit"
                        disabled={!inputValue.trim() || isChatLoading}
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-md disabled:opacity-40 disabled:shadow-none transition-all active:scale-95 shrink-0"
                        style={{ backgroundColor: formData.widgetConfig.primaryColor }}
                      >
                         <Send className="h-4 w-4" />
                      </button>
                   </form>
                </div>

             </motion.div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
