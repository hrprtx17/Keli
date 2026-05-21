'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Bot, Globe, MessageSquare } from 'lucide-react';
import { KeliAiLogo } from '@/components/Logo';

const GoogleIcon = () => (
  <svg className="h-[18px] w-[18px] flex-shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return; }
      const signInResult = await signIn('credentials', { email, password, redirect: false });
      if (signInResult?.error) { router.push('/login'); return; }
      router.push('/onboarding');
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/onboarding' });
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F7F7F7] dark:bg-zinc-950 antialiased overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(#000 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Form Panel */}
      <div className="flex w-full md:w-[46%] lg:w-[42%] min-h-screen items-center justify-center px-6 sm:px-10 relative z-10 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 py-10">
        <div className="w-full max-w-[380px] space-y-5">
          <KeliAiLogo size="md" />

          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-gray-900 dark:text-zinc-100 leading-tight">Create your account</h1>
            <p className="mt-1 text-[14px] text-gray-500 dark:text-zinc-400 font-medium">Free forever — no credit card required.</p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-[13px] font-medium text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Email form FIRST */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[11px] font-bold tracking-widest uppercase text-gray-500 dark:text-zinc-400">Full Name</Label>
                <Input id="name" type="text" placeholder="John Doe" value={name}
                  onChange={e => setName(e.target.value)} required autoFocus
                  className="h-11 rounded-xl bg-gray-50 dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 px-4 text-[14px] focus:ring-[3px] focus:ring-orange-500/10 focus:border-orange-300 transition-all outline-none" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[11px] font-bold tracking-widest uppercase text-gray-500 dark:text-zinc-400">Email</Label>
                <Input id="email" type="email" placeholder="you@company.com" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  className="h-11 rounded-xl bg-gray-50 dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 px-4 text-[14px] focus:ring-[3px] focus:ring-orange-500/10 focus:border-orange-300 transition-all outline-none" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[11px] font-bold tracking-widest uppercase text-gray-500 dark:text-zinc-400">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" value={password}
                    onChange={e => setPassword(e.target.value)} required minLength={8}
                    className="h-11 rounded-xl bg-gray-50 dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 pl-4 pr-11 text-[14px] focus:ring-[3px] focus:ring-orange-500/10 focus:border-orange-300 transition-all outline-none" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 font-semibold text-[14px] transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : 'Get Started Free'}
            </Button>
          </form>

          {/* Divider — Google AFTER email */}
          <div className="flex items-center gap-3 text-[11px] text-gray-400 font-semibold uppercase tracking-widest">
            <div className="flex-1 border-t border-gray-100 dark:border-zinc-800" />
            <span>or</span>
            <div className="flex-1 border-t border-gray-100 dark:border-zinc-800" />
          </div>

          <button type="button" onClick={handleGoogle} disabled={googleLoading}
            className="w-full h-11 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center justify-center gap-3 text-[14px] font-semibold text-gray-700 dark:text-zinc-200 transition-all shadow-sm active:scale-[0.99] disabled:opacity-60">
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            Sign up with Google
          </button>

          <p className="text-[11px] text-center text-gray-400 dark:text-zinc-500">
            By continuing you agree to our{' '}
            <Link href="/terms" className="underline hover:text-gray-600 transition-colors">Terms</Link>
            {' & '}
            <Link href="/privacy" className="underline hover:text-gray-600 transition-colors">Privacy</Link>
          </p>

          <p className="text-center text-[13px] font-medium text-gray-500 dark:text-zinc-400">
            Have an account?{' '}
            <Link href="/login" className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right visual */}
      <div className="hidden md:flex md:flex-1 flex-col justify-center items-center px-12 py-16 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 to-transparent dark:from-orange-950/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/[0.06] rounded-full blur-[140px]" />
        <div className="max-w-md space-y-8 relative">
          <div className="inline-flex rounded-[28px] bg-white dark:bg-zinc-900 p-6 shadow-2xl shadow-black/5 border border-gray-100 dark:border-zinc-800">
            <div className="w-14 h-14 rounded-[18px] bg-zinc-950 dark:bg-zinc-100 flex items-center justify-center shadow-lg">
              <span className="font-sans font-black text-2xl text-white dark:text-zinc-950 select-none">K</span>
            </div>
          </div>
          <div>
            <h2 className="text-[34px] font-bold tracking-tight text-gray-900 dark:text-zinc-100 leading-[1.15]">Build your AI agent in minutes.</h2>
            <p className="mt-3 text-[15px] text-gray-500 dark:text-zinc-400 font-medium leading-relaxed">
              Deploy powerful support agents and keep customers happy 24/7.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { icon: Bot, title: 'Custom AI Agents', desc: 'Train on your own content' },
              { icon: Globe, title: 'Deploy Anywhere', desc: 'One script tag, any website' },
              { icon: MessageSquare, title: 'Live Chat Inbox', desc: 'Real-time conversation management' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center gap-3.5 rounded-[16px] border border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
                  <div className="w-9 h-9 rounded-[10px] bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-[18px] h-[18px] text-orange-500" />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-gray-900 dark:text-zinc-100">{item.title}</div>
                    <div className="text-[12px] text-gray-500 dark:text-zinc-400 font-medium mt-0.5">{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
