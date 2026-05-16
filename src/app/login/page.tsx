'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false
    });
    setLoading(false);
    if (res?.error) {
      setError('Invalid email or password. Please try again.');
    } else {
      router.push('/agents');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex bg-[#F8F8F8] dark:bg-zinc-950 text-[#1A1A1A] dark:text-zinc-100 antialiased selection:bg-orange-100 selection:text-orange-700 overflow-hidden">
      
      {/* Background Components */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" 
          style={{ backgroundImage: `radial-gradient(var(--foreground, #000) 1px, transparent 1px)`, backgroundSize: '24px 24px' }} 
        />
      </div>

      {/* Left Form Side */}
      <div className="flex w-full md:w-[45%] lg:w-[40%] items-center justify-center p-6 sm:p-8 relative z-10 bg-white dark:bg-zinc-900 shadow-2xl shadow-black/[0.02] border-r border-gray-100 dark:border-zinc-800">
        <div className="w-full max-w-md space-y-8">
          
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
               <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                 <div className="w-2.5 h-2.5 bg-white rounded-sm rotate-45 shadow-sm" />
               </div>
            </div>
            <span className="font-semibold text-lg tracking-tight text-black dark:text-zinc-100">AgentDesk</span>
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 leading-[1.1]">Welcome back</h1>
            <p className="mt-2 text-sm font-medium text-gray-500 dark:text-zinc-400">
              Sign in to manage your custom AI agents
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/30 px-4 py-3 text-[13px] font-medium text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2 duration-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[12px] font-semibold tracking-wide uppercase text-gray-500 dark:text-zinc-400">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@agentdesk.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-950/50 border-gray-200 dark:border-zinc-800 px-4 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:ring-[3px] focus:ring-orange-500/10 transition-all outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[12px] font-semibold tracking-wide uppercase text-gray-500 dark:text-zinc-400">Password</Label>
                  <Link href="#" title="Coming soon" className="text-[11px] font-bold text-orange-600 hover:text-orange-700 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-950/50 border-gray-200 dark:border-zinc-800 px-4 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:ring-[3px] focus:ring-orange-500/10 transition-all outline-none"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 min-h-[44px] rounded-xl bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white hover:shadow-md font-semibold text-[14px] transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : 'Sign In'}
            </Button>
            
            <div className="relative my-4 flex items-center gap-4 text-xs text-gray-400 font-medium uppercase tracking-wider">
              <div className="flex-1 border-t border-gray-100 dark:border-zinc-800" />
              <span>Or</span>
              <div className="flex-1 border-t border-gray-100 dark:border-zinc-800" />
            </div>

            {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true' && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 min-h-[44px] rounded-xl border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-2 text-[14px] font-semibold transition-all shadow-sm active:scale-[0.99] dark:text-zinc-200"
                onClick={() => signIn('google', { callbackUrl: '/agents' })}
              >
                <svg className="h-4 w-4" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            )}
          </form>

          <p className="text-center text-[13px] font-medium text-gray-500 dark:text-zinc-400">
            Don't have an account?{' '}
            <Link href="/register" className="text-orange-600 hover:text-orange-700 hover:underline transition-colors min-h-[44px] inline-flex items-center">
              Create one for free
            </Link>
          </p>

        </div>
      </div>

      {/* Right Display Side */}
      <div className="hidden md:flex md:flex-1 flex-col justify-center items-center p-12 text-center relative z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-transparent to-transparent opacity-60" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/[0.04] dark:bg-orange-500/[0.08] rounded-full blur-[120px]" />
        
        <div className="max-w-lg space-y-8 relative">
          <div className="inline-flex items-center justify-center rounded-[24px] bg-white dark:bg-zinc-900 p-5 shadow-xl shadow-black/[0.02] border border-gray-100 dark:border-zinc-800 mx-auto">
            <div className="w-16 h-16 rounded-[18px] bg-black flex items-center justify-center text-white text-3xl shadow-lg shadow-orange-500/20 overflow-hidden">
               <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                 <div className="w-5 h-5 bg-white rounded rotate-45 shadow-sm" />
               </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-[32px] lg:text-[40px] font-bold tracking-tight text-gray-900 dark:text-zinc-100 leading-[1.15]">
              The AI support platform that works while you sleep.
            </h2>
            <p className="text-[15px] font-medium text-gray-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Automate responses, index your knowledge base, and deploy enterprise chatbots in minutes.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-4 text-left">
            {[
              { val: '24/7', label: 'Autonomous' },
              { val: '< 1s', label: 'Inference Speed' },
              { val: '100%', label: 'Data Secure' }
            ].map(s => (
              <div key={s.label} className="rounded-[16px] border border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-[16px] font-bold text-orange-600 tracking-tight">{s.val}</div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-1 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
