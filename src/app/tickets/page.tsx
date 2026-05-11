'use client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Ticket, Clock, AlertCircle, CheckCircle2, CircleDot, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={`transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  );
}

function statusConfig(status: string) {
  switch (status) {
    case 'open': return { label: 'Open', color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400', icon: AlertCircle, dot: 'bg-orange-500' };
    case 'in_progress': return { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', icon: CircleDot, dot: 'bg-blue-500' };
    case 'resolved': return { label: 'Resolved', color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400', icon: CheckCircle2, dot: 'bg-green-500' };
    default: return { label: status, color: 'bg-muted text-muted-foreground', icon: Ticket, dot: 'bg-muted-foreground' };
  }
}

function TicketRow({ ticket, index }: { ticket: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig(ticket.status);
  const Icon = cfg.icon;

  return (
    <FadeIn delay={index * 50}>
      <div className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-sm transition-all">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
        >
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground truncate">{ticket.subject || `Ticket #${ticket._id.slice(-6)}`}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Clock className="h-3 w-3" />
              {new Date(ticket.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {ticket.agentId && <><span>·</span><span className="text-primary">AI Agent</span></>}
            </p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${cfg.color}`}>
            {cfg.label}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>

        {expanded && (
          <div className="border-t border-border bg-muted/20 p-4 space-y-2 animate-in fade-in slide-in-from-top-2">
            <p className="text-sm text-muted-foreground">{ticket.description || 'No description provided.'}</p>
            <div className="flex gap-2 pt-1">
              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground font-mono">ID: {ticket._id}</span>
            </div>
          </div>
        )}
      </div>
    </FadeIn>
  );
}

export default function TicketsPage() {
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => { const res = await fetch('/api/tickets'); if (!res.ok) return []; return res.json(); }
  });

  const counts = {
    open: tickets?.filter((t: any) => t.status === 'open').length ?? 0,
    in_progress: tickets?.filter((t: any) => t.status === 'in_progress').length ?? 0,
    resolved: tickets?.filter((t: any) => t.status === 'resolved').length ?? 0,
  };

  const filtered = filter === 'all' ? (tickets || []) : (tickets || []).filter((t: any) => t.status === filter);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <FadeIn>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Conversations escalated for human review.</p>
          </div>
        </FadeIn>

        {/* Stat Cards */}
        <FadeIn delay={100}>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { key: 'open' as const, label: 'Open', icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20' },
              { key: 'in_progress' as const, label: 'In Progress', icon: CircleDot, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20' },
              { key: 'resolved' as const, label: 'Resolved', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10', border: 'border-green-200 dark:border-green-500/20' },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setFilter(filter === s.key ? 'all' : s.key)}
                className={`rounded-2xl border p-5 flex items-center gap-4 text-left transition-all hover:shadow-md ${filter === s.key ? `${s.bg} ${s.border} ring-1 ring-inset ${s.border}` : 'bg-card border-border hover:border-muted-foreground/30'}`}
              >
                <div className={`h-11 w-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${isLoading ? 'text-muted-foreground' : s.color}`}>
                    {isLoading ? '—' : counts[s.key]}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
                </div>
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Filter Pills */}
        <FadeIn delay={150}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground mr-1">Filter:</span>
            {['all', 'open', 'in_progress', 'resolved'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${filter === f ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">{filtered.length} ticket{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </FadeIn>

        {/* Ticket List */}
        <div className="space-y-3">
          {isLoading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)
          ) : filtered.length === 0 ? (
            <FadeIn>
              <div className="flex flex-col items-center py-20 text-center rounded-2xl border border-dashed border-border bg-muted/20">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <MessageSquare className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">No tickets {filter !== 'all' ? `with status "${filter}"` : 'yet'}</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Tickets appear when your AI agents escalate conversations that need human attention.
                </p>
              </div>
            </FadeIn>
          ) : (
            filtered.map((ticket: any, i: number) => (
              <TicketRow key={ticket._id} ticket={ticket} index={i} />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
