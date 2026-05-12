'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Code2, Copy, Check, Globe, CheckCircle2, 
  Frame, Tablet, Plus, Trash2, ExternalLink, ArrowRight
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

function DeployPageContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agentId');
  const [copied, setCopied] = useState<string | null>(null);
  const [activeMethod, setActiveMethod] = useState<'widget' | 'frame' | 'sdk'>('widget');

  // Mock persistent allowed domains UI state
  const [domains, setDomains] = useState(['example.com']);
  const [newDomain, setNewDomain] = useState('');

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      if (!agentId) return null;
      const res = await fetch(`/api/agents/${agentId}`);
      return res.json();
    },
    enabled: !!agentId
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAddDomain = (e: React.FormEvent) => {
     e.preventDefault();
     if (!newDomain) return;
     const clean = newDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
     if (clean && !domains.includes(clean)) {
        setDomains([...domains, clean]);
        setNewDomain('');
        toast.success('Domain allowed successfully.');
     }
  };

  const removeDomain = (d: string) => {
     setDomains(domains.filter(x => x !== d));
  };

  if (!agentId) return <DashboardLayout><div className="p-12 text-center text-gray-500 font-medium">Please select an agent from the sidebar.</div></DashboardLayout>;
  
  if (isLoading) return <DashboardLayout><div className="p-12 flex justify-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  const scripts = {
    widget: `<!-- AgentDesk Widget -->\n<script \n  src="https://agentdesk.ai/embed.js"\n  data-agent-id="${agentId}"\n  async defer\n></script>`,
    frame: `<iframe \n  src="https://agentdesk.ai/chat/${agentId}"\n  width="100%" height="600px" \n  frameborder="0" \n  allow="microphone"\n></iframe>`,
    sdk: `import { AgentChat } from '@agentdesk/sdk';\n\nexport const App = () => (\n  <AgentChat agentId="${agentId}" />\n);`
  };

  const methods = [
     { id: 'widget', label: 'Website Widget', desc: 'Recommended for simple plug-and-play setups.', icon: Globe },
     { id: 'frame', label: 'Embed Chat Window', desc: 'Perfect for custom internal dashboards.', icon: Frame },
     { id: 'sdk', label: 'React SDK', desc: 'Advanced workflows for technical teams.', icon: Tablet }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto pb-24">
         
         {/* 1. HEADER */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
            <div>
               <div className="flex items-center gap-2 text-[11px] font-semibold text-orange-600 tracking-wider uppercase mb-2">
                  DEPLOYMENT
               </div>
               <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Deploy Your AI Assistant</h1>
               <p className="text-[14px] text-gray-500 mt-1.5">
                  Add your AI assistant to your website or application in minutes.
               </p>
            </div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full shrink-0">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[12px] font-semibold">Ready to Deploy</span>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            <div className="lg:col-span-2 space-y-8">

               {/* 2. DEPLOYMENT METHODS GRID */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {methods.map(m => {
                     const isAct = activeMethod === m.id;
                     return (
                        <button 
                          key={m.id} 
                          onClick={() => setActiveMethod(m.id as any)}
                          className={`relative flex flex-col p-5 rounded-2xl border text-left transition-all ${
                             isAct ? 'border-orange-500 bg-orange-50/30 shadow-sm ring-1 ring-orange-500' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                          }`}
                        >
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${isAct ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-500'}`}>
                              <m.icon className="w-5 h-5" />
                           </div>
                           <div className="font-semibold text-[14px] text-gray-900 mb-1">{m.label}</div>
                           <div className="text-[11px] text-gray-500 leading-relaxed">{m.desc}</div>
                           {m.id === 'widget' && (
                              <span className="absolute top-3 right-3 bg-white text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md border shadow-sm text-gray-600">Best</span>
                           )}
                        </button>
                     )
                  })}
               </div>

               {/* 3. INTEGRATION COMPONENT EXPLICIT */}
               <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeMethod}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="bg-white border border-gray-200 rounded-[24px] p-6 sm:p-8 shadow-sm"
                  >
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                           <h2 className="text-[16px] font-semibold text-gray-900 capitalize">
                              {methods.find(m => m.id === activeMethod)?.label} Installation
                           </h2>
                           <p className="text-[13px] text-gray-500 mt-1">Works effortlessly across generic, WordPress, Shopify sites.</p>
                        </div>
                     </div>

                     {/* Installation Steps visualization for primary methods */}
                     <div className="space-y-6">
                        <div className="space-y-4 border-l-2 border-gray-100 ml-3 pl-6 relative">
                           <div className="relative">
                              <span className="absolute -left-[33px] top-0.5 w-[14px] h-[14px] bg-orange-500 rounded-full ring-4 ring-white" />
                              <div className="text-[13px] font-semibold text-gray-900">Copy code snippet</div>
                              <div className="text-[12px] text-gray-500 mt-0.5">Copy the autogenerated initialization string below.</div>
                           </div>
                           <div className="relative py-4">
                              <div className="relative rounded-xl overflow-hidden bg-[#1e1e1e] shadow-lg group">
                                 <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-white/5 text-[11px] font-mono text-gray-400">
                                    <span>{activeMethod === 'sdk' ? 'App.js' : 'index.html'}</span>
                                    <button 
                                       onClick={() => handleCopy(scripts[activeMethod], 'Snippet')}
                                       className="flex items-center gap-1.5 hover:text-white transition-colors font-semibold"
                                    >
                                       {copied === 'Snippet' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                       {copied === 'Snippet' ? 'Copied' : 'Copy'}
                                    </button>
                                 </div>
                                 <pre className="p-5 font-mono text-[12px] leading-relaxed text-gray-300 overflow-x-auto">
                                    <code>{scripts[activeMethod]}</code>
                                 </pre>
                              </div>
                           </div>
                           <div className="relative">
                              <span className="absolute -left-[33px] top-0.5 w-[14px] h-[14px] bg-gray-200 rounded-full ring-4 ring-white" />
                              <div className="text-[13px] font-semibold text-gray-900">Paste before &lt;/body&gt;</div>
                              <div className="text-[12px] text-gray-500 mt-0.5">Insert standard tag in your global template or site root.</div>
                           </div>
                           <div className="relative">
                              <span className="absolute -left-[33px] top-0.5 w-[14px] h-[14px] bg-gray-200 rounded-full ring-4 ring-white" />
                              <div className="text-[13px] font-semibold text-gray-900">Go live</div>
                              <div className="text-[12px] text-gray-500 mt-0.5">Publish settings to deploy the dynamic AI immediately.</div>
                           </div>
                        </div>
                     </div>
                  </motion.div>
               </AnimatePresence>

            </div>

            {/* 4. SIDE PANEL - Security / Allowed Domains */}
            <div className="space-y-6">
               
               <div className="bg-white border border-gray-200 rounded-[24px] p-6 shadow-sm">
                  <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-1">
                     Allowed Domains
                  </h3>
                  <p className="text-[12px] text-gray-500 mb-5 leading-relaxed">
                     Restrict where your widget fires to prevent usage hijacking.
                  </p>

                  <form onSubmit={handleAddDomain} className="flex gap-2 mb-4">
                     <input 
                       type="text"
                       placeholder="myapp.com"
                       value={newDomain}
                       onChange={e => setNewDomain(e.target.value)}
                       className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[13px] font-medium text-gray-800 focus:bg-white focus:border-orange-400 focus:ring-[3px] focus:ring-orange-500/10 transition-all outline-none placeholder:text-gray-400"
                     />
                     <button 
                       type="submit"
                       disabled={!newDomain}
                       className="bg-gray-900 text-white rounded-xl w-10 flex items-center justify-center hover:bg-black transition-all disabled:opacity-50 shadow-sm shrink-0"
                     >
                        <Plus className="w-4 h-4" />
                     </button>
                  </form>

                  <div className="space-y-2">
                     {domains.map(d => (
                        <div key={d} className="flex items-center justify-between bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl group transition-colors">
                           <div className="flex items-center gap-2 min-w-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="text-[12px] font-medium text-gray-700 truncate">{d}</span>
                           </div>
                           <button 
                             onClick={() => removeDomain(d)}
                             className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                           >
                              <Trash2 className="w-3 h-3" />
                           </button>
                        </div>
                     ))}
                     {domains.length === 0 && (
                        <div className="text-[12px] text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
                           Allow all domains (Unsafe)
                        </div>
                     )}
                  </div>
               </div>

               <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white border border-zinc-800 rounded-[24px] p-6 shadow-lg relative overflow-hidden group">
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl group-hover:bg-orange-500/30 transition-colors" />
                  <div className="relative z-10">
                     <div className="bg-white/10 w-8 h-8 rounded-lg flex items-center justify-center mb-4 border border-white/5">
                        <CheckCircle2 className="w-4 h-4 text-orange-400" />
                     </div>
                     <h4 className="text-[14px] font-semibold mb-1">Need more help?</h4>
                     <p className="text-[12px] text-zinc-400 leading-relaxed mb-4">Read integration guides for WordPress, Webflow, and custom React stacks.</p>
                     <button className="text-[12px] font-medium flex items-center gap-1.5 hover:text-orange-400 transition-colors">
                        View developer docs <ArrowRight className="w-3 h-3" />
                     </button>
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
    <Suspense fallback={<DashboardLayout><div className="p-12 flex justify-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>}>
      <DeployPageContent />
    </Suspense>
  );
}
