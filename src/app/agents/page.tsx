'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function RedirectToWorkspace() {
  const router = useRouter();
  
  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      if (!res.ok) return [];
      return res.json();
    }
  });

  useEffect(() => {
    if (!isLoading && agents) {
      if (agents.length > 0) {
        router.replace(`/agents/${agents[0]._id}`);
      } else {
        router.replace('/onboarding');
      }
    }
  }, [agents, isLoading, router]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAFA]">
      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
    </div>
  );
}
