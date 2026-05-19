'use client';
import { useState, Suspense } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X, ChevronRight, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Desktop sidebar (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Suspense fallback={<div className="w-[240px] bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl" />}>
          <Sidebar />
        </Suspense>
      </div>

      {/* Mobile sidebar backdrop overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar sliding drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 flex transition duration-300 transform lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Suspense fallback={<div className="w-[240px] bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl" />}>
          <Sidebar onNavClick={() => setSidebarOpen(false)} />
        </Suspense>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Enhanced Mobile Sticky Header */}
        <header className="flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md px-4 lg:hidden sticky top-0 z-30">
          <button
            type="button"
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors focus:outline-none"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="font-semibold text-[15px] tracking-tight font-heading">Keli AI</div>
          <div className="w-5" />
        </header>

        {/* Upscaled content area with maximized breathing room */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none p-4 sm:p-8 md:p-10 lg:p-12 xl:p-14 bg-[#fafafa] dark:bg-zinc-950">
          <div className="mx-auto max-w-[1400px] min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
