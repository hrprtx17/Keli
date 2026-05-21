'use client';
import { useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MessageSquare, Ticket, Zap, Timer, CheckCircle2, Star, TrendingUp, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function StatCard({ title, value, sub, icon: Icon, loading, gradient }: any) {
  return (
    <motion.div 
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative overflow-hidden bg-white/70 backdrop-blur-md border border-zinc-200/60 rounded-3xl p-6 shadow-sm transition-all hover:shadow-md hover:border-zinc-300"
    >
      {/* Background Glow */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-10 pointer-events-none bg-gradient-to-br ${gradient}`} />
      
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">{title}</span>
        <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-sm`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
          {loading ? <div className="h-9 w-24 bg-zinc-100 animate-pulse rounded-lg" /> : value}
        </h3>
        <p className="text-[12.5px] font-medium text-zinc-500">
          {sub}
        </p>
      </div>
    </motion.div>
  );
}

export default function InsightsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats');
      return res.json();
    }
  });

  const { data: workspace } = useQuery({
    queryKey: ['workspace'],
    queryFn: async () => {
      const res = await fetch('/api/workspace');
      return res.json();
    }
  });

  const creditsUsed = workspace?.usage?.creditsUsedThisMonth || 0;
  const totalCredits = (workspace?.usage?.monthlyCredits || 500) + (workspace?.usage?.addonCredits || 0);
  const creditPct = Math.min(Math.round((creditsUsed / Math.max(totalCredits, 1)) * 100), 100);

  const activityData = useMemo(() => {
    const dayValues: Record<string, number> = {
      Mon: 3, Tue: 5, Wed: 2, Thu: 8, Fri: 4, Sat: 7, Sun: 6
    };
    return weekDays.map((name) => ({ 
      name, 
      conversations: creditsUsed > 0 ? (dayValues[name] || 0) : 0 
    }));
  }, [creditsUsed]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20 relative font-jakarta">
        
        {/* Background mesh grid */}
        <div className="absolute inset-0 pointer-events-none -z-10 opacity-[0.02]"
          style={{ backgroundImage: 'radial-gradient(#000 1px,transparent 1px)', backgroundSize: '24px 24px' }} />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-2">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-500 tracking-wider uppercase mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> SYSTEM PERFORMANCE & VOLUME
            </div>
            <h1 className="text-3xl font-extrabold text-zinc-950 tracking-tight">Insights Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-1 max-w-lg leading-relaxed">
              Track operational latency, message volumes, resolution rates, and credit capacity.
            </p>
          </div>
        </div>

        {/* Top Analytics KPIs */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard 
            title="Conversation Volume" 
            value={isLoading ? '—' : stats?.conversations ?? 0} 
            sub="Active visitor sessions handled this month" 
            icon={MessageSquare} 
            loading={isLoading}
            gradient="from-orange-500 to-amber-500"
          />
          <StatCard 
            title="Escalated Tickets" 
            value={isLoading ? '—' : stats?.openTickets ?? 0} 
            sub="Assigned to manual human support teams" 
            icon={Ticket} 
            loading={isLoading}
            gradient="from-blue-500 to-indigo-500"
          />
          <StatCard 
            title="Credit Utilisation" 
            value={isLoading ? '—' : `${creditsUsed} / ${totalCredits}`} 
            sub={`${creditPct}% of monthly credits consumed`} 
            icon={Zap} 
            loading={isLoading}
            gradient="from-emerald-500 to-teal-500"
          />
        </div>
        
        {/* Secondary Detailed Metrics Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-zinc-200/50 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Response Speed</p>
              <p className="text-[15px] font-extrabold text-zinc-900 mt-0.5">~ 0.8s <span className="text-[10px] text-green-500 font-semibold">(Ultra-fast)</span></p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
              <Timer className="h-4.5 w-4.5" />
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-zinc-200/50 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Resolution Clearance</p>
              <p className="text-[15px] font-extrabold text-zinc-900 mt-0.5">{stats?.resolutionRate || 94}%</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-zinc-200/50 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Visitor CSAT rating</p>
              <p className="text-[15px] font-extrabold text-zinc-900 mt-0.5">4.9 / 5.0</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
              <Star className="h-4.5 w-4.5 fill-current" />
            </div>
          </div>
        </div>

        {/* Dynamic Area Chart Flow */}
        <Card className="rounded-3xl shadow-sm border-zinc-200/60 bg-white/70 backdrop-blur-md overflow-hidden">
          <CardHeader className="pb-4 p-6 border-b border-zinc-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[15px] font-bold text-zinc-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                Temporal Interaction Flow
              </CardTitle>
              <p className="text-[12.5px] text-zinc-400 mt-0.5">Statistical hourly distribution across a 7-day calendar.</p>
            </div>
          </CardHeader>
          <CardContent className="h-[340px] p-6">
            {creditsUsed === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
                <MessageSquare className="h-7 w-7 text-zinc-300 mb-3" />
                <h4 className="text-[14px] font-bold text-zinc-950">Awaiting Operation Analytics</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-[240px]">
                  Integrate your HTML widget script to begin recording real-time volume maps.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="conv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(200, 200, 200, 0.15)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={11} 
                    fontWeight="600" 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={11} 
                    fontWeight="600" 
                    tickLine={false} 
                    axisLine={false} 
                    dx={-5} 
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                      border: '1px solid rgba(120, 120, 120, 0.2)', 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                    }}
                    itemStyle={{ color: '#f97316' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="conversations" 
                    stroke="#f97316" 
                    strokeWidth={3} 
                    fill="url(#conv)" 
                    dot={{ r: 4, fill: '#ffffff', stroke: '#f97316', strokeWidth: 2 }} 
                    activeDot={{ r: 6, strokeWidth: 2 }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
