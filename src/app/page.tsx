'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, MessageSquare, Zap, Shield, 
  BarChart3, Star, Check, UploadCloud, Code2, Rocket, Globe,
  ArrowRight, Sparkles, FileText, Bot
} from 'lucide-react';
import { KeliAiLogo } from '@/components/Logo';

// --- COMPONENT: TYPING EFFECT ---
function TypingText({ words }: { words: string[] }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];

    if (!isDeleting && charIndex === currentWord.length) {
      const pause = setTimeout(() => setIsDeleting(true), 1800);
      return () => clearTimeout(pause);
    }

    if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const speed = isDeleting ? 50 : 80;
    const timer = setTimeout(() => {
      setCharIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, speed);

    return () => clearTimeout(timer);
  }, [charIndex, wordIndex, isDeleting, words]);

  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-500 to-amber-400 inline-block">
      {words[wordIndex].substring(0, charIndex)}
      <span className="text-orange-500 animate-[blink_1s_infinite] ml-[1px]">|</span>
    </span>
  );
}

// --- COMPONENT: SCROLL REVEAL WRAPPER ---
interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
}

function ScrollReveal({ children, delay = 0 }: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.7, ease: [0.21, 1.02, 0.81, 0.99], delay }}
    >
      {children}
    </motion.div>
  );
}

// --- MAIN LANDING PAGE ---
export default function LandingPage() {
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
    <div className="relative min-h-screen bg-white text-zinc-900 selection:bg-orange-500/30 overflow-x-hidden font-outfit antialiased">
      
      {/* --- GLOBAL PATTERN MOTION BACKGROUND (MOTION FILLED COVERS WHOLE LANDING) --- */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Continuous moving dot-grid matrix background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-75 moving-pattern-bg h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 to-white" />
        
        {/* Soft elegant warm top spotlight */}
        <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[700px] h-[350px] bg-orange-500/[0.04] rounded-full blur-[100px]" />

        {/* Floating parallax ambient outline rings & squares (extremely elegant modern motion) */}
        <motion.div
          animate={{
            y: [0, -60, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-[12%] left-[4%] w-60 h-60 rounded-[48px] border border-orange-500/10 bg-transparent hidden lg:block"
        />
        <motion.div
          animate={{
            y: [0, 80, 0],
            rotate: [360, 0],
          }}
          transition={{
            duration: 32,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-[38%] right-[5%] w-80 h-80 rounded-full border border-amber-500/10 bg-transparent hidden lg:block"
        />
        <motion.div
          animate={{
            x: [0, 40, -40, 0],
            y: [0, -40, 40, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-[28%] left-[6%] w-72 h-72 rounded-[40px] border border-pink-500/5 bg-transparent hidden lg:block"
        />
        <motion.div
          animate={{
            y: [0, -50, 0],
            rotate: [180, -180],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-[8%] right-[8%] w-64 h-64 rounded-full border border-orange-500/[0.03] bg-transparent hidden lg:block"
        />
      </div>

      {/* --- NAVBAR --- */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed z-50 transition-all duration-300 ease-in-out
          top-4 inset-x-4 max-w-5xl md:mx-auto rounded-[24px] md:rounded-[28px]
          border border-zinc-200/50 bg-white/65 backdrop-blur-xl
          ${scrolled 
            ? 'shadow-[0_12px_40px_-12px_rgba(249,115,22,0.12)] py-2 md:py-3 border-zinc-200' 
            : 'shadow-[0_8px_30px_rgba(0,0,0,0.03)] py-3 md:py-4 border-zinc-200/50'
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <KeliAiLogo size="md" />

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-650 font-outfit">
            {['Features', 'How It Works', 'Pricing', 'Reviews'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-zinc-900 transition-colors relative group">
                {item}
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </a>
            ))}
          </div>

          {/* Action Right */}
          <div className="flex items-center gap-1.5 sm:gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-bold hover:text-orange-500 transition-colors font-outfit">Login</Link>
            <Link href="/register" className="hidden sm:block">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white rounded-full text-xs font-bold transition-all duration-200 font-outfit"
              >
                Try Now <ArrowRight className="w-3.5 h-3.5 ml-1 inline-block" />
              </motion.button>
            </Link>
            <button className="md:hidden p-1.5 border border-zinc-200/60 rounded-xl hover:bg-zinc-100 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
              className="md:hidden absolute top-[calc(100%+8px)] inset-x-0 bg-white/95 backdrop-blur-2xl border border-zinc-200/70 overflow-hidden z-50 shadow-2xl rounded-[22px] sm:rounded-[26px] p-2"
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
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold text-zinc-700 hover:bg-orange-500/10 hover:text-orange-600 transition-all active:scale-[0.99] min-h-[44px] font-outfit"
                  >
                    <div className="w-8 h-8 rounded-lg sm:rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500">
                      <item.icon className="w-3.5 h-3.5 stroke-[2.5px]" />
                    </div>
                    {item.name}
                  </a>
                ))}
                <div className="h-[1px] bg-zinc-200/50 my-1.5 mx-2" />
                <div className="grid grid-cols-2 gap-2 p-1">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 text-center rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors flex items-center justify-center min-h-[44px] font-outfit">
                    Login
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
                    <button className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:brightness-105 text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-orange-600/20 active:scale-[0.98] transition-all flex items-center justify-center min-h-[44px] font-outfit">
                      Try Now
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* --- HERO SECTION: PRISTINE, DEEPLY MOTION-FILLED & UPSCALED --- */}
      <section className="relative pt-36 pb-20 md:pt-48 md:pb-28 px-6 text-center z-10 overflow-hidden">
        {/* Grid dots backdrop layer */}
        <div className="absolute inset-0 z-0 opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        <div className="max-w-6xl mx-auto flex flex-col items-center relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-650 text-[11px] font-bold uppercase tracking-widest mb-10 shadow-xs font-outfit"
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> AI-Powered Customer Support
          </motion.div>
          
          {/* MOBILE HERO TITLE — typing effect */}
          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:hidden text-[36px] xs:text-[44px] sm:text-[56px] font-black tracking-[-0.04em] mb-10 max-w-5xl w-full text-center leading-[1.0] select-none font-space"
          >
            Resolve customer<br />conversations{' '}
            <TypingText words={["faster.", "instantly.", "automatically.", "24/7."]} />
          </motion.h1>

          {/* DESKTOP HERO TITLE — typing effect */}
          <motion.h1 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hidden md:block text-[76px] lg:text-[92px] xl:text-[106px] font-black tracking-[-0.04em] mb-10 max-w-5xl w-full text-center leading-[0.95] select-none font-space"
          >
            Your AI Support Team<br />is Always{' '}
            <TypingText words={["Ready.", "Online.", "Watching.", "Learning.", "Working."]} />
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[17px] sm:text-[20px] text-zinc-650 font-medium mb-14 max-w-2xl leading-[1.7] font-outfit"
          >
            Deploy autonomous AI agents trained on your custom brand data in seconds. Resolve 90% of tickets instantly, deliver 24/7 answers, and delight customers automatically.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto"
          >
            {/* CRAZY SPINNING GLOWING RING BUTTON (PRIMARY) */}
            <Link href="/register" className="relative group/ring w-full sm:w-auto flex justify-center font-outfit">
              <div className="glowing-ring-blur" />
              <div className="glowing-ring-btn w-full sm:w-auto">
                <div className="glowing-ring-btn-content px-10 py-4 font-bold text-[14.5px] flex items-center justify-center gap-2.5">
                  Start Free — No Card Needed <ArrowRight className="w-4 h-4 text-orange-400 group-hover/ring:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </Link>
            
            {/* SECONDARY SPINNING GLOWING RING BUTTON */}
            <a href="#how-it-works" className="relative group/ring-secondary w-full sm:w-auto flex justify-center font-outfit">
              <div className="glowing-ring-blur opacity-35" />
              <div className="glowing-ring-btn w-full sm:w-auto" style={{ padding: '2px' }}>
                <div className="glowing-ring-btn-content bg-white text-zinc-900 px-10 py-4 font-bold text-[14.5px] flex items-center justify-center">
                  See How It Works
                </div>
              </div>
            </a>
          </motion.div>

          {/* Stats Bar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 sm:mt-24 grid grid-cols-3 gap-6 sm:gap-12 border-t border-zinc-200/50 pt-12 w-full max-w-xl font-outfit"
          >
            {[
              { val: '90%', label: 'Fewer tickets', sub: 'resolved by AI' },
              { val: '< 1s', label: 'Response time', sub: 'always fast' },
              { val: '24/7', label: 'Always online', sub: 'zero downtime' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-[26px] sm:text-[32px] font-black text-zinc-900 tracking-tight leading-none font-space">{stat.val}</div>
                <div className="text-[11px] font-bold text-zinc-550 mt-2">{stat.label}</div>
                <div className="text-[10px] text-zinc-450 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </motion.div>
          
        </div>
      </section>

      {/* --- LOGO STRIP WITH SCROLL REVEAL --- */}
      <ScrollReveal>
        <section className="py-12 bg-zinc-50/70 border-y border-zinc-200/50 font-outfit">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-xs font-black uppercase tracking-widest text-zinc-450 mb-8">Trusted by forward-thinking startups globally</p>
            <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-50 grayscale brightness-0 transition-all font-space">
               <span className="font-black text-xl italic">Vercel</span>
               <span className="font-black text-xl tracking-tighter">Linear</span>
               <span className="font-black text-xl tracking-wide">Stripe</span>
               <span className="font-black text-xl">Raycast</span>
               <span className="font-black text-xl uppercase tracking-widest">Supabase</span>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* --- FEATURES SECTION WITH SCROLL REVEAL --- */}
      <ScrollReveal>
        <section id="features" className="py-28 px-6 relative font-outfit">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-sm font-black uppercase text-orange-500 tracking-widest mb-3">Superpowers</h2>
              <h3 className="text-3xl md:text-5xl font-black tracking-tight font-space">Everything you need to automate</h3>
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
                  className="group relative bg-white border border-zinc-200 rounded-3xl p-8 shadow-xs transition-all duration-300 hover:shadow-orange-500/10 hover:border-orange-500/30"
                >
                  <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center mb-6 transition-colors group-hover:bg-orange-500/10 group-hover:text-orange-500">
                    <f.icon className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="text-lg font-bold mb-2 font-space">{f.t}</h4>
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed">{f.d}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* --- HOW IT WORKS SECTION WITH SCROLL REVEAL --- */}
      <ScrollReveal>
        <section id="how-it-works" className="py-28 bg-zinc-50 text-zinc-900 border-y border-zinc-200 relative overflow-hidden font-outfit">
           <div className="absolute inset-0 bg-orange-600/5 opacity-[0.2] text-zinc-900/5" style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
           <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="text-center mb-20">
                 <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6 font-space">Go live in 3 steps</h2>
                 <p className="text-zinc-505 max-w-xl mx-auto text-lg font-medium">No complex deployments. Pure intelligence ready in minutes.</p>
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
                      <div className="w-14 h-14 rounded-2xl bg-white border-2 border-orange-500/30 hover:border-orange-500 flex items-center justify-center text-orange-500 shadow-lg shadow-orange-500/10 mb-6 transition-all hover:scale-105">
                         <s.icon className="w-6 h-6" />
                      </div>
                      <div className="text-[11px] font-black text-orange-500 tracking-widest uppercase mb-2">{s.step}</div>
                      <h4 className="text-[20px] font-bold mb-3 text-zinc-900 font-space">{s.t}</h4>
                      <p className="text-[14px] text-zinc-500 font-medium leading-relaxed">{s.d}</p>
                   </div>
                 ))}
              </div>
           </div>
        </section>
      </ScrollReveal>

      {/* --- PRICING SECTION WITH SCROLL REVEAL --- */}
      <ScrollReveal>
        <section id="pricing" className="py-28 px-6 relative overflow-hidden font-outfit">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
           <div className="max-w-5xl mx-auto relative z-10">
              <div className="text-center mb-20">
                 <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight font-space">Transparent Scale-pricing</h2>
                 
                 {/* Smooth Toggle Container */}
                 <div className="inline-flex items-center bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-lg">
                    <button 
                      onClick={() => setPriceAnnual(false)} 
                      className={`relative px-8 py-3 text-sm font-bold rounded-xl transition-all ${!priceAnnual ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-505'}`}
                    >
                       {!priceAnnual && <motion.div layoutId="active-tab" className="absolute inset-0 bg-zinc-100 rounded-xl shadow-sm z-0" />}
                       <span className="relative z-10">Monthly</span>
                    </button>
                    <button 
                      onClick={() => setPriceAnnual(true)} 
                      className={`relative px-8 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${priceAnnual ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-505'}`}
                    >
                       {priceAnnual && <motion.div layoutId="active-tab" className="absolute inset-0 bg-zinc-100 rounded-xl shadow-sm z-0" />}
                       <span className="relative z-10">Yearly</span>
                       <span className="relative z-10 text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full shadow-md animate-pulse">Save 10%</span>
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                 {/* FREE PLAN */}
                 <div className="bg-white/60 backdrop-blur-xl border border-zinc-200 rounded-[32px] p-10 shadow-xs flex flex-col h-full transition-all hover:scale-[1.01] hover:bg-white/80">
                    <div className="mb-10">
                       <h3 className="font-bold text-xl mb-3 text-zinc-900 font-space">Free</h3>
                       <p className="text-zinc-500 text-sm mb-6 font-medium">Perfect for testing and small projects.</p>
                       <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-black tracking-tighter text-zinc-900 font-space">$0</span>
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
                         <li key={i} className="flex items-start gap-3 text-sm font-medium text-zinc-650">
                            <Check className="w-5 h-5 text-emerald-550 shrink-0 stroke-[2.5px]" /> {f}
                         </li>
                       ))}
                    </ul>
                    <Link href="/register">
                       <button className="w-full py-4 rounded-2xl border-2 border-zinc-200 font-bold text-sm hover:bg-zinc-50 transition-all flex items-center justify-center">
                          Start Free
                       </button>
                    </Link>
                 </div>

                 {/* PREMIUM PLAN */}
                 <div className="relative bg-zinc-950 text-white border-2 border-orange-500 shadow-[0_0_60px_rgba(249,115,22,0.18)] rounded-[32px] p-10 flex flex-col h-full transition-all hover:scale-[1.02] overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none group-hover:opacity-70 transition-opacity" />
                    
                    <div className="absolute top-6 right-6 bg-orange-500 text-white text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg shadow-orange-500/30 z-10 animate-pulse">
                       Most Popular
                    </div>
                    
                    <div className="mb-10 relative z-10">
                       <h3 className="font-bold text-xl mb-3 text-orange-500 flex items-center gap-2 font-space">Premium <Sparkles className="w-4 h-4 fill-current text-orange-400" /></h3>
                       <p className="text-zinc-400 text-sm mb-6 font-medium">Built for startups and growing businesses.</p>
                       <div className="flex items-baseline gap-1 overflow-hidden h-[60px]">
                          <span className="text-5xl font-black tracking-tighter text-white flex items-center font-space">
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
                             <span className="line-through opacity-60 font-outfit font-bold">Was $348</span>
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
      </ScrollReveal>

      {/* --- TESTIMONIALS WITH SCROLL REVEAL --- */}
      <ScrollReveal>
        <section id="reviews" className="py-28 bg-zinc-50 overflow-hidden font-outfit">
           <div className="max-w-7xl mx-auto px-6 text-center mb-12">
              <h2 className="text-3xl font-black font-space">Loved by top founders</h2>
           </div>
           
           <div className="flex gap-6 overflow-x-hidden relative group">
              <div className="flex gap-6 animate-marquee whitespace-nowrap py-4 flex-nowrap">
                 {[
                   { n: 'Sarah J.', r: 'CTO @ Fintech', q: "Agent Desk slashed our support queue in hours. Pure wizardry." },
                   { n: 'Alex K.', r: 'Founder @ SaaSify', q: "Best integration I've ever written. Hand-offs are instant." },
                   { n: 'Elena V.', r: 'Growth @ Ecom', q: "Elena's AI handles 90% of requests. CSAT instantly jumped." },
                   { n: 'Mike D.', r: 'Lead @ Agency', q: "Absolutely vital component for modern enterprise apps. High-end UI." },
                   { n: 'Sarah J.', r: 'CTO @ Fintech', q: "Agent Desk slashed our support queue in hours. Pure wizardry." },
                   { n: 'Alex K.', r: 'Founder @ SaaSify', q: "Best integration I've ever written. Hand-offs are instant." },
                 ].map((t, i) => (
                   <div key={i} className="w-[350px] inline-block flex-shrink-0 whitespace-normal bg-white border border-zinc-205 p-6 rounded-3xl shadow-xs">
                      <div className="flex gap-1 text-orange-550 mb-4">
                         {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
                      </div>
                      <p className="text-sm font-semibold text-zinc-700 mb-6 italic leading-relaxed font-outfit">"{t.q}"</p>
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-black text-sm">{t.n[0]}</div>
                         <div>
                            <div className="font-bold text-sm font-space">{t.n}</div>
                            <div className="text-xs text-zinc-500 font-medium">{t.r}</div>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </section>
      </ScrollReveal>

      {/* --- FINAL CTA BANNER WITH SCROLL REVEAL --- */}
      <ScrollReveal>
        <section className="py-28 px-6 font-outfit">
           <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#fff2eb] via-[#fffbf9] to-[#fff2eb] rounded-[48px] border border-orange-200/30 p-12 md:p-24 text-center text-zinc-900 shadow-xl relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                 <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 leading-[1.1] font-space">
                    Ready to transform support?
                 </h2>
                 <p className="text-zinc-650 max-w-2xl mx-auto mb-12 text-lg font-medium leading-relaxed px-4">
                    Join thousands of teams delivering superhuman support at a fraction <br className="hidden md:block" /> of the cost.
                 </p>
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                    <Link href="/register">
                       <motion.button 
                          whileHover={{ scale: 1.02 }} 
                          whileTap={{ scale: 0.98 }}
                          className="h-14 px-10 bg-zinc-950 hover:bg-zinc-900 text-white rounded-2xl font-bold text-base shadow-xs transition-all duration-200 flex items-center justify-center font-outfit"
                       >
                          Get Started for Free
                       </motion.button>
                    </Link>
                    <Link href="/login">
                       <motion.button 
                          whileHover={{ scale: 1.02 }} 
                          whileTap={{ scale: 0.98 }}
                          className="h-14 px-10 bg-white text-zinc-900 border border-zinc-200 rounded-2xl font-bold text-base shadow-xs hover:bg-zinc-50 transition-all duration-200 flex items-center justify-center font-outfit"
                       >
                          Login to Dashboard
                       </motion.button>
                    </Link>
                 </div>
              </div>
           </div>
        </section>
      </ScrollReveal>

      {/* --- FOOTER --- */}
      <footer className="bg-zinc-50 border-t border-zinc-200/60 pt-20 pb-12 px-6 relative overflow-hidden font-outfit">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-orange-500/[0.03] rounded-full blur-3xl pointer-events-none" />
         
         <div className="max-w-7xl mx-auto relative z-10">
            {/* Top Grid Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16 border-b border-zinc-200/50">
               
               {/* Brand & Newsletter Column (Covers 2 span on desktop) */}
               <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center gap-2.5">
                     <KeliAiLogo size="md" />
                  </div>
                  <p className="text-zinc-500 text-sm max-w-sm leading-relaxed font-medium">
                     Superhuman 24/7 customer support automation engine trained on your brand guidelines in seconds.
                  </p>
                  
                  {/* Modern Newsletter Signup Form */}
                  <div className="space-y-3 pt-2">
                     <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Subscribe to updates</div>
                     <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row items-stretch gap-3 max-w-md">
                        <input 
                           type="email" 
                           placeholder="Enter your email" 
                           className="flex-1 bg-white border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:outline-hidden focus:border-orange-500/50 font-medium transition-all"
                        />
                        {/* CRAZY SPINNING GLOWING RING BUTTON (SUBSCRIBE) */}
                        <div className="relative group/ring shrink-0">
                           <div className="glowing-ring-blur opacity-50 inset-[-2px]" />
                           <div className="glowing-ring-btn">
                              <button type="submit" className="glowing-ring-btn-content px-6 py-3 font-bold text-xs flex items-center justify-center gap-1.5 h-full">
                                 Subscribe
                              </button>
                           </div>
                        </div>
                     </form>
                  </div>
               </div>

               {/* Links Column 1: Product */}
               <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-space">Product</h4>
                  <ul className="space-y-2.5 text-[13.5px] font-semibold text-zinc-500">
                     <li><a href="#features" className="hover:text-orange-500 transition-colors">Features</a></li>
                     <li><a href="#how-it-works" className="hover:text-orange-500 transition-colors">How It Works</a></li>
                     <li><a href="#pricing" className="hover:text-orange-500 transition-colors">Scale Pricing</a></li>
                     <li><a href="#reviews" className="hover:text-orange-500 transition-colors">Testimonials</a></li>
                  </ul>
               </div>

               {/* Links Column 2: Resources */}
               <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-space">Resources</h4>
                  <ul className="space-y-2.5 text-[13.5px] font-semibold text-zinc-500">
                     <li><Link href="/login" className="hover:text-orange-500 transition-colors">Developer Portal</Link></li>
                     <li><Link href="/dashboard" className="hover:text-orange-500 transition-colors">Console Log</Link></li>
                     <li><Link href="/privacy" className="hover:text-orange-500 transition-colors">System Schema</Link></li>
                     <li><span className="flex items-center gap-1.5 text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> All Systems Online
                     </span></li>
                  </ul>
               </div>

               {/* Links Column 3: Legal & Company */}
               <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 font-space">Legal</h4>
                  <ul className="space-y-2.5 text-[13.5px] font-semibold text-zinc-500">
                     <li><Link href="/privacy" className="hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
                     <li><Link href="/terms" className="hover:text-orange-500 transition-colors">Terms of Service</Link></li>
                     <li><Link href="/privacy" className="hover:text-orange-500 transition-colors">Security Audit</Link></li>
                     <li><Link href="/terms" className="hover:text-orange-500 transition-colors">Data Processing</Link></li>
                  </ul>
               </div>
               
            </div>

            {/* Middle Row: Massive Typographical Space Grotesk Logo Banner */}
            <div className="py-12 border-b border-zinc-200/30 flex justify-center overflow-hidden select-none">
               <h2 className="text-[60px] sm:text-[100px] md:text-[130px] lg:text-[150px] font-black uppercase tracking-[0.25em] leading-none bg-gradient-to-r from-orange-600 via-[#FF6B35] to-amber-500 bg-clip-text text-transparent drop-shadow-[0_8px_30px_rgba(255,107,53,0.18)] transition-all duration-500 font-space">
                  Keli AI
               </h2>
            </div>

            {/* Bottom Row */}
            <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
               {/* Copyright info */}
               <p className="text-[11.5px] font-bold text-zinc-450 uppercase tracking-widest order-2 md:order-1">
                  © {new Date().getFullYear()} Keli AI Inc. All rights reserved.
               </p>

               {/* Social Icons */}
               <div className="flex items-center gap-6 order-1 md:order-2">
                  {[
                     { n: 'Twitter', h: '#' },
                     { n: 'GitHub', h: '#' },
                     { n: 'Discord', h: '#' },
                     { n: 'LinkedIn', h: '#' }
                  ].map((s, i) => (
                     <a key={i} href={s.h} className="text-zinc-400 hover:text-orange-500 text-xs font-bold uppercase tracking-wider transition-colors relative group">
                        {s.n}
                        <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                     </a>
                  ))}
               </div>
            </div>
         </div>
      </footer>

      {/* Define beautiful Google Fonts, infinite marquee and rotating glowing ring custom animations */}
      <style jsx global>{`
         @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;900&family=Outfit:wght@400;500;600;700;900&display=swap');
         
         .font-space {
            font-family: 'Space Grotesk', sans-serif;
         }
         
         .font-outfit {
            font-family: 'Outfit', sans-serif;
         }

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
         @keyframes moving-pattern {
            0% { background-position: 0 0; }
            100% { background-position: 32px 32px; }
         }
         .moving-pattern-bg {
            animation: moving-pattern 20s linear infinite;
         }
         @keyframes glowing-border-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
         }
         .glowing-ring-btn {
            position: relative;
            border-radius: 9999px;
            padding: 2px;
            overflow: hidden;
            background: transparent;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 100%;
         }
         .glowing-ring-btn::before {
            content: '';
            position: absolute;
            top: -150%;
            left: -150%;
            width: 400%;
            height: 400%;
            background: conic-gradient(from 0deg, #ff6b35, #f59e0b, #ec4899, #8b5cf6, #3b82f6, #ff6b35);
            animation: glowing-border-spin 3.5s linear infinite;
            z-index: 1;
         }
         .glowing-ring-btn-content {
            position: relative;
            z-index: 2;
            background: #09090b;
            color: white;
            border-radius: 9999px;
            width: 100%;
            transition: background 0.3s;
         }
         .glowing-ring-btn:hover .glowing-ring-btn-content {
            background: #18181b;
         }
         .glowing-ring-blur {
            position: absolute;
            inset: -4px;
            border-radius: 9999px;
            background: conic-gradient(from 0deg, #ff6b35, #f59e0b, #ec4899, #8b5cf6, #3b82f6, #ff6b35);
            animation: glowing-border-spin 3.5s linear infinite;
            filter: blur(12px);
            opacity: 0.75;
            z-index: 0;
            pointer-events: none;
         }
         .group\/ring-secondary .glowing-ring-btn-content {
            background: white;
            color: #18181b;
         }
         .group\/ring-secondary:hover .glowing-ring-btn-content {
            background: #fafafa;
         }
         .group\/ring-secondary .glowing-ring-blur {
            filter: blur(10px);
            opacity: 0.45;
         }
      `}</style>
    </div>
  );
}
