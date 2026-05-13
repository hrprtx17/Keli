'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Bot, Loader2, Globe, Zap, Sparkles, ArrowRight, 
  MessageSquare, Check, Server, Layers, HelpCircle, FileText 
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const PREFS = [
  { id: 'web', label: 'Website Chat', icon: Globe },
  { id: 'page', label: 'Chat Page', icon: MessageSquare },
  { id: 'slack', label: 'Slack', icon: Sparkles },
  { id: 'shop', label: 'Shopify', icon: Layers },
  { id: 'wa', label: 'WhatsApp', icon: Zap },
  { id: 'mess', label: 'Messenger', icon: MessageSquare },
  { id: 'discord', label: 'Discord', icon: Bot },
  { id: 'email', label: 'Email', icon: Server }
];

const FEED_MESSAGES = [
  "Found pricing page",
  "Reading support documentation",
  "Preparing chatbot replies",
  "Analyzing FAQ content",
  "Optimizing query retrieval",
  "Validating agent persona"
];

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Inputs
  const [agentName, setAgentName] = useState('');
  const [website, setWebsite] = useState('');

  // Handlers
  const [persistedWsId, setPersistedWsId] = useState<string | null>(null);
  const [persistedAgentId, setPersistedAgentId] = useState<string | null>(null);

  // Live Training States
  const [currentStage, setCurrentStage] = useState('DISCOVERY'); // DISCOVERY, READING, TRAINING, FINISHING
  const [trainingComplete, setTrainingComplete] = useState(false);
  const [activeFeedIndex, setActiveFeedIndex] = useState(0);

  // Prefs
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(['web']);



  useEffect(() => {
     const fetchScope = async () => {
        try {
           const r = await fetch('/api/workspace');
           const d = await r.json();
           if (d && d._id) setPersistedWsId(d._id);
        } catch(e){}
     };
     fetchScope();
  }, []);

  // Feed rotation
  useEffect(() => {
     let int: any;
     if (step === 2 && !trainingComplete) {
        int = setInterval(() => {
           setActiveFeedIndex(p => (p + 1) % FEED_MESSAGES.length);
        }, 2800);
     }
     return () => clearInterval(int);
  }, [step, trainingComplete]);

  const beginDeployment = async () => {
    if (!agentName || !website) return;
    setLoading(true);

    try {
       let wId = persistedWsId;
       if (!wId) {
          const fallbackSlug = `${agentName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-3)}`;
          const wr = await fetch('/api/workspace', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ name: `${agentName} Organization`, slug: fallbackSlug })
          });
          const wd = await wr.json();
          if (!wr.ok) throw new Error(wd.error || 'Workspace initialization lock failure.');
          wId = wd._id || wd.id;
          setPersistedWsId(wId);
       }

       const ar = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             name: agentName,
             workspaceId: wId,
             systemPrompt: `You are an AI for ${agentName}. Base answers on website data with brevity.`,
             description: `Assigned node for ${website}`
          })
       });
       const ad = await ar.json();
       if (!ar.ok) throw new Error(ad.error || 'Core Agent fabrication failed.');
       setPersistedAgentId(ad._id);

       setLoading(false);
       setStep(2);
       runTrainingPipeline(ad._id);
    } catch (e: any) {
       setLoading(false);
       toast.error(e.message);
    }
  };

  const runTrainingPipeline = async (aId: string) => {
     setCurrentStage('DISCOVERY');
     const timeout = setTimeout(() => {
        if (!trainingComplete) {
           setTrainingComplete(true);
           setCurrentStage('FINISHING');
        }
     }, 8000); // Aggressive 8s cap to eliminate perceived "stuck" loading states completely

     try {
        const response = await fetch('/api/datasources/crawl', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ agentId: aId, url: website.startsWith('http') ? website : `https://${website}` })
        });

        if (!response.ok || !response.body) throw new Error('Pipeline disconnect');
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
           const { done, value } = await reader.read();
           if (done) break;
           const raw = decoder.decode(value);
           const lines = raw.split('\n').filter(b => b.trim().length > 0);
           for (let chunk of lines) {
              try {
                 const cleaned = chunk.replace(/^data:\s*/i, '').trim(); 
                 const packet = JSON.parse(cleaned);
                 const stg = packet.stage || '';
                 if (stg === 'Crawling' || stg === 'Extracting') setCurrentStage('READING');
                 if (stg === 'Chunking' || stg === 'Embedding') setCurrentStage('TRAINING');
                 if (stg === 'Completed' || stg === 'Failed') {
                    setCurrentStage('FINISHING');
                    setTrainingComplete(true);
                    clearTimeout(timeout);
                    return;
                 }
              } catch(e) {}
           }
        }
        setTrainingComplete(true);
        setCurrentStage('FINISHING');
        clearTimeout(timeout);
     } catch (e) {
        setTrainingComplete(true);
        setCurrentStage('FINISHING');
        clearTimeout(timeout);
     }
  };

  const finalize = () => {
     router.push(`/agents/${persistedAgentId}`);
  };

  const parsedGreeting = session?.user?.name?.split(' ')[0] || 'Friend';
  const hostname = website.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Fast high-end spring animations
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.02,
      }
    },
    exit: { 
      opacity: 0, 
      y: -8,
      transition: { duration: 0.15, ease: "easeInOut" } 
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12, scale: 0.985 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 350,
        damping: 28
      } 
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#F8F8F8] dark:bg-zinc-950 text-[#1A1A1A] dark:text-zinc-100 font-sans overflow-x-hidden selection:bg-orange-100 selection:text-orange-700">
      
      {/* PREMIUM BACKGROUND COMPONENTS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" 
          style={{ backgroundImage: `radial-gradient(var(--foreground, #000) 1px, transparent 1px)`, backgroundSize: '24px 24px' }} 
        />
        <div className="absolute inset-0 opacity-[0.015] bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F5F5F5] dark:via-zinc-900 to-[#EBEBEB] dark:to-black opacity-40" />
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.45, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-orange-500/[0.06] rounded-full blur-[100px] md:blur-[140px]" 
        />
      </div>

      {/* 1. TOP NAVBAR */}
      <nav className="sticky top-0 z-50 h-[64px] md:h-[72px] w-full flex items-center justify-between px-4 md:px-12 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-lg border-b border-gray-200/50 dark:border-zinc-800/50 transition-all">
        <div className="flex items-center gap-3 group cursor-default">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-black flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
             <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-600 opacity-90 flex items-center justify-center">
               <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-white rounded-sm rotate-45 shadow-sm" />
             </div>
          </div>
          <span className="font-semibold text-lg md:text-xl tracking-tight text-black dark:text-zinc-100">AgentDesk</span>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6 text-[13px] md:text-[14px] font-medium text-gray-500 dark:text-zinc-400">
          <Link href="#" className="hover:text-black dark:hover:text-zinc-100 flex items-center gap-1 transition-colors duration-200">
             <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-70" /> <span className="hidden sm:inline">Docs</span>
          </Link>
          <Link href="#" className="hover:text-black dark:hover:text-zinc-100 flex items-center gap-1 transition-colors duration-200">
             <HelpCircle className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-70" /> <span className="hidden sm:inline">Help</span>
          </Link>
        </div>
      </nav>

      {/* 2. MAIN CONTENT */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 md:py-12 md:pb-28">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: HERO & SETUP */}
          {step === 1 && (
            <motion.div 
              key="setup"
              variants={containerVariants} initial="hidden" animate="visible" exit="exit"
              className="flex flex-col items-center w-full"
            >
              {/* Hero Section */}
              <motion.div variants={itemVariants} className="text-center max-w-[560px] mb-8 md:mb-12 flex flex-col items-center px-2">
                <h1 className="text-[34px] sm:text-[44px] md:text-[52px] font-semibold leading-[1.1] tracking-[-0.04em] text-black dark:text-zinc-100 mb-3 md:mb-4">
                  Welcome, {parsedGreeting}
                </h1>
                <p className="text-[15px] sm:text-[17px] font-medium text-gray-500 dark:text-zinc-400 leading-relaxed max-w-[480px]">
                  Train your AI agent using your website. 
                  <span className="block text-gray-400 dark:text-zinc-500 font-normal text-[14px] sm:text-[15px] mt-1">Your AI can answer questions and learn from content.</span>
                </p>
              </motion.div>

              {/* Onboarding Card */}
              <motion.div variants={itemVariants} className="w-full max-w-[460px] bg-white/82 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-200/70 dark:border-zinc-800/70 rounded-[24px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04),0_20px_60px_-15px_rgba(0,0,0,0.02)] flex flex-col gap-5 sm:gap-6 relative">
                
                {/* Card Header */}
                <motion.div variants={itemVariants}>
                   <div className="text-[10px] sm:text-[11px] font-medium tracking-[0.12em] text-orange-600 uppercase mb-1">Setup</div>
                   <div className="text-[12px] sm:text-[13px] text-gray-500 dark:text-zinc-400">Create your first AI assistant.</div>
                </motion.div>

                {/* Inputs */}
                <div className="space-y-3 sm:space-y-4">
                  <motion.div variants={itemVariants} className="relative group">
                    <Bot className="absolute left-[16px] sm:left-[18px] top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-focus-within:text-orange-500 transition-colors" />
                    <input 
                      type="text"
                      value={agentName}
                      onChange={e => setAgentName(e.target.value)}
                      placeholder="Support Assistant"
                      className="w-full h-[52px] sm:h-[56px] pl-11 sm:pl-12 pr-4 rounded-[14px] bg-[#FCFCFC] dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 outline-none text-[15px] text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:border-orange-300 focus:ring-[3px] ring-orange-500/10"
                      autoFocus
                    />
                  </motion.div>
                  <motion.div variants={itemVariants} className="relative group">
                    <Globe className="absolute left-[16px] sm:left-[18px] top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-focus-within:text-orange-500 transition-colors" />
                    <input 
                      type="text"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      placeholder="yourcompany.com"
                      className="w-full h-[52px] sm:h-[56px] pl-11 sm:pl-12 pr-4 rounded-[14px] bg-[#FCFCFC] dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 outline-none text-[15px] text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all focus:border-orange-300 focus:ring-[3px] ring-orange-500/10"
                    />
                  </motion.div>
                </div>

                {/* Button */}
                <motion.button 
                  variants={itemVariants}
                  whileTap={{ scale: 0.98 }}
                  onClick={beginDeployment}
                  disabled={!agentName || !website || loading}
                  className="group relative w-full h-[50px] sm:h-[54px] bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[16px] font-semibold text-[15px] flex items-center justify-center overflow-hidden transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_25px_-6px_rgba(249,115,22,0.25)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {loading ? (
                    <div className="flex items-center gap-2 opacity-90">
                       <Loader2 className="w-4 h-4 animate-spin" /> Preparing AI...
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      Start Training <ArrowRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 2: TRAINING SCREEN */}
          {step === 2 && (
            <motion.div 
              key="training"
              variants={containerVariants} initial="hidden" animate="visible" exit="exit"
              className="w-full max-w-[520px]"
            >
              <motion.div variants={itemVariants} className="bg-white/82 dark:bg-zinc-900/80 backdrop-blur-xl border border-gray-200/70 dark:border-zinc-800/70 rounded-[24px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
                
                {/* Top Section */}
                <motion.div variants={itemVariants} className="flex items-center gap-3 sm:gap-4 pb-5 sm:pb-6 mb-5 sm:mb-6 border-b border-gray-100 dark:border-zinc-800">
                   <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
                      {website ? (
                         <img 
                           src={`https://www.google.com/s2/favicons?sz=64&domain=${website}`} 
                           alt="favicon" 
                           className="w-6 h-6 sm:w-7 sm:h-7"
                           onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2"%3E%3Ccircle cx="12" cy="12" r="10"%3E%3C/circle%3E%3C/svg%3E'; }}
                         />
                      ) : <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />}
                   </div>
                   <div>
                      <h2 className="text-[17px] sm:text-[19px] font-semibold text-black dark:text-zinc-100 tracking-tight">Training your AI</h2>
                      <p className="text-[12px] sm:text-[13px] text-gray-500 dark:text-zinc-400 font-medium truncate max-w-[200px] sm:max-w-none">{trainingComplete ? 'Ready for interaction' : 'Preparing replies.'}</p>
                   </div>
                </motion.div>

                {/* Training States Checklist */}
                <div className="space-y-3 sm:space-y-3.5 py-1 sm:py-2">
                   {[
                      { label: 'Website connected', status: 'done' },
                      { label: 'Pages discovered', status: currentStage !== 'DISCOVERY' || trainingComplete ? 'done' : 'active' },
                      { label: 'Reading website pages', status: trainingComplete ? 'done' : currentStage === 'READING' ? 'active' : currentStage === 'TRAINING' || currentStage === 'FINISHING' ? 'done' : 'pending' },
                      { label: 'Training your AI', status: trainingComplete ? 'done' : currentStage === 'TRAINING' ? 'active' : currentStage === 'FINISHING' ? 'done' : 'pending' },
                      { label: 'Preparing replies', status: trainingComplete ? 'done' : currentStage === 'FINISHING' ? 'active' : 'pending' }
                   ].map((item, idx) => {
                      return (
                        <motion.div variants={itemVariants} key={idx} className="flex items-center gap-3">
                          <div className="w-5 h-5 flex items-center justify-center">
                             {item.status === 'done' && <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center"><Check className="w-3 h-3 text-green-600 stroke-[3]" /></div>}
                             {item.status === 'active' && <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />}
                             {item.status === 'pending' && <div className="w-2 h-2 rounded-full bg-gray-200" />}
                          </div>
                          <span className={`text-[13px] sm:text-[14px] font-medium transition-colors duration-300 ${item.status === 'done' ? 'text-gray-800 dark:text-zinc-200' : item.status === 'active' ? 'text-black dark:text-zinc-100' : 'text-gray-400 dark:text-zinc-500'}`}>
                             {item.label}
                          </span>
                        </motion.div>
                      )
                   })}
                </div>

                {/* Live Activity Feed */}
                <motion.div variants={itemVariants} className="mt-6 sm:mt-8 pt-4 border-t border-gray-50 dark:border-zinc-800 overflow-hidden h-8 flex items-center">
                   <AnimatePresence mode="wait">
                      <motion.div 
                        key={activeFeedIndex + (trainingComplete ? 'c' : 'a')}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.7, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.35 }}
                        className="text-[11px] sm:text-[12px] font-mono text-gray-600 dark:text-zinc-400 flex items-center gap-2"
                      >
                         <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block animate-pulse" />
                         {trainingComplete ? 'All operations finalized.' : FEED_MESSAGES[activeFeedIndex]}
                      </motion.div>
                   </AnimatePresence>
                </motion.div>

                <AnimatePresence>
                   {trainingComplete && (
                      <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 20 }} className="overflow-hidden">
                         <motion.button 
                           variants={itemVariants}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => setStep(3)} 
                           className="w-full h-[48px] sm:h-[52px] bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[16px] font-semibold text-[15px] flex items-center justify-center gap-1 hover:-translate-y-[2px] hover:shadow-md transition-all duration-200"
                         >
                           Continue Setup <ArrowRight className="w-4 h-4 ml-1"/>
                         </motion.button>
                      </motion.div>
                   )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 3: READY OVERVIEW */}
          {step === 3 && (
            <motion.div 
              key="ready-overview"
              variants={containerVariants} initial="hidden" animate="visible" exit="exit"
              className="w-full max-w-[520px]"
            >
              <motion.div variants={itemVariants} className="bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800/70 rounded-[24px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
                
                <motion.div variants={itemVariants} className="mb-5 sm:mb-6">
                  <h2 className="text-[20px] sm:text-[22px] font-semibold text-black dark:text-zinc-100 leading-tight">Your AI Agent is ready to preview!</h2>
                  <p className="text-[13px] sm:text-[14px] text-gray-500 dark:text-zinc-400 mt-1">Click Next to continue</p>
                </motion.div>

                <motion.div variants={itemVariants} className="flex items-center gap-2 text-[13px] sm:text-[14px] text-gray-500 dark:text-zinc-400 font-medium mb-5 sm:mb-6">
                  <Globe className="w-3.5 h-3.5 opacity-70" />
                  <span className="truncate">{agentName || 'AI Agent'} | Modern AI Support Platform</span>
                </motion.div>

                {/* Static Message Component */}
                <motion.div variants={itemVariants} className="border border-gray-100 dark:border-zinc-800 rounded-[16px] overflow-hidden mb-6 sm:mb-8 bg-white dark:bg-zinc-950 shadow-sm">
                   <div className="bg-[#0C111D] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2">
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                         <div className="w-0 h-0 border-l-[2.5px] sm:border-l-[3px] border-l-transparent border-r-[2.5px] sm:border-r-[3px] border-r-transparent border-b-[4px] sm:border-b-[5px] border-b-[#0C111D]" />
                      </div>
                      <span className="text-white text-[11px] sm:text-[12px] font-semibold truncate">{agentName || 'Assistant'} Support</span>
                   </div>
                   <div className="p-3 sm:p-4 text-[12px] sm:text-[13px] text-gray-800 dark:text-zinc-300 leading-relaxed bg-[#FCFCFD] dark:bg-zinc-950">
                      Hi, I&apos;m the {agentName || 'Assistant'} assistant. Ask me about features, setup, or how we help resolve customer inquiries faster.
                   </div>
                </motion.div>

                {/* Summary Details */}
                <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-12">
                   {[
                      { icon: Layers, label: 'Profession: Customer Support' },
                      { icon: Sparkles, label: 'Personality: Professional' },
                      { icon: Globe, label: 'Languages: English' },
                      { icon: FileText, label: '1 page added. Fetching more in the background.' }
                   ].map((line, i) => {
                      const Icon = line.icon;
                      return (
                        <motion.div variants={itemVariants} key={i} className="flex items-start sm:items-center gap-3 text-[13px] sm:text-[14px] text-gray-800 dark:text-zinc-200 font-medium">
                          <div className="w-5 h-5 flex items-center justify-center text-green-600 flex-shrink-0 mt-0.5 sm:mt-0">
                             <Icon className="w-[16px] sm:w-[18px] h-[16px] sm:h-[18px]" />
                          </div>
                          <span className="leading-tight">{line.label}</span>
                        </motion.div>
                      )
                   })}
                </div>

                <motion.div variants={itemVariants} className="flex justify-end">
                   <motion.button 
                     whileTap={{ scale: 0.98 }}
                     onClick={() => setStep(4)}
                     className="h-[40px] sm:h-[42px] px-6 sm:px-8 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-[13px] sm:text-[14px] rounded-full shadow-sm hover:opacity-90 transition-all flex items-center justify-center"
                   >
                      Next
                   </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 4: DEPLOYMENT SCREEN */}
          {step === 4 && (
            <motion.div 
              key="deployment"
              variants={containerVariants} initial="hidden" animate="visible" exit="exit"
              className="w-full max-w-[620px] text-center flex flex-col items-center"
            >
               <motion.div variants={itemVariants} className="mb-8 sm:mb-10">
                  <h1 className="text-[26px] sm:text-[32px] font-semibold text-black dark:text-zinc-100 tracking-tight leading-tight px-4">Where will you use it?</h1>
                  <p className="text-gray-500 dark:text-zinc-400 text-[14px] sm:text-[15px] font-medium mt-2 px-4">Select the channels where you want to deploy.</p>
               </motion.div>

               <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 px-2 sm:px-4 w-full max-w-[500px] sm:max-w-none">
                  {PREFS.map(pref => {
                     const Icon = pref.icon;
                     const isSel = selectedPrefs.includes(pref.id);
                     return (
                        <motion.div 
                          key={pref.id}
                          variants={itemVariants}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setSelectedPrefs(p => p.includes(pref.id) ? p.filter(x => x !== pref.id) : [...p, pref.id])}
                          className={`relative p-3 sm:p-5 aspect-[4/3.2] rounded-[14px] sm:rounded-[18px] border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 group ${
                             isSel 
                              ? 'border-black bg-black shadow-md sm:scale-[1.02]' 
                              : 'border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-850'
                          }`}
                        >
                           <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${isSel ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                           <span className={`text-[12px] sm:text-[13px] font-semibold tracking-tight leading-tight ${isSel ? 'text-white' : 'text-gray-600 dark:text-zinc-300'}`}>{pref.label}</span>
                        </motion.div>
                     )
                  })}
               </motion.div>

               <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10 sm:mt-12 w-full">
                  <motion.button 
                     whileTap={{ scale: 0.97 }}
                     onClick={finalize} 
                     className="w-full sm:w-auto text-[13px] sm:text-[14px] font-semibold text-gray-400 dark:text-zinc-500 hover:text-black dark:hover:text-zinc-200 px-6 py-3 order-2 sm:order-1 transition-colors"
                  >
                     Skip for now
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={finalize}
                    className="w-[80%] sm:w-auto h-[48px] sm:h-[54px] px-8 sm:px-12 bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-[14px] sm:text-[15px] rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:-translate-y-[1px] transition-all flex items-center justify-center gap-1 order-1 sm:order-2"
                  >
                     Finish Setup
                  </motion.button>
               </motion.div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* 3. BOTTOM PROGRESS DOTS */}
        <div className="mt-8 sm:mt-[32px] flex items-center justify-center gap-2">
           {[1, 2, 3, 4].map((dot) => {
              const isActive = step === dot;
              return (
                 <div 
                   key={dot} 
                   className={`h-[5px] sm:h-[6px] rounded-full transition-all duration-300 ease-out ${
                     isActive 
                       ? 'w-[14px] sm:w-[18px] bg-black dark:bg-zinc-100' 
                       : 'w-[5px] sm:w-[6px] bg-gray-300 dark:bg-zinc-700'
                   }`} 
                 />
              )
           })}
        </div>
      </main>
    </div>
  );
}

