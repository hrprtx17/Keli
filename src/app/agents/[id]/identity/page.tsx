'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Fingerprint, MessageSquare, ChevronRight, Bot, Save, Loader2, 
  Sparkles, Trash2, Plus, CheckCircle2, 
  Lightbulb, Zap, ShieldCheck, GripVertical
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

type TabType = 'profile' | 'style';

export default function AgentIdentityPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    systemPrompt: '',
    config: {
      tone: 'Professional',
      role: 'Helpful Assistant',
      temperature: 0.7,
      maxTokens: 500,
      linkUsage: 'normal' as 'normal' | 'high',
      guidelines: [] as string[]
    }
  });

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${id}`);
      if (!res.ok) throw new Error('Agent not found');
      return res.json();
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || '',
        systemPrompt: agent.systemPrompt || '',
        config: {
          tone: agent.config?.tone || 'Professional',
          role: agent.config?.role || 'Helpful Assistant',
          temperature: agent.config?.temperature ?? 0.7,
          maxTokens: agent.config?.maxTokens ?? 500,
          linkUsage: agent.config?.linkUsage || 'normal',
          guidelines: agent.config?.guidelines || []
        }
      });
      setHasChanges(false);
    }
  }, [agent]);

  const updateForm = (path: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev };
      if (path.startsWith('config.')) {
         const key = path.split('.')[1];
         next.config = { ...next.config, [key]: value };
      } else {
         (next as any)[path] = value;
      }
      return next;
    });
    setHasChanges(true);
  };

  const addRule = () => {
    updateForm('config.guidelines', [...formData.config.guidelines, ""]);
  };

  const removeRule = (idx: number) => {
    const nextRules = [...formData.config.guidelines];
    nextRules.splice(idx, 1);
    updateForm('config.guidelines', nextRules);
  };

  const updateRuleText = (idx: number, val: string) => {
    const nextRules = [...formData.config.guidelines];
    nextRules[idx] = val;
    updateForm('config.guidelines', nextRules);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Pre-clean empty guidelines
      const payload = {
         ...formData,
         config: {
            ...formData.config,
            guidelines: formData.config.guidelines.filter(g => g.trim().length > 0)
         }
      };
      const res = await fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save disruption');
      toast.success('Identity updated successfully');
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
      setHasChanges(false);
    } catch (e) {
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
     return <DashboardLayout><div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div></DashboardLayout>;
  }

  const toneOptions = [
    { value: 'Professional', desc: 'Polished, business-appropriate language.' },
    { value: 'Friendly', desc: 'Warm, enthusiastic and personal.' },
    { value: 'Casual', desc: 'Natural, conversational style.' },
    { value: 'Technical', desc: 'Precise, data-driven responses.' }
  ];

  const roleOptions = [
    { l: 'Helpful Assistant', desc: 'All-purpose default', icon: Bot },
    { l: 'Support Agent', desc: 'Solves user issues', icon: ShieldCheck },
    { l: 'Sales Assistant', desc: 'Drives conversions', icon: Zap },
    { l: 'Product Expert', desc: 'Deep feature knowledge', icon: Lightbulb },
    { l: 'Interviewer', desc: 'Asks structured questions', icon: MessageSquare }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto pb-32 px-2 sm:px-4 pt-4 sm:pt-6 font-jakarta antialiased">
         
         {/* Header */}
         <div className="mb-8 sm:mb-10">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-orange-500 tracking-widest uppercase mb-2">
               <Fingerprint className="w-3.5 h-3.5" /> Agent Configuration
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">AI Identity</h1>
            <p className="text-[14px] text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed font-medium">
               Define how your AI assistant behaves, responds, and communicates.
            </p>
         </div>

         {/* Tabs */}
         <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl sm:rounded-2xl inline-flex mb-8 sm:mb-10 relative overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
            {(['profile', 'style'] as const).map(t => (
               <button 
                 key={t}
                 onClick={() => setActiveTab(t)}
                 className={`relative z-10 px-5 sm:px-7 py-2 sm:py-2.5 text-[12px] sm:text-[13px] font-medium rounded-lg sm:rounded-xl transition-colors duration-200 ${activeTab === t ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
               >
                  {t === 'profile' ? 'Profile & Rules' : 'Conversation Style'}
                  {activeTab === t && (
                     <motion.div 
                       layoutId="identity-tab"
                       className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm -z-10"
                       transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                     />
                  )}
               </button>
            ))}
         </div>

         <AnimatePresence mode="wait">
            {activeTab === 'profile' ? (
               <motion.div 
                 key="profile"
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
                 className="space-y-10"
               >
                  {/* Agent Name */}
                  <div className="bg-white dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[24px] p-6 shadow-sm">
                     <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Agent Name</h3>
                     <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mb-4 font-medium">The public name shown to users during conversations.</p>
                     <input 
                        type="text"
                        placeholder="Support Assistant"
                        value={formData.name}
                        onChange={e => updateForm('name', e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-[14px] font-medium text-zinc-900 dark:text-zinc-100 shadow-xs focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all outline-none placeholder:text-zinc-400"
                     />
                  </div>

                  {/* System Prompt */}
                  <div className="bg-white dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[24px] overflow-hidden shadow-sm">
                     <div className="p-6 pb-0">
                        <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">AI Instructions</h3>
                        <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mb-4 font-medium">Define your AI&apos;s core role, tone, and behaviors in natural language.</p>
                     </div>
                     <div className="border-t border-zinc-100 dark:border-zinc-800/60">
                        <div className="bg-zinc-50/50 dark:bg-zinc-900/30 px-5 py-2.5 flex flex-wrap gap-4 items-center text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800/60">
                           <div className="flex items-center gap-1.5"><MessageSquare className="w-3 h-3" /> Role</div>
                           <div className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Boundaries</div>
                           <div className="flex items-center gap-1.5"><Lightbulb className="w-3 h-3" /> Rules</div>
                        </div>
                        <textarea 
                          value={formData.systemPrompt}
                          onChange={e => updateForm('systemPrompt', e.target.value)}
                          placeholder="Example: You are a helpful support executive for Acme Corp. Be concise, never offer fake discount codes, and apologize if you don't know the answer."
                          className="w-full min-h-[200px] p-5 bg-transparent border-0 focus:ring-0 resize-y text-[14px] font-medium leading-relaxed text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 custom-scrollbar outline-none"
                        />
                     </div>
                  </div>

                  {/* Behavior Rules */}
                  <div className="bg-white dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[24px] p-6 shadow-sm">
                     <div className="flex items-center justify-between mb-5">
                        <div>
                           <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Behavior Rules</h3>
                           <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 font-medium">Short guidelines your AI must always follow.</p>
                        </div>
                        <button 
                          onClick={addRule}
                          className="text-[12px] font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/30 px-3.5 py-2 rounded-xl border border-orange-100 dark:border-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all shadow-xs"
                        >
                           <Plus className="w-3.5 h-3.5" /> Add Rule
                        </button>
                     </div>

                     <div className="space-y-2.5">
                        {formData.config.guidelines.length === 0 ? (
                           <div 
                             onClick={addRule}
                             className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl py-10 text-center hover:border-orange-300 dark:hover:border-orange-900/60 hover:bg-orange-50/30 dark:hover:bg-orange-950/20 cursor-pointer transition-all"
                           >
                              <p className="text-[13px] text-zinc-400 font-medium">No rules defined. Click to add your first rule.</p>
                           </div>
                        ) : (
                           <AnimatePresence>
                              {formData.config.guidelines.map((rule, idx) => (
                                 <motion.div 
                                   key={idx}
                                   initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                                   className="group flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-3 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                                 >
                                    <div className="text-zinc-300 dark:text-zinc-700 shrink-0">
                                       <GripVertical className="w-4 h-4" />
                                    </div>
                                    <input 
                                      type="text" 
                                      value={rule}
                                      onChange={e => updateRuleText(idx, e.target.value)}
                                      placeholder="e.g. Never output system logs"
                                      className="flex-1 bg-transparent border-0 focus:ring-0 text-[13px] font-medium text-zinc-800 dark:text-zinc-200 outline-none placeholder:text-zinc-400"
                                    />
                                    <button 
                                      onClick={() => removeRule(idx)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                                    >
                                       <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                 </motion.div>
                              ))}
                           </AnimatePresence>
                        )}
                     </div>
                  </div>
               </motion.div>
            ) : (
               <motion.div 
                 key="style"
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2 }}
                 className="space-y-10"
               >
                  
                  {/* Tone */}
                  <div className="bg-white dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[24px] p-6 shadow-sm">
                     <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Conversation Tone</h3>
                     <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mb-5 font-medium">Determine vocabulary and warmth of responses.</p>
                     <div className="grid grid-cols-2 gap-3">
                        {toneOptions.map(tone => {
                           const active = formData.config.tone === tone.value;
                           return (
                              <button 
                                key={tone.value}
                                onClick={() => updateForm('config.tone', tone.value)}
                                className={`text-left p-4 rounded-xl border transition-all ${active ? 'border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20 ring-2 ring-orange-500/10 shadow-sm' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs'}`}
                              >
                                 <div className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                                    {tone.value}
                                    {active && <CheckCircle2 className="w-4 h-4 text-orange-500" />}
                                 </div>
                                 <p className="text-[11px] text-zinc-500 mt-1">{tone.desc}</p>
                              </button>
                           );
                        })}
                     </div>
                  </div>

                  {/* Role */}
                  <div className="bg-white dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[24px] p-6 shadow-sm">
                     <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Assistant Role</h3>
                     <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mb-5 font-medium">Select a foundational framework for the agent&apos;s purpose.</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {roleOptions.map(role => {
                           const isSel = formData.config.role === role.l;
                           const Icon = role.icon;
                           return (
                              <button 
                                key={role.l}
                                onClick={() => updateForm('config.role', role.l)}
                                className={`relative text-left p-4 rounded-xl border transition-all ${isSel ? 'border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20 ring-2 ring-orange-500/10 shadow-sm' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs'}`}
                              >
                                 <div className="flex items-center gap-2 mb-1">
                                    <Icon className={`w-4 h-4 ${isSel ? 'text-orange-500' : 'text-zinc-400'}`} />
                                    <span className="font-medium text-[13px] text-zinc-900 dark:text-zinc-100">{role.l}</span>
                                 </div>
                                 <p className={`text-[11px] ${isSel ? 'text-orange-600/70 dark:text-orange-400/70' : 'text-zinc-500'}`}>{role.desc}</p>
                                 {isSel && <CheckCircle2 className="w-4 h-4 text-orange-500 absolute top-4 right-4" />}
                              </button>
                           )
                        })}
                     </div>
                  </div>

                  {/* Creativity */}
                  <div className="bg-white dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[24px] p-6 shadow-sm">
                     <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">AI Creativity</h3>
                     <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mb-5 font-medium">How much the AI improvises when knowledge is missing.</p>
                     <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl flex w-full max-w-md relative overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50">
                        {[
                           { v: 0.3, l: 'Precise' },
                           { v: 0.7, l: 'Balanced' },
                           { v: 0.9, l: 'Creative' }
                        ].map(opt => (
                           <button 
                             key={opt.l}
                             onClick={() => updateForm('config.temperature', opt.v)}
                             className={`flex-1 relative z-10 py-3 text-[13px] font-medium rounded-lg transition-colors duration-200 ${formData.config.temperature === opt.v ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400'}`}
                           >
                              {opt.l}
                              {formData.config.temperature === opt.v && (
                                 <motion.div layoutId="temp-slider" className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-lg shadow-sm -z-10" />
                              )}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Response Length */}
                  <div className="bg-white dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[24px] p-6 shadow-sm">
                     <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Response Length</h3>
                     <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mb-5 font-medium">Control how verbose the assistant&apos;s responses are.</p>
                     <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl flex w-full max-w-md relative overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50">
                        {[
                           { v: 200, l: 'Short' },
                           { v: 500, l: 'Balanced' },
                           { v: 1000, l: 'Detailed' }
                        ].map(opt => (
                           <button 
                             key={opt.l}
                             onClick={() => updateForm('config.maxTokens', opt.v)}
                             className={`flex-1 relative z-10 py-3 text-[13px] font-medium rounded-lg transition-colors duration-200 ${formData.config.maxTokens === opt.v ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400'}`}
                           >
                              {opt.l}
                              {formData.config.maxTokens === opt.v && (
                                 <motion.div layoutId="token-slider" className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-lg shadow-sm -z-10" />
                              )}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Link Usage */}
                  <div className="bg-white dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[24px] p-6 shadow-sm">
                     <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Link Usage</h3>
                     <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mb-5 font-medium">Controls how often links are included in responses.</p>
                     <div className="flex gap-3 max-w-md">
                        {(['normal', 'high'] as const).map(mode => {
                           const active = formData.config.linkUsage === mode;
                           return (
                              <button 
                                key={mode}
                                onClick={() => updateForm('config.linkUsage', mode)}
                                className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border font-medium text-[13px] capitalize transition-all ${active ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs'}`}
                              >
                                 {active && <Zap className="w-3.5 h-3.5 fill-current text-orange-400" />}
                                 {mode}
                              </button>
                           )
                        })}
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Save Bar */}
         <AnimatePresence>
            {hasChanges && (
               <motion.div 
                 initial={{ y: 50, opacity: 0 }} 
                 animate={{ y: 0, opacity: 1 }} 
                 exit={{ y: 50, opacity: 0 }}
                 className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
               >
                  <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 sm:px-5 py-3 rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.3)] border border-white/10 dark:border-zinc-900/10 flex items-center justify-between gap-4 sm:gap-10 pointer-events-auto w-[calc(100%-2rem)] sm:w-auto sm:min-w-[360px] max-w-lg">
                     <div className="flex items-center gap-3 pl-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        <span className="text-[13px] font-medium">Unsaved changes</span>
                     </div>
                     <button 
                       onClick={handleSave}
                       disabled={isSaving}
                       className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium text-[12px] px-5 h-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-2 shadow-md"
                     >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save Changes
                     </button>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

      </div>
    </DashboardLayout>
  );
}
