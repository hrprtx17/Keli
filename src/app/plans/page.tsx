'use client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Check, TrendingUp, ArrowUpRight, CreditCard, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={`transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  );
}

export default function PlansPage() {
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace'],
    queryFn: async () => { const res = await fetch('/api/workspace'); return res.json(); }
  });

  const handleCheckout = async (type: 'premium' | 'addon') => {
    setCheckingOut(type);
    setToastMsg(''); // reset previous
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      
      const data = await res.json().catch(() => ({ error: 'Invalid server response format' }));
      
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setToastMsg(data.error || `Checkout failed with status ${res.status}`);
        setTimeout(() => setToastMsg(''), 6000);
      }
    } catch (err: any) {
      console.error('Checkout exception:', err);
      setToastMsg(`System exception: ${err.message || 'Failed to connect to backend API'}`);
      setTimeout(() => setToastMsg(''), 6000);
    } finally {
      setCheckingOut(null);
    }
  };

  if (isLoading) return (
    <DashboardLayout>
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto py-12 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-96 bg-muted rounded-2xl" />)}
      </div>
    </DashboardLayout>
  );

  const isPremium = workspace?.plan === 'premium';

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-20 max-w-6xl mx-auto">
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-destructive text-white text-sm px-5 py-3 rounded-xl shadow-xl font-medium">
            {toastMsg}
          </div>
        )}

        <div className="text-center py-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Choose your tier</h1>
          <p className="text-muted-foreground mt-2 text-base">Scale effortlessly with enterprise grade infrastructure</p>
        </div>

        <FadeIn delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* CARD 1: FREE */}
            <div className={`flex flex-col h-full rounded-3xl border bg-card transition-all relative ${!isPremium ? 'shadow-xl border-zinc-200 ring-1 ring-zinc-100 dark:border-zinc-800' : 'shadow-sm opacity-80 border-border'}`}>
              <div className="p-8 pb-6 border-b border-border/50 min-h-[160px] flex flex-col">
                 <div className="h-6 mb-2">
                   {!isPremium && <span className="text-[10px] font-bold tracking-widest uppercase text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">CURRENT</span>}
                 </div>
                 <h3 className="text-xl font-bold">Standard Free</h3>
                 <p className="text-xs text-muted-foreground mt-1">Core operational starter package.</p>
                 <div className="mt-auto pt-4 flex items-baseline gap-1">
                   <span className="text-4xl font-black text-foreground">$0</span>
                   <span className="text-sm text-muted-foreground font-medium">/ month</span>
                 </div>
              </div>
              <div className="p-8 flex-1 flex flex-col bg-muted/5">
                <ul className="space-y-4 mb-10">
                  {['1 Activated Agent', '500 Free Cycles/mo', 'Native Chat Injection', 'General Core Stats', 'Platform Direct Support'].map(f => (
                    <li key={f} className="flex items-start gap-3 text-sm text-foreground/90 font-medium">
                      <Check className="h-5 w-5 text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Button variant="outline" className="w-full rounded-xl h-12 font-bold text-xs uppercase tracking-wide" disabled>
                    {!isPremium ? '✓ In Operation' : 'Restricted'}
                  </Button>
                </div>
              </div>
            </div>

            {/* CARD 2: PREMIUM */}
            <div className={`flex flex-col h-full rounded-3xl border transition-all relative shadow-2xl bg-card ring-2 ${isPremium ? 'ring-emerald-500 border-emerald-500' : 'ring-primary border-primary'} transform md:scale-[1.03] z-10`}>
              <div className={`p-8 pb-6 border-b border-border/50 min-h-[160px] flex flex-col rounded-t-3xl ${isPremium ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : 'bg-primary/5'}`}>
                 <div className="h-6 mb-2 flex">
                   <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded border flex items-center gap-1 shadow-sm ${isPremium ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-primary text-white border-primary'}`}>
                      {isPremium ? <TrendingUp className="h-3 w-3" /> : '⚡'} {isPremium ? 'ACTIVE' : 'MOST POPULAR'}
                   </span>
                 </div>
                 <h3 className="text-xl font-bold">Premium Pro</h3>
                 <p className="text-xs text-muted-foreground mt-1">Scale infrastructure for heavy traffic.</p>
                 <div className="mt-auto pt-4 flex items-baseline gap-1">
                   <span className="text-4xl font-black text-foreground">$29</span>
                   <span className="text-sm text-muted-foreground font-medium">/ month</span>
                 </div>
              </div>
              <div className="p-8 flex-1 flex flex-col bg-card/50">
                <ul className="space-y-4 mb-10">
                  {['5 Activated Agents', '20,000 Total Cycles/mo', 'Hardened Firewall Shield', 'Priority Fast Track Support', 'Stealth Brand Hiding', 'Access to Top-up Market'].map(f => (
                    <li key={f} className="flex items-start gap-3 text-sm text-foreground/90 font-bold">
                      <Check className={`h-5 w-5 shrink-0 ${isPremium ? 'text-emerald-500' : 'text-primary'}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Button
                    onClick={() => handleCheckout('premium')}
                    disabled={isPremium || checkingOut === 'premium'}
                    className={`w-full rounded-xl h-12 font-black text-xs uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] border-0 ${isPremium ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-primary text-white hover:bg-primary/90'}`}
                  >
                    {isPremium ? '✓ Subscription Valid' : checkingOut === 'premium' ? (
                      <span className="flex items-center gap-2 animate-pulse"><RefreshCw className="h-4 w-4 animate-spin"/> Authorization...</span>
                    ) : (
                      <span className="flex items-center gap-1">Upgrade to Pro <ArrowUpRight className="h-4 w-4" /></span>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* CARD 3: ADDON */}
            <div className="flex flex-col h-full rounded-3xl border bg-card shadow-sm border-border hover:shadow-lg transition-all relative group">
              <div className="p-8 pb-6 border-b border-border/50 min-h-[160px] flex flex-col bg-muted/10 rounded-t-3xl">
                 <div className="h-6 mb-2">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground bg-background border px-2 py-1 rounded">UTILITY</span>
                 </div>
                 <h3 className="text-xl font-bold">Threshold Pack</h3>
                 <p className="text-xs text-muted-foreground mt-1">Instant, persistent credit override.</p>
                 <div className="mt-auto pt-4 flex items-baseline gap-1">
                   <span className="text-4xl font-black text-foreground">$9</span>
                   <span className="text-sm text-muted-foreground font-medium">/ one-time</span>
                 </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <ul className="space-y-4 mb-10">
                  {['10,000 Excess Credits', 'Zero Expiration Policy', 'Runs Alongside Tiers', 'Instant Load Balancing', 'Infinite Repurchase Capacity'].map(f => (
                    <li key={f} className="flex items-start gap-3 text-sm text-foreground/90 font-medium">
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Button
                    variant="secondary"
                    onClick={() => handleCheckout('addon')}
                    disabled={checkingOut === 'addon'}
                    className="w-full rounded-xl h-12 font-bold text-xs uppercase tracking-wide bg-muted hover:bg-muted/80 border border-border group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all"
                  >
                    {checkingOut === 'addon' ? (
                       <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin"/> In Processing...</span>
                    ) : (
                       <span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Inject Credits</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </DashboardLayout>
  );
}
