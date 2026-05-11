'use client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Bot, ArrowLeft, Save, RefreshCw, Sparkles, Zap, Trash2, CornerDownLeft, Mic, Send, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AgentPlaygroundPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    systemPrompt: '',
    description: '',
    widgetConfig: {
      primaryColor: '#F97316',
      welcomeMessage: 'Hi! What can I help you with?',
      showBranding: true
    }
  });

  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([]);
  const [inputVal, setInputVal] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic scroll capture hook
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory, chatLoading]);

  const sendMessage = async () => {
    if (!inputVal.trim() || chatLoading) return;
    
    const userMsg = { role: 'user', content: inputVal.trim() };
    setChatHistory(prev => [...prev, userMsg]);
    setInputVal('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          agentId: id,
          conversationId
        })
      });
      
      const data = await res.json();
      
      if (data.reply) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
        if (data.conversationId) setConversationId(data.conversationId);
      } else if (data.error) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${data.error}` }]);
      }
    } catch (err) {
      toast.error('Transmission failure');
      setChatHistory(prev => [...prev, { role: 'assistant', content: '⚠️ Network communication error.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }
  });

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || '',
        description: agent.description || '',
        systemPrompt: agent.systemPrompt || '',
        widgetConfig: {
          primaryColor: agent.widgetConfig?.primaryColor || '#F97316',
          welcomeMessage: agent.widgetConfig?.welcomeMessage || 'Hi! What can I help you with?',
          showBranding: agent.widgetConfig?.showBranding !== false
        }
      });
    }
  }, [agent]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Agent configuration committed');
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
    } catch (err) {
      toast.error('Commit error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <DashboardLayout><div className="p-8 animate-pulse h-full"><div className="h-full bg-muted rounded-xl" /></div></DashboardLayout>;
  if (!agent) return <DashboardLayout><div className="p-8">Agent not initialized.</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full min-h-screen -m-4 sm:-m-6 md:-m-8 lg:-m-10 overflow-hidden">
        
        {/* Sub Header breadcrumb explicitly tailored like user's top bar */}
        <div className="flex items-center justify-between px-6 h-14 border-b bg-card shrink-0">
           <div className="flex items-center gap-3 text-[13px]">
              <Link href="/agents" className="text-muted-foreground hover:text-foreground transition-colors">Agents</Link>
              <span className="text-muted-foreground/50">/</span>
              <span className="font-semibold flex items-center gap-1.5">
                 {agent.name} 
                 <span className="bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">Agent</span>
              </span>
           </div>
           <div className="flex items-center gap-3">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-black hover:bg-zinc-800 text-white font-bold text-xs h-8 px-4 rounded-lg shadow-sm"
              >
                 {isSaving ? <RefreshCw className="h-3 w-3 animate-spin mr-1.5"/> : <Save className="h-3 w-3 mr-1.5"/>}
                 Save
              </Button>
           </div>
        </div>

        {/* Split Window Context */}
        <div className="flex flex-1 overflow-hidden bg-card">
           
           {/* LEFT PANE: Configurations (Matches the scrolling left context form) */}
           <div className="w-full md:w-[360px] lg:w-[420px] border-r border-border/60 overflow-y-auto bg-card custom-scrollbar relative">
             <div className="p-6 space-y-8 pb-20">
                
                {/* Model Config Box */}
                <div className="space-y-3">
                   <Label className="text-[13px] font-bold text-foreground/80">Model Base</Label>
                   <div className="relative rounded-lg border bg-card p-3 flex items-center justify-between group cursor-default hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="h-8 w-8 bg-muted/50 border rounded-lg flex items-center justify-center"><Sparkles className="h-4 w-4 text-primary" /></div>
                         <div>
                           <p className="text-[13px] font-bold">Llama 3.1 - 8B</p>
                           <p className="text-[10px] text-muted-foreground">Standard inference engine</p>
                         </div>
                      </div>
                      <span className="text-[10px] font-black text-muted-foreground uppercase border px-1.5 rounded bg-muted">Fixed</span>
                   </div>
                </div>

                {/* Action / Widget Theme Setup */}
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <Label className="text-[13px] font-bold text-foreground/80">Widget Theme</Label>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground/70">Primary Color</span>
                        <div className="flex gap-2">
                           <div className="relative h-9 w-9 shrink-0 rounded-lg border overflow-hidden">
                              <input 
                                type="color" 
                                className="absolute inset-[-10px] w-[150%] h-[150%] cursor-pointer"
                                value={formData.widgetConfig.primaryColor}
                                onChange={e => setFormData({...formData, widgetConfig: {...formData.widgetConfig, primaryColor: e.target.value}})}
                              />
                           </div>
                           <Input 
                              value={formData.widgetConfig.primaryColor}
                              onChange={e => setFormData({...formData, widgetConfig: {...formData.widgetConfig, primaryColor: e.target.value}})}
                              className="h-9 text-xs font-mono"
                           />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                         <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground/70">Identity</span>
                         <Input 
                           value={formData.name} 
                           onChange={e => setFormData({...formData, name: e.target.value})}
                           className="h-9 text-xs"
                         />
                      </div>
                   </div>
                </div>

                {/* Instructions / System Prompt (Exactly matches the text area shown on screenshot) */}
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <Label className="text-[13px] font-bold text-foreground/80">Instructions (System prompt)</Label>
                      <button className="text-muted-foreground hover:text-foreground"><RefreshCw className="h-3 w-3"/></button>
                   </div>
                   <div className="border rounded-xl bg-muted/5 overflow-hidden focus-within:ring-2 ring-primary/20 ring-offset-0 border-border/80 shadow-inner-sm">
                      <div className="h-10 border-b bg-muted/30 px-3 flex items-center text-[12px] font-bold text-muted-foreground justify-between">
                         <span>Base Instructions</span>
                         <ChevronRight className="h-3 w-3 rotate-90" />
                      </div>
                      <textarea 
                        className="w-full min-h-[350px] p-4 text-[13px] font-medium leading-relaxed bg-transparent border-0 focus:ring-0 resize-none custom-scrollbar text-foreground"
                        placeholder="Define how the AI should act..."
                        value={formData.systemPrompt}
                        onChange={e => setFormData({...formData, systemPrompt: e.target.value})}
                      />
                   </div>
                </div>

                {/* Danger Area */}
                <div className="pt-6 border-t border-dashed">
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs"
                     onClick={() => {
                       if (window.confirm("Verify permanent removal")) {
                          fetch(`/api/agents/${id}`, { method: 'DELETE' }).then(() => router.push('/agents'));
                       }
                     }}
                   >
                     <Trash2 className="h-3.5 w-3.5"/> Destroy Agent Context
                   </Button>
                </div>

             </div>
           </div>

           {/* RIGHT PANE: PLAYGROUND CANVAS (Matches dotted canvas window perfectly) */}
           <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#fafafa] dark:bg-zinc-950">
              
              {/* Grid Dot Pattern Canvas Overlay */}
              <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.6]"
                   style={{ 
                     backgroundImage: `radial-gradient(circle, #e5e7eb 1.5px, transparent 1.5px)`, 
                     backgroundSize: '24px 24px' 
                   }} 
              />
              <div className="absolute inset-0 dark:hidden z-0 pointer-events-none opacity-[0.4]"
                   style={{ 
                     backgroundImage: `radial-gradient(circle, #000000 1px, transparent 1px)`, 
                     backgroundSize: '24px 24px' 
                   }} 
              />

              {/* Live Previsualization Widget (Matches exact physical aesthetics of visual preview) */}
              <div className="relative z-10 w-full max-w-[420px] h-[650px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl shadow-black/10 border flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
                  
                  {/* Widget Top Bar (Dynamically colored via state) */}
                  <div className="h-16 w-full px-5 flex items-center justify-between shrink-0 transition-colors duration-500" 
                       style={{ backgroundColor: formData.widgetConfig.primaryColor }}>
                     <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                           <Zap className="h-4.5 w-4.5 text-white fill-current" />
                        </div>
                        <span className="font-bold text-white text-[15px] tracking-wide">{formData.name || 'X1 Chat'}</span>
                     </div>
                     <button className="text-white/70 hover:text-white"><RefreshCw className="h-4 w-4" /></button>
                  </div>

                  {/* Live Message Content View */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-card custom-scrollbar" ref={chatContainerRef}>
                     
                     {/* AI Greeting */}
                     <div className="flex flex-col items-start space-y-1 max-w-[85%] animate-in slide-in-from-bottom-2 duration-300">
                        <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-muted text-foreground text-sm font-medium leading-relaxed border">
                           {formData.widgetConfig.welcomeMessage || 'Hi! What can I help you with?'}
                        </div>
                     </div>

                     {/* Real Thread Iterator */}
                     {chatHistory.map((msg, idx) => (
                        <div 
                          key={idx} 
                          className={`flex flex-col space-y-1 max-w-[85%] animate-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'ml-auto items-end' : 'items-start'}`}
                        >
                           <div 
                             className={`px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed ${
                               msg.role === 'user' 
                                 ? 'rounded-tr-none text-white shadow-sm' 
                                 : 'rounded-tl-none bg-muted text-foreground border'
                             }`}
                             style={msg.role === 'user' ? { backgroundColor: formData.widgetConfig.primaryColor } : {}}
                           >
                              {msg.content}
                           </div>
                        </div>
                     ))}

                     {chatLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground text-xs animate-pulse font-medium ml-1">
                           <div className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                           <div className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                           <div className="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce"></div>
                        </div>
                     )}

                  </div>

                  {/* Footer Input Loop */}
                  <div className="px-4 py-3 border-t bg-card flex flex-col items-center shrink-0 gap-3">
                     {formData.widgetConfig.showBranding && (
                       <div className="text-[10px] font-bold text-muted-foreground/60 flex items-center gap-1 select-none">
                          <div className="h-3.5 w-3.5 bg-muted rounded flex items-center justify-center font-black">A</div> Powered by AgentDesk
                       </div>
                     )}
                     <form 
                       onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                       className="w-full relative"
                     >
                        <div className="h-11 w-full rounded-full border bg-muted/10 px-4 flex items-center gap-2 focus-within:ring-2 ring-primary/20 border-border/80 transition-all group shadow-inner-sm">
                           <input 
                              type="text" 
                              value={inputVal}
                              onChange={(e) => setInputVal(e.target.value)}
                              disabled={chatLoading}
                              placeholder="Ask anything..." 
                              className="flex-1 h-full bg-transparent text-sm font-medium placeholder:text-muted-foreground outline-none border-0"
                           />
                           <button 
                             type="submit"
                             disabled={!inputVal.trim() || chatLoading}
                             className="h-7 w-7 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-50 shadow-sm"
                             style={{ backgroundColor: formData.widgetConfig.primaryColor }}
                           >
                             <Send className="h-3.5 w-3.5" />
                           </button>
                        </div>
                     </form>
                  </div>

              </div>
           </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

// In case it wasn't defined elsewhere in scope, adding standard scrollbar concealment Utility within TS
function styleFix() {
  return (
    <style>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 5px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e5e7eb;
        border-radius: 10px;
      }
      .dark .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #3f3f46;
      }
    `}</style>
  )
}
