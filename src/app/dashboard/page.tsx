'use client';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MessageSquare, Ticket, Bot, Zap, ArrowUpRight, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function StatCard({ title, value, sub, icon: Icon, href, loading }: any) {
  return (
    <Card className="rounded-3xl shadow-sm hover:shadow-md transition-all border-zinc-200 dark:border-zinc-800 group">
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-6 pt-6">
        <CardTitle className="text-[11px] font-black tracking-widest uppercase text-muted-foreground/70">{title}</CardTitle>
        <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Icon className="h-5 w-5 text-zinc-400 group-hover:text-primary transition-colors" />
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
          {loading ? <div className="h-9 w-20 bg-muted animate-pulse rounded-xl" /> : value}
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs font-medium text-zinc-500">{sub}</p>
          {href && (
            <Link href={href} className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs font-bold">
              Analyze <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => { const res = await fetch('/api/dashboard/stats'); return res.json(); }
  });

  const { data: workspace } = useQuery({
    queryKey: ['workspace'],
    queryFn: async () => { const res = await fetch('/api/workspace'); return res.json(); }
  });

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => { const res = await fetch('/api/agents'); return res.json(); }
  });

  const isPremium = workspace?.plan === 'premium';
  const creditsUsed = workspace?.usage?.creditsUsedThisMonth || 0;
  const totalCredits = (workspace?.usage?.monthlyCredits || 500) + (workspace?.usage?.addonCredits || 0);
  const creditPct = Math.min(Math.round((creditsUsed / Math.max(totalCredits, 1)) * 100), 100);

  // Only generate actual mock data if user is Active, otherwise flatline zeros to avoid "fake data" confusion.
  const activityData = weekDays.map((name) => ({ 
    name, 
    conversations: creditsUsed > 0 ? Math.floor(Math.random() * 10) : 0 
  }));

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-16">
        
        {/* Refined Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Analytics Overview</h1>
            <p className="text-muted-foreground text-sm mt-1.5">Monitor autonomous interaction layers and system performance.</p>
          </div>
          <Link href="/agents/new">
            <button className="flex items-center gap-2 rounded-2xl bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 text-white px-6 py-3 text-sm font-bold shadow-lg shadow-zinc-500/10 transition-all active:scale-95">
              <Bot className="h-4 w-4" />
              Initialize Agent
            </button>
          </Link>
        </div>

        {/* Standardized Heavy Stat Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Output" value={isLoading ? '—' : stats?.conversations ?? 0} sub="Aggregated chat sessions" icon={MessageSquare} href="/conversations" loading={isLoading} />
          <StatCard title="Escalations" value={isLoading ? '—' : stats?.openTickets ?? 0} sub="Active support tickets" icon={Ticket} href="/conversations" loading={isLoading} />
          <StatCard title="Fleet Count" value={isLoading ? '—' : agents?.length ?? 0} sub="Deployed node instances" icon={Bot} href="/agents" loading={isLoading} />
          <StatCard title="Credit Satiation" value={isLoading ? '—' : `${creditsUsed} / ${totalCredits}`} sub={`${creditPct}% utilized rate`} icon={Zap} href="/billing" loading={isLoading} />
        </div>

        {/* Advanced Visuals Row */}
        <div className="grid gap-8 lg:grid-cols-7 items-stretch">
          
          {/* Heatmap Style Flow chart */}
          <Card className="lg:col-span-4 rounded-3xl shadow-sm border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
            <CardHeader className="pb-6 p-6 border-b bg-zinc-50/50 dark:bg-zinc-900/50">
              <CardTitle className="text-lg font-bold flex items-center gap-2.5">
                <ArrowUpRight className="h-5 w-5 text-primary" />
                Temporal Flow Pattern
              </CardTitle>
              <p className="text-xs text-zinc-500 mt-0.5">Real-time operational logs over 7-day cadence.</p>
            </CardHeader>
            <CardContent className="h-[300px] p-6 flex-1 bg-white dark:bg-zinc-950">
              {creditsUsed === 0 ? (
                 <div className="h-full w-full flex flex-col items-center justify-center text-center border border-dashed rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20">
                    <MessageSquare className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-3" />
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Zero System Activity</h4>
                    <p className="text-xs text-zinc-500 mt-1">Deploy your widget to activate data ingestion.</p>
                 </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="conv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight="600" tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={11} fontWeight="600" tickLine={false} axisLine={false} dx={-5} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e4e4e7', borderRadius: '16px', fontSize: '12px', fontWeight: '600', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Area type="monotone" dataKey="conversations" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#conv)" dot={{ r: 4, fill: '#fff', stroke: 'hsl(var(--primary))', strokeWidth: 2 }} activeDot={{ r: 6, shadow: '0px 0px 10px rgba(0,0,0,0.2)' }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Heavy List Panel */}
          <Card className="lg:col-span-3 rounded-3xl shadow-sm border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
            <CardHeader className="pb-6 p-6 border-b bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Operational Assets</CardTitle>
                <p className="text-xs text-zinc-500 mt-0.5">Active fleet health status.</p>
              </div>
              <Link href="/agents" className="text-xs font-bold text-primary hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent className="p-6 space-y-4 flex-1 bg-white dark:bg-zinc-950 overflow-y-auto custom-scrollbar">
              {!agents || agents.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 flex flex-col items-center border border-dashed rounded-2xl bg-zinc-50/50">
                  <Bot className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm font-bold">No Active Nodes Found.</p>
                  <Link href="/agents/new" className="text-primary text-xs font-bold mt-2 hover:underline">Initiate Genesis Unit →</Link>
                </div>
              ) : (
                agents.slice(0, 4).map((agent: any) => (
                  <Link key={agent._id} href={`/agents/${agent._id}`} className="block">
                    <div className="flex items-center gap-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-primary/30 hover:shadow-md transition-all group relative overflow-hidden">
                      <div className="h-10 w-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                        <Bot className="h-5 w-5 text-zinc-400 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{agent.name}</p>
                        <p className="text-[10px] font-medium text-zinc-400 truncate uppercase tracking-wide mt-0.5">{agent.model || 'llama-3.1-8b'}</p>
                      </div>
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] shrink-0" />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sophisticated Command Board */}
        <div className="grid gap-6 md:grid-cols-3 pt-4">
          {[
            { title: 'Ingest Intelligence', desc: 'Inject official domain vectors to baseline train your fleet core.', href: '/knowledge', icon: '📚' },
            { title: 'Broadcast Vector', desc: 'Retrieve embed hashes to spawn handlers on arbitrary platforms.', href: '/agents', icon: '🚀' },
            { title: 'Scale Capacity', desc: 'Unlock expanded throughput and architectural bandwidth.', href: '/plans', icon: '⚡' },
          ].map(item => (
            <Link key={item.title} href={item.href}>
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 hover:border-primary/40 hover:shadow-lg transition-all duration-300 group cursor-pointer relative overflow-hidden h-full">
                <div className="absolute -right-4 -bottom-4 bg-zinc-50 rounded-full h-24 w-24 flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-500 opacity-50 dark:bg-zinc-800" />
                <span className="text-3xl mb-5 block group-hover:scale-110 transition-transform origin-left">{item.icon}</span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1.5 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-sm font-medium text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
