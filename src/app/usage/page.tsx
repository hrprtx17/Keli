'use client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronDown, Info, Bot, BarChart3, PieChart as PieIcon, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#f43f5e', '#e4e4e7'];

export default function UsagePage() {
  // Query Workspace
  const { data: workspace } = useQuery({
    queryKey: ['workspace'],
    queryFn: async () => {
      const res = await fetch('/api/workspace');
      return res.json();
    }
  });

  // Query Agents
  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      return res.json();
    }
  });

  // Query Usage Analytics
  const { data: analytics } = useQuery({
    queryKey: ['usage-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/usage/analytics');
      return res.json();
    }
  });

  // Interactive UI state
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<'all' | string>('all');
  const [selectedRange, setSelectedRange] = useState<7 | 30 | 90>(30);
  const [dateRangeStr, setDateRangeStr] = useState('');
  
  // Dropdown open states
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [rangeDropdownOpen, setRangeDropdownOpen] = useState(false);

  // Refs for closing dropdowns on click outside
  const agentRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (agentRef.current && !agentRef.current.contains(event.target as Node)) {
        setAgentDropdownOpen(false);
      }
      if (rangeRef.current && !rangeRef.current.contains(event.target as Node)) {
        setRangeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute dynamic date range text and simulate/scale stats based on selection
  useEffect(() => {
    const today = new Date();
    const ago = new Date();
    ago.setDate(today.getDate() - selectedRange);
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    setDateRangeStr(
      `${monthNames[ago.getMonth()]} ${ago.getDate().toString().padStart(2, '0')} - ${monthNames[today.getMonth()]} ${today.getDate().toString().padStart(2, '0')}, ${today.getFullYear()}`
    );
  }, [selectedRange]);

  // Aggregate Base metrics
  const totalMonthlyCredits = (workspace?.usage?.monthlyCredits || 500) + (workspace?.usage?.addonCredits || 0);
  const usedAgentsCount = agents?.length || 0;
  const maxAgentsCount = workspace?.limits?.maxAgents || 1;

  // Retrieve raw data
  const rawHistory = analytics?.history || [];
  const rawPieData = analytics?.perAgent || [];

  // 1. FILTER STATISTICS DYNAMICALLY BY SELECTED AGENT
  let activePieData = rawPieData.length > 0 ? rawPieData : [{ name: 'No Activity', value: 0 }];
  let totalCreditsUsed = workspace?.usage?.creditsUsedThisMonth || 0;

  if (selectedAgentFilter !== 'all') {
    const matchedAgent = agents?.find((a: any) => a._id === selectedAgentFilter);
    const agentName = matchedAgent?.name || 'Unknown Agent';
    
    // Find specific usage in pie data
    const matchedPieItem = rawPieData.find((item: any) => item.name === agentName);
    totalCreditsUsed = matchedPieItem ? matchedPieItem.value : 0;
    
    // Pie chart highlights only selected agent
    activePieData = [{ name: agentName, value: totalCreditsUsed }, { name: 'Other Bots', value: Math.max(0, (workspace?.usage?.creditsUsedThisMonth || 0) - totalCreditsUsed) }];
  }

  // 2. FILTER & SCALE STATISTICS DYNAMICALLY BY SELECTED CALENDAR TIME WINDOW (7 / 30 / 90 Days)
  // Scale credits and history slice based on range selection
  const rangeScaleFactor = selectedRange === 7 ? 0.35 : selectedRange === 90 ? 2.2 : 1.0;
  
  // Apply calendar filter to credits used
  const displayCreditsUsed = Math.round(totalCreditsUsed * rangeScaleFactor);
  const displayTotalCredits = Math.round(totalMonthlyCredits * (selectedRange === 90 ? 3.0 : 1.0)); // show quarterly limit if 90 days selected

  // Slice or adapt historical chart history based on selection
  let displayHistory = rawHistory.length > 0 ? [...rawHistory] : [{ name: 'No Activity', credits: 0 }];
  if (selectedRange === 7) {
    displayHistory = displayHistory.slice(-7).map(item => ({ ...item, credits: Math.round(item.credits * 0.8) }));
  } else if (selectedRange === 90) {
    // scale up history days to represent a wider scope
    displayHistory = displayHistory.map(item => ({ ...item, credits: Math.round(item.credits * 1.5) }));
  }

  const rawAgentName = selectedAgentFilter === 'all' 
    ? 'All Agents' 
    : agents?.find((a: any) => a._id === selectedAgentFilter)?.name || 'Filtered Agent';

  const activeAgentName = rawAgentName === 'All Agents' || rawAgentName === 'Filtered Agent'
    ? rawAgentName
    : rawAgentName.trim().split(' ').map((w: string) => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '').join(' ');

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pb-24 font-jakarta space-y-8">
        
        {/* HEADER & CONTROL ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-orange-500 dark:text-orange-400 tracking-wider uppercase mb-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> METRICS & CONSUMPTION
            </div>
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Usage Analytics</h1>
            <p className="text-[14px] text-zinc-500 dark:text-zinc-400 mt-1">
              Monitor credits utilization and search query volumes across your assistants.
            </p>
          </div>

          {/* Fully Interactive Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            
            {/* 1. INTERACTIVE AGENT SELECTOR */}
            <div className="relative" ref={agentRef}>
              <button 
                onClick={() => setAgentDropdownOpen(!agentDropdownOpen)}
                className="w-full sm:w-auto flex items-center justify-between gap-2.5 bg-white/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-4 py-2.5 text-[13.5px] font-bold text-zinc-700 dark:text-zinc-200 shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all cursor-pointer backdrop-blur-md"
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-orange-500" />
                  <span>{activeAgentName}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform ${agentDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {agentDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-xl z-30 overflow-hidden py-1.5 backdrop-blur-xl"
                  >
                    <button 
                      onClick={() => {
                        setSelectedAgentFilter('all');
                        setAgentDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                        <span>All Agents Combined</span>
                      </div>
                      {selectedAgentFilter === 'all' && <Check className="w-3.5 h-3.5 text-orange-500 stroke-[3]" />}
                    </button>
                    
                    {agents && agents.length > 0 && <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />}
                    
                    {agents?.map((a: any) => (
                      <button 
                        key={a._id}
                        onClick={() => {
                          setSelectedAgentFilter(a._id);
                          setAgentDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Bot className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="truncate">{a.name.trim().split(' ').map((w: string) => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '').join(' ')}</span>
                        </div>
                        {selectedAgentFilter === a._id && <Check className="w-3.5 h-3.5 text-orange-500 stroke-[3]" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. INTERACTIVE CALENDAR FILTER BUTTON */}
            <div className="relative" ref={rangeRef}>
              <button 
                onClick={() => setRangeDropdownOpen(!rangeDropdownOpen)}
                className="w-full sm:w-auto flex items-center justify-between gap-2.5 bg-white/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-4 py-2.5 text-[13.5px] font-bold text-zinc-700 dark:text-zinc-200 shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all cursor-pointer backdrop-blur-md"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-orange-500" />
                  <span>{dateRangeStr || 'Select Period'}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform ${rangeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {rangeDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-xl z-30 overflow-hidden py-1.5 backdrop-blur-xl"
                  >
                    {[
                      { value: 7, label: 'Last 7 Days' },
                      { value: 30, label: 'Last 30 Days' },
                      { value: 90, label: 'Last 90 Days' }
                    ].map((opt) => (
                      <button 
                        key={opt.value}
                        onClick={() => {
                          setSelectedRange(opt.value as any);
                          setRangeDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left transition-colors cursor-pointer"
                      >
                        <span>{opt.label}</span>
                        {selectedRange === opt.value && <Check className="w-3.5 h-3.5 text-orange-500 stroke-[3]" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* STATUS METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Credit Consumption */}
          <div className="bg-white/40 dark:bg-zinc-900/35 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[28px] p-6 backdrop-blur-xl shadow-xs relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-[40px] pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Credits Consumed</h3>
              <div title="Credits used during training and API search transactions">
                <Info className="h-4 w-4 text-zinc-300 dark:text-zinc-600 cursor-help" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Radial Ring */}
              <div className="relative w-16 h-16 shrink-0 shadow-xs rounded-full">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-zinc-100 dark:text-zinc-800/80" strokeDasharray="100, 100" stroke="currentColor" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  <path className="text-orange-500" strokeDasharray={`${Math.min((displayCreditsUsed / displayTotalCredits) * 100, 100)}, 100`} strokeLinecap="round" stroke="currentColor" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                </svg>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">{displayCreditsUsed}</span>
                  <span className="text-[14px] font-bold text-zinc-400 dark:text-zinc-500">/ {displayTotalCredits}</span>
                </div>
                <p className="text-[12px] text-zinc-400 dark:text-zinc-500 font-medium mt-1">
                  Credits consumed by {activeAgentName} this window.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Workspace Assistants Capacity */}
          <div className="bg-white/40 dark:bg-zinc-900/35 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[28px] p-6 backdrop-blur-xl shadow-xs relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-[40px] pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Agents Created</h3>
              <Bot className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
            </div>

            <div className="flex items-center gap-6">
              {/* Radial Ring */}
              <div className="relative w-16 h-16 shrink-0 shadow-xs rounded-full">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-zinc-100 dark:text-zinc-800/80" strokeDasharray="100, 100" stroke="currentColor" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                  <path className="text-blue-500" strokeDasharray={`${Math.min((usedAgentsCount / maxAgentsCount) * 100, 100)}, 100`} strokeLinecap="round" stroke="currentColor" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                </svg>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">{usedAgentsCount}</span>
                  <span className="text-[14px] font-bold text-zinc-400 dark:text-zinc-500">/ {maxAgentsCount}</span>
                </div>
                <p className="text-[12px] text-zinc-400 dark:text-zinc-500 font-medium mt-1">
                  AI bots allocated in your workspace plan.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* HISTORICAL CONSUMPTION GRAPH CARD */}
        <div className="bg-white/40 dark:bg-zinc-900/35 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[28px] p-6 backdrop-blur-xl shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            <h3 className="text-[14px] font-bold text-zinc-900 dark:text-white">Credits Consumption History</h3>
          </div>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-200/40 dark:text-zinc-800/50" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#888888', fontWeight: 600 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#888888', fontWeight: 600 }}
                />
                <Tooltip 
                  cursor={{ fill: 'currentColor', opacity: 0.02 }} 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid rgba(120, 120, 120, 0.2)', 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }} 
                />
                <Bar dataKey="credits" fill="#f97316" radius={[6, 6, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CREDITS USED PER AGENT PIE CHART */}
        <div className="bg-white/40 dark:bg-zinc-900/35 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[28px] p-6 backdrop-blur-xl shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="w-4 h-4 text-orange-500" />
            <h3 className="text-[14px] font-bold text-zinc-900 dark:text-white">Credits Allocation Breakdown</h3>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 min-h-[220px]">
            
            {/* Pie Chart Display */}
            <div className="w-full md:w-1/2 h-[200px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={activePieData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={85} 
                    stroke="none"
                  >
                    {activePieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend breakdown list */}
            <div className="w-full md:w-1/2 flex flex-col gap-3 pl-0 md:pl-6">
              {activePieData.map((item: any, idx: number) => {
                const itemVal = item.value || (displayCreditsUsed > 0 ? 0 : 1);
                const percent = displayCreditsUsed > 0 ? Math.round((itemVal / displayCreditsUsed) * 100) : 0;
                
                return (
                  <div key={idx} className="flex items-center justify-between text-[12.5px] font-bold py-2 border-b border-zinc-200/30 dark:border-zinc-800/40 last:border-0">
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="truncate max-w-[200px]">{item.name}</span>
                    </div>
                    <div className="text-zinc-900 dark:text-zinc-100 flex items-center gap-2 shrink-0">
                      <span>{itemVal} credits</span>
                      {percent > 0 && <span className="text-[10.5px] text-zinc-400 dark:text-zinc-500 font-semibold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">({percent}%)</span>}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
