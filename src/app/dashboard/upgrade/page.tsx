'use client';
import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { Check, ArrowRight, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function UpgradePage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const { data: workspace } = useQuery({
    queryKey: ['workspace'],
    queryFn: async () => {
      const res = await fetch('/api/workspace');
      return res.json();
    }
  });

  const isPremium = workspace?.plan === 'premium';

  const handleUpgrade = async () => {
    setLoadingTier('premium');
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'premium' })
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      if (data.checkoutUrl) {
        toast.success('Redirecting you to secure checkout...');
        window.location.href = data.checkoutUrl;
      } else {
        toast.error('Failed to resolve secure billing checkpoint.');
      }
    } catch (err) {
      toast.error('Failed to initialize payment pipeline.');
    } finally {
      setLoadingTier(null);
    }
  };

  const starterPrice = 0;
  const proPrice = billingCycle === 'monthly' ? 29 : 23;

  const starterFeatures = [
    "1 Active Chatbot Agent",
    "500 Message Credits / month",
    "Standard PDF & Markdown training",
    "Basic Web Embed & Iframe integration",
    "Standard LLM Execution Speed",
    "Keli AI branding on widget"
  ];

  const proFeatures = [
    "Unlimited Active Chatbot Agents",
    "Unlimited Message Credits (Fair-use)",
    "Auto-crawling & Full Web scraping",
    "Completely Whitelabel (Zero branding)",
    "Priority Low-latency LLM (<0.8s)",
    "Slack & Discord API Integrations",
    "Secure Database RAG Collections",
    "Priority 24/7 Support clearance"
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-20 px-4 sm:px-6 antialiased">
        
        {/* HEADER SECTION */}
        <div className="text-center max-w-2xl mx-auto mb-16 mt-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/5 text-[#FF6B35] text-[11px] font-bold uppercase tracking-wider mb-4 border border-orange-500/10">
            <Sparkles className="w-3 h-3" /> Workspace Plans
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Start free. Upgrade as you scale.
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 max-w-md mx-auto leading-relaxed">
            Choose a plan to unlock whitelabeling, dynamic vectors, and unlimited chatbot deployments.
          </p>

          {/* MINIMAL BILLING TOGGLE */}
          <div className="mt-8 flex items-center justify-center">
            <div className="bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800 p-1 rounded-full flex items-center shadow-xs">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                  billingCycle === 'monthly' 
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs' 
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                }`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                  billingCycle === 'yearly' 
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs' 
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                }`}
              >
                Yearly
                <span className="text-[9px] font-bold uppercase bg-[#FF6B35]/10 text-[#FF6B35] px-1.5 py-0.5 rounded-md border border-[#FF6B35]/20">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* PLANS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-3xl mx-auto mb-16">
          
          {/* STARTER CARD */}
          <div className="bg-white/80 dark:bg-zinc-950/80 border border-zinc-200/60 dark:border-zinc-900 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all hover:border-zinc-300 dark:hover:border-zinc-800 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Free Tier</span>
                <span className="text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">Current Scope</span>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Starter</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 leading-relaxed">Perfect for simple playgrounds and testing embed configurations.</p>
              
              <div className="mt-6 mb-8 border-b border-zinc-100 dark:border-zinc-900 pb-5">
                <div className="flex items-baseline">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">${starterPrice}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">/ forever</span>
                </div>
              </div>

              {/* Starter checklist */}
              <ul className="space-y-3.5">
                {starterFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs">
                    <span className="w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-300 leading-normal">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              <button 
                disabled 
                className="w-full h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 font-medium text-[11px] tracking-wider uppercase cursor-not-allowed border border-zinc-200/20 dark:border-zinc-800/30"
              >
                Current Tier
              </button>
            </div>
          </div>

          {/* PREMIUM PRO CARD */}
          <div className="bg-white dark:bg-zinc-950 border border-[#FF6B35] rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all shadow-[0_12px_32px_rgba(255,107,53,0.03)] relative transform hover:scale-[1.005]">
            <span className="absolute -top-2.5 right-6 bg-[#FF6B35] text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
              Recommended
            </span>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium uppercase tracking-widest text-[#FF6B35]">Premium Plan</span>
                <span className="text-[10px] font-semibold bg-[#FF6B35]/10 px-2 py-0.5 rounded text-[#FF6B35] border border-[#FF6B35]/10">Unlimited Pro</span>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Unlimited</h3>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 leading-relaxed">Engineered for businesses needing whitelabel, fast LLMs, and multi-bots.</p>
              
              <div className="mt-6 mb-8 border-b border-zinc-100 dark:border-zinc-900 pb-5">
                <div className="flex items-baseline">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">${proPrice}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">/ month {billingCycle === 'yearly' && '(billed yearly)'}</span>
                </div>
              </div>

              {/* Premium features checklists with icons */}
              <ul className="space-y-3.5">
                {proFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs">
                    <span className="w-4 h-4 rounded-full bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center shrink-0 border border-[#FF6B35]/15 mt-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium leading-normal">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              <button 
                onClick={handleUpgrade}
                disabled={loadingTier !== null || isPremium}
                className="group w-full h-10 rounded-xl bg-[#FF6B35] hover:bg-[#e05621] text-white font-medium text-[11px] tracking-wider flex items-center justify-center gap-1 transition-all duration-200 disabled:opacity-60 uppercase shadow-sm"
              >
                {loadingTier === 'premium' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : isPremium ? (
                  'Active Member'
                ) : (
                  <>
                    Upgrade Workspace <ArrowRight className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* ELEGANT FAQ */}
        <div className="max-w-2xl mx-auto border-t border-zinc-200/50 dark:border-zinc-800/80 pt-12">
          <h3 className="text-sm font-bold text-center text-zinc-900 dark:text-zinc-200 mb-8 flex items-center justify-center gap-1.5 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-[#FF6B35]" /> Pricing FAQ
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {[
              {
                q: "Can I cancel my subscription anytime?",
                a: "Yes. Subscriptions are fully self-service and can be cancelled inside your billing dashboard workspace settings instantly."
              },
              {
                q: "What happens if I exhaust my message credits?",
                a: "On the Free Starter tier, chatbot interactions pause until your monthly cycle refreshes. On Premium, usage is unrestricted under normal fair-use guidelines."
              },
              {
                q: "Is document ingestion secure?",
                a: "Absolutely. All files, PDFs, and crawled URLs are stored in encrypted, sandbox vector database namespaces, fully isolated and protected from public search bots."
              }
            ].map((faq, i) => (
              <div key={i} className="pb-4 border-b border-zinc-100 dark:border-zinc-900 last:border-b-0">
                <h4 className="font-medium text-xs text-zinc-800 dark:text-zinc-200 mb-1">{faq.q}</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
