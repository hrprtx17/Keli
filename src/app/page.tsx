'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Bot, Sun, Moon, Menu, X, ChevronRight, MessageSquare, Zap, Shield, BarChart3, Star, Check } from 'lucide-react';

const TYPING_WORDS = ['Scale.', 'Growth.', 'Efficiency.', 'Velocity.', 'Automation.'];

function useTypingEffect(words: string[], speed = 80, pause = 1800) {
  const [display, setDisplay] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing');
  const ref = useRef({ charIdx: 0, wordIdx: 0, phase: 'typing' as 'typing' | 'pausing' | 'deleting' });

  useEffect(() => {
    const tick = () => {
      const { charIdx, wordIdx: wIdx, phase: p } = ref.current;
      const word = words[wIdx];
      if (p === 'typing') {
        const next = word.slice(0, charIdx + 1);
        setDisplay(next);
        ref.current.charIdx++;
        if (ref.current.charIdx === word.length) {
          ref.current.phase = 'pausing';
        }
      } else if (p === 'pausing') {
        ref.current.phase = 'deleting';
      } else {
        const next = word.slice(0, charIdx - 1);
        setDisplay(next);
        ref.current.charIdx--;
        if (ref.current.charIdx === 0) {
          ref.current.wordIdx = (wIdx + 1) % words.length;
          setWordIdx(ref.current.wordIdx);
          ref.current.phase = 'typing';
        }
      }
    };

    const delay = ref.current.phase === 'pausing' ? pause : ref.current.phase === 'deleting' ? speed / 2 : speed;
    const timer = setTimeout(tick, delay);
    return () => clearTimeout(timer);
  }, [display, words, speed, pause]);

  return display;
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-9 h-9 flex items-center justify-center rounded-full border border-border bg-background hover:bg-muted transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const typedWord = useTypingEffect(TYPING_WORDS);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast Setup',
      desc: 'Upload PDFs, paste a URL, or type text. Your AI agent learns your business in minutes, not days.',
    },
    {
      icon: MessageSquare,
      title: 'Embeddable Chat Widget',
      desc: 'A single line of JavaScript adds your trained AI agent to any website. No engineering required.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      desc: 'Domain verification, rate limiting, and atomic credit locking protect you from abuse and overspending.',
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      desc: 'Track conversations, resolution rates, and credit usage from a beautiful unified dashboard.',
    },
  ];

  const testimonials = [
    { name: 'Priya S.', role: 'CTO at Finly', text: 'AgentDesk cut our support ticket volume by 70% in the first week. Absolutely game changing.' },
    { name: 'Marcus T.', role: 'Founder at ShipFast', text: 'Setup took 15 minutes. Our AI agent now handles FAQs 24/7 and customers love it.' },
    { name: 'Aisha K.', role: 'Head of Support', text: 'The knowledge base RAG is genuinely impressive. It cites the right docs every single time.' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-background/95 backdrop-blur-md shadow-sm border-b border-border' : 'bg-transparent'}`}>
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">AgentDesk</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Reviews</a>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">Sign In</Link>
            <Link href="/register">
              <Button className="rounded-full px-6 bg-primary hover:bg-primary/90 text-white shadow-md">
                Start Free
              </Button>
            </Link>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center space-x-2">
            <ThemeToggle />
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-md hover:bg-muted transition-colors">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-background border-b border-border px-6 pb-6 space-y-4">
            <a href="#features" className="block text-sm font-medium py-2" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#pricing" className="block text-sm font-medium py-2" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#testimonials" className="block text-sm font-medium py-2" onClick={() => setMenuOpen(false)}>Reviews</a>
            <div className="flex flex-col space-y-2 pt-2">
              <Link href="/login"><Button variant="outline" className="w-full">Sign In</Button></Link>
              <Link href="/register"><Button className="w-full bg-primary text-white">Start Free</Button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 px-6 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
            Now live — AgentDesk 1.0
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
            AI Support Agents
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-400 to-amber-500">
              Built for{' '}
              <span className="inline-block min-w-[180px]">
                {typedWord}
                <span className="animate-pulse text-primary">|</span>
              </span>
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Train custom AI agents on your docs, deploy a chat widget instantly, and let AI handle your support queue around the clock.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-14 px-10 text-base rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all hover:scale-105">
                Start for free
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="h-14 px-10 text-base rounded-full">
                See how it works
              </Button>
            </a>
          </div>

          <p className="text-xs text-muted-foreground mt-4">No credit card required · Free plan includes 500 AI credits</p>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 container mx-auto max-w-5xl">
          <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 text-center text-xs text-muted-foreground font-mono">agentdesk.ai/dashboard</div>
            </div>
            <div className="flex h-80">
              {/* Sidebar Mock */}
              <div className="w-48 border-r border-border bg-muted/30 p-4 space-y-2 hidden sm:block">
                {['Dashboard', 'Agents', 'Knowledge Base', 'Conversations', 'Billing'].map((item, i) => (
                  <div key={item} className={`h-8 rounded-md flex items-center px-3 text-xs font-medium ${i === 0 ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}>
                    {item}
                  </div>
                ))}
              </div>
              {/* Content Mock */}
              <div className="flex-1 p-6 space-y-4 bg-background">
                <div className="grid grid-cols-3 gap-4">
                  {['1,247 Chats', '94% Resolved', '500 Credits'].map((label) => (
                    <div key={label} className="rounded-lg border border-border bg-card p-3">
                      <div className="h-2 w-12 bg-muted rounded mb-2 animate-pulse" />
                      <div className="text-sm font-semibold">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-border bg-card p-4 h-40">
                  <div className="h-2 w-20 bg-muted rounded mb-4 animate-pulse" />
                  <div className="flex items-end gap-2 h-24">
                    {[60, 80, 45, 90, 70, 95, 65].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm bg-primary/20" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Everything you need to automate support</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">From AI training to widget deployment, AgentDesk handles the entire support stack.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-8 hover:border-primary/40 hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Simple, honest pricing</h2>
            <p className="text-muted-foreground text-lg">Start free. Upgrade when you're ready.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free */}
            <div className="rounded-2xl border border-border bg-card p-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Free</h3>
                <p className="text-muted-foreground text-sm">Perfect to get started</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['1 AI Agent', '500 AI Credits/month', 'Chat Widget Embed', 'Basic Analytics', 'Community Support'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full rounded-full">Get started free</Button>
              </Link>
            </div>

            {/* Premium */}
            <div className="rounded-2xl border-2 border-primary bg-card p-8 relative shadow-lg shadow-primary/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full">MOST POPULAR</span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Premium</h3>
                <p className="text-muted-foreground text-sm">For growing businesses</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold">$29</span>
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['5 AI Agents', '20,000 AI Credits/month', 'Domain Verification', 'Priority Support', 'Credit Top-ups Available', 'Custom Widget Branding'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full rounded-full bg-primary hover:bg-primary/90 text-white shadow-md">
                  Start free, upgrade anytime
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Loved by support teams</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
            Ready to automate your support?
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Join hundreds of businesses using AgentDesk to resolve tickets faster.
          </p>
          <Link href="/register">
            <Button size="lg" className="h-14 px-12 text-base rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 hover:scale-105 transition-all">
              Start for free — no credit card needed
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">AgentDesk</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} AgentDesk. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
