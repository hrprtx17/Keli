'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TicketsLegacyPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/tickets');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-pulse text-zinc-400 text-sm font-semibold">
        Syncing support desk...
      </div>
    </div>
  );
}
