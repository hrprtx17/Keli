'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Fingerprint, MessageSquare, ChevronRight, Bot, Save, Loader2, 
  Sparkles, LayoutGrid, GripVertical, Trash2, Plus, CheckCircle2, 
  MessageCircle, Lightbulb, Zap, ShieldCheck
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
      toast.success('Identity metrics successfully updated');
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
      setHasChanges(false);
    } catch (e) {
      toast.error('Transmission halted. Failed to commit config.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
     return <DashboardLayout><div className="p-8 flex items-center justify-center h-64"><Loader2 className="animate-spin text-orange-500" /></div></DashboardLayout>;
  }

  const toneHelpers: Record<string, string> = {
     Professional: "Uses respectful, polished business syntax. Strictly informative.",
     Friendly: "Warm and enthusiastic, builds personal connections via soft tone.",
     Casual: "Natural conversational style. Less rigid and highly approachable.",
     Technical: "Direct, verbose data exchange. High engineering precision."
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto pb-32 relative">
         
         {/* Header */}
         <div className="mb-10">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-orange-600 tracking-wider uppercase mb-2">
               AI CONFIGURATION
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">AI Identity</h1>
            <p className="text-[14px] text-gray-500 dark:text-zinc-400 mt-2 leading-relaxed">
               Customize how your AI assistant behaves, responds, and communicates with users.
            </p>
         </div>

         {/* Segmented Control Tabs */}
         <div className="bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl inline-flex mb-10 relative overflow-hidden">
            {(['profile', 'style'] as const).map(t => (
               <button 
                 key={t}
                 onClick={() => setActiveTab(t)}
                 className={`relative z-10 px-6 py-2 text-[13px] font-medium rounded-lg transition-colors duration-300 capitalize ${activeTab === t ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}
               >
                  {t === 'profile' ? 'Profile' : 'Conversation Style'}
                  {activeTab === t && (
                     <motion.div 
                       layoutId="active-tab-bg"
                       className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-lg shadow-sm -z-10"
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
                 className="space-y-12"
               >
                  {/* Section 1: Agent Name */}
                  <div className="space-y-4">
                     <div>
                        <h3 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">AI Agent Name</h3>
                        <p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1">The public name shown to users during conversations.</p>
                     </div>
                     <input 
                        type="text"
                        placeholder="Support Assistant"
                        value={formData.name}
                        onChange={e => updateForm('name', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-[14px] text-gray-900 dark:text-zinc-100 shadow-sm focus:ring-[3px] focus:ring-orange-500/10 focus:border-orange-500/60 transition-all outline-none placeholder:text-gray-300 dark:placeholder:text-zinc-700"
                     />
                  </div>

                  {/* Section 2: Instructions */}
                  <div className="space-y-4">
                     <div>
                        <h3 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">AI Instructions</h3>
                        <p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1">Define your AI's core role, tone, and behaviors.</p>
                     </div>
                     
                     <div className="border border-gray-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-zinc-950 transition-all group focus-within:border-orange-300 dark:focus-within:border-orange-500/50 focus-within:ring-[3px] focus-within:ring-orange-500/10">
                        <div className="bg-gray-50/80 dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 px-4 py-2.5 flex flex-wrap gap-4 items-center text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                           <div className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Role</div>
                           <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Boundaries</div>
                           <div className="flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5" /> Rules</div>
                        </div>
                        <textarea 
                          value={formData.systemPrompt}
                          onChange={e => updateForm('systemPrompt', e.target.value)}
                          placeholder="Example: You are a helpful support executive for Acme Corp. Be concise, never offer fake discount codes, and apologize if you don't know the answer."
                          className="w-full min-h-[240px] p-4 bg-transparent border-0 focus:ring-0 resize-y text-[14px] font-medium leading-relaxed text-gray-800 dark:text-zinc-200 placeholder:text-gray-300 dark:placeholder:text-zinc-700 custom-scrollbar outline-none"
                        />
                     </div>
                  </div>

                  {/* Section 3: Behavior Rules */}
                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <div>
                           <h3 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">Behavior Rules</h3>
                           <p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1">Add short guidelines your AI should always enforce.</p>
                        </div>
                        <button 
                          onClick={addRule}
                          className="text-[13px] font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center gap-1.5 transition-colors bg-orange-50 dark:bg-orange-950/30 px-3 py-1.5 rounded-lg border border-orange-100 dark:border-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/40"
                        >
                           <Plus className="w-3.5 h-3.5" /> Add Rule
                        </button>
                     </div>

                     <div className="space-y-3">
                        {formData.config.guidelines.length === 0 ? (
                           <div 
                             onClick={addRule}
                             className="border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl py-8 text-center hover:border-orange-300 dark:hover:border-orange-900/60 hover:bg-orange-50/30 dark:hover:bg-orange-950/20 cursor-pointer transition-colors"
                           >
                              <p className="text-[13px] text-gray-400 dark:text-zinc-500 font-medium">No special behavior rules yet. Click to add.</p>
                           </div>
                        ) : (
                           <AnimatePresence>
                              {formData.config.guidelines.map((rule, idx) => (
                                 <motion.div 
                                   key={idx}
                                   initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                                   className="group flex items-center gap-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-2.5 rounded-xl shadow-sm hover:border-gray-300 dark:hover:border-zinc-700 transition-all"
                                 >
                                    <div className="text-gray-300 dark:text-zinc-700 group-hover:text-gray-400 dark:group-hover:text-zinc-600 cursor-grab shrink-0 px-1">
                                       <GripVertical className="w-4 h-4" />
                                    </div>
                                    <input 
                                      type="text" 
                                      value={rule}
                                      onChange={e => updateRuleText(idx, e.target.value)}
                                      placeholder="e.g. Never output system logs"
                                      className="flex-1 bg-transparent border-0 focus:ring-0 text-[13px] font-medium text-gray-800 dark:text-zinc-200 outline-none placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                                    />
                                    <button 
                                      onClick={() => removeRule(idx)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
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
                 className="space-y-12"
               >
                  
                  {/* Tone Dropdown */}
                  <div className="space-y-4">
                     <div>
                        <h3 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">Conversation Tone</h3>
                        <p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1">Determine the vocabulary and warmth of responses.</p>
                     </div>
                     <div className="relative">
                        <select 
                          value={formData.config.tone}
                          onChange={e => updateForm('config.tone', e.target.value)}
                          className="w-full appearance-none bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-sm rounded-xl px-4 py-3 pr-10 text-[14px] font-medium text-gray-800 dark:text-zinc-200 focus:border-orange-400 dark:focus:border-orange-500/60 focus:ring-[3px] focus:ring-orange-500/10 outline-none cursor-pointer transition-all"
                        >
                           {Object.keys(toneHelpers).map(tone => (
                              <option key={tone} value={tone} className="dark:bg-zinc-900">{tone}</option>
                           ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                           <ChevronRight className="w-4 h-4 rotate-90" />
                        </div>
                     </div>
                     <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-lg px-4 py-2.5 text-[12px] text-gray-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                        <InfoCircle /> {toneHelpers[formData.config.tone] || toneHelpers.Professional}
                     </div>
                  </div>

                  {/* Roles Card Stack */}
                  <div className="space-y-4">
                     <div>
                        <h3 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">Assistant Role</h3>
                        <p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1">Select a foundational framework for how the agent models its purpose.</p>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                           { l: 'Helpful Assistant', desc: 'All-purpose default' },
                           { l: 'Support Agent', desc: 'Solves user issues' },
                           { l: 'Sales Assistant', desc: 'Drives action/lead gen' },
                           { l: 'Product Expert', desc: 'Deep feature breakdown' },
                           { l: 'Interviewer', desc: 'Asks structured Qs' }
                        ].map(role => {
                           const isSel = formData.config.role === role.l;
                           return (
                              <button 
                                key={role.l}
                                onClick={() => updateForm('config.role', role.l)}
                                className={`relative text-left p-4 rounded-xl border transition-all ${isSel ? 'border-orange-400 dark:border-orange-500/50 bg-orange-50/40 dark:bg-orange-950/20 ring-[3px] ring-orange-500/10 shadow-sm' : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm'}`}
                              >
                                 <div className="font-semibold text-[13px] text-gray-900 dark:text-zinc-100 flex justify-between items-center">
                                    {role.l}
                                    {isSel && <motion.div layoutId="check-role"><CheckCircle2 className="w-4 h-4 text-orange-500 dark:text-orange-400" /></motion.div>}
                                 </div>
                                 <p className={`text-[11px] mt-1 ${isSel ? 'text-orange-700/70 dark:text-orange-400/70' : 'text-gray-500 dark:text-zinc-400'}`}>{role.desc}</p>
                              </button>
                           )
                        })}
                     </div>
                  </div>

                  {/* Creativity Segmented Control */}
                  <div className="space-y-4">
                     <div>
                        <h3 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">AI Creativity</h3>
                        <p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1">Controls how much the AI improvises when knowledge is missing.</p>
                     </div>
                     <div className="bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl flex w-full max-w-md relative overflow-hidden">
                        {[
                           { v: 0.3, l: 'Low' },
                           { v: 0.7, l: 'Normal' },
                           { v: 0.9, l: 'High' }
                        ].map(opt => (
                           <button 
                             key={opt.l}
                             onClick={() => updateForm('config.temperature', opt.v)}
                             className={`flex-1 relative z-10 py-2.5 text-[13px] font-semibold rounded-lg transition-colors duration-300 ${formData.config.temperature === opt.v ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-500 dark:text-zinc-400'}`}
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
                  <div className="space-y-4">
                     <div>
                        <h3 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">Response Length</h3>
                        <p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1">Max output limit to control verbosity.</p>
                     </div>
                     <div className="bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl flex w-full max-w-md relative overflow-hidden">
                        {[
                           { v: 200, l: 'Short' },
                           { v: 500, l: 'Balanced' },
                           { v: 1000, l: 'Detailed' }
                        ].map(opt => (
                           <button 
                             key={opt.l}
                             onClick={() => updateForm('config.maxTokens', opt.v)}
                             className={`flex-1 relative z-10 py-2.5 text-[13px] font-semibold rounded-lg transition-colors duration-300 ${formData.config.maxTokens === opt.v ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-500 dark:text-zinc-400'}`}
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
                  <div className="space-y-4">
                     <div>
                        <h3 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100">Link Usage</h3>
                        <p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1">Controls how often links are included in responses.</p>
                     </div>
                     <div className="flex gap-4">
                        {(['normal', 'high'] as const).map(mode => {
                           const active = formData.config.linkUsage === mode;
                           return (
                              <button 
                                key={mode}
                                onClick={() => updateForm('config.linkUsage', mode)}
                                className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border font-semibold text-[13px] capitalize transition-all ${active ? 'border-gray-900 dark:border-zinc-100 bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md' : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-700 shadow-sm'}`}
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

         {/* Sticky Floating Save Experience */}
         <AnimatePresence>
            {hasChanges && (
               <motion.div 
                 initial={{ y: 50, opacity: 0 }} 
                 animate={{ y: 0, opacity: 1 }} 
                 exit={{ y: 50, opacity: 0 }}
                 className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
               >
                  <div className="bg-[#1A1A1A] text-white px-4 py-3 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between gap-12 pointer-events-auto min-w-[360px] max-w-lg overflow-hidden">
                     <div className="flex items-center gap-3 pl-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                        <span className="text-[13px] font-medium text-zinc-100">Unsaved configuration changes</span>
                     </div>
                     <button 
                       onClick={handleSave}
                       disabled={isSaving}
                       className="bg-white text-black font-semibold text-[12px] px-4 h-9 rounded-lg hover:bg-zinc-100 transition-all active:scale-95 flex items-center gap-2"
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

function InfoCircle() {
   return (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
   )
}
