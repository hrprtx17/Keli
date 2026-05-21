'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Code2, Copy, Check, Globe, CheckCircle2, 
  ArrowRight, Sparkles, Palette, Save, Loader2
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

function DeployPageContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agentId');
  const queryClient = useQueryClient();
  
  const [copied, setCopied] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#F97316');
  const [welcomeMessage, setWelcomeMessage] = useState('Hi there! How can I help you today?');
  const [isSaving, setIsSaving] = useState(false);

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
      
      if (data?.widgetConfig) {
        if (data.widgetConfig.primaryColor) setPrimaryColor(data.widgetConfig.primaryColor);
        if (data.widgetConfig.welcomeMessage) setWelcomeMessage(data.widgetConfig.welcomeMessage);
      }
      return data;
    },
    enabled: !!agentId
  });

  const [origin, setOrigin] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Integration script copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

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
      toast.success('Widget configurations saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    } catch (err) {
      toast.error('Failed to save configurations.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!agentId) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-gray-500 font-medium">Please select an agent from the sidebar context.</div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-12 flex justify-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
      </DashboardLayout>
    );
  }

  const actualOrigin = origin || 'http://localhost:3000';
  const embedCode = `<!-- Keli AI Assistant Widget -->\n<script\n  src="${actualOrigin}/keli.js"\n  data-agent-id="${agentId}"\n  async\n></script>`;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto pb-24 px-4 sm:px-6">
         
         {/* TOP ROW */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 text-center sm:text-left">
            <div>
               <div className="flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold text-orange-600 dark:text-orange-400 tracking-wider uppercase mb-1">
                  Deployment Platform
               </div>
               <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-150 tracking-tight flex items-center justify-center sm:justify-start gap-2">
                 Go Live: {agent?.name || 'Assistant'}
                 {agent?.isActive ? (
                   <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                     <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live
                   </span>
                 ) : (
                   <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                     <div className="w-1 h-1 rounded-full bg-zinc-500" /> Offline
                   </span>
                 )}
               </h1>
               <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                  Embed the script snippet into your website to deploy {agent?.name || 'your assistant'} instantly.
               </p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: INTEGRATION DETAILS */}
            <div className="md:col-span-7 space-y-6">
               
               {/* SNIPPET VIEWER */}
               <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-[24px] p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between gap-4 mb-4">
                     <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                           HTML Script Embed
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Copy and append within the &lt;body&gt; boundary.</p>
                     </div>
                     <button 
                        onClick={() => handleCopy(embedCode)}
                        className="flex items-center gap-1.5 h-8.5 px-4 bg-[#FF6B35] hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shrink-0 shadow-sm"
                     >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                     </button>
                  </div>

                  {/* CODE PREVIEW */}
                  <div className="relative rounded-xl overflow-hidden bg-zinc-950 border border-zinc-850 shadow-inner mb-6">
                     <pre className="p-4 font-mono text-[12.5px] leading-relaxed text-zinc-300 overflow-x-auto whitespace-pre">
                        <code>{embedCode}</code>
                     </pre>
                  </div>

                  {/* Vertical Steps */}
                  <div className="pt-2 space-y-4">
                     <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Step-by-step instructions</h3>
                     <div className="space-y-3.5">
                        {[
                           "Copy the HTML snippet shown above.",
                           "Open your website's main code editor or template builder.",
                           "Paste this script tag just before the closing </body> tag on your pages.",
                           "Save and deploy your updates. The chat launcher will load automatically."
                        ].map((step, i) => (
                           <div key={i} className="flex gap-3 items-start">
                              <div className="w-5.5 h-5.5 rounded-full bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center font-bold text-xs shrink-0 text-[#FF6B35] mt-0.5">{i + 1}</div>
                              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium pt-0.5">{step}</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

            </div>

            {/* RIGHT: APPEARANCE CUSTOMIZER */}
            <div className="md:col-span-5 space-y-6">
               
               {/* MINI PREVIEW */}
               <div className="space-y-2">
                  <span className="text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">Accent preview</span>
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs bg-white dark:bg-zinc-950">
                     <div className="h-8 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 justify-between">
                        <div className="flex gap-1">
                           <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] opacity-80" />
                           <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] opacity-80" />
                           <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] opacity-80" />
                        </div>
                        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded text-[9.5px] text-zinc-400 w-32 text-center select-none font-medium truncate">
                           yourwebsite.com
                        </div>
                        <div className="w-4" />
                     </div>
                     <div className="h-[120px] bg-zinc-50/50 dark:bg-zinc-950/20 p-4 relative overflow-hidden">
                        <div className="space-y-2">
                           <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-[40%] animate-pulse" />
                           <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded w-[60%]" />
                        </div>

                        {/* Miniature Launcher Button */}
                        <div 
                           className="absolute bottom-3.5 right-3.5 w-9.5 h-9.5 rounded-full flex items-center justify-center shadow-md cursor-default transition-all duration-300"
                           style={{ 
                              backgroundColor: primaryColor,
                              boxShadow: `0 3px 10px ${primaryColor}4D`
                           }}
                        >
                           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                           </svg>
                        </div>
                     </div>
                  </div>
               </div>

               {/* CONTROLS */}
               <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[24px] p-5 shadow-xs">
                  <div className="space-y-4">
                     <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-orange-500" /> Styling Customizer
                     </h3>

                     {/* Primary Color */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-zinc-500">Accent Hex Code</label>
                        <div className="flex items-center gap-2">
                           <div 
                              className="w-8.5 h-8.5 rounded-lg border border-black/5 dark:border-white/10 shrink-0 shadow-xs" 
                              style={{ backgroundColor: primaryColor }} 
                           />
                           <input 
                              type="text" 
                              value={primaryColor}
                              onChange={e => setPrimaryColor(e.target.value)}
                              placeholder="#HEXCODE"
                              className="flex-grow h-8.5 px-3 text-xs font-mono font-bold border border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-[#FF6B35] transition-all"
                           />
                           <input 
                              type="color" 
                              value={primaryColor.startsWith('#') && primaryColor.length === 7 ? primaryColor : '#F97316'} 
                              onChange={e => setPrimaryColor(e.target.value)}
                              className="w-8.5 h-8.5 p-0.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg cursor-pointer"
                           />
                        </div>
                     </div>

                     {/* Welcome Message */}
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-zinc-500">Welcome Text</label>
                        <textarea 
                           value={welcomeMessage}
                           onChange={e => setWelcomeMessage(e.target.value)}
                           rows={2}
                           placeholder="Introduce your assistant..."
                           className="w-full px-3 py-2 text-xs font-medium border border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:bg-white dark:focus:bg-zinc-900 transition-all outline-none resize-none"
                        />
                     </div>

                     {/* Save CTA */}
                     <button 
                        onClick={saveCustomization}
                        disabled={isSaving}
                        className="w-full h-9 rounded-lg bg-[#FF6B35] hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-60"
                     >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Settings
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
    <Suspense fallback={
      <DashboardLayout>
         <div className="p-12 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-[9px] font-bold tracking-widest text-zinc-400 uppercase">Aligning Configurations</div>
         </div>
      </DashboardLayout>
    }>
      <DeployPageContent />
    </Suspense>
  );
}
