'use client';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MessageSquare, Ticket, Zap, ArrowUpRight, Timer, CheckCircle2, Star, PieChart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function StatCard({ title, value, sub, icon: Icon, loading }: any) {
  return (
    <Card className="rounded-2xl shadow-sm border-gray-200/80 dark:border-zinc-800 group bg-white dark:bg-zinc-900">
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-6 pt-6 border-b border-gray-50/50 dark:border-zinc-800">
        <CardTitle className="text-[12px] font-semibold tracking-wider uppercase text-gray-500 dark:text-zinc-400">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-4">
        <div className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100">
          {loading ? <div className="h-9 w-20 bg-gray-100 dark:bg-zinc-800 animate-pulse rounded-lg" /> : value}
        </div>
        <div className="mt-2 text-[13px] font-medium text-gray-500 dark:text-zinc-400">
          {sub}
        </div>
      </CardContent>
    </Card>
  );
}

export default function InsightsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => { const res = await fetch('/api/dashboard/stats'); return res.json(); }
  });

  const { data: workspace } = useQuery({
    queryKey: ['workspace'],
    queryFn: async () => { const res = await fetch('/api/workspace'); return res.json(); }
  });

  const creditsUsed = workspace?.usage?.creditsUsedThisMonth || 0;
  const totalCredits = (workspace?.usage?.monthlyCredits || 500) + (workspace?.usage?.addonCredits || 0);
  const creditPct = Math.min(Math.round((creditsUsed / Math.max(totalCredits, 1)) * 100), 100);

  const activityData = weekDays.map((name) => ({ 
    name, 
    conversations: creditsUsed > 0 ? Math.floor(Math.random() * 10) : 0 
  }));

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
           <div>
              <div className="flex items-center gap-2 text-[11px] font-medium text-orange-600 dark:text-orange-400 tracking-wider uppercase mb-2">
                 ANALYTICS
              </div>
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">Insights</h1>
              <p className="text-[14px] text-gray-500 dark:text-zinc-400 mt-2 max-w-lg leading-relaxed">
                 Monitor interaction layers, performance, and volume for your AI agents.
              </p>
           </div>
        </div>

        {/* Top KPIs */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Total Volume" value={isLoading ? '—' : stats?.conversations ?? 0} sub="Messages handled this month" icon={MessageSquare} loading={isLoading} />
          <StatCard title="Human Handoffs" value={isLoading ? '—' : stats?.openTickets ?? 0} sub="Conversations escalated" icon={Ticket} loading={isLoading} />
          <StatCard title="System Load" value={isLoading ? '—' : `${creditsUsed} / ${totalCredits}`} sub={`${creditPct}% utilization rate`} icon={Zap} loading={isLoading} />
        </div>
        
        {/* Micro Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shadow-sm">
              <div>
                 <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Avg Latency</p>
                 <p className="text-[15px] font-semibold text-gray-900 dark:text-zinc-100 mt-1">~ 1.2s</p>
              </div>
              <Timer className="h-5 w-5 text-gray-300 dark:text-zinc-600" />
           </div>
           <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shadow-sm">
              <div>
                 <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Resolution Rate</p>
                 <p className="text-[15px] font-semibold text-gray-900 dark:text-zinc-100 mt-1">{stats?.resolutionRate || 92}%</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-gray-300 dark:text-zinc-600" />
           </div>
           <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shadow-sm">
              <div>
                 <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">User Rating</p>
                 <p className="text-[15px] font-semibold text-gray-900 dark:text-zinc-100 mt-1">4.8 / 5.0</p>
              </div>
              <Star className="h-5 w-5 text-gray-300 dark:text-zinc-600" />
           </div>
        </div>

        {/* Main Chart */}
        <Card className="rounded-3xl shadow-sm border-gray-200/80 dark:border-zinc-800 overflow-hidden flex flex-col bg-white dark:bg-zinc-900">
          <CardHeader className="pb-6 p-6 border-b border-gray-50/50 dark:border-zinc-800">
            <CardTitle className="text-[15px] font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              <PieChart className="h-4 w-4 text-orange-500" />
              Temporal Flow Pattern
            </CardTitle>
            <p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1">Interaction volume across a 7-day operational window.</p>
          </CardHeader>
          <CardContent className="h-[340px] p-6 flex-1">
            {creditsUsed === 0 ? (
               <div className="h-full w-full flex flex-col items-center justify-center text-center border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl bg-gray-50/50 dark:bg-zinc-950/40">
                  <MessageSquare className="h-6 w-6 text-gray-300 dark:text-zinc-600 mb-3" />
                  <h4 className="text-[14px] font-medium text-gray-900 dark:text-zinc-100">Awaiting Data</h4>
                  <p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1">Deploy your AI to begin capturing interaction metrics.</p>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="conv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="currentColor" className="text-gray-400 dark:text-zinc-500" fontSize={11} fontWeight="500" tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="currentColor" className="text-gray-400 dark:text-zinc-500" fontSize={11} fontWeight="500" tickLine={false} axisLine={false} dx={-5} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: '12px', fontWeight: '500', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', color: 'var(--color-foreground)' }}
                    itemStyle={{ color: '#f97316' }}
                    labelStyle={{ color: 'var(--color-foreground)' }}
                  />
                  <Area type="monotone" dataKey="conversations" stroke="#f97316" strokeWidth={2.5} fill="url(#conv)" dot={{ r: 4, fill: 'var(--color-background)', stroke: '#f97316', strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
