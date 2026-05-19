'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Moon, Menu, X, MessageSquare, Zap, Shield, 
  BarChart3, Star, Check, UploadCloud, Code2, Rocket, Globe,
  ArrowRight, Sparkles, FileText, Bot
} from 'lucide-react';
import { AgentDeskLogo } from '@/components/Logo';

// --- COMPONENT: TYPING EFFECT LOOP ---
const TYPING_WORDS = ["Ready", "Online", "Watching", "Learning", "Working"];

function TypingText() {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (subIndex === TYPING_WORDS[index].length + 1 && !reverse) {
      const timer = setTimeout(() => setReverse(true), 1500);
      return () => clearTimeout(timer);
    }
    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % TYPING_WORDS.length);
      return;
    }
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 40 : 60);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  useEffect(() => {
    if (subIndex === TYPING_WORDS[index].length && !reverse) {
      const timer = setTimeout(() => setReverse(true), 1800);
      return () => clearTimeout(timer);
    }
  }, [subIndex, index, reverse]);

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 inline-block min-w-[150px]">
      {TYPING_WORDS[index].substring(0, subIndex)}
      <span className="text-orange-400 animate-[blink_1s_infinite]">|</span>
    </span>
  );
}

// --- MAIN LANDING PAGE ---
export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [priceAnnual, setPriceAnnual] = useState(false);



  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-50 selection:bg-orange-500/30 overflow-x-hidden font-sans antialiased transition-colors duration-300">
      
      {/* --- GLOBAL AMBIENT GLOWS --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-500/10 dark:bg-orange-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400/10 dark:bg-orange-500/10 rounded-full blur-[120px]" />
      </div>

      {/* --- NAVBAR --- */}
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
          <AgentDeskLogo size="md" />

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
            {['Features', 'How It Works', 'Pricing', 'Reviews'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-zinc-900 dark:hover:text-white transition-colors relative group">
                {item}
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </a>
            ))}
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
                  { name: 'Features', icon: Zap, href: '#features' },
                  { name: 'How It Works', icon: Rocket, href: '#how-it-works' },
                  { name: 'Pricing', icon: Check, href: '#pricing' },
                  { name: 'Reviews', icon: Star, href: '#reviews' }
                ].map((item) => (
                  <a 
                    key={item.name} 
                    href={item.href} 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold text-zinc-700 dark:text-zinc-300 hover:bg-orange-500/10 dark:hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 transition-all active:scale-[0.99] min-h-[44px]"
                  >
                    <div className="w-8 h-8 rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                      <item.icon className="w-3.5 h-3.5 stroke-[2.5px]" />
                    </div>
                    {item.name}
                  </a>
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

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Left Column */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-left"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-bold uppercase tracking-widest mb-7">
              <Sparkles className="w-3 h-3" /> AI-Powered Customer Support
            </div>
            <h1 className="text-[46px] sm:text-[58px] lg:text-[68px] font-black leading-[1.08] tracking-[-0.03em] mb-6">
              Your AI Support<br />Team Is Always{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-400">
                <TypingText />
              </span>
            </h1>
            <p className="text-[17px] text-zinc-600 dark:text-zinc-400 font-medium mb-10 max-w-lg leading-[1.7]">
              Deploy AI agents trained on your content. Resolve tickets instantly, automate workflows, and deliver 24/7 support without hiring a single rep.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/register">
                <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                  className="h-13 px-8 py-3.5 bg-black dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-[15px] shadow-lg flex items-center gap-2 transition-all">
                  Start Free — No Card Needed <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <a href="#how-it-works">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="h-13 px-8 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-[15px] shadow-sm flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                  See How It Works
                </motion.button>
              </a>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-8">
              {[
                { val: '90%', label: 'Fewer tickets', sub: 'resolved by AI' },
                { val: '< 1s', label: 'Response time', sub: 'always fast' },
                { val: '24/7', label: 'Always online', sub: 'zero downtime' },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-[22px] sm:text-[26px] font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{stat.val}</div>
                  <div className="text-[11px] font-bold text-zinc-500 mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500">{stat.sub}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Dashboard Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22,1,0.36,1] }}
            className="relative hidden lg:block"
          >
            {/* Glow */}
            <div className="absolute -inset-6 bg-gradient-to-br from-orange-500/15 via-amber-400/10 to-transparent blur-3xl rounded-full" />
            
            {/* Browser chrome */}
            <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] shadow-2xl shadow-black/10 overflow-hidden">
              {/* Browser bar */}
              <div className="h-11 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                </div>
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-md h-6 flex items-center px-3 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-medium text-zinc-400">agentdesk-xi.vercel.app/dashboard</span>
                </div>
              </div>

              {/* Dashboard body */}
              <div className="p-5 bg-[#fafafa] dark:bg-zinc-950 space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[{l:'Resolved Today',v:'142',c:'text-emerald-600'},{l:'Avg Response',v:'0.8s',c:'text-orange-600'},{l:'CSAT Score',v:'98%',c:'text-blue-600'}].map((s,i)=>(
                    <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm">
                      <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide mb-1">{s.l}</div>
                      <div className={`text-[20px] font-black tracking-tight ${s.c}`}>{s.v}</div>
                    </div>
                  ))}
                </div>

                {/* Chat panel */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white">
                      <div className="w-2.5 h-2.5 bg-white rounded-sm rotate-45" />
                    </div>
                    <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200">Live Chat — Support Agent</span>
                    <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Online
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold flex-shrink-0">U</div>
                      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tl-sm px-3 py-2 text-[12px] text-zinc-700 dark:text-zinc-300 max-w-[75%]">How do I reset my password?</div>
                    </div>
                    <div className="flex gap-2.5 justify-end">
                      <div className="bg-orange-500 rounded-2xl rounded-tr-sm px-3 py-2 text-[12px] text-white max-w-[75%]">
                        Sure! Go to Settings → Security → Reset Password. I&apos;ll send a link to your email right away.
                      </div>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 bg-white rounded-sm rotate-45" />
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold flex-shrink-0">U</div>
                      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-tl-sm px-3 py-2 text-[12px] text-zinc-700 dark:text-zinc-300">
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{animationDelay:'0ms'}} />
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{animationDelay:'150ms'}} />
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{animationDelay:'300ms'}} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- LOGO STRIP --- */}
      <section className="py-10 bg-zinc-50 dark:bg-zinc-900/20 border-y border-zinc-200 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-8">Trusted by forward-thinking startups globally</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-50 grayscale dark:invert brightness-0 transition-all">
             <span className="font-black text-xl italic">Vercel</span>
             <span className="font-black text-xl tracking-tighter">Linear</span>
             <span className="font-black text-xl tracking-wide">Stripe</span>
             <span className="font-black text-xl">Raycast</span>
             <span className="font-black text-xl uppercase tracking-widest">Supabase</span>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-sm font-black uppercase text-orange-500 tracking-widest mb-3">Superpowers</h2>
            <h3 className="text-3xl md:text-5xl font-black tracking-tight">Everything you need to automate</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Bot, t: 'AI Customer Support', d: 'Leverage bleeding-edge language models for human-like accuracy.' },
              { icon: FileText, t: 'Smart Knowledge Base', d: 'Instantly hydrate AI using existing docs, URLs, and TXT files.' },
              { icon: ArrowRight, t: 'Live Chat Escalation', d: 'Smooth handoffs to real teammates whenever humans are preferred.' },
              { icon: Globe, t: 'Multi-platform Grid', d: 'Deploy on WhatsApp, Discord, Telegram, and Native Web Widgets.' },
              { icon: Zap, t: 'AI Ticket Creation', d: 'Automatically open internal support tickets from AI chatter triggers.' },
              { icon: BarChart3, t: 'Analytics Dashboard', d: 'Track resolved tickets, user happiness, and node activity live.' },
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm transition-all duration-300 hover:shadow-orange-500/10 hover:border-orange-500/30"
              >
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center mb-6 transition-colors group-hover:bg-orange-500/10 group-hover:text-orange-500">
                  <f.icon className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold mb-2">{f.t}</h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">{f.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION REMASTERED --- */}
      <section id="how-it-works" className="py-24 bg-zinc-50 dark:bg-[#050506] text-zinc-900 dark:text-white border-y border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
         <div className="absolute inset-0 bg-orange-600/5 opacity-[0.2] dark:opacity-30 text-zinc-900/5 dark:text-white/5" style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
         <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20">
               <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">Go live in 3 steps</h2>
               <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto text-lg font-medium">No complex deployments. Pure intelligence ready in minutes.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
               {/* Connector Line */}
               <div className="hidden lg:block absolute top-1/2 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-orange-500 via-orange-500/20 to-transparent -translate-y-1/2 z-0 opacity-30" />
               
               {[
                 { step: '01', icon: UploadCloud, t: 'Name Your Agent', d: 'Give your AI a name and role. No website scraping, no complexity — just describe what it does.' },
                 { step: '02', icon: Code2, t: 'Embed One Script', d: 'Copy a single <script> tag and paste it into your site. Works on any platform in seconds.' },
                 { step: '03', icon: Rocket, t: 'Go Live Instantly', d: 'Your AI handles real conversations 24/7. Watch tickets resolve automatically while you sleep.' },
               ].map((s, i) => (
                 <div key={i} className="relative z-10 flex flex-col">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-orange-500/30 hover:border-orange-500 flex items-center justify-center text-orange-500 shadow-lg shadow-orange-500/10 mb-6 transition-all hover:scale-105">
                       <s.icon className="w-6 h-6" />
                    </div>
                    <div className="text-[11px] font-black text-orange-500 tracking-widest uppercase mb-2">{s.step}</div>
                    <h4 className="text-[20px] font-bold mb-3 text-zinc-900 dark:text-zinc-100">{s.t}</h4>
                    <p className="text-[14px] text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">{s.d}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* --- PRICING SECTION --- */}
      {/* --- PRICING SECTION REMASTERED --- */}
      <section id="pricing" className="py-24 px-6 relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
         <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-16">
               <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">Transparent Scale-pricing</h2>
               
               {/* Smooth Toggle Container */}
               <div className="inline-flex items-center bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
                  <button 
                    onClick={() => setPriceAnnual(false)} 
                    className={`relative px-8 py-3 text-sm font-bold rounded-xl transition-all ${!priceAnnual ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-500'}`}
                  >
                     {!priceAnnual && <motion.div layoutId="active-tab" className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-xl shadow-sm z-0" />}
                     <span className="relative z-10">Monthly</span>
                  </button>
                  <button 
                    onClick={() => setPriceAnnual(true)} 
                    className={`relative px-8 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${priceAnnual ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-500'}`}
                  >
                     {priceAnnual && <motion.div layoutId="active-tab" className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-xl shadow-sm z-0" />}
                     <span className="relative z-10">Yearly</span>
                     <span className="relative z-10 text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full shadow-md animate-pulse">Save 10%</span>
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
               {/* FREE PLAN */}
               <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-10 shadow-sm flex flex-col h-full transition-all hover:scale-[1.01] hover:bg-white/80 dark:hover:bg-zinc-900/80">
                  <div className="mb-10">
                     <h3 className="font-bold text-xl mb-3 text-zinc-900 dark:text-zinc-100">Free</h3>
                     <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 font-medium">Perfect for testing and small projects.</p>
                     <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-white">$0</span>
                        <span className="text-zinc-400 text-sm font-bold ml-1">/mo</span>
                     </div>
                  </div>
                  <ul className="space-y-4 mb-12 flex-1">
                     {[
                        '5,000 AI Credits/month',
                        '1 AI Agent',
                        'Basic Website Widget',
                        'Limited Chat History',
                        'Community Support',
                        'Basic Analytics',
                        '1 Team Member',
                        'Standard Response Speed'
                     ].map((f, i) => (
                       <li key={i} className="flex items-start gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                          <Check className="w-5 h-5 text-emerald-500 dark:text-orange-500/80 shrink-0 stroke-[2.5px]" /> {f}
                       </li>
                     ))}
                  </ul>
                  <Link href="/register">
                     <button className="w-full py-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center">
                        Start Free
                     </button>
                  </Link>
               </div>

               {/* PREMIUM PLAN */}
               <div className="relative bg-zinc-950 text-white dark:bg-[#0a0a0b] border-2 border-orange-500 shadow-[0_0_60px_rgba(249,115,22,0.2)] rounded-[32px] p-10 flex flex-col h-full transition-all hover:scale-[1.02] overflow-hidden group">
                  {/* Subtle glowing gradient background inside card */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none group-hover:opacity-70 transition-opacity" />
                  
                  {/* Most Popular Badge */}
                  <div className="absolute top-6 right-6 bg-orange-500 text-white text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg shadow-orange-500/30 z-10">
                     Most Popular
                  </div>
                  
                  <div className="mb-10 relative z-10">
                     <h3 className="font-bold text-xl mb-3 text-orange-500 flex items-center gap-2">Premium <Sparkles className="w-4 h-4 fill-current" /></h3>
                     <p className="text-zinc-400 text-sm mb-6 font-medium">Built for startups and growing businesses.</p>
                     <div className="flex items-baseline gap-1 overflow-hidden h-[60px]">
                        <span className="text-5xl font-black tracking-tighter text-white flex items-center">
                           $
                           <AnimatePresence mode="wait">
                              <motion.span
                                 key={priceAnnual ? '313' : '29'}
                                 initial={{ y: 20, opacity: 0 }}
                                 animate={{ y: 0, opacity: 1 }}
                                 exit={{ y: -20, opacity: 0 }}
                                 transition={{ duration: 0.2 }}
                                 className="inline-block"
                              >
                                 {priceAnnual ? '312' : '29'}
                              </motion.span>
                           </AnimatePresence>
                        </span>
                        <AnimatePresence mode="wait">
                           <motion.span 
                              key={priceAnnual ? '/year' : '/mo'}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-zinc-400 text-sm font-bold ml-1"
                           >
                              {priceAnnual ? '/year' : '/mo'}
                           </motion.span>
                        </AnimatePresence>
                     </div>
                     {priceAnnual && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-orange-500/90 text-xs font-black mt-2 flex items-center gap-2">
                           <span className="line-through opacity-60">Was $348</span>
                           <span className="bg-orange-500/10 text-[10px] px-2 py-0.5 rounded border border-orange-500/20">10% OFF</span>
                        </motion.div>
                     )}
                     {priceAnnual && (
                        <div className="text-orange-500/70 text-[10px] font-bold mt-1">
                           Billed $312/year
                        </div>
                     )}
                  </div>
                  
                  <ul className="grid grid-cols-1 sm:grid-cols-1 gap-y-4 mb-12 flex-1 relative z-10">
                     {[
                        '20,000 AI Credits/month',
                        '5 AI Agents',
                        'Unlimited Chat History',
                        'AI Ticket Automation',
                        'Human Handoff',
                        'Slack + Zendesk Integrations',
                        'Advanced Analytics Dashboard',
                        'Priority AI Response Speed',
                        'Multi-Website Support',
                        'Team Inbox',
                        'Custom Branding',
                        'Priority Support'
                     ].map((f, i) => (
                       <li key={i} className="flex items-start gap-3 text-sm font-medium text-zinc-200 hover:text-white transition-colors">
                          <Check className="w-5 h-5 text-orange-500 shrink-0 stroke-[3px]" /> {f}
                       </li>
                     ))}
                  </ul>
                  
                  <Link href="/#pricing" className="relative z-10">
                     <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 text-white font-bold text-base shadow-xl shadow-orange-600/20 hover:shadow-orange-500/40 hover:brightness-110 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]">
                        Upgrade Now <ArrowRight className="w-5 h-5" />
                     </button>
                  </Link>
               </div>
            </div>
         </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section id="reviews" className="py-24 bg-zinc-50 dark:bg-zinc-900/30 overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 text-center mb-12">
            <h2 className="text-3xl font-black">Loved by top founders</h2>
         </div>
         
         {/* Carousel Marquee effect wrapper */}
         <div className="flex gap-6 overflow-x-hidden relative group">
            <div className="flex gap-6 animate-marquee whitespace-nowrap py-4 flex-nowrap">
               {[
                 { n: 'Sarah J.', r: 'CTO @ Fintech', q: "Agent Desk slashed our support queue in hours. Pure wizardry." },
                 { n: 'Alex K.', r: 'Founder @ SaaSify', q: "Best integration I've ever written. Hand-offs are instant." },
                 { n: 'Elena V.', r: 'Growth @ Ecom', q: "The AI handles 90% of requests. Conversion rate jumped instantly." },
                 { n: 'Mike D.', r: 'Lead @ Agency', q: "Absolutely vital component for modern enterprise apps. High-end UI." },
                 { n: 'Sarah J.', r: 'CTO @ Fintech', q: "Agent Desk slashed our support queue in hours. Pure wizardry." },
                 { n: 'Alex K.', r: 'Founder @ SaaSify', q: "Best integration I've ever written. Hand-offs are instant." },
               ].map((t, i) => (
                 <div key={i} className="w-[350px] inline-block flex-shrink-0 whitespace-normal bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
                    <div className="flex gap-1 text-orange-500 mb-4">
                       {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
                    </div>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-6 italic leading-relaxed">"{t.q}"</p>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-sm">{t.n[0]}</div>
                       <div>
                          <div className="font-bold text-sm">{t.n}</div>
                          <div className="text-xs text-zinc-500 font-medium">{t.r}</div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* --- FINAL CTA BANNER REMASTERED --- */}
      <section className="py-24 px-6">
         <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#fff2eb] via-[#fffbf9] to-[#fff2eb] dark:from-[#27272a] dark:to-[#18181b] rounded-[48px] border border-orange-200/30 dark:border-zinc-800 p-12 md:p-24 text-center text-zinc-900 dark:text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
               <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-[1.1]">
                  Ready to transform support?
               </h2>
               <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-12 text-lg font-medium leading-relaxed px-4">
                  Join thousands of teams delivering superhuman support at a fraction <br className="hidden md:block" /> of the cost.
               </p>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                  <Link href="/register">
                     <motion.button 
                        whileHover={{ scale: 1.03, y: -2 }} 
                        className="h-14 px-10 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-orange-500/30 transition-all"
                     >
                        Get Started for Free
                     </motion.button>
                  </Link>
                  <Link href="/login">
                     <motion.button 
                        whileHover={{ scale: 1.03 }} 
                        className="h-14 px-10 bg-white text-zinc-900 border border-zinc-200 rounded-2xl font-bold text-base shadow-sm hover:bg-zinc-50 transition-all"
                     >
                        Login to Dashboard
                     </motion.button>
                  </Link>
               </div>
            </div>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800/50 pt-20 pb-10 px-6">
         <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
            <div className="col-span-2">
               <div className="mb-5"><AgentDeskLogo size="md" /></div>
               <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-xs leading-relaxed">Intelligent AI agents that resolve customer issues 24/7, automatically.</p>
            </div>
            {[
              { t: 'Product', links: [
                { n: 'Features', h: '#features' },
                { n: 'Pricing', h: '#pricing' },
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
                          title={l.h === '#' ? 'Coming soon' : ''}
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
               <a href="#" title="Coming soon">Privacy</a>
               <a href="#" title="Coming soon">Terms</a>
               <a href="#" title="Coming soon">GDPR</a>
            </div>
         </div>
      </footer>

      {/* Define simple infinite marquee animation custom style */}
      <style jsx global>{`
         @keyframes marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
         }
         .animate-marquee {
            display: flex;
            width: max-content;
            animation: marquee 30s linear infinite;
         }
         @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
         }
         .animate-marquee:hover {
            animation-play-state: paused;
         }
         @keyframes bounce-slow {
            0%, 100% { transform: translateY(-5%); }
            50% { transform: translateY(0); }
         }
         .animate-bounce-slow {
            animation: bounce-slow 3s ease-in-out infinite;
         }
      `}</style>
    </div>
  );
}
