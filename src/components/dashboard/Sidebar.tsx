'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  MessageSquare, Settings, LogOut, ChevronDown, Zap, 
  BarChart3, Database, Rocket, Bot, Plus, Search, Check,
  UserCircle, CreditCard, PieChart, Inbox, PlayCircle, Fingerprint, Network
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Sidebar({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Ensure there's always an active agent if agents exist
  useEffect(() => {
    if (agents?.length > 0 && !activeAgentId && pathname !== '/onboarding') {
      router.replace(`/agents/${agents[0]._id}`);
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
        <div className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-400 cursor-not-allowed transition-all opacity-70">
           <div className="flex items-center gap-3">
             {Icon && <Icon className="h-4.5 w-4.5 shrink-0 opacity-60" />}
             <span className="truncate">{children}</span>
           </div>
           <span className="text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">Soon</span>
        </div>
      );
    }

    return (
      <Link
        href={finalHref}
        onClick={onNavClick}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
          isActive
            ? 'bg-gray-100/80 text-black font-semibold'
            : 'text-gray-500 hover:text-black hover:bg-gray-50'
        }`}
      >
        {Icon && <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-600 transition-colors'}`} />}
        <span className="flex-1 truncate">{children}</span>
      </Link>
    );
  };

  const NavSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-6 last:mb-0">
      <div className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{title}</div>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );

  const filteredAgents = agents?.filter((a: any) => a.name.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  return (
    <div className="flex h-screen w-[260px] flex-col border-r border-gray-200/80 bg-[#FAFAFA] antialiased">
      
      {/* 1. AGENT SWITCHER HEADER */}
      <div className="px-4 py-4 relative z-50" ref={dropdownRef}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`w-full flex items-center justify-between bg-white border ${dropdownOpen ? 'border-orange-500/50 shadow-[0_0_0_3px_rgba(249,115,22,0.1)]' : 'border-gray-200/80 shadow-sm hover:border-gray-300'} rounded-xl px-3 py-2.5 transition-all`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-[14px] text-gray-900 truncate">
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
              className="absolute top-[calc(100%-8px)] left-4 right-4 bg-white border border-gray-200/80 rounded-xl shadow-[0_12px_24px_rgba(0,0,0,0.06)] overflow-hidden z-50 flex flex-col"
            >
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search AI Agents..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent rounded-lg pl-8 pr-3 py-1.5 text-[12px] font-medium text-gray-900 outline-none focus:border-gray-200 focus:bg-white transition-all placeholder:text-gray-400"
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
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors group text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-200">
                          <Bot className="w-3 h-3" />
                        </div>
                        <div className="min-w-0">
                           <div className="font-semibold text-[13px] text-gray-900 truncate leading-tight">{agent.name}</div>
                           <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{agent.model || 'GPT-4'}</div>
                        </div>
                      </div>
                      {activeAgentId === agent._id && <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                    </button>
                  ))
                )}
              </div>

              <div className="p-1.5 border-t border-gray-100 bg-gray-50/50">
                <Link href="/agents/new" onClick={() => setDropdownOpen(false)}>
                  <button className="w-full flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm text-gray-700 rounded-lg py-1.5 text-[12px] font-semibold transition-all">
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
          <NavLink href="/conversations" icon={Inbox}>Inbox</NavLink>
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
      <div className="p-4 mt-auto border-t border-gray-200/60 bg-white">
        <div className="space-y-0.5 mb-4">
           <NavLink href="/plans" icon={Zap} exact>Upgrade</NavLink>
           <NavLink href="/usage" icon={BarChart3} exact>Usage</NavLink>
        </div>

        <div className="flex items-center justify-between px-2 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[12px] font-bold text-gray-600 shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-gray-900 truncate leading-tight">{session?.user?.name || 'User'}</div>
              <div className="text-[11px] font-medium text-gray-500 truncate">{session?.user?.email}</div>
            </div>
          </div>
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
  );
}
