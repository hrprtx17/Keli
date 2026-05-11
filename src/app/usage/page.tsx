'use client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronDown, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Tooltip } from 'recharts';

const COLORS = ['#a78bfa', '#818cf8', '#60a5fa', '#34d399', '#fbbf24'];

export default function UsagePage() {
  const { data: workspace } = useQuery({
    queryKey: ['workspace'],
    queryFn: async () => { const res = await fetch('/api/workspace'); return res.json(); }
  });

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => { const res = await fetch('/api/agents'); return res.json(); }
  });

  const { data: analytics } = useQuery({
    queryKey: ['usage-analytics'],
    queryFn: async () => { const res = await fetch('/api/usage/analytics'); return res.json(); }
  });

  const usedCredits = workspace?.usage?.creditsUsedThisMonth || 0;
  const totalCredits = (workspace?.usage?.monthlyCredits || 500) + (workspace?.usage?.addonCredits || 0);
  const usedAgentsCount = agents?.length || 0;
  const maxAgentsCount = workspace?.limits?.maxAgents || 1;

  // Map real data from server aggregation loop
  const historyData = analytics?.history || [{ name: 'No Activity', credits: 0 }];
  const pieData = analytics?.perAgent || [{ name: 'No Activity', value: 0 }];

  // Get real timestamp labels for filtering box
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(today.getDate() - 30);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateRangeStr = `${monthNames[monthAgo.getMonth()]} ${monthAgo.getDate().toString().padStart(2, '0')} - ${monthNames[today.getMonth()]} ${today.getDate().toString().padStart(2, '0')}, ${today.getFullYear()}`;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Usage</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-50">
              All agents <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-50">
              <CalendarDays className="h-3.5 w-3.5 opacity-60" />
              {dateRangeStr}
            </div>
          </div>
        </div>

        {/* Status Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Credits */}
          <Card className="rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
            <CardContent className="p-6 flex flex-col justify-between h-full min-h-[110px]">
              <div className="relative w-7 h-7 mb-2">
                 <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-zinc-100 dark:text-zinc-800" strokeDasharray="100, 100" stroke="currentColor" strokeWidth="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path className="text-blue-500" strokeDasharray={`${Math.min((usedCredits/totalCredits)*100, 100)}, 100`} strokeLinecap="round" stroke="currentColor" strokeWidth="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                 </svg>
              </div>
              <div>
                <div className="flex items-baseline gap-0.5 font-bold">
                  <span className="text-xl text-zinc-900 dark:text-zinc-100">{usedCredits}</span>
                  <span className="text-sm text-zinc-400 dark:text-zinc-500">/ {totalCredits}</span>
                  <Info className="h-3 w-3 text-zinc-300 ml-1 cursor-help" />
                </div>
                <p className="text-[11px] text-zinc-500 font-medium mt-1">Credits used during the selected period</p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Agents */}
          <Card className="rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
            <CardContent className="p-6 flex flex-col justify-between h-full min-h-[110px]">
              <div className="relative w-7 h-7 mb-2">
                 <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-zinc-100 dark:text-zinc-800" strokeDasharray="100, 100" stroke="currentColor" strokeWidth="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path className="text-blue-500" strokeDasharray={`${Math.min((usedAgentsCount/maxAgentsCount)*100, 100)}, 100`} strokeLinecap="round" stroke="currentColor" strokeWidth="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                 </svg>
              </div>
              <div>
                <div className="flex items-baseline gap-0.5 font-bold">
                  <span className="text-xl text-zinc-900 dark:text-zinc-100">{usedAgentsCount}</span>
                  <span className="text-sm text-zinc-400 dark:text-zinc-500">/ {maxAgentsCount}</span>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium mt-1">Agents used in your workspace</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card 3: Usage History BarChart */}
        <Card className="rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
          <CardHeader className="pb-2 pt-6 px-6">
             <CardTitle className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">Usage history</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={historyData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                 <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#a1a1aa' }} 
                    dy={10}
                    interval={0}
                 />
                 <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#a1a1aa' }}
                 />
                 <Tooltip cursor={{fill: '#f8fafc'}} />
                 <Bar dataKey="credits" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={30} />
               </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Card 4: Credits Used Per Agent Pie */}
        <Card className="rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04)] border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
          <CardHeader className="pb-2 pt-6 px-6">
             <CardTitle className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">Credits used per agent</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between min-h-[250px]">
            
            <div className="w-full md:w-1/2 h-[200px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={85} 
                    stroke="none"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend List */}
            <div className="w-full md:w-1/2 flex flex-col gap-3 pl-0 md:pl-10 mt-6 md:mt-0">
               {pieData.map((item: any, idx: number) => (
                 <div key={idx} className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                       {item.name}
                    </div>
                    <div className="text-zinc-900 dark:text-zinc-100">
                       {usedCredits > 0 ? item.value : 1}
                    </div>
                 </div>
               ))}
            </div>

          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
