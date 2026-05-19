'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2, Zap, Shield, Clock } from 'lucide-react';
import { KeliAiLogo } from '@/components/Logo';

const GoogleIcon = () => (
  <svg className="h-[18px] w-[18px] flex-shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError('Invalid email or password. Please try again.');
    else router.push('/agents');
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/agents' });
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F7F7F7] dark:bg-zinc-950 antialiased overflow-hidden">
      {/* Dot grid */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(#000 1px,transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Form Panel */}
      <div className="flex w-full md:w-[46%] lg:w-[42%] min-h-screen items-center justify-center px-6 sm:px-10 relative z-10 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800">
        <div className="w-full max-w-[380px] space-y-6">
          <KeliAiLogo size="md" />

          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-gray-900 dark:text-zinc-100 leading-tight">Welcome back</h1>
            <p className="mt-1 text-[14px] text-gray-500 dark:text-zinc-400 font-medium">Sign in to manage your AI agents</p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-[13px] font-medium text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Email/Password form first */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[11px] font-bold tracking-widest uppercase text-gray-500 dark:text-zinc-400">Email</Label>
                <Input id="email" type="email" placeholder="you@company.com" value={email}
                  onChange={e => setEmail(e.target.value)} required autoFocus
                  className="h-11 rounded-xl bg-gray-50 dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 px-4 text-[14px] focus:ring-[3px] focus:ring-orange-500/10 focus:border-orange-300 transition-all outline-none" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[11px] font-bold tracking-widest uppercase text-gray-500 dark:text-zinc-400">Password</Label>
                  <Link href="#" className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 transition-colors">Forgot?</Link>
                </div>
                <Input id="password" type="password" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required
                  className="h-11 rounded-xl bg-gray-50 dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 px-4 text-[14px] focus:ring-[3px] focus:ring-orange-500/10 focus:border-orange-300 transition-all outline-none" />
              </div>
            </div>

            <Button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 font-semibold text-[14px] transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : 'Sign In'}
            </Button>
          </form>

          {/* Divider — Google comes AFTER email form */}
          <div className="flex items-center gap-3 text-[11px] text-gray-400 font-semibold uppercase tracking-widest">
            <div className="flex-1 border-t border-gray-100 dark:border-zinc-800" />
            <span>or</span>
            <div className="flex-1 border-t border-gray-100 dark:border-zinc-800" />
          </div>

          <button type="button" onClick={handleGoogle} disabled={googleLoading}
            className="w-full h-11 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center justify-center gap-3 text-[14px] font-semibold text-gray-700 dark:text-zinc-200 transition-all shadow-sm active:scale-[0.99] disabled:opacity-60">
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          <p className="text-center text-[13px] font-medium text-gray-500 dark:text-zinc-400">
            No account?{' '}
            <Link href="/register" className="text-orange-600 hover:text-orange-700 font-semibold hover:underline transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>

      {/* Right visual panel */}
      <div className="hidden md:flex md:flex-1 flex-col justify-center items-center px-12 py-16 relative z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 to-transparent dark:from-orange-950/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/[0.06] rounded-full blur-[140px]" />
        <div className="max-w-md space-y-8 relative">
          <div className="inline-flex rounded-[28px] bg-white dark:bg-zinc-900 p-6 shadow-2xl shadow-black/5 border border-gray-100 dark:border-zinc-800">
            <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <div className="w-5 h-5 bg-white rounded rotate-45" />
            </div>
          </div>
          <div>
            <h2 className="text-[34px] font-bold tracking-tight text-gray-900 dark:text-zinc-100 leading-[1.15]">
              The AI support platform that works while you sleep.
            </h2>
            <p className="mt-3 text-[15px] text-gray-500 dark:text-zinc-400 font-medium leading-relaxed">
              Deploy intelligent AI agents and delight customers 24/7.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[{ icon: Clock, v: '< 1s', l: 'Response' }, { icon: Zap, v: '24/7', l: 'Uptime' }, { icon: Shield, v: '100%', l: 'Secure' }].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.l} className="rounded-[16px] border border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
                  <Icon className="w-4 h-4 text-orange-500 mb-2" />
                  <div className="text-[15px] font-bold text-gray-900 dark:text-zinc-100">{s.v}</div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{s.l}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
