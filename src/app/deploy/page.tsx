'use client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Code2, Copy, Check, Globe, Sparkles, AlertCircle, Tablet, Frame } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function DeployPage() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agentId');
  const [copied, setCopied] = useState<string | null>(null);

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      if (!agentId) return null;
      const res = await fetch(`/api/agents/${agentId}`);
      return res.json();
    },
    enabled: !!agentId
  });

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type} snippet copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!agentId) return <DashboardLayout><div className="p-8 text-center font-bold">Select an agent context first.</div></DashboardLayout>;
  if (isLoading) return <DashboardLayout><div className="p-8 animate-pulse space-y-4"><div className="h-8 w-40 bg-zinc-200 rounded"/><div className="h-64 w-full bg-zinc-200 rounded-3xl"/></div></DashboardLayout>;

  const embedScript = `<!-- AgentDesk Widget Integration -->\n<script src="https://agentdesk.ai/embed.js" data-agent-id="${agentId}" async defer></script>\n<!-- End of AgentDesk Widget -->`;
  const iframeEmbed = `<iframe src="https://agentdesk.ai/chat/${agentId}" width="100%" height="600px" frameborder="0" allow="microphone"></iframe>`;
  const reactComponent = `import { AgentDeskChat } from '@agentdesk/react';\n\nexport const ChatWidget = () => (\n  <AgentDeskChat agentId="${agentId}" theme="light" />\n);`;

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-8 pb-20">
         
         <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
               <Sparkles className="h-7 w-7 text-primary" /> Deploy Agent
            </h1>
            <p className="text-zinc-500 font-medium mt-1.5">Integrate "{agent?.name || 'Agent'}" into your application workflow.</p>
         </div>

         <div className="grid gap-8">
            
            {/* Primary Script Installation */}
            <Card className="rounded-3xl border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-950">
               <CardHeader className="pb-4 pt-8 px-8">
                  <div className="flex items-center gap-3 mb-1">
                     <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Code2 className="h-5 w-5" /></div>
                     <CardTitle className="text-lg font-bold">Direct Script Injection</CardTitle>
                  </div>
                  <p className="text-sm font-medium text-zinc-500 pl-13">Copy and paste this code block just before the closing &lt;/body&gt; tag on your website.</p>
               </CardHeader>
               <CardContent className="px-8 pb-8 pt-2">
                  <div className="relative group">
                     <pre className="bg-zinc-950 text-zinc-300 p-6 rounded-2xl font-mono text-xs leading-relaxed overflow-x-auto shadow-inner border border-zinc-800">
                        <code>{embedScript}</code>
                     </pre>
                     <button 
                        onClick={() => handleCopy(embedScript, 'Script')}
                        className="absolute top-4 right-4 h-10 px-4 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-white/10 shadow-lg"
                     >
                        {copied === 'Script' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied === 'Script' ? 'Copied!' : 'Copy Snippet'}
                     </button>
                  </div>
               </CardContent>
            </Card>

            {/* Advanced Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
               <Card className="rounded-3xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 relative overflow-hidden shadow-sm">
                  <div className="p-8">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900"><Frame className="h-4.5 w-4.5" /></div>
                        <h3 className="font-bold text-zinc-900 dark:text-white">IFrame Embed</h3>
                     </div>
                     <p className="text-xs font-medium text-zinc-500 mb-6 leading-relaxed">Best for embedding into pre-built dashboard portals or legacy frameworks.</p>
                     <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-1 rounded-2xl border shadow-sm">
                        <span className="text-xs font-mono text-zinc-400 truncate pl-3 pr-2">...frame src="https://age...</span>
                        <button onClick={() => handleCopy(iframeEmbed, 'iFrame')} className="h-9 px-4 font-bold text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200">Copy</button>
                     </div>
                  </div>
               </Card>

               <Card className="rounded-3xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 relative overflow-hidden shadow-sm">
                  <div className="p-8">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><Tablet className="h-4.5 w-4.5" /></div>
                        <h3 className="font-bold text-zinc-900 dark:text-white">React / Next.js SDK</h3>
                     </div>
                     <p className="text-xs font-medium text-zinc-500 mb-6 leading-relaxed">Native components for complete control over dynamic lifecycles.</p>
                     <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-1 rounded-2xl border shadow-sm">
                        <span className="text-xs font-mono text-zinc-400 truncate pl-3 pr-2">npm install @agentdesk/react</span>
                        <button onClick={() => handleCopy(reactComponent, 'React')} className="h-9 px-4 font-bold text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200">Copy</button>
                     </div>
                  </div>
               </Card>

            </div>

            {/* Domain Lock Reminder */}
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 p-6 flex items-start gap-4">
               <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
               <div>
                  <h4 className="font-bold text-amber-800 dark:text-amber-200 text-sm mb-1">Firewall Configuration Check</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed max-w-2xl">
                     Ensure target host domains are authorized inside Workspace Settings. Unregistered origins attempting to initiate widget handshakes will be forcibly detached to prevent token drain.
                  </p>
               </div>
            </div>

         </div>
      </div>
    </DashboardLayout>
  );
}
