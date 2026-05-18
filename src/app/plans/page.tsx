'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Sun, Moon, Menu, X, Check, HelpCircle, 
  ArrowRight, Zap, Star, Sparkles, ChevronDown 
} from 'lucide-react';

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FaqItem({ question, answer, isOpen, onToggle }: FaqItemProps) {
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 py-4 last:border-0">
      <button 
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left py-2 font-semibold text-zinc-900 dark:text-zinc-50 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
      >
        <span className="text-base sm:text-[17px] leading-snug">{question}</span>
        <ChevronDown 
          className={`w-5 h-5 text-zinc-400 transition-transform duration-300 shrink-0 ml-4 ${
            isOpen ? 'rotate-180 text-orange-500' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-zinc-600 dark:text-zinc-400 text-[14px] leading-relaxed pt-2 pb-3">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PlansPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const faqs = [
    {
      q: "Can I upgrade or downgrade anytime?",
      a: "Yes. You can upgrade instantly to get immediate access to premium features. Downgrades take effect at the end of your current billing period."
    },
    {
      q: "What happens when I reach the message limit?",
      a: "On the free plan, once the 500 message limit is reached, your chat widget will show a polite message stating that the monthly limit has been met. You can upgrade to Premium at any time to resume messaging immediately."
    },
    {
      q: "Do I need a credit card to start?",
      a: "No. You can start the Free plan without ever entering a credit card. The Premium 14-day free trial also does not require any credit card upfront."
    },
    {
      q: "Can I train the AI on my own data?",
      a: "Yes. You can train the AI by pasting your website URLs or uploading files (PDF, TXT, DOCX). The AI learns your specific brand content within seconds."
    },
    {
      q: "What is AgentDesk branding?",
      a: "The free plan displays 'Powered by AgentDesk' with a backlink at the bottom of the chat widget. Upgrading to the Premium plan removes this branding completely."
    },
    {
      q: "How does the 14-day trial work?",
      a: "You get full, unrestricted Premium features for 14 days without inputting a card. At the end of the trial, you can choose to enter your card details to subscribe or automatically drop back down to the Free tier."
    }
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-50 selection:bg-orange-500/30 overflow-x-hidden font-sans antialiased transition-colors duration-300">
      
      {/* GLOBAL AMBIENT GLOWS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-500/10 dark:bg-orange-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400/10 dark:bg-orange-500/10 rounded-full blur-[120px]" />
      </div>

      {/* NAVBAR */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed z-50 transition-all duration-500 ease-in-out
          md:top-0 md:inset-x-0 
          top-3 inset-x-3 sm:top-4 sm:inset-x-6 rounded-[22px] sm:rounded-[26px] md:rounded-none
          border border-zinc-200/40 dark:border-zinc-800/40 md:border-0
          bg-white/50 dark:bg-[#09090b]/50 backdrop-blur-xl md:backdrop-blur-none
          ${scrolled 
            ? 'shadow-[0_12px_40px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.4)] py-2 md:py-3 bg-white/80 dark:bg-[#09090b]/80 border-zinc-200/70 dark:border-zinc-800/70 md:border-b md:border-zinc-200/50 md:dark:border-zinc-800/50' 
            : 'py-3 md:py-5 bg-white/50 dark:bg-[#09090b]/50 md:bg-transparent md:backdrop-blur-none md:border-0'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 group">
            <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-orange-500 to-amber-400 rounded-[10px] sm:rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 transform transition group-hover:rotate-6">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5px]" />
            </div>
            <span className="font-black text-[16px] sm:text-lg md:text-xl tracking-tighter text-zinc-900 dark:text-zinc-50">Agent Desk</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            <Link href="/#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors relative group">
              Features
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link>
            <Link href="/#how-it-works" className="hover:text-zinc-900 dark:hover:text-white transition-colors relative group">
              How It Works
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link>
            <Link href="/plans" className="text-zinc-900 dark:text-white transition-colors relative group">
              Pricing
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-orange-500 scale-x-100 transition-transform origin-left" />
            </Link>
            <Link href="/#reviews" className="hover:text-zinc-900 dark:hover:text-white transition-colors relative group">
              Reviews
              <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link>
          </div>

          {/* Action Right */}
          <div className="flex items-center gap-1.5 sm:gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 sm:p-2 rounded-full border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              {mounted && theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
            <Link href="/login" className="hidden sm:block text-sm font-bold hover:text-orange-500 transition-colors">Login</Link>
            <Link href="/register" className="hidden sm:block">
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(249, 115, 22, 0.3)' }}
                whileTap={{ scale: 0.95 }}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-full text-sm font-bold shadow-md flex items-center gap-2"
              >
                Try Now <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <button className="md:hidden p-1.5 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="md:hidden absolute top-[calc(100%+8px)] inset-x-0 bg-white/95 dark:bg-[#0c0c0e]/95 backdrop-blur-2xl border border-zinc-200/70 dark:border-zinc-800/70 overflow-hidden z-50 shadow-2xl rounded-[22px] sm:rounded-[26px] p-2"
            >
              <div className="flex flex-col gap-1">
                {[
                  { name: 'Features', icon: Zap, href: '/#features' },
                  { name: 'How It Works', icon: Star, href: '/#how-it-works' },
                  { name: 'Pricing', icon: Check, href: '/plans' },
                  { name: 'Reviews', icon: Star, href: '/#reviews' }
                ].map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.href} 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold text-zinc-700 dark:text-zinc-300 hover:bg-orange-500/10 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-all active:scale-[0.99] min-h-[44px]"
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="h-[1px] bg-zinc-200/50 dark:bg-zinc-800/50 my-1.5 mx-2" />
                <div className="grid grid-cols-2 gap-2 p-1">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 text-center rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center min-h-[44px]">
                    Login
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
                    <button className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:brightness-105 text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-orange-600/20 active:scale-[0.98] transition-all flex items-center justify-center min-h-[44px]">
                      Try Now
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* HEADER SECTION */}
      <section className="relative pt-32 pb-16 px-6 text-center z-10">
        <div className="max-w-3xl mx-auto mt-8 sm:mt-12">
          {/* Centered pill badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-6">
            Simple, transparent pricing
          </div>
          
          <h1 className="text-4xl sm:text-[44px] font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-[1.1]">
            Start free. Scale when you&apos;re ready.
          </h1>
          <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 font-medium mt-4 max-w-xl mx-auto leading-relaxed">
            No credit card required. Upgrade or downgrade anytime.
          </p>

          {/* Billing Toggle */}
          <div className="mt-10 flex justify-center">
            <div className="inline-flex items-center bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md relative">
              <button
                onClick={() => setIsYearly(false)}
                className={`relative px-6 py-2.5 text-sm font-bold rounded-xl transition-all z-10 ${
                  !isYearly ? 'text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {!isYearly && (
                  <motion.div 
                    layoutId="billing-pill" 
                    className="absolute inset-0 bg-[#FF6B35] rounded-xl shadow-sm z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Monthly</span>
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`relative px-6 py-2.5 text-sm font-bold rounded-xl transition-all z-10 flex items-center gap-2 ${
                  isYearly ? 'text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {isYearly && (
                  <motion.div 
                    layoutId="billing-pill" 
                    className="absolute inset-0 bg-[#FF6B35] rounded-xl shadow-sm z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Yearly</span>
                <span className="relative z-10 text-[10px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-md shadow-sm">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="px-6 py-8 relative z-10">
        <div className="max-w-[900px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* CARD 1 - FREEMIUM */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[20px] p-8 flex flex-col justify-between transition-all hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg shadow-sm">
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Free</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mt-2 leading-relaxed">
                Perfect for getting started and testing your AI agent
              </p>
              
              <div className="mt-6 mb-8">
                <div className="flex items-baseline">
                  <span className="text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">$0</span>
                  <span className="text-zinc-400 text-sm font-bold ml-1">/month</span>
                </div>
                <div className="text-[12px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1.5">
                  Free forever
                </div>
              </div>

              <Link href="/register" className="block mb-8">
                <button className="w-full py-3 rounded-xl border-2 border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white transition-all font-bold text-sm text-center">
                  Get started free
                </button>
              </Link>

              <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-6">
                <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider mb-4">Included Features</h4>
                <ul className="space-y-3.5">
                  {[
                    { t: '1 AI agent', active: true },
                    { t: '500 messages per month', active: true },
                    { t: 'Website training (1 URL)', active: true },
                    { t: 'File upload (1 file, max 5MB)', active: true },
                    { t: 'Basic chat widget', active: true },
                    { t: 'Widget customization (color)', active: true },
                    { t: 'Deploy via HTML embed', active: true },
                    { t: 'Ticket system (10 tickets/month)', active: true },
                    { t: 'Email notifications', active: true },
                    { t: 'AgentDesk branding (cannot remove)', active: true },
                    { t: 'Custom domain', active: false },
                    { t: 'Multiple agents', active: false },
                    { t: 'Priority support', active: false },
                    { t: 'Analytics dashboard', active: false },
                    { t: 'API access', active: false }
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] font-medium">
                      {feat.active ? (
                        <Check className="w-4 h-4 text-[#FF6B35] shrink-0 mt-0.5 stroke-[3px]" />
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700 shrink-0 font-black text-sm w-4 h-4 flex items-center justify-center">✗</span>
                      )}
                      <span className={feat.active ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-600 line-through'}>
                        {feat.t}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* CARD 2 - PREMIUM */}
          <div className="relative bg-white dark:bg-zinc-900 border-2 border-[#FF6B35] rounded-[20px] p-8 flex flex-col justify-between shadow-xl shadow-orange-500/5 transition-all hover:scale-[1.01]">
            {/* Most Popular Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FF6B35] text-white text-[11px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
              Most Popular
            </div>

            <div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Premium <Sparkles className="w-4.5 h-4.5 text-[#FF6B35] fill-current" />
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mt-2 leading-relaxed">
                For businesses serious about AI-powered customer support
              </p>
              
              <div className="mt-6 mb-8">
                <div className="flex items-baseline overflow-hidden h-[48px]">
                  <span className="text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center">
                    $
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={isYearly ? '23' : '29'}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isYearly ? '23' : '29'}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span className="text-zinc-400 text-sm font-bold ml-1">/month</span>
                </div>
                <div className="text-[12px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1.5 h-4">
                  {isYearly ? 'Billed $276/year' : 'Billed monthly'}
                </div>
              </div>

              <div className="mb-8">
                <Link href="/register?plan=premium">
                  <button className="w-full py-3 rounded-xl bg-[#FF6B35] hover:bg-orange-600 text-white font-bold text-sm text-center shadow-md shadow-orange-500/10">
                    Start free trial
                  </button>
                </Link>
                <div className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 font-medium">
                  14-day free trial, no credit card required
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-6">
                <h4 className="text-xs font-black uppercase text-[#FF6B35] tracking-wider mb-4">Everything in Free, plus:</h4>
                <ul className="space-y-3.5">
                  {[
                    '5 AI agents',
                    'Unlimited messages',
                    'Unlimited website training URLs',
                    'Unlimited file uploads (50MB each)',
                    'Advanced widget customization',
                    'Remove AgentDesk branding',
                    'Unlimited tickets',
                    'Analytics dashboard',
                    'Conversation history (90 days)',
                    'Priority email support',
                    'API access',
                    'Custom welcome messages per page',
                    'Multiple team members (3 seats)',
                    'Webhook integrations'
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
                      <Check className="w-4 h-4 text-[#FF6B35] shrink-0 mt-0.5 stroke-[3px]" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURE COMPARISON TABLE */}
      <section className="px-6 py-20 relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Compare plans</h2>
          <p className="text-sm text-zinc-400 mt-1 font-semibold">Every atomic detail compared head-to-head</p>
        </div>

        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950/20 shadow-sm">
          <table className="w-full border-collapse min-w-[650px] text-left">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                <th className="py-5 px-6 text-sm font-bold text-zinc-500 uppercase tracking-wider w-2/5">Feature</th>
                <th className="py-5 px-6 text-sm font-bold text-zinc-500 uppercase tracking-wider text-center w-3/10">Free</th>
                <th className="py-5 px-6 text-sm font-bold text-[#FF6B35] uppercase tracking-wider text-center w-3/10 bg-orange-500/5 border-x border-orange-500/10">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              
              {/* GROUP 1: AI & TRAINING */}
              <tr className="bg-zinc-100/50 dark:bg-zinc-900/10">
                <td colSpan={3} className="py-3 px-6 text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                  AI & Training
                </td>
              </tr>
              {[
                { name: 'AI agents', free: '1', premium: '5' },
                { name: 'Messages/month', free: '500', premium: 'Unlimited' },
                { name: 'Training URLs', free: '1', premium: 'Unlimited' },
                { name: 'File uploads', free: '1 (5MB)', premium: 'Unlimited (50MB)' },
                { name: 'Knowledge base size', free: '5MB', premium: '500MB' }
              ].map((row, i) => (
                <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                  <td className="py-4 px-6 text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">{row.name}</td>
                  <td className="py-4 px-6 text-[13px] text-center text-zinc-500 dark:text-zinc-400 font-medium">{row.free}</td>
                  <td className="py-4 px-6 text-[13px] text-center font-bold text-zinc-900 dark:text-zinc-100 bg-orange-500/5 border-x border-orange-500/10">{row.premium}</td>
                </tr>
              ))}

              {/* GROUP 2: WIDGET & DEPLOYMENT */}
              <tr className="bg-zinc-100/50 dark:bg-zinc-900/10">
                <td colSpan={3} className="py-3 px-6 text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                  Widget & Deployment
                </td>
              </tr>
              {[
                { name: 'Chat widget', free: true, premium: true },
                { name: 'Widget color customization', free: true, premium: true },
                { name: 'Remove branding', free: false, premium: true },
                { name: 'Custom welcome message', free: true, premium: true },
                { name: 'HTML embed', free: true, premium: true },
                { name: 'WordPress', free: true, premium: true },
                { name: 'Webflow', free: true, premium: true },
                { name: 'Framer', free: true, premium: true }
              ].map((row, i) => (
                <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                  <td className="py-4 px-6 text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">{row.name}</td>
                  <td className="py-4 px-6 text-center">
                    {row.free ? (
                      <Check className="w-4.5 h-4.5 text-[#FF6B35] mx-auto stroke-[2.5px]" />
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-800 text-sm font-black">✗</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center bg-orange-500/5 border-x border-orange-500/10">
                    {row.premium ? (
                      <Check className="w-4.5 h-4.5 text-[#FF6B35] mx-auto stroke-[2.5px]" />
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-850 text-sm font-black">✗</span>
                    )}
                  </td>
                </tr>
              ))}

              {/* GROUP 3: SUPPORT & TICKETS */}
              <tr className="bg-zinc-100/50 dark:bg-zinc-900/10">
                <td colSpan={3} className="py-3 px-6 text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                  Support & Tickets
                </td>
              </tr>
              {[
                { name: 'Ticket system', free: '10/month', premium: 'Unlimited' },
                { name: 'Email notifications', free: true, premium: true },
                { name: 'Conversation history', free: '7 days', premium: '90 days' },
                { name: 'Priority support', free: false, premium: true }
              ].map((row, i) => (
                <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                  <td className="py-4 px-6 text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">{row.name}</td>
                  <td className="py-4 px-6 text-center text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
                    {typeof row.free === 'boolean' ? (
                      row.free ? <Check className="w-4.5 h-4.5 text-[#FF6B35] mx-auto stroke-[2.5px]" /> : <span className="text-zinc-300 dark:text-zinc-850 text-sm font-black">✗</span>
                    ) : (
                      row.free
                    )}
                  </td>
                  <td className="py-4 px-6 text-center text-[13px] font-bold text-zinc-900 dark:text-zinc-100 bg-orange-500/5 border-x border-orange-500/10">
                    {typeof row.premium === 'boolean' ? (
                      row.premium ? <Check className="w-4.5 h-4.5 text-[#FF6B35] mx-auto stroke-[2.5px]" /> : <span className="text-zinc-300 dark:text-zinc-850 text-sm font-black">✗</span>
                    ) : (
                      row.premium
                    )}
                  </td>
                </tr>
              ))}

              {/* GROUP 4: ADVANCED */}
              <tr className="bg-zinc-100/50 dark:bg-zinc-900/10">
                <td colSpan={3} className="py-3 px-6 text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                  Advanced
                </td>
              </tr>
              {[
                { name: 'Analytics dashboard', free: false, premium: true },
                { name: 'API access', free: false, premium: true },
                { name: 'Webhooks', free: false, premium: true },
                { name: 'Team members', free: '1', premium: '3' },
                { name: 'Multiple agents', free: false, premium: true }
              ].map((row, i) => (
                <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                  <td className="py-4 px-6 text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">{row.name}</td>
                  <td className="py-4 px-6 text-center text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
                    {typeof row.free === 'boolean' ? (
                      row.free ? <Check className="w-4.5 h-4.5 text-[#FF6B35] mx-auto stroke-[2.5px]" /> : <span className="text-zinc-350 dark:text-zinc-800 text-sm font-black">✗</span>
                    ) : (
                      row.free
                    )}
                  </td>
                  <td className="py-4 px-6 text-center text-[13px] font-bold text-zinc-900 dark:text-zinc-100 bg-orange-500/5 border-x border-orange-500/10">
                    {typeof row.premium === 'boolean' ? (
                      row.premium ? <Check className="w-4.5 h-4.5 text-[#FF6B35] mx-auto stroke-[2.5px]" /> : <span className="text-zinc-350 dark:text-zinc-800 text-sm font-black">✗</span>
                    ) : (
                      row.premium
                    )}
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="px-6 py-20 relative z-10 bg-zinc-50 dark:bg-zinc-900/20 border-y border-zinc-200 dark:border-zinc-800/60">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Frequently asked questions</h2>
            <p className="text-sm text-zinc-400 mt-1 font-semibold">Everything you need to know about our service models</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            {faqs.map((faq, index) => (
              <FaqItem 
                key={index}
                question={faq.q}
                answer={faq.a}
                isOpen={openFaqIndex === index}
                onToggle={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-6 z-10 relative">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#FFF5F0] via-[#FFFBF9] to-[#FFF5F0] dark:from-[#1b1512] dark:via-[#110e0c] dark:to-[#1b1512] border border-orange-200/40 dark:border-orange-550/10 rounded-[32px] p-10 sm:p-20 text-center shadow-lg">
          <h2 className="text-3xl sm:text-[40px] font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
            Ready to put AI to work?
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-medium mt-4 max-w-xl mx-auto leading-relaxed">
            Join businesses using AgentDesk to automate support
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <motion.button 
                whileHover={{ scale: 1.03 }} 
                className="w-full sm:w-auto h-13 px-8 bg-[#FF6B35] hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                Start for free <ArrowRight className="w-4.5 h-4.5" />
              </motion.button>
            </Link>
            <Link href="/#features">
              <motion.button 
                whileHover={{ scale: 1.03 }} 
                className="w-full sm:w-auto h-13 px-8 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-sm shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
              >
                See how it works
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800/50 pt-20 pb-10 px-6 z-10 relative">
         <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2">
               <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white"><Bot className="w-5 h-5" /></div>
                  <span className="font-black text-lg">Agent Desk</span>
               </div>
               <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-xs leading-relaxed">Injecting autonomous atomic intelligence into scaling workflows worldwide.</p>
            </div>
            {[
              { t: 'Product', links: [
                { n: 'Features', h: '/#features' },
                { n: 'Pricing', h: '/plans' },
                { n: 'Widget', h: '/dashboard/deploy' },
                { n: 'Integrations', h: '#' }
              ] },
              { t: 'Company', links: [
                { n: 'About', h: '#' },
                { n: 'Careers', h: '#' },
                { n: 'Blog', h: '#' },
                { n: 'Media Kit', h: '#' }
              ] },
              { t: 'Support', links: [
                { n: 'Documentation', h: '#' },
                { n: 'API Access', h: '#' },
                { n: 'Guides', h: '#' },
                { n: 'Status', h: '#' }
              ] },
            ].map((group, i) => (
              <div key={i}>
                 <h5 className="font-bold text-sm mb-6 text-zinc-900 dark:text-white">{group.t}</h5>
                 <ul className="space-y-4">
                    {group.links.map(l => (
                      <li key={l.n}>
                        <a 
                          href={l.h} 
                          className="text-sm font-medium text-zinc-500 hover:text-orange-500 transition-colors"
                        >
                          {l.n}
                        </a>
                      </li>
                    ))}
                 </ul>
              </div>
            ))}
         </div>
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-zinc-200 dark:border-zinc-800/50 text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <p>© 2026 AgentDesk Inc. All rights reserved.</p>
            <div className="flex gap-6">
               <a href="#">Privacy</a>
               <a href="#">Terms</a>
               <a href="#">GDPR</a>
            </div>
         </div>
      </footer>

    </div>
  );
}
