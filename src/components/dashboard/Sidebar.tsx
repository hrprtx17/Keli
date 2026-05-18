'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  MessageSquare, Settings, LogOut, ChevronDown, Zap, 
  BarChart3, Database, Rocket, Bot, Plus, Search, Check,
  UserCircle, CreditCard, PieChart, Inbox, PlayCircle, Fingerprint, Network,
  Sun, Moon, Ticket
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';

export function Sidebar({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOpenCount = async () => {
      try {
        const res = await fetch('/api/tickets?status=open');
        if (!res.ok) return;
        const data = await res.json();
        if (data && typeof data.total === 'number') {
          setOpenTicketsCount(data.total);
        }
      } catch (err) {
        console.error('Failed to fetch open tickets count', err);
      }
    };
    fetchOpenCount();
    const interval = setInterval(fetchOpenCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamic state-preservation system
  const agentPathMatch = pathname.match(/^\/agents\/([a-zA-Z0-9]+)/);
  const urlParamAgentId = searchParams.get('agentId');
  const activeAgentId = agentPathMatch ? agentPathMatch[1] : urlParamAgentId;

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const { data: workspace } = useQuery({
    queryKey: ['workspace-sidebar'],
    queryFn: async () => {
      const res = await fetch('/api/workspace');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60_000,
  });

  // Ensure there's always an active agent if agents exist, otherwise force onboarding
  useEffect(() => {
    if (agents) {
      if (agents.length > 0 && !activeAgentId && pathname !== '/onboarding') {
        router.replace(`/agents/${agents[0]._id}`);
      } else if (agents.length === 0 && pathname !== '/onboarding') {
        router.replace('/onboarding');
      }
    }
  }, [agents, activeAgentId, pathname, router]);

  const activeAgent = agents?.find((a: any) => a._id === activeAgentId) || agents?.[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const NavLink = ({ href, icon: Icon, children, exact = false, isLocked = false }: any) => {
    const isActive = exact ? pathname === href : (pathname === href || pathname.startsWith(href));
    
    // Auto-tether active context
    const finalHref = (activeAgentId && !href.startsWith('/agents') && href !== '#' && !href.includes('?')) 
      ? `${href}?agentId=${activeAgentId}` 
      : href;

    if (isLocked) {
      return (
        <div className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-400 dark:text-zinc-500 cursor-not-allowed transition-all opacity-70">
           <div className="flex items-center gap-3">
             {Icon && <Icon className="h-4.5 w-4.5 shrink-0 opacity-60" />}
             <span className="truncate">{children}</span>
           </div>
           <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-md">Soon</span>
        </div>
      );
    }

    return (
      <Link
        href={finalHref}
        onClick={onNavClick}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
          isActive
            ? 'bg-gray-100/80 dark:bg-zinc-900 text-black dark:text-zinc-100 font-semibold border border-transparent dark:border-zinc-800/40'
            : 'text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-900/50'
        }`}
      >
        {Icon && <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-orange-500' : 'text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300 transition-colors'}`} />}
        <span className="flex-1 truncate">{children}</span>
        {(children === 'Inbox' || children === 'Tickets') && openTicketsCount > 0 && (
          <span 
            className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center justify-center rounded-full font-bold text-white bg-[#FF6B35]"
            style={{
              width: '18px',
              height: '18px',
              fontSize: '10px',
              lineHeight: '1',
            }}
          >
            {openTicketsCount >= 10 ? '9+' : openTicketsCount}
          </span>
        )}
      </Link>
    );
  };

  const NavSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-6 last:mb-0">
      <div className="px-3 mb-2 text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">{title}</div>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );

  const filteredAgents = agents?.filter((a: any) => a.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  return (
    <div className="flex h-screen w-[260px] flex-col border-r border-gray-200/80 bg-[#FAFAFA] dark:bg-zinc-950 dark:border-zinc-900 antialiased">
      
      {/* 1. AGENT SWITCHER HEADER */}
      <div className="px-4 py-4 relative z-50" ref={dropdownRef}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`w-full flex items-center justify-between bg-white dark:bg-zinc-900 border ${dropdownOpen ? 'border-orange-500/50 shadow-[0_0_0_3px_rgba(249,115,22,0.1)] dark:border-orange-500/40' : 'border-gray-200/80 dark:border-zinc-800 shadow-sm hover:border-gray-300 dark:hover:border-zinc-700'} rounded-xl px-3 py-2.5 transition-all`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-[14px] text-gray-900 dark:text-zinc-100 truncate">
               {activeAgent?.name || 'Select Agent'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-orange-500' : ''}`} />
        </button>

        {/* DROPDOWN PANEL */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-[calc(100%-8px)] left-4 right-4 bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-xl shadow-[0_12px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)] overflow-hidden z-50 flex flex-col"
            >
              <div className="p-2 border-b border-gray-100 dark:border-zinc-800">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search AI Agents..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-transparent rounded-lg pl-8 pr-3 py-1.5 text-[12px] font-medium text-gray-900 dark:text-zinc-100 outline-none focus:border-gray-200 dark:focus:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 transition-all placeholder:text-gray-400"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="max-h-[220px] overflow-y-auto custom-scrollbar py-1">
                {filteredAgents.length === 0 ? (
                  <div className="px-3 py-4 text-center text-[12px] text-gray-500 font-medium">No agents found</div>
                ) : (
                  filteredAgents.map((agent: any) => (
                    <button 
                      key={agent._id}
                      onClick={() => {
                        router.push(`/agents/${agent._id}`);
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 flex items-center justify-center shrink-0 group-hover:bg-white dark:group-hover:bg-zinc-700 group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-200 dark:group-hover:border-zinc-600">
                          <Bot className="w-3 h-3" />
                        </div>
                        <div className="min-w-0">
                           <div className="font-semibold text-[13px] text-gray-900 dark:text-zinc-100 truncate leading-tight">{agent.name}</div>
                           <div className="text-[10px] text-gray-500 dark:text-zinc-400 uppercase tracking-wider font-medium">{agent.model || 'GPT-4'}</div>
                        </div>
                      </div>
                      {activeAgentId === agent._id && <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                    </button>
                  ))
                )}
              </div>

              <div className="p-1.5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
                <Link href="/agents/new" onClick={() => setDropdownOpen(false)}>
                  <button className="w-full flex items-center justify-center gap-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 hover:shadow-sm text-gray-700 dark:text-zinc-200 rounded-lg py-1.5 text-[12px] font-semibold transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add new AI Agent
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. MAIN NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
        <NavSection title="Main">
          <NavLink href={`/agents/${activeAgentId || ''}`} icon={PlayCircle} exact>AI Preview</NavLink>
          <NavLink href="/dashboard/inbox" icon={Inbox}>Inbox</NavLink>
          <NavLink href="/dashboard/tickets" icon={Ticket}>Tickets</NavLink>
          <NavLink href="/dashboard" icon={PieChart}>Insights</NavLink>
        </NavSection>

        <NavSection title="AI Agent">
          <NavLink href={`/agents/${activeAgentId || ''}/identity`} icon={Fingerprint} exact>Identity</NavLink>
          <NavLink href="/knowledge" icon={Database}>Training Data</NavLink>
          <NavLink href="/deploy" icon={Rocket}>Deploy</NavLink>
          <NavLink href="#" icon={Network} isLocked>Integrations</NavLink>
        </NavSection>

        <NavSection title="General">
          <NavLink href="/settings" icon={Settings}>Settings</NavLink>
        </NavSection>
      </nav>

      {/* 3. BOTTOM BAR */}
      <div className="p-4 mt-auto border-t border-gray-200/60 dark:border-zinc-900 bg-white dark:bg-zinc-950">
        <div className="space-y-0.5 mb-4">
           <NavLink href="/plans" icon={Zap} exact>Upgrade</NavLink>
           <NavLink href="/usage" icon={BarChart3} exact>Usage</NavLink>
        </div>

        <div className="flex items-center justify-between px-2 pt-3 border-t border-gray-100 dark:border-zinc-900">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center text-[12px] font-bold text-gray-600 dark:text-zinc-300 shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-gray-900 dark:text-zinc-100 truncate leading-tight">{session?.user?.name || 'User'}</div>
              <div className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 truncate">{session?.user?.email}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5 shrink-0">
            {mounted && (
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors shrink-0 p-1.5"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })} 
              className="text-gray-400 hover:text-red-500 transition-colors shrink-0 p-1.5"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
