'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Loader2, Sparkles, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { AgentDeskLogo } from '@/components/Logo';

const SUGGESTIONS = [
  'Support Assistant',
  'Sales Helper',
  'Customer Care Bot',
  'Help Desk AI',
  'Product Guide',
];

const CREATING_STEPS = [
  'Setting up your agent...',
  'Configuring AI settings...',
  'Almost ready!',
];

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [agentName, setAgentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingStep, setCreatingStep] = useState(0);
  const [done, setDone] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);

  const parsedGreeting = session?.user?.name?.split(' ')[0] || 'there';

  const handleCreate = async () => {
    if (!agentName.trim()) return;
    setLoading(true);

    // Animated step ticker
    let stepIdx = 0;
    const tick = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, CREATING_STEPS.length - 1);
      setCreatingStep(stepIdx);
    }, 600);

    try {
      // Create workspace if needed
      let wId: string | null = null;
      try {
        const wr = await fetch('/api/workspace');
        const wd = await wr.json();
        if (wd && wd._id) wId = wd._id;
      } catch {}

      if (!wId) {
        const slug = `${agentName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-4)}`;
        const wr = await fetch('/api/workspace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `${agentName} Workspace`, slug }),
        });
        const wd = await wr.json();
        wId = wd._id || wd.id;
      }

      // Create agent
      const ar = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName.trim(),
          workspaceId: wId,
          systemPrompt: `You are ${agentName}, an AI assistant. Answer questions helpfully and concisely.`,
          description: `AI agent created during onboarding`,
          isActive: true,
        }),
      });
      const ad = await ar.json();
      if (!ar.ok) throw new Error(ad.error || 'Failed to create agent');

      clearInterval(tick);
      setAgentId(ad._id);
      setCreatingStep(CREATING_STEPS.length - 1);
      setDone(true);
      setLoading(false);

      // Auto-navigate after 1.2s
      setTimeout(() => {
        router.push(`/agents/${ad._id}`);
      }, 1200);
    } catch (e: any) {
      clearInterval(tick);
      setLoading(false);
      setCreatingStep(0);
      toast.error(e.message || 'Something went wrong');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#F8F8F8] dark:bg-zinc-950 text-[#1A1A1A] dark:text-zinc-100 antialiased selection:bg-orange-100 selection:text-orange-700 px-4">

      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '28px 28px' }}
        />
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.4, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/[0.07] rounded-full blur-[160px]"
        />
      </div>

      {/* Logo top-left */}
      <div className="fixed top-6 left-8 z-20">
        <AgentDeskLogo size="md" />
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[440px]"
      >
        <AnimatePresence mode="wait">
          {!loading && !done ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-[28px] p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)]"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25 mb-6">
                <Sparkles className="w-5 h-5 text-white" />
              </div>

              {/* Heading */}
              <h1 className="text-[26px] font-bold tracking-tight text-gray-900 dark:text-zinc-100 leading-tight mb-1">
                Hey {parsedGreeting} 👋
              </h1>
              <p className="text-[14px] text-gray-500 dark:text-zinc-400 font-medium mb-7">
                Give your AI agent a name to get started.
              </p>

              {/* Input */}
              <div className="relative group mb-4">
                <Bot className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
                <input
                  type="text"
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && agentName.trim() && handleCreate()}
                  placeholder="e.g. Support Assistant"
                  autoFocus
                  className="w-full h-[54px] pl-11 pr-4 rounded-[16px] bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 outline-none text-[15px] font-medium text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600 focus:border-orange-300 focus:ring-[3px] focus:ring-orange-500/10 transition-all"
                />
              </div>

              {/* Suggestion pills */}
              <div className="flex flex-wrap gap-2 mb-7">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setAgentName(s)}
                    className={`px-3 py-1.5 rounded-full border text-[12px] font-semibold transition-all ${
                      agentName === s
                        ? 'border-orange-400 bg-orange-50 text-orange-600'
                        : 'border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleCreate}
                disabled={!agentName.trim()}
                className="w-full h-[52px] bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[16px] font-semibold text-[15px] flex items-center justify-center gap-2 transition-all hover:-translate-y-[1px] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.2)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                Create My Agent
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ) : done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-[28px] p-10 shadow-[0_8px_40px_rgba(0,0,0,0.06)] flex flex-col items-center text-center gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center border border-emerald-200 dark:border-emerald-900"
              >
                <Check className="w-7 h-7 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
              </motion.div>
              <div>
                <h2 className="text-[22px] font-bold text-gray-900 dark:text-zinc-100 tracking-tight">
                  {agentName} is ready! 🎉
                </h2>
                <p className="text-[14px] text-gray-500 dark:text-zinc-400 font-medium mt-1">
                  Opening your dashboard...
                </p>
              </div>
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mt-2" />
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-[28px] p-10 shadow-[0_8px_40px_rgba(0,0,0,0.06)] flex flex-col items-center text-center gap-6"
            >
              {/* Animated logo */}
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-xl shadow-orange-500/30"
              >
                <div className="w-6 h-6 bg-white rounded rotate-45" />
              </motion.div>

              {/* Steps checklist */}
              <div className="space-y-3 w-full max-w-[260px]">
                {CREATING_STEPS.map((step, idx) => {
                  const isDone = idx < creatingStep;
                  const isActive = idx === creatingStep;
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {isDone ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
                            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          </div>
                        ) : isActive ? (
                          <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-zinc-700" />
                        )}
                      </div>
                      <span className={`text-[13px] font-medium transition-colors ${
                        isDone ? 'text-gray-500 line-through' : isActive ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-300 dark:text-zinc-600'
                      }`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
