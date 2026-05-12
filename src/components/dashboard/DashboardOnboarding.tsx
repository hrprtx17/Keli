'use client';
import { CheckCircle2, Circle, ArrowRight, Database, Settings, PlayCircle, Rocket } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

export function DashboardOnboarding({ agentId }: { agentId?: string }) {
  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => { const res = await fetch('/api/agents'); return res.json(); }
  });

  const { data: sources } = useQuery({
    queryKey: ['datasources', agentId],
    queryFn: async () => { 
      if (!agentId) return []; 
      const res = await fetch(`/api/datasources?agentId=${agentId}`); 
      return res.json(); 
    },
    enabled: !!agentId
  });

  const activeAgentId = agentId || agents?.[0]?._id;

  const steps = [
    {
      id: 1,
      title: 'Create AI Agent',
      desc: 'Initialize your genesis support unit.',
      icon: Circle,
      done: !!agents && agents.length > 0,
      href: '/agents/new',
    },
    {
      id: 2,
      title: 'Add Data Source',
      desc: 'Inject documentation context.',
      icon: Database,
      done: !!sources && sources.length > 0,
      href: activeAgentId ? `/knowledge?agentId=${activeAgentId}` : '/knowledge',
    },
    {
      id: 3,
      title: 'Test in Playground',
      desc: 'Validate responses in active preview.',
      icon: PlayCircle,
      done: false, // Manual check usually simulated, we list as item
      href: activeAgentId ? `/agents/${activeAgentId}` : '/agents',
    },
    {
      id: 4,
      title: 'Deploy Widget',
      desc: 'Copy snippets to your live domain.',
      icon: Rocket,
      done: false,
      href: activeAgentId ? `/deploy?agentId=${activeAgentId}` : '/deploy',
    }
  ];

  const completedCount = steps.filter(s => s.done).length;
  
  if (completedCount === 4) return null; // Hide when completed. But let's keep visible for initial activation state.

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/30 dark:bg-zinc-950/30">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Action Required</span>
            Finalize Setup Activation
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5 font-medium">Complete these remaining infrastructure steps to enable system functionality.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="h-1.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(completedCount / 4) * 100}%` }} />
           </div>
           <span className="text-xs font-black text-zinc-700 dark:text-zinc-300">{completedCount}/4 Complete</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-zinc-800">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link key={step.id} href={step.href} className="group">
              <div className={`p-5 transition-all hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 h-full flex flex-col ${step.done ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-colors ${step.done ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 text-emerald-600' : 'bg-white dark:bg-zinc-900 text-zinc-500 group-hover:border-primary/30 group-hover:text-primary'}`}>
                     {step.done ? <CheckCircle2 className="h-4.5 w-4.5" /> : <Icon className="h-4.5 w-4.5" />}
                  </div>
                  {!step.done && <ArrowRight className="h-3.5 w-3.5 text-zinc-300 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary" />}
                </div>
                <h4 className={`text-[13px] font-bold mb-1 ${step.done ? 'text-zinc-600 dark:text-zinc-400 line-through decoration-zinc-300' : 'text-zinc-900 dark:text-zinc-100'}`}>{step.title}</h4>
                <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">{step.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
