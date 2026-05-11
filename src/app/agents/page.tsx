'use client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Bot, Plus, MoreHorizontal, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function AgentsPage() {
  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Agents</h1>
          </div>
          <Link href="/agents/new">
            <Button className="bg-black hover:bg-zinc-800 text-white rounded-lg px-4 text-xs font-bold tracking-wide h-9 flex items-center gap-1.5 shadow-sm">
              <Plus className="h-3.5 w-3.5" /> Create Agent
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1,2].map(i => <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : agents?.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center bg-muted/5">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bot className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold">Deploy First Agent</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-1 mb-6">Launch a localized intelligent chat handler on your domain.</p>
            <Link href="/agents/new">
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-6">Start Creation</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {agents?.map((agent: any) => (
              <AgentVisualCard key={agent._id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function AgentVisualCard({ agent }: { agent: any }) {
  const primaryColor = agent.widgetConfig?.primaryColor || '#F97316';
  const creationDate = new Date(agent.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <Link href={`/agents/${agent._id}`} className="group block">
      <div className="overflow-hidden rounded-2xl border bg-card hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer flex flex-col h-full">
        {/* Upper visual representation mockup similar to the screenshot provided */}
        <div className="aspect-[16/9] w-full relative bg-muted/30 border-b flex items-center justify-center p-6 overflow-hidden">
          {/* Abstract background ambient glow */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundColor: primaryColor }} />
          
          {/* Simplified Chat Widget Visual representation matching original sample image concept */}
          <div className="relative w-full max-w-[220px] bg-white dark:bg-zinc-900 rounded-t-xl shadow-xl border overflow-hidden transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 flex flex-col">
             <div className="h-12 w-full flex items-center px-3 gap-2 border-b" style={{ backgroundColor: primaryColor }}>
                <div className="h-6 w-6 rounded bg-white/20 flex items-center justify-center text-white"><Bot className="h-3 w-3"/></div>
                <div className="h-2.5 w-20 bg-white/30 rounded-full" />
             </div>
             <div className="p-3 space-y-2.5">
                <div className="flex gap-2">
                   <div className="h-5 w-5 rounded-full shrink-0 bg-muted" />
                   <div className="h-4 w-24 bg-muted rounded-lg" />
                </div>
                <div className="flex gap-2 justify-end">
                   <div className="h-6 w-20 rounded-lg opacity-80" style={{ backgroundColor: primaryColor }} />
                </div>
                <div className="flex gap-2">
                   <div className="h-5 w-5 rounded-full shrink-0 bg-muted" />
                   <div className="h-12 w-full bg-muted rounded-lg opacity-50" />
                </div>
             </div>
          </div>
        </div>

        {/* Lower Info Section */}
        <div className="p-5 flex items-center justify-between bg-card">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{agent.name}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-medium">
               <Calendar className="h-3 w-3" />
               <span>Created {creationDate}</span>
            </div>
          </div>
          <button 
            onClick={(e) => { e.preventDefault(); }} 
            className="h-8 w-8 flex items-center justify-center rounded-lg border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
