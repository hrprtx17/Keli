'use client';
import { useState, useEffect, Suspense } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { signOut } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Save, RefreshCw, Trash2, AlertTriangle, 
  Building, Info, Link as LinkIcon, X, ShieldAlert, Bot,
  Sun, Moon, Laptop
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

function SettingsPageContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agentId');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const { data: agent, isLoading: isLoadingAgent } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
       const res = await fetch(`/api/agents/${agentId}`);
       return res.json();
    },
    enabled: !!agentId
  });

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace'],
    queryFn: async () => {
      const res = await fetch('/api/workspace');
      return res.json();
    }
  });

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    notificationEmail: '',
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (workspace) {
      setFormData(prev => ({
        ...prev,
        name: workspace.name || '',
        slug: workspace.slug || '',
      }));
      setHasChanges(false);
    }
  }, [workspace]);

  useEffect(() => {
    if (agent) {
      setFormData(prev => ({
        ...prev,
        notificationEmail: agent.notificationEmail || '',
      }));
    }
  }, [agent]);

  const handleChange = (key: string, val: string) => {
     setFormData(p => ({ ...p, [key]: val }));
     setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name })
      });
      if (!res.ok) throw new Error('Save failed');

      if (agentId) {
        const resAgent = await fetch(`/api/agents/${agentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationEmail: formData.notificationEmail })
        });
        if (!resAgent.ok) throw new Error('Agent save failed');
        queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      }

      toast.success('Workspace preferences synced successfully.');
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
      setHasChanges(false);
    } catch (err) {
      toast.error('Connection failure: Check parameters and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!agentId) return;
    if (deleteConfirm !== agent?.name) {
       toast.error('Verification failed: Input text does not match agent identity.');
       return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Deletion sequence aborted');
      toast.success('AI Agent has been decommissioned successfully.');
      setShowDeleteModal(false);
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setTimeout(() => router.replace('/dashboard'), 500);
    } catch (err) {
      toast.error('Failed to delete agent entity.');
      setIsDeleting(false);
    }
  };

  if (isLoading) return <DashboardLayout><div className="p-12 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto pb-32 relative">
         
         {/* Header */}
         <div className="mb-10">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-orange-600 tracking-wider uppercase mb-2">
               WORKSPACE
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">Settings</h1>
            <p className="text-[14px] text-gray-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
               Manage your workspace preferences and account configuration.
            </p>
         </div>

         {/* Main Settings Flow */}
         <div className="space-y-8">
            
            {/* Card 1: Workspace Profile */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[24px] shadow-sm overflow-hidden"
            >
               <div className="p-6 sm:p-8">
                  <h2 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100 mb-6">Workspace Profile</h2>
                  
                  <div className="space-y-6">
                     <div>
                        <label className="text-[13px] font-medium text-gray-600 dark:text-zinc-400 block mb-2">Workspace Name</label>
                        <input 
                          type="text"
                          value={formData.name}
                          onChange={e => handleChange('name', e.target.value)}
                          placeholder="Acme Inc"
                          className="w-full bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl text-[14px] text-gray-900 dark:text-zinc-100 focus:border-orange-400 focus:ring-[3px] focus:ring-orange-500/10 outline-none transition-all shadow-sm placeholder:text-gray-300 dark:placeholder:text-zinc-700"
                        />
                     </div>

                     <div>
                        <label className="text-[13px] font-medium text-gray-600 dark:text-zinc-400 block mb-2">Workspace ID (Permanent)</label>
                        <div className="flex items-center bg-gray-50 dark:bg-zinc-950/50 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 group cursor-not-allowed">
                           <span className="text-[14px] font-mono text-gray-400 dark:text-zinc-600 select-none">agentdesk.ai/ws/</span>
                           <input 
                             disabled
                             type="text"
                             value={formData.slug}
                             className="flex-1 bg-transparent border-0 p-0 text-[14px] font-mono text-gray-400 dark:text-zinc-600 focus:ring-0 cursor-not-allowed"
                           />
                        </div>
                        <div className="mt-3 flex items-start gap-2.5 text-gray-500 dark:text-zinc-500 px-1">
                           <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-600" />
                           <p className="text-[12px] leading-relaxed">Your workspace URL identifier is unique and fixed. Used for public AI pages and secure widget handshakes.</p>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>

            {/* Card 1.5: Ticket Notification (only if agentId present) */}
            {agentId && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}
                 className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[24px] shadow-sm overflow-hidden"
               >
                  <div className="p-6 sm:p-8">
                     <h2 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
                        <Bot className="w-4 h-4 text-orange-500" />
                        Agent Support Escalation ({agent?.name})
                     </h2>
                     <p className="text-[13px] text-gray-500 dark:text-zinc-400 mb-6">
                        Configure where visitor escalation support tickets are sent.
                     </p>
                     
                     <div className="space-y-6">
                        <div>
                           <label className="text-[13px] font-medium text-gray-600 dark:text-zinc-400 block mb-2">Ticket notification email</label>
                           <input 
                             type="email"
                             value={formData.notificationEmail}
                             onChange={e => handleChange('notificationEmail', e.target.value)}
                             placeholder="support@yourcompany.com"
                             className="w-full bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 px-4 py-2.5 rounded-xl text-[14px] text-gray-900 dark:text-zinc-100 focus:border-orange-400 focus:ring-[3px] focus:ring-orange-500/10 outline-none transition-all shadow-sm placeholder:text-gray-300 dark:placeholder:text-zinc-700"
                           />
                           <div className="mt-3 flex items-start gap-2.5 text-gray-500 dark:text-zinc-500 px-1">
                              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-600" />
                              <p className="text-[12px] leading-relaxed">Where we send alerts when a visitor creates a support ticket. Free tier emails are delivered immediately via Resend.</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </motion.div>
            )}

            {/* Card 2: Appearance & Theme */}
            {mounted && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                 className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[24px] shadow-sm overflow-hidden"
               >
                  <div className="p-6 sm:p-8">
                     <h2 className="text-[16px] font-semibold text-gray-900 dark:text-zinc-100 mb-2">Appearance & Theme</h2>
                     <p className="text-[13px] text-gray-500 dark:text-zinc-400 mb-6">Customize your interface background and visual preference.</p>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                           { id: 'light', label: 'Light Mode', icon: Sun, desc: 'Clean and crisp interface' },
                           { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Easy on the eyes at night' },
                           { id: 'system', label: 'System', icon: Laptop, desc: 'Follow computer settings' },
                        ].map((opt) => {
                           const Icon = opt.icon;
                           const isActive = theme === opt.id;
                           return (
                              <button
                                key={opt.id}
                                onClick={() => setTheme(opt.id)}
                                className={`group relative flex flex-col items-start text-left p-4 rounded-2xl border-2 transition-all cursor-pointer active:scale-[0.98] ${
                                  isActive 
                                    ? 'border-orange-500 bg-orange-50/30 dark:bg-orange-500/5 text-orange-600 dark:text-orange-400 ring-4 ring-orange-500/10' 
                                    : 'border-gray-100 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-950/30 hover:border-gray-300 dark:hover:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:shadow-sm'
                                }`}
                              >
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all group-hover:scale-105 duration-300 ${
                                    isActive ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'
                                 }`}>
                                    <Icon className="w-5 h-5" />
                                 </div>
                                 <div className="font-bold text-[14px] mb-1 leading-none">{opt.label}</div>
                                 <div className="text-[11px] text-gray-500 dark:text-zinc-500 font-medium">{opt.desc}</div>
                              </button>
                           )
                        })}
                     </div>
                  </div>
               </motion.div>
            )}

            {/* Danger Zone for Current Agent */}
            {agentId && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                 className="bg-red-50/30 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 rounded-[24px] p-6 sm:p-8"
               >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                     <div>
                        <h3 className="text-[16px] font-semibold text-red-900 dark:text-red-400 flex items-center gap-2">
                           <ShieldAlert className="w-4 h-4" /> Danger Zone
                        </h3>
                        <p className="text-[13px] text-red-700/70 dark:text-red-400/60 mt-1 leading-relaxed max-w-md">
                           Irrevocably dismantle the <span className="font-bold text-red-800 dark:text-red-300">{agent?.name || 'active'}</span> AI agent. All knowledge weights and interaction logs will be erased.
                        </p>
                     </div>
                     <button 
                       disabled={!agent}
                       onClick={() => setShowDeleteModal(true)}
                       className="px-6 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-950/20 text-[13px] font-semibold transition-all shrink-0 hover:shadow-sm active:scale-95 disabled:opacity-50"
                     >
                        Delete Agent
                     </button>
                  </div>
               </motion.div>
            )}

         </div>

         {/* Sticky Action Bar */}
         <AnimatePresence>
            {hasChanges && (
               <motion.div 
                 initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                 className="fixed bottom-8 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
               >
                  <div className="bg-black text-white px-5 py-3 rounded-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)] border border-white/10 flex items-center justify-between gap-8 pointer-events-auto w-full max-w-lg">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        <span className="text-[13px] font-medium text-gray-200">Unsaved modifications</span>
                     </div>
                     <div className="flex gap-2">
                        <button 
                          onClick={() => { setFormData({ name: workspace.name, slug: workspace.slug }); setHasChanges(false); }}
                          className="text-[12px] font-medium text-gray-400 hover:text-white px-3 py-1.5 transition-colors"
                        >
                           Revert
                        </button>
                        <button 
                          onClick={handleSave}
                          disabled={isSaving}
                          className="bg-white text-black font-semibold text-[12px] px-4 h-9 rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2 shadow-md"
                        >
                           {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                           Save Changes
                        </button>
                     </div>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>

          {/* Customized Destruction Modal */}
          <AnimatePresence>
             {showDeleteModal && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                >
                   <motion.div 
                     initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                     className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[24px] shadow-2xl w-full max-w-md p-6 overflow-hidden"
                   >
                      <div className="flex items-center justify-between mb-6">
                         <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-5 h-5" />
                         </div>
                         <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 transition-colors">
                            <X className="w-5 h-5" />
                         </button>
                      </div>
                      <h3 className="text-[18px] font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">Terminate Active Agent</h3>
                      <p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-2 leading-relaxed">
                         This operation is final. You are about to permanently retire the <span className="font-bold text-gray-900 dark:text-zinc-200">{agent?.name}</span> entity. Memory contexts and configured settings cannot be recovered.
                      </p>

                      <div className="mt-6 bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl p-4">
                         <p className="text-[12px] font-medium text-gray-600 dark:text-zinc-400 mb-3">Type <span className="font-mono bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 px-1.5 py-0.5 rounded text-[11px]">{agent?.name}</span> to verify:</p>
                         <input 
                           type="text" 
                           value={deleteConfirm}
                           onChange={e => setDeleteConfirm(e.target.value)}
                           className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-800 dark:text-zinc-100 focus:border-red-400 focus:ring-2 focus:ring-red-100/10 transition-all outline-none"
                           placeholder="Enter agent name to proceed"
                         />
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-8">
                         <button 
                           onClick={() => { setShowDeleteModal(false); setDeleteConfirm(''); }}
                           className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl py-2.5 text-[13px] font-semibold text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                         >
                            Cancel
                         </button>
                         <button 
                           disabled={deleteConfirm !== agent?.name || isDeleting}
                           onClick={handleDelete}
                           className="bg-red-600 text-white rounded-xl py-2.5 text-[13px] font-semibold hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                         >
                            {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Confirm Destruct
                         </button>
                      </div>
                   </motion.div>
                </motion.div>
             )}
          </AnimatePresence>

      </div>
    </DashboardLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="p-12 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin text-gray-400" /></div></DashboardLayout>}>
      <SettingsPageContent />
    </Suspense>
  );
}
