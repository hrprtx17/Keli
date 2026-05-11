'use client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { Zap, CreditCard, Check, RefreshCw, TrendingUp, ArrowUpRight, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 30);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplayed(value); clearInterval(timer); }
      else setDisplayed(start);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <>{displayed}</>;
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={`transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  );
}

export default function BillingPage() {
  const { data: workspace, isLoading, refetch } = useQuery({
    queryKey: ['workspace'],
    queryFn: async () => { const res = await fetch('/api/workspace'); return res.json(); }
  });

  if (isLoading) return (
    <DashboardLayout>
      <div className="space-y-8 animate-pulse pb-16 max-w-6xl mx-auto">
        <div className="h-12 w-64 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-3xl" />
        <div className="h-80 bg-muted rounded-3xl" />
      </div>
    </DashboardLayout>
  );

  const isPremium = workspace?.plan === 'premium';
  const monthlyCredits = workspace?.usage?.monthlyCredits || 500;
  const addonCredits = workspace?.usage?.addonCredits || 0;
  const used = workspace?.usage?.creditsUsedThisMonth || 0;
  const total = monthlyCredits + addonCredits;
  const pct = Math.min(Math.round((used / Math.max(total, 1)) * 100), 100);

  const resetDateRaw = workspace?.usage?.resetDate ? new Date(workspace.usage.resetDate) : new Date();
  const resetDate = resetDateRaw.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  // Simulated last billing date
  const lastBillingDate = new Date(resetDateRaw.getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-20 max-w-6xl mx-auto">
        
        {/* Page Header */}
        <FadeIn>
          <div className="flex items-end justify-between border-b pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Financial Overview</h1>
              <p className="text-muted-foreground mt-2">Track payment timestamps, lifecycle thresholds, and transactional activity.</p>
            </div>
            <button onClick={() => refetch()} className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase text-zinc-500 hover:text-zinc-900 transition-colors border px-4 py-2 rounded-xl bg-white shadow-sm">
              <RefreshCw className="h-3.5 w-3.5" /> Force Refresh
            </button>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Column 1: The Heavy Stats (2/3) */}
           <div className="lg:col-span-2 space-y-8">
              <FadeIn delay={100}>
                <Card className="rounded-3xl shadow-lg overflow-hidden border-zinc-200 dark:border-zinc-800">
                   <CardHeader className="bg-zinc-50 dark:bg-zinc-900 border-b p-6">
                      <div className="flex items-center justify-between">
                         <CardTitle className="text-base font-bold text-zinc-800 dark:text-zinc-200">Capacity Lifecycle</CardTitle>
                         <div className="flex items-center gap-2 px-3 py-1 bg-white border dark:bg-zinc-800 rounded-lg text-[11px] font-bold uppercase text-muted-foreground shadow-sm">
                            <Shield className="h-3 w-3 text-emerald-500" /> Secure
                         </div>
                      </div>
                   </CardHeader>
                   <CardContent className="p-8 space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                         <div className="p-6 rounded-2xl bg-zinc-50 border dark:bg-zinc-900">
                            <div className="flex items-center justify-between mb-3">
                               <span className="text-[11px] uppercase font-black tracking-wider text-zinc-400">Allocated Limit</span>
                               <Zap className="h-4 w-4 text-primary opacity-50" />
                            </div>
                            <div className="text-3xl font-black tracking-tighter"><AnimatedNumber value={total} /></div>
                            <div className="text-xs text-zinc-500 mt-1">Total network credits available.</div>
                         </div>
                         <div className="p-6 rounded-2xl bg-zinc-50 border dark:bg-zinc-900">
                            <div className="flex items-center justify-between mb-3">
                               <span className="text-[11px] uppercase font-black tracking-wider text-zinc-400">Utilized Output</span>
                               <ArrowUpRight className="h-4 w-4 text-red-500 opacity-50" />
                            </div>
                            <div className={`text-3xl font-black tracking-tighter ${pct > 80 ? 'text-red-500' : ''}`}><AnimatedNumber value={used} /></div>
                            <div className="text-xs text-zinc-500 mt-1">{pct}% consumption rate.</div>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <div className="flex items-center justify-between text-sm font-bold tracking-tight">
                            <span>Operational Load</span>
                            <span className={pct > 80 ? 'text-red-500' : 'text-primary'}>{pct}% saturated</span>
                         </div>
                         <div className="h-3 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-inner ${pct > 80 ? 'bg-red-500' : 'bg-gradient-to-r from-primary to-orange-400'}`} 
                              style={{ width: `${pct}%` }}
                            />
                         </div>
                      </div>
                   </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={200}>
                 <Card className="rounded-3xl shadow-sm border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <CardHeader className="border-b p-6 bg-zinc-50/50 dark:bg-zinc-900/50">
                       <CardTitle className="text-base font-bold flex items-center gap-2">
                          <CreditCard className="h-5 w-5 opacity-70" /> System Invoices
                       </CardTitle>
                    </CardHeader>
                    <div>
                       {!isPremium ? (
                          <div className="p-12 text-center flex flex-col items-center justify-center bg-white dark:bg-zinc-900">
                             <div className="h-16 w-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 border border-dashed border-zinc-300 dark:border-zinc-700">
                                <CreditCard className="h-6 w-6 text-zinc-400" />
                             </div>
                             <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">No Transaction History</h3>
                             <p className="text-sm text-zinc-500 mt-1 max-w-xs mx-auto">Purchase artifacts and upgrade triggers have not been initiated on this entity.</p>
                          </div>
                       ) : (
                          <>
                          <table className="w-full text-left text-sm">
                             <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 border-b text-[11px] uppercase font-black tracking-wider">
                                   <th className="px-6 py-4">Reference ID</th>
                                   <th className="px-6 py-4">Cycle Date</th>
                                   <th className="px-6 py-4">Status</th>
                                   <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                <tr className="group hover:bg-zinc-50 transition-colors">
                                   <td className="px-6 py-5 font-mono font-medium text-zinc-900 dark:text-zinc-100">INV-9421</td>
                                   <td className="px-6 py-5 text-zinc-600">{lastBillingDate}</td>
                                   <td className="px-6 py-5">
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-wide">Paid</span>
                                   </td>
                                   <td className="px-6 py-5 text-right font-bold text-zinc-900 dark:text-zinc-100">$29.00</td>
                                </tr>
                             </tbody>
                          </table>
                          <div className="p-6 text-center bg-zinc-50 border-t dark:bg-zinc-950/50">
                             <p className="text-xs text-muted-foreground">Zero remaining active receivables found.</p>
                          </div>
                          </>
                       )}
                    </div>
                 </Card>
              </FadeIn>
           </div>

           {/* Column 2: Billing Detail Sidebar (1/3) */}
           <div className="space-y-8">
              <FadeIn delay={150}>
                 <div className="rounded-3xl bg-zinc-900 text-white p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-12 -top-12 h-32 w-32 bg-white opacity-5 rounded-full blur-2xl" />
                    
                    <h3 className="text-[11px] font-black tracking-widest uppercase opacity-60 mb-6">Payment Gateway</h3>
                    
                    <div className="space-y-6">
                       {isPremium ? (
                         <>
                          <div>
                             <p className="text-xs text-zinc-400 font-medium mb-1">Primary Method</p>
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-12 bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center font-black italic text-sm tracking-wider">VISA</div>
                                <p className="font-bold text-lg tracking-wide font-mono">•••• 4242</p>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                             <div>
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider mb-1">Last Billed</p>
                                <p className="text-sm font-bold">{lastBillingDate}</p>
                             </div>
                             <div>
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider mb-1">Next Cycle</p>
                                <p className="text-sm font-bold">{resetDate}</p>
                             </div>
                          </div>
                         </>
                       ) : (
                         <div className="py-4">
                            <p className="text-xs text-zinc-400 italic mb-4">No valid vaulted credentials registered.</p>
                            <div className="p-4 border border-dashed border-zinc-700 rounded-2xl bg-zinc-800/30 text-center text-xs text-zinc-300">
                               Requires valid subscription to activate payment gateways.
                            </div>
                         </div>
                       )}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full mt-8 border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800 rounded-xl h-11 text-xs font-bold shadow-none"
                      onClick={() => window.location.href = '/plans'}
                    >
                       {isPremium ? 'Modify Payment Engine' : 'Attach Vault Instance'}
                    </Button>
                 </div>
              </FadeIn>

              <FadeIn delay={250}>
                 <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border shadow-sm">
                    <h4 className="text-sm font-bold mb-4">Active Plan</h4>
                    <div className="flex items-center justify-between mb-6 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border">
                       <div>
                          <p className="font-bold">{isPremium ? 'Premium Pro' : 'Standard Free'}</p>
                          <p className="text-xs text-muted-foreground">{isPremium ? '$29 / month' : '$0 / month'}</p>
                       </div>
                       <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                    <Button className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border shadow-none text-xs font-bold rounded-xl" onClick={() => window.location.href = '/plans'}>
                       Launch Tier Matrix
                    </Button>
                 </div>
              </FadeIn>
           </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
