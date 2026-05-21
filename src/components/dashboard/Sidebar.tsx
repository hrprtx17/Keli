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

interface NavLinkProps {
  href: string;
  icon?: any;
  children: React.ReactNode;
  exact?: boolean;
  isLocked?: boolean;
  pathname: string;
  activeAgentId?: string | null;
  onNavClick?: () => void;
  openTicketsCount: number;
}

function NavLink({ href, icon: Icon, children, exact = false, isLocked = false, pathname, activeAgentId, onNavClick, openTicketsCount }: NavLinkProps) {
  const isActive = exact ? pathname === href : (pathname === href || pathname.startsWith(href));
  
  const finalHref = (activeAgentId && !href.startsWith('/agents') && href !== '#' && !href.includes('?')) 
    ? `${href}?agentId=${activeAgentId}` 
    : href;

  if (isLocked) {
    return (
      <div className="group flex items-center justify-between rounded-xl px-3 py-2 text-[12.5px] font-medium text-zinc-400 dark:text-zinc-500 cursor-not-allowed transition-all opacity-60">
         <div className="flex items-center gap-2.5">
           {Icon && <Icon className="h-4 w-4 shrink-0 opacity-55" />}
           <span className="truncate tracking-wide">{children}</span>
         </div>
         <span className="text-[8px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-md scale-90">Soon</span>
      </div>
    );
  }

  return (
    <Link
      href={finalHref}
      onClick={onNavClick}
      className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium tracking-wide transition-all duration-200 ease-out ${
        isActive
          ? 'bg-zinc-900/[0.04] dark:bg-white/[0.06] text-zinc-950 dark:text-zinc-50 border border-zinc-200/40 dark:border-zinc-800/40 shadow-xs'
          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-900/[0.02] dark:hover:bg-white/[0.03] hover:translate-x-[2px]'
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_0_12px_rgba(249,115,22,0.5)]" />
      )}
      {Icon && <Icon className={`h-4 w-4 shrink-0 transition-transform duration-250 group-hover:scale-105 ${isActive ? 'text-orange-500' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'}`} />}
      <span className="flex-1 truncate">{children}</span>
      {(children === 'Inbox' || children === 'Tickets') && openTicketsCount > 0 && (
        <span 
          className="absolute top-1/2 -translate-y-1/2 right-2.5 flex items-center justify-center rounded-full font-black text-white bg-orange-500 shadow-sm animate-pulse"
          style={{
            width: '16px',
            height: '16px',
            fontSize: '9px',
            lineHeight: '1',
          }}
        >
          {openTicketsCount >= 10 ? '9+' : openTicketsCount}
        </span>
      )}
    </Link>
  );
}

function NavSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="px-3 mb-2 flex items-center gap-1.5">
        <span className="w-1 h-1 rounded-full bg-orange-500/60 dark:bg-orange-500/45 shrink-0" />
        <span className="text-[10px] font-bold text-zinc-400/80 dark:text-zinc-500/80 uppercase tracking-widest">{title}</span>
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

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

  useEffect(() => {
    if (agents) {
      if (agents.length === 0 && pathname !== '/onboarding') {
        router.replace('/onboarding');
      } else if (agents.length > 0 && pathname === '/agents') {
        router.replace(`/agents/${agents[0]._id}`);
      }
    }
  }, [agents, pathname, router]);

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

  const renderLink = (href: string, icon: any, label: string, exact = false, isLocked = false) => (
    <NavLink
      href={href}
      icon={icon}
      exact={exact}
      isLocked={isLocked}
      pathname={pathname}
      activeAgentId={activeAgentId}
      onNavClick={onNavClick}
      openTicketsCount={openTicketsCount}
    >
      {label}
    </NavLink>
  );

  const formatAgentName = (name: string) => {
    if (!name) return '';
    return name.trim().split(' ').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '').join(' ');
  };

  const filteredAgents = agents?.filter((a: any) => a.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  return (
    <div className="flex h-screen w-[240px] flex-col border-r border-zinc-200/30 dark:border-zinc-800/40 bg-white/35 dark:bg-zinc-950/30 backdrop-blur-2xl antialiased transition-all duration-300 font-jakarta shadow-[4px_0_24px_-10px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_30px_-8px_rgba(0,0,0,0.55)]">
      
      {/* 1. AGENT SWITCHER HEADER */}
      <div className="px-3.5 py-4 relative z-50" ref={dropdownRef}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`w-full flex items-center justify-between bg-white/40 dark:bg-zinc-900/30 backdrop-blur-md border ${dropdownOpen ? 'border-orange-500/50 shadow-[0_0_0_3px_rgba(249,115,22,0.1)] dark:border-orange-500/30' : 'border-zinc-200/50 dark:border-zinc-800/50 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700'} rounded-xl px-3 py-2.5 transition-all duration-200 cursor-pointer`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-5.5 h-5.5 rounded-md bg-zinc-950 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shrink-0 shadow-xs">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-[13.5px] text-zinc-900 dark:text-zinc-100 truncate tracking-tight">
               {formatAgentName(activeAgent?.name) || 'Select Agent'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-255 ${dropdownOpen ? 'rotate-180 text-orange-500' : ''}`} />
        </button>
 
        {/* DROPDOWN PANEL */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-[calc(100%+8px)] left-3.5 right-3.5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200/30 dark:border-zinc-800/30 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.6)] overflow-hidden z-50 flex flex-col"
            >
              <div className="p-2 border-b border-zinc-200/30 dark:border-zinc-800/30">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search AI Agents..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-50/50 dark:bg-zinc-900/50 border border-transparent rounded-lg pl-8.5 pr-3 py-1.5 text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-200/50 dark:focus:border-zinc-800/50 focus:bg-white dark:focus:bg-zinc-900 transition-all placeholder:text-zinc-400"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="max-h-[200px] overflow-y-auto custom-scrollbar py-1">
                {filteredAgents.length === 0 ? (
                  <div className="px-3 py-4 text-center text-[11px] text-zinc-500 font-medium">No agents found</div>
                ) : (
                  filteredAgents.map((agent: any) => (
                    <button 
                      key={agent._id}
                      onClick={() => {
                        router.push(`/agents/${agent._id}`);
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors group text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-850 text-zinc-500 dark:text-zinc-400 flex items-center justify-center shrink-0 group-hover:bg-white dark:group-hover:bg-zinc-700 group-hover:shadow-xs transition-all border border-transparent">
                          <Bot className="w-3 h-3" />
                        </div>
                        <div className="min-w-0">
                           <div className="font-bold text-[12.5px] text-zinc-900 dark:text-zinc-100 truncate leading-none">{formatAgentName(agent.name)}</div>
                           <div className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold mt-0.5">{agent.model || 'GPT-4'}</div>
                        </div>
                      </div>
                      {activeAgentId === agent._id && <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                    </button>
                  ))
                )}
              </div>

              <div className="p-1.5 border-t border-zinc-200/30 dark:border-zinc-800/30 bg-zinc-50/30 dark:bg-zinc-900/30">
                <Link href="/agents/new" onClick={() => setDropdownOpen(false)}>
                  <button className="w-full flex items-center justify-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-250 rounded-lg py-1.5 text-[11px] font-bold transition-all shadow-xs cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Add AI Agent
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. MAIN NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-2 custom-scrollbar space-y-5">
        <NavSection title="Main">
          {renderLink(`/agents/${activeAgentId || ''}`, PlayCircle, 'AI Preview', true)}
          {renderLink('/dashboard/inbox', Inbox, 'Inbox')}
          {renderLink('/dashboard/tickets', Ticket, 'Tickets')}
          {renderLink('/dashboard', PieChart, 'Insights', true)}
        </NavSection>

        <NavSection title="AI Agent">
          {renderLink(`/agents/${activeAgentId || ''}/identity`, Fingerprint, 'Identity', true)}
          {renderLink('/knowledge', Database, 'Training Data')}
          {renderLink('/dashboard/deploy', Rocket, 'Deploy')}
          {renderLink('#', Network, 'Integrations', false, true)}
        </NavSection>

        <NavSection title="Account & Plan">
          {renderLink('/dashboard/upgrade', Zap, 'Upgrade Plan', true)}
          {renderLink('/usage', BarChart3, 'Usage Analytics', true)}
        </NavSection>

        <NavSection title="System">
          {renderLink('/settings', Settings, 'Settings')}
        </NavSection>
      </nav>

      {/* 3. BOTTOM BAR */}
      <div className="p-3.5 mt-auto border-t border-zinc-200/30 dark:border-zinc-800/40 bg-white/20 dark:bg-zinc-950/20 backdrop-blur-xl">
        <button 
          onClick={async (e) => {
            e.preventDefault();
            try {
              await signOut({ callbackUrl: '/login', redirect: true });
            } catch (err) {
              window.location.href = '/login';
            }
          }}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 bg-zinc-900/[0.02] dark:bg-white/[0.02] hover:bg-red-500/5 dark:hover:bg-red-500/10 border border-zinc-200/40 dark:border-zinc-800/40 hover:border-red-500/20 dark:hover:border-red-500/30 shadow-xs transition-all duration-200 cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
