'use client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, CalendarDays, TrendingUp, Activity, Bot, Zap } from 'lucide-react';
import { useState } from 'react';

export default function UsagePage() {
  const [selectedMonth, setSelectedMonth] = useState('May 2026');
  
  const { data: workspace } = useQuery({
    queryKey: ['workspace'],
    queryFn: async () => { const res = await fetch('/api/workspace'); return res.json(); }
  });

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => { const res = await fetch('/api/agents'); return res.json(); }
  });

  const isPremium = workspace?.plan === 'premium';

  const daysInMonth = Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    // If not premium, set random values to 0 so it remains blank!
    val: isPremium ? Math.floor(Math.random() * 100) : 0,
  }));

  const agentStats = agents?.map((a: any) => ({
    name: a.name,
    usage: isPremium ? (Math.floor(Math.random() * 400) + 50) : 0,
    trend: isPremium ? (Math.floor(Math.random() * 15) + 2) : 0,
  })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-20">
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
               <h1 className="text-3xl font-bold tracking-tight">Platform Usage</h1>
               <p className="text-muted-foreground mt-1.5">Deep dive analytics into your runtime resource consumption.</p>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border rounded-2xl p-1.5 shadow-sm">
               <button className="px-4 py-1.5 text-xs font-bold rounded-xl bg-zinc-100 dark:bg-zinc-800">Daily</button>
               <button className="px-4 py-1.5 text-xs font-bold text-muted-foreground rounded-xl">Monthly</button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <StatBlock title="Gross API Consumption" value={isPremium ? "1,429" : "0"} sub="Requests" trend={isPremium ? "+12.5%" : "0.0%"} />
            <StatBlock title="Vector Store Calls" value={isPremium ? "45,102" : "0"} sub="Tokens" trend={isPremium ? "+8.1%" : "0.0%"} />
            <StatBlock title="Computation Units" value={isPremium ? "84.2" : "0.0"} sub="Hrs" trend="0.0%" negative={false} />
            <StatBlock title="Active Handlers" value={agents?.length || 0} sub="Agents" trend="Active" />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Calendar Usage Plot */}
            <Card className="lg:col-span-2 rounded-3xl shadow-md border-zinc-200 dark:border-zinc-800">
               <CardHeader className="border-b p-6 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2.5">
                     <CalendarDays className="h-5 w-5 text-primary" /> 
                     Heatmap Activity Registry
                  </CardTitle>
                  <div className="text-sm font-bold text-muted-foreground bg-zinc-50 border dark:bg-zinc-900 px-3 py-1 rounded-xl">{selectedMonth}</div>
               </CardHeader>
               <CardContent className="p-6">
                  <div className="mb-6 flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                     <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2.5 md:gap-3">
                     {/* Empty padding for grid alignment */}
                     <div className="aspect-square rounded-xl" />
                     <div className="aspect-square rounded-xl" />
                     {daysInMonth.map((d) => {
                       const intensity = d.val > 80 ? 'bg-orange-500 text-white border-orange-600' : 
                                         d.val > 50 ? 'bg-orange-300 dark:bg-orange-700 text-orange-950 dark:text-white border-orange-400/30' : 
                                         d.val > 20 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 border-orange-200/50' : 
                                         'bg-zinc-50 dark:bg-zinc-900 text-zinc-400 border-zinc-200/50 dark:border-zinc-800';
                       return (
                         <div key={d.day} className={`group aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all cursor-pointer hover:scale-105 hover:z-10 hover:shadow-lg ${intensity}`}>
                            <span className="text-xs md:text-sm font-bold">{d.day}</span>
                            <div className="absolute inset-x-0 -bottom-8 opacity-0 group-hover:opacity-100 transition-all bg-black text-white text-[10px] font-bold text-center p-1 rounded pointer-events-none z-20 whitespace-nowrap">
                               {d.val} units
                            </div>
                         </div>
                       );
                     })}
                  </div>
                  <div className="mt-8 pt-6 border-t flex items-center gap-6 justify-end">
                     <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Activity Intensity:</span>
                     <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-zinc-50 border" />
                        <div className="w-4 h-4 rounded bg-orange-100 border" />
                        <div className="w-4 h-4 rounded bg-orange-300 border" />
                        <div className="w-4 h-4 rounded bg-orange-500 border" />
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* Agent Distribution List */}
            <Card className="rounded-3xl shadow-md border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
               <CardHeader className="border-b p-6 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <CardTitle className="text-lg font-bold flex items-center gap-2.5">
                     <Bot className="h-5 w-5 text-primary" /> 
                     Agent Load Share
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-6 flex-1 flex flex-col">
                  {!isPremium || !agentStats || agentStats.length === 0 ? (
                     <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                        <Zap className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-4" />
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100">Load Distribution Frozen</h4>
                        <p className="text-xs text-zinc-500 mt-2 max-w-[200px]">Requires higher-tier deployment to track node differentials.</p>
                     </div>
                  ) : (
                     <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {agentStats.map((a: any, i: number) => {
                           const totalShare = agentStats.reduce((sum: number, item: any) => sum + item.usage, 0);
                           const pct = totalShare > 0 ? Math.round((a.usage / totalShare) * 100) : 0;
                           return (
                              <div key={i} className="group animate-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
                                 <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                       <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                          <Zap className="h-4 w-4 text-primary" />
                                       </div>
                                       <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors">{a.name}</span>
                                    </div>
                                    <div className="text-right">
                                       <span className="font-black text-sm">{a.usage}</span>
                                       <p className="text-[10px] font-bold text-emerald-500 flex items-center justify-end gap-0.5">
                                          <TrendingUp className="h-2.5 w-2.5" /> {a.trend}%
                                       </p>
                                    </div>
                                 </div>
                                 <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                    <div 
                                       className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-1000" 
                                       style={{ width: `${pct}%`, transitionDelay: `${i * 100}ms` }}
                                    />
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  )}
                  <div className="mt-auto pt-6 border-t text-center">
                     <p className="text-xs text-muted-foreground font-medium mb-3">Operational visualization integrity check.</p>
                     <button className="w-full py-3 text-xs font-black uppercase tracking-widest bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl hover:opacity-90 transition-all shadow-md" onClick={() => window.location.href = '/plans'}>
                        {isPremium ? 'Analyze Active Nodes' : 'Unfreeze Matrix Dashboard'}
                     </button>
                  </div>
               </CardContent>
            </Card>

         </div>
      </div>
    </DashboardLayout>
  );
}

function StatBlock({ title, value, sub, trend, negative = false }: any) {
   return (
      <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
         <div className="absolute -right-4 -top-4 opacity-0 group-hover:opacity-5 transition-all duration-500">
            <Activity className="h-24 w-24 text-zinc-900 dark:text-white" />
         </div>
         <p className="text-[11px] font-black tracking-widest uppercase text-zinc-400 mb-2">{title}</p>
         <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black tracking-tight">{value}</span>
            <span className="text-xs font-bold text-muted-foreground">{sub}</span>
         </div>
         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${negative ? 'text-red-600 bg-red-50 border-red-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
            {trend}
         </span>
      </div>
   );
}
