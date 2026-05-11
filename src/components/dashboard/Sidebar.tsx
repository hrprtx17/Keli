'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Bot, MessageSquare, Ticket, BookOpen, Settings, LogOut, ChevronRight, Zap, 
  Activity, BarChart3, Database, Code, Globe, Users, PlayCircle, HelpCircle, LayoutDashboard, Timer, ChevronDown, Rocket
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function Sidebar({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [settingsOpen, setSettingsOpen] = useState(true);

  // Dynamic state-preservation system: Read ID from path OR query params
  const agentPathMatch = pathname.match(/^\/agents\/([a-zA-Z0-9]+)$/);
  const urlParamAgentId = searchParams.get('agentId');
  const activeAgentId = agentPathMatch ? agentPathMatch[1] : urlParamAgentId;
  const isAgentView = !!activeAgentId;

  const { data: workspace } = useQuery({
    queryKey: ['workspace-sidebar'],
    queryFn: async () => {
      const res = await fetch('/api/workspace');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60_000,
  });

  const monthlyCredits = workspace?.usage?.monthlyCredits || 500;
  const usedCredits = workspace?.usage?.creditsUsedThisMonth || 0;
  const addonCredits = workspace?.usage?.addonCredits || 0;
  const totalAvailable = monthlyCredits + addonCredits;
  const pct = Math.min(Math.round((usedCredits / Math.max(totalAvailable, 1)) * 100), 100);
  const isPremium = workspace?.plan === 'premium';

  const NavLink = ({ href, icon: Icon, children, isSubItem = false, exact = false }: any) => {
    const isDashboardHome = href === '/dashboard';
    const isActive = exact ? pathname === href : (pathname === href || (pathname.startsWith(href) && !isDashboardHome));
    
    // Auto-tether active context into route destination seamlessly
    const finalHref = (isAgentView && !href.startsWith('/agents') && href !== '#' && !href.includes('?')) 
      ? `${href}?agentId=${activeAgentId}` 
      : href;

    return (
      <Link
        href={finalHref}
        onClick={onNavClick}
        className={`group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
          isSubItem ? 'ml-5 mb-0.5' : 'mb-1.5'
        } ${
          isActive
            ? 'bg-white dark:bg-zinc-900 text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-border/50'
            : 'text-muted-foreground hover:text-foreground hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40'
        }`}
      >
        {Icon && <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground/70 group-hover:text-muted-foreground'}`} />}
        <span className="flex-1 truncate">{children}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-[#fcfcfc] dark:bg-zinc-950 overflow-hidden select-none antialiased">
      
      {/* Premium Organization Context Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-border/40 bg-white dark:bg-zinc-950/50 relative z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center text-white text-sm font-medium shadow-sm shrink-0 select-none transition-transform hover:scale-105">A</div>
          <span className="font-medium text-[15px] text-zinc-900 dark:text-zinc-100 truncate tracking-tight">{workspace?.name || 'AgentDesk'}</span>
        </div>
      </div>

      {/* Elegant Scrolling Nav Plane */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-5 custom-scrollbar bg-[#fafafa] dark:bg-zinc-950">
        
        {isAgentView ? (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-left-1 duration-300">
             <Link href="/agents" className="flex items-center gap-2 text-[12px] font-medium tracking-wider uppercase text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 mb-6 px-3 transition-all duration-200 group">
               <ChevronRight className="h-3.5 w-3.5 rotate-180 transition-transform group-hover:-translate-x-1" /> Back to Workspace
             </Link>

             <NavLink href={`/agents/${activeAgentId}`} icon={PlayCircle} exact>Playground</NavLink>
             
             <div className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-lg cursor-default group transition-all mt-3">
                <div className="flex items-center gap-3"><Activity className="h-4.5 w-4.5 shrink-0 opacity-70" /> Activity</div>
                <ChevronDown className="h-3.5 w-3.5 opacity-40" />
             </div>
             
             <NavLink href="/dashboard" icon={BarChart3}>
                <div className="flex items-center justify-between w-full pr-0.5">
                  <span>Analytics</span>
                  <ChevronDown className="h-3 w-3 opacity-30" />
                </div>
             </NavLink>

             <NavLink href="/knowledge" icon={Database}>
                <div className="flex items-center justify-between w-full pr-0.5">
                  <span>Data Sources</span>
                  <ChevronDown className="h-3 w-3 opacity-30" />
                </div>
             </NavLink>

             <NavLink href="/deploy" icon={Rocket}>
                <div className="flex items-center justify-between w-full pr-0.5">
                  <span>Deploy</span>
                  <ChevronDown className="h-3 w-3 opacity-30" />
                </div>
             </NavLink>

             <div className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-lg cursor-default group transition-all mt-6 border-t border-border/30 pt-5">
                <div className="flex items-center gap-3"><Settings className="h-4.5 w-4.5 shrink-0 opacity-70" /> Settings</div>
                <ChevronDown className="h-3.5 w-3.5 opacity-40" />
             </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-left-1 duration-300 space-y-1">
            
            <NavLink href="/agents" icon={Bot} exact>Agents</NavLink>
            <NavLink href="/usage" icon={Timer}><span className="flex-1">Usage</span></NavLink>

            <div className="mt-8 border-t border-border/30 pt-6">
               <button 
                 onClick={() => setSettingsOpen(!settingsOpen)}
                 className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-left transition-colors group rounded-lg hover:bg-zinc-200/30"
               >
                 <Settings className="h-4.5 w-4.5 shrink-0 opacity-70" />
                 <span className="flex-1 font-medium uppercase text-[12px] tracking-wider">Workspace Settings</span>
                 <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${settingsOpen ? 'rotate-90' : ''} opacity-40`} />
               </button>
               
               {settingsOpen && (
                 <div className="mt-1 border-l-2 border-border/30 ml-6.5 space-y-0.5">
                   <NavLink href="/settings" isSubItem>General</NavLink>
                   <NavLink href="/plans" isSubItem>Plans</NavLink>
                   <NavLink href="/billing" isSubItem>Billing</NavLink>
                 </div>
               )}
            </div>
          </div>
        )}

      </nav>

      {/* Premium Micro Usage Dashboard */}
      <div className="p-5 mt-auto border-t border-border/40 bg-[#fdfdfd] dark:bg-zinc-950 z-10">
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 space-y-3 mb-5">
          <div className="flex items-center justify-between text-[11px] font-medium tracking-wider uppercase text-muted-foreground">
             <span>Capacity</span>
             <span className="text-foreground font-semibold">{usedCredits} / {totalAvailable}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200/30">
             <div className={`h-full rounded-full transition-all duration-500 ${pct > 80 ? 'bg-destructive' : 'bg-zinc-900 dark:bg-zinc-100'}`} style={{ width: `${pct}%` }} />
          </div>
          {!isPremium && (
            <Link href="/billing">
              <button className="w-full mt-2 bg-zinc-900 hover:bg-black text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-md h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:translate-y-[-1.5px] active:translate-y-[0px]">
                <Zap className="h-3.5 w-3.5 fill-current" /> Upgrade to Premium
              </button>
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between gap-2.5 px-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-border/60 flex items-center justify-center text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 shrink-0 shadow-sm">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 truncate flex-1 tracking-tight">{session?.user?.email}</span>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })} 
            className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1.5 hover:bg-destructive/5 rounded-lg"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
