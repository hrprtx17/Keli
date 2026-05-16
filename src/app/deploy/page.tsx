'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Code2, Copy, Check, Globe, CheckCircle2, 
  Frame, Tablet, Plus, Trash2, ArrowRight,
  Sparkles, Palette, MessageSquare, Save, Loader2, Laptop
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

const PRESET_COLORS = [
  { hex: '#F97316', label: 'Orange Accent' },
  { hex: '#000000', label: 'Jet Black' },
  { hex: '#3B82F6', label: 'Ocean Blue' },
  { hex: '#8B5CF6', label: 'Royal Violet' },
  { hex: '#EC4899', label: 'Classic Pink' },
  { hex: '#10B981', label: 'Active Emerald' },
];

function DeployPageContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agentId');
  const queryClient = useQueryClient();
  
  const [copied, setCopied] = useState<string | null>(null);
  const [activeMethod, setActiveMethod] = useState<'widget' | 'frame' | 'sdk'>('widget');
  const [activeView, setActiveView] = useState<'setup' | 'customize'>('setup');

  // Live Cust State
  const [primaryColor, setPrimaryColor] = useState('#F97316');
  const [welcomeMessage, setWelcomeMessage] = useState('Hi there! How can I help you today?');
  const [isSaving, setIsSaving] = useState(false);

  // Security Domains State
  const [newDomain, setNewDomain] = useState('');

  // Fetch Workspace
  const { data: workspace } = useQuery({
    queryKey: ['workspace'],
    queryFn: async () => {
      const r = await fetch('/api/workspace');
      return r.json();
    }
  });

  // Fetch Agent Info
  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      if (!agentId) return null;
      const res = await fetch(`/api/agents/${agentId}`);
      const data = await res.json();
      
      // Hydrate customization states
      if (data?.widgetConfig) {
        if (data.widgetConfig.primaryColor) setPrimaryColor(data.widgetConfig.primaryColor);
        if (data.widgetConfig.welcomeMessage) setWelcomeMessage(data.widgetConfig.welcomeMessage);
      }
      return data;
    },
    enabled: !!agentId
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  // Real Database Persistence for Customization Options
  const saveCustomization = async () => {
    if (!agentId) return;
    setIsSaving(true);
    try {
      const r = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetConfig: {
            primaryColor,
            welcomeMessage,
            showBranding: true
          }
        })
      });
      if (!r.ok) throw new Error('Persistence rejection.');
      toast.success('Widget configurations deployed successfully!');
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    } catch (err) {
      toast.error('Failed to save configurations.');
    } finally {
      setIsSaving(false);
    }
  };

  // Real Allowed Domains Database Writer
  const saveDomains = async (nextDomains: string[]) => {
     try {
        const r = await fetch('/api/workspace', {
           method: 'PATCH',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ allowedDomains: nextDomains })
        });
        if (!r.ok) throw new Error();
        queryClient.invalidateQueries({ queryKey: ['workspace'] });
     } catch (e) {
        toast.error('Could not synchronize domain whitelist.');
     }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!newDomain) return;
     const clean = newDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/\/.*/, '').trim();
     
     if (clean) {
        const currentDomains = workspace?.allowedDomains || [];
        if (!currentDomains.includes(clean)) {
           const next = [...currentDomains, clean];
           setNewDomain('');
           toast.success(`Successfully whitelisted ${clean}`);
           await saveDomains(next);
        } else {
           toast.warning('Domain already exists in list.');
        }
     }
  };

  const removeDomain = async (d: string) => {
     const next = (workspace?.allowedDomains || []).filter((x: string) => x !== d);
     await saveDomains(next);
     toast.success('Removed domain from security clearance.');
  };

  const [origin, setOrigin] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  if (!agentId) return <DashboardLayout><div className="p-12 text-center text-gray-500 font-medium">Please select an agent from the sidebar context.</div></DashboardLayout>;
  if (isLoading) return <DashboardLayout><div className="p-12 flex justify-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  const actualOrigin = origin || 'https://agentdesk.vercel.app';

  const scripts = {
    widget: `<!-- AgentDesk AI Assistant Widget -->\n<script\n  src="${actualOrigin}/agentdesk.js"\n  data-agent-id="${agentId}"\n  async\n></script>`,
    frame: `<iframe \n  src="${actualOrigin}/widget/chat?agent=${agentId}"\n  width="100%" \n  height="600px" \n  frameborder="0" \n  style="border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden;"\n  allow="microphone; clipboard-write"\n></iframe>`,
    sdk: `import { AgentWidget } from '@agentdesk/react';\n\nexport default function App() {\n  return (\n    <AgentWidget \n      agentId="${agentId}" \n      themeColor="${primaryColor}" \n    />\n  );\n}`
  };

  const methods = [
     { id: 'widget', label: 'Website Widget', desc: 'Lightweight async floating button launcher.', icon: Globe },
     { id: 'frame', label: 'Inline Iframe', desc: 'Static embed designed for content areas.', icon: Frame },
     { id: 'sdk', label: 'React Context', desc: 'Component level React integration hook.', icon: Tablet }
  ];

  const activeDomains = workspace?.allowedDomains || [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pb-24 px-4 sm:px-6">
         
         {/* TOP ROW */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8">
            <div>
               <div className="flex items-center gap-2 text-[10px] font-bold text-orange-600 dark:text-orange-400 tracking-wider uppercase mb-1">
                  Deployment Platform
               </div>
               <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                 Go Live: {agent?.name || 'Assistant'}
                 {agent?.isActive ? (
                   <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                     <div className="w-1 h-1 rounded-full bg-emerald-500" /> Live
                   </span>
                 ) : (
                   <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                     <div className="w-1 h-1 rounded-full bg-zinc-500" /> Offline
                   </span>
                 )}
               </h1>
               <p className="text-[14px] text-gray-500 dark:text-zinc-400 mt-1">
                  Acquire the embed script and deploy to any tech stack instantly.
               </p>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={async () => {
                  const next = !agent?.isActive;
                  try {
                    await fetch(`/api/agents/${agentId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ isActive: next })
                    });
                    queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
                    toast.success(next ? 'Agent is now LIVE' : 'Agent taken offline');
                  } catch (e) {
                    toast.error('Status update failed');
                  }
                }}
                className={`h-10 px-6 rounded-xl font-bold text-[13px] transition-all shadow-sm ${
                  agent?.isActive 
                  ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200' 
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {agent?.isActive ? 'Take Offline' : 'Go Live Now'}
              </button>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center bg-gray-100/80 dark:bg-zinc-800/50 p-1 rounded-xl border border-gray-200/40 dark:border-zinc-800 shrink-0 self-start">
               <button 
                 onClick={() => setActiveView('setup')}
                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                    activeView === 'setup' ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                 }`}
               >
                  <Code2 className="w-3.5 h-3.5" /> Setup Snippet
               </button>
               <button 
                 onClick={() => setActiveView('customize')}
                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                    activeView === 'customize' ? 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                 }`}
               >
                  <Palette className="w-3.5 h-3.5" /> Widget Designer
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* MAIN ZONE */}
            <div className="lg:col-span-2">
               <AnimatePresence mode="wait">
                  
                  {activeView === 'setup' ? (
                     <motion.div 
                       key="setupView"
                       initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                       transition={{ duration: 0.2 }}
                       className="space-y-6"
                     >
                        {/* 1. CHOOSE CHANNEL */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                           {methods.map(m => {
                              const isAct = activeMethod === m.id;
                              return (
                                 <button 
                                   key={m.id} 
                                   onClick={() => setActiveMethod(m.id as any)}
                                   className={`relative flex flex-col p-4 rounded-[20px] border text-left transition-all ${
                                      isAct ? 'border-black dark:border-zinc-100 bg-white dark:bg-zinc-900 shadow-md shadow-black/[0.03] ring-2 ring-black/5 dark:ring-zinc-100/10 scale-[1.01]' : 'border-gray-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900'
                                   }`}
                                 >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3.5 transition-all ${isAct ? 'bg-black dark:bg-zinc-100 text-white dark:text-black shadow-sm' : 'bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400'}`}>
                                       <m.icon className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="font-bold text-[13px] text-gray-900 dark:text-zinc-100 mb-0.5">{m.label}</div>
                                    <div className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">{m.desc}</div>
                                    {m.id === 'widget' && (
                                       <span className="absolute top-3 right-3 bg-orange-500 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-sm">Best</span>
                                    )}
                                 </button>
                              )
                           })}
                        </div>

                        {/* 2. SNIPPET VIEWER */}
                        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[24px] p-6 sm:p-7 shadow-sm">
                           <div className="flex items-center justify-between gap-4 mb-5">
                              <div>
                                 <h2 className="text-[15px] font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                                    Installation Segment
                                 </h2>
                                 <p className="text-[12px] text-gray-500 dark:text-zinc-400 mt-0.5">Copy and append within the &lt;body&gt; boundary.</p>
                              </div>
                              <button 
                                 onClick={() => handleCopy(scripts[activeMethod], 'Integration Script')}
                                 className="flex items-center gap-1.5 h-9 px-4 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 text-[12px] font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-white transition-all active:scale-95 shrink-0 shadow-sm"
                              >
                                 {copied === 'Integration Script' ? <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600 stroke-[3px]" /> : <Copy className="w-3.5 h-3.5" />}
                                 {copied === 'Integration Script' ? 'Copied' : 'Copy Embed'}
                              </button>
                           </div>

                           {/* CODE PREVIEW */}
                           <div className="relative rounded-2xl overflow-hidden bg-[#0d1117] border border-[#21262d] shadow-inner mb-6">
                              <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-[#21262d] text-[10px] font-bold tracking-wider uppercase font-mono text-gray-400">
                                 <span className="flex items-center gap-2"><Laptop className="w-3 h-3 opacity-70" /> {activeMethod === 'sdk' ? 'App.tsx' : 'index.html'}</span>
                              </div>
                              <pre className="p-4 font-mono text-[12px] leading-relaxed text-zinc-300 overflow-x-auto whitespace-pre select-all">
                                 <code>{scripts[activeMethod]}</code>
                              </pre>
                           </div>

                           {/* Visual Vert Steps */}
                           <div className="pt-2 space-y-5 ml-1">
                              <div className="flex gap-4 items-start">
                                 <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-[11px] shrink-0 border border-gray-200/50 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">1</div>
                                 <div>
                                    <h4 className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">Include JavaScript File</h4>
                                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">Insert this single script anywhere on your site. It initiates the loader asynchronously and won&apos;t block initial DOM mounting.</p>
                                 </div>
                              </div>
                              <div className="flex gap-4 items-start">
                                 <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-[11px] shrink-0 border border-gray-200/50 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">2</div>
                                 <div>
                                    <h4 className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">Define Host Element Parameters</h4>
                                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">The attribute `data-agent` guarantees secure mapping to this specific AI identity record. The widget initializes instantly.</p>
                                 </div>
                              </div>
                              <div className="flex gap-4 items-start">
                                 <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900"><Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3px]" /></div>
                                 <div>
                                    <h4 className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">Deploy live!</h4>
                                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">Commit code and visit your URL. A stunning AI assistant will appear in the bottom-right corner automatically.</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </motion.div>
                  ) : (
                     <motion.div 
                       key="customizeView"
                       initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                       transition={{ duration: 0.2 }}
                       className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                     >
                        {/* CONTROLS PANEL */}
                        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[24px] p-6 shadow-sm flex flex-col justify-between min-h-[450px]">
                           <div className="space-y-5">
                              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2 mb-2">
                                 <Palette className="w-4 h-4 text-orange-500" /> Styling Controls
                              </h3>

                              {/* Primary Color Setup */}
                              <div className="space-y-2.5">
                                 <label className="text-[11px] font-bold tracking-wider uppercase text-gray-400 dark:text-zinc-500">Launcher Core Color</label>
                                 <div className="grid grid-cols-6 gap-2">
                                    {PRESET_COLORS.map(clr => {
                                       const isSel = primaryColor.toLowerCase() === clr.hex.toLowerCase();
                                       return (
                                          <button 
                                            key={clr.hex}
                                            onClick={() => setPrimaryColor(clr.hex)}
                                            style={{ backgroundColor: clr.hex }}
                                            className={`h-8 rounded-lg transition-all border relative ${
                                               isSel ? 'ring-2 ring-offset-2 ring-black dark:ring-offset-zinc-900 dark:ring-white border-transparent scale-110' : 'border-black/5 dark:border-white/10 hover:scale-105'
                                            }`}
                                            title={clr.label}
                                          >
                                             {isSel && <Check className={`w-3.5 h-3.5 mx-auto ${clr.hex === '#ffffff' ? 'text-black' : 'text-white'} stroke-[3px]`} />}
                                          </button>
                                       )
                                    })}
                                 </div>
                                 
                                 <div className="flex items-center gap-2 pt-1">
                                    <div className="relative flex-1 group">
                                       <input 
                                          type="text" 
                                          value={primaryColor}
                                          onChange={e => setPrimaryColor(e.target.value)}
                                          placeholder="#HEXCODE"
                                          className="w-full h-9 px-3 text-[12px] font-mono font-bold border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-900 transition-all"
                                       />
                                    </div>
                                    <input 
                                       type="color" 
                                       value={primaryColor.startsWith('#') && primaryColor.length === 7 ? primaryColor : '#F97316'} 
                                       onChange={e => setPrimaryColor(e.target.value)}
                                       className="w-9 h-9 p-1 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl cursor-pointer"
                                    />
                                 </div>
                              </div>

                              {/* Welcome Msg Setup */}
                              <div className="space-y-2.5 pt-2">
                                 <label className="text-[11px] font-bold tracking-wider uppercase text-gray-400 dark:text-zinc-500">Initial Greeting</label>
                                 <textarea 
                                    value={welcomeMessage}
                                    onChange={e => setWelcomeMessage(e.target.value)}
                                    rows={3}
                                    placeholder="Introduce your assistant..."
                                    className="w-full px-3 py-2.5 text-[13px] font-medium border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-900 transition-all outline-none focus:border-orange-400/50 focus:ring-[3px] focus:ring-orange-500/5"
                                 />
                                 <div className="text-[11px] text-gray-400">Sent automatically as the conversation opener.</div>
                              </div>
                           </div>

                           {/* Save State CTA */}
                           <div className="pt-6 border-t border-gray-100 dark:border-zinc-800/50">
                              <button 
                                onClick={saveCustomization}
                                disabled={isSaving}
                                className="w-full h-10 rounded-xl bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-[13px] flex items-center justify-center gap-2 transition-all shadow-sm hover:-translate-y-[1px] active:scale-95 disabled:opacity-60"
                              >
                                 {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                 Publish Customization
                              </button>
                           </div>
                        </div>

                        {/* REALTIME SIMULATED PREVIEW */}
                        <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-[24px] p-4 shadow-inner flex flex-col items-center justify-center relative min-h-[450px] group overflow-hidden">
                           
                           <div className="absolute top-4 left-4 bg-white dark:bg-zinc-900 text-[10px] font-bold uppercase tracking-widest border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded-md text-zinc-400 z-10 shadow-sm">
                              Simulated View
                           </div>
                           
                           {/* Miniature Chat Window Mock */}
                           <div className="w-[260px] h-[380px] bg-white dark:bg-zinc-900 rounded-[20px] border border-gray-200 dark:border-zinc-800 shadow-xl flex flex-col overflow-hidden relative">
                              {/* Mock Header */}
                              <div 
                                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}
                                className="px-3.5 py-3 text-white flex items-center gap-2.5 shrink-0 transition-colors"
                              >
                                 <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center"><Sparkles className="w-3.5 h-3.5" /></div>
                                 <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] font-bold truncate leading-tight">{agent?.name || 'Assistant'}</span>
                                    <span className="text-[8px] font-medium text-white/80 flex items-center gap-1 leading-tight mt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Always active</span>
                                 </div>
                              </div>
                              {/* Mock Body */}
                              <div className="flex-1 p-3 space-y-3 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/20 flex flex-col justify-end">
                                 <div className="flex items-start gap-1.5">
                                    <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center rounded-[6px] shrink-0 mt-0.5"><Sparkles className="w-2.5 h-2.5 text-zinc-400" /></div>
                                    <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[12px] rounded-tl-sm px-2.5 py-2 text-[10px] font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed shadow-sm max-w-[80%] break-words">
                                       {welcomeMessage || 'Introduce your assistant...'}
                                    </div>
                                 </div>
                              </div>
                              {/* Mock Footer */}
                              <div className="p-2.5 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 shrink-0 flex items-center gap-1.5">
                                 <div className="flex-1 h-7 bg-zinc-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-lg px-2 flex items-center text-[9px] text-zinc-400">Message assistance...</div>
                                 <div style={{ backgroundColor: primaryColor }} className="w-7 h-7 rounded-lg flex items-center justify-center text-white opacity-75 shadow-sm transition-colors"><ArrowRight className="w-3.5 h-3.5" /></div>
                              </div>
                           </div>

                           {/* Mini Floating Button Launch Mock */}
                           <div 
                             style={{ backgroundColor: primaryColor }}
                             className="absolute bottom-6 right-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center border border-white/10 text-white cursor-default transition-transform group-hover:scale-105"
                           >
                              <Sparkles className="w-5 h-5" />
                              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 border border-white rounded-full" />
                           </div>
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>

            {/* SECURITY & DOCS BLOCK - SIDE COLUMN */}
            <div className="space-y-6">
               
               {/* ALLOWED DOMAINS (Live & Real Database Writing!) */}
               <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[24px] p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
                  <h3 className="text-[14px] font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2 mb-1">
                     <Globe className="w-4 h-4 text-emerald-500" /> Security Clearing
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 mb-4 leading-relaxed">
                     Whitelist domain URLs to prevent unauthorized execution elsewhere.
                  </p>

                  <form onSubmit={handleAddDomain} className="flex gap-1.5 mb-4">
                     <input 
                       type="text"
                       placeholder="mybusiness.com"
                       value={newDomain}
                       onChange={e => setNewDomain(e.target.value)}
                       className="flex-1 min-w-0 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-3 h-9 text-[12px] font-medium text-gray-800 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-900 transition-all outline-none placeholder:text-gray-400"
                     />
                     <button 
                       type="submit"
                       disabled={!newDomain}
                       className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl w-9 h-9 flex items-center justify-center hover:bg-black dark:hover:bg-white transition-all disabled:opacity-40 shrink-0 shadow-sm active:scale-95"
                     >
                        <Plus className="w-3.5 h-3.5" />
                     </button>
                  </form>

                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 select-none">
                     {activeDomains.map((d: string) => (
                        <div key={d} className="flex items-center justify-between bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 px-3 py-1.5 rounded-xl group transition-colors hover:border-gray-200 dark:hover:border-zinc-800">
                           <div className="flex items-center gap-2 min-w-0">
                              <div className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                              <span className="text-[11px] font-bold text-gray-600 dark:text-zinc-300 truncate">{d}</span>
                           </div>
                           <button 
                             onClick={() => removeDomain(d)}
                             className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-all p-1 active:scale-90"
                           >
                              <Trash2 className="w-3 h-3" />
                           </button>
                        </div>
                     ))}
                     {activeDomains.length === 0 && (
                        <div className="text-[11px] font-medium text-gray-400 dark:text-zinc-500 text-center py-5 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
                           Allowing all destinations (Public)
                        </div>
                     )}
                  </div>
               </div>

               {/* QUICK DOCS CARD */}
               <div className="bg-zinc-950 border border-zinc-800 rounded-[24px] p-5 sm:p-6 text-white relative overflow-hidden group">
                  <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-orange-500/20 rounded-full blur-2xl group-hover:bg-orange-500/30 transition-colors duration-500" />
                  <div className="relative z-10 flex flex-col">
                     <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mb-3.5 shadow-inner text-orange-400">
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5px]" />
                     </div>
                     <h4 className="text-[14px] font-bold tracking-tight mb-1">Need integration help?</h4>
                     <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">Browse implementation walkthroughs for React, Webflow, Shopify, and WordPress.</p>
                     <a href="#" className="text-[11px] font-bold text-zinc-200 hover:text-orange-400 transition-colors flex items-center gap-1 active:scale-95 self-start">
                        Explore platform docs <ArrowRight className="w-3 h-3" />
                     </a>
                  </div>
               </div>

            </div>

         </div>

      </div>
    </DashboardLayout>
  );
}

export default function DeployPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
         <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Aligning configurations</div>
         </div>
      </DashboardLayout>
    }>
      <DeployPageContent />
    </Suspense>
  );
}
