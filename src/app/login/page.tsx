'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      alert('Invalid credentials');
    } else {
      router.push('/agents');
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left Form */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your AgentDesk account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@agentdesk.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => signIn('google')}
            >
              Google
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>

          <div className="mt-8 rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Demo Credentials:</p>
            <p>Email: admin@agentdesk.ai</p>
            <p>Password: admin123</p>
          </div>
        </div>
      </div>

      {/* Right Gradient */}
      <div className="hidden md:flex w-1/2 flex-col justify-center items-center bg-gradient-to-br from-primary/20 via-background to-background border-l border-border p-12 text-center">
        <div className="max-w-lg space-y-6">
          <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-3xl">
              A
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            The AI support platform that works while you sleep.
          </h1>
          <p className="text-lg text-muted-foreground">
            Automate customer service, resolve tickets faster, and boost satisfaction with intelligent AI agents.
          </p>
        </div>
      </div>
    </div>
  );
}
