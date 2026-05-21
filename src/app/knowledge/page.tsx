'use client';
import { useState, useEffect, Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Database, Bot, Trash2, Loader2, Check, ChevronRight, 
  Sparkles, FileText, Edit2, RefreshCcw, BookOpen, Clock
} from 'lucide-react';

function KnowledgePageContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const urlAgentId = searchParams.get('agentId');
  
  const [selectedAgent, setSelectedAgent] = useState<string>(urlAgentId || '');
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  
  const [training, setTraining] = useState(false);
  const [ingestStage, setIngestStage] = useState<string | null>(null);
  const [ingestProgress, setIngestProgress] = useState<{current: number, total: number} | null>(null);

  // Load agents
  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      return res.json();
    }
  });

  // Load data sources for the selected agent
  const { data: dataSources, isLoading: isLoadingData } = useQuery({
    queryKey: ['datasources', selectedAgent],
    queryFn: async () => {
      if (!selectedAgent) return [];
      const res = await fetch(`/api/datasources?agentId=${selectedAgent}`);
      return res.json();
    },
    enabled: !!selectedAgent,
  });

  // Select the first agent automatically if none is selected
  useEffect(() => {
    if (!selectedAgent && agents && agents.length > 0) {
       setSelectedAgent(agents[0]._id);
    }
  }, [agents, selectedAgent]);

  // Handle Training / Syncing custom text
  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) {
      toast.error('Please select an agent first');
      return;
    }
    if (!docTitle.trim()) {
      toast.error('Please enter a title for your knowledge base');
      return;
    }
    if (!docContent.trim() || docContent.trim().length < 10) {
      toast.error('Knowledge content must be at least 10 characters long');
      return;
    }

    setTraining(true);
    setIngestStage('Structuring Text');
    setIngestProgress(null);

    try {
      // If we are editing, we can delete the old source first to avoid double entries
      if (editingSourceId) {
        setIngestStage('Updating Source');
        await fetch(`/api/datasources?id=${editingSourceId}`, { method: 'DELETE' });
      }

      // Convert custom text content to a dynamic .txt file representation
      const file = new File(
        [docContent], 
        `${docTitle.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}.txt`, 
        { type: 'text/plain' }
      );

      const formData = new FormData();
      formData.append('agentId', selectedAgent);
      formData.append('file', file);

      const res = await fetch('/api/datasources', { method: 'POST', body: formData });
      if (!res.ok || !res.body) throw new Error('Failed to connect to training engine');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: isDone } = await reader.read();
        done = isDone;
        if (!value) continue;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const payload = JSON.parse(line);
            const { stage, current, total, error } = payload;

            if (stage === 'Failed') throw new Error(error || 'Training pipeline failed');
            setIngestStage(stage);
            if (current && total) setIngestProgress({ current, total });

            if (stage === 'Completed') {
              toast.success(editingSourceId ? 'Knowledge updated & retrained!' : 'AI trained successfully!');
              queryClient.invalidateQueries({ queryKey: ['datasources', selectedAgent] });
              
              // Reset input form
              setDocTitle('');
              setDocContent('');
              setEditingSourceId(null);
              setIngestStage(null);
              setIngestProgress(null);
            }
          } catch (err: any) { 
            if (err.message.includes('failed')) throw err; 
          }
        }
      }
    } catch (err: any) {
      toast.error(`Training failed: ${err.message}`);
      setIngestStage('Failed');
    } finally {
      setTraining(false);
    }
  };

  // Delete training source
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/datasources?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete source');
      toast.success('Source deleted and removed from AI brain');
      queryClient.invalidateQueries({ queryKey: ['datasources', selectedAgent] });
      
      if (editingSourceId === id) {
        setEditingSourceId(null);
        setDocTitle('');
        setDocContent('');
      }
    } catch (e: any) {
      toast.error('Failed to delete training data.');
    }
  };

  // Load existing source back into editor for quick revision
  const handleEdit = (source: any) => {
    setEditingSourceId(source._id);
    setDocTitle(source.name.replace(/\.txt$/, ''));
    setDocContent(source.content || '');
    toast.info(`Loaded "${source.name}" into editor for updating`);
  };
  const rawAgentName = agents?.find((a: any) => a._id === selectedAgent)?.name || '';
  const activeAgentName = rawAgentName
    ? rawAgentName.trim().split(' ').map((w: string) => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '').join(' ')
    : 'Select Agent';

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pb-24 font-jakarta">
        
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-orange-500 dark:text-orange-400 tracking-wider uppercase mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI BRAIN MANAGEMENT
            </div>
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Training Data</h1>
            <p className="text-[14px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-lg leading-relaxed">
              Write custom business guidelines, FAQs, and scripts to instantly train your agent.
            </p>
          </div>

          {/* Elegant Agent Selection Dropdown */}
          <div className="relative shrink-0 w-full md:w-auto">
            <select 
              value={selectedAgent}
              onChange={(e) => {
                setSelectedAgent(e.target.value);
                setEditingSourceId(null);
                setDocTitle('');
                setDocContent('');
              }}
              className="w-full md:w-auto appearance-none bg-white/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl pl-10 pr-10 py-3 text-[14px] font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all cursor-pointer backdrop-blur-md"
            >
              {!agents?.length && <option className="dark:bg-zinc-900">No agents found</option>}
              {agents?.map((a: any) => (
                <option key={a._id} value={a._id} className="dark:bg-zinc-900">
                  {a.name.trim().split(' ').map((w: string) => w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '').join(' ')}
                </option>
              ))}
            </select>
            <Bot className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
            <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 rotate-90 pointer-events-none" />
          </div>
        </div>

        {!selectedAgent ? (
          <div className="bg-white/40 dark:bg-zinc-900/35 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[28px] p-12 flex flex-col items-center justify-center text-center backdrop-blur-xl shadow-xs">
            <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
            </div>
            <h3 className="text-[16px] font-bold text-zinc-900 dark:text-white">No active agent selected</h3>
            <p className="text-[14px] text-zinc-500 dark:text-zinc-400 mt-1">Create or select an agent to modify its intelligence pool.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: THE PREMIUM WRITER/EDITOR */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white/40 dark:bg-zinc-900/35 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[28px] p-6 backdrop-blur-xl shadow-xs relative overflow-hidden">
                
                {/* Visual Glass highlights */}
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-[16px] font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-orange-500" />
                      {editingSourceId ? 'Modify Knowledge Block' : 'Draft New Knowledge'}
                    </h2>
                    <p className="text-[12.5px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                      Write or copy text directly to teach {activeAgentName}.
                    </p>
                  </div>
                  {editingSourceId && (
                    <button 
                      onClick={() => {
                        setEditingSourceId(null);
                        setDocTitle('');
                        setDocContent('');
                        toast.success('Cleared editing session');
                      }}
                      className="text-[12px] font-bold text-zinc-400 hover:text-red-500 transition-colors px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleTrain} className="space-y-4">
                  {/* Title Box */}
                  <div>
                    <label className="block text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                      Document Title
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Return Policy, Pricing FAQ"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      disabled={training}
                      maxLength={60}
                      className="w-full h-11 px-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 outline-none text-[14px] font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-orange-500/40 focus:ring-4 focus:ring-orange-500/5 dark:focus:ring-orange-500/10 transition-all"
                    />
                  </div>

                  {/* Body Editor Box */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[12px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        Knowledge Content
                      </label>
                      <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-600">
                        {docContent.length} chars
                      </span>
                    </div>
                    <textarea 
                      placeholder="Type or paste the raw knowledge context here. For example:&#10;Q: What is the delivery timeframe?&#10;A: Standard delivery takes 3-5 business days. Express shipping takes 1-2 days."
                      value={docContent}
                      onChange={(e) => setDocContent(e.target.value)}
                      disabled={training}
                      rows={12}
                      className="w-full p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 outline-none text-[14px] font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-orange-500/40 focus:ring-4 focus:ring-orange-500/5 dark:focus:ring-orange-500/10 transition-all resize-none leading-relaxed"
                    />
                  </div>

                  {/* Actions & Dynamic Training Bar */}
                  <div className="pt-2">
                    <AnimatePresence mode="wait">
                      {training ? (
                        <motion.div 
                          key="training-state"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-500/20 rounded-xl p-4 flex flex-col gap-3"
                        >
                          <div className="flex justify-between items-center text-[13px] font-bold">
                            <span className="text-orange-600 dark:text-orange-400 flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {ingestStage || 'Training AI Assistant...'}
                            </span>
                            {ingestProgress && (
                              <span className="text-zinc-500 dark:text-zinc-400">
                                {Math.round((ingestProgress.current / ingestProgress.total) * 100)}%
                              </span>
                            )}
                          </div>
                          
                          {/* Progress Line */}
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden relative">
                            {ingestProgress ? (
                              <motion.div 
                                initial={{ width: '5%' }}
                                animate={{ width: `${(ingestProgress.current / ingestProgress.total) * 100}%` }}
                                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                              />
                            ) : (
                              <div className="h-full w-1/3 bg-orange-500 rounded-full animate-[shimmer_1.5s_infinite]" />
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.button 
                          key="submit-state"
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={!docTitle.trim() || docContent.trim().length < 10}
                          className="w-full h-11 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-white hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
                        >
                          <Database className="w-4 h-4" />
                          {editingSourceId ? 'Update & Train Agent' : 'Train Agent on Text'}
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </form>
              </div>
            </div>

            {/* RIGHT COLUMN: CURRENTLY TRAINED SOURCES */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* STATS OVERVIEW CARD */}
              <div className="bg-zinc-900 dark:bg-zinc-900/40 text-white rounded-[24px] p-5 shadow-md relative overflow-hidden group border border-zinc-800/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/3" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[12px] text-zinc-500 font-bold uppercase tracking-wider">AI Memory State</div>
                    <h3 className="text-[18px] font-bold text-white leading-tight">{activeAgentName}</h3>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Active
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-zinc-800/80">
                  <div>
                    <div className="text-[20px] font-extrabold text-white">
                      {dataSources?.length || 0}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-medium">Drafted Sources</div>
                  </div>
                  <div>
                    <div className="text-[20px] font-extrabold text-white flex items-center gap-0.5">
                      100<span className="text-[14px] text-zinc-500 font-medium">%</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-medium">Accuracy Health</div>
                  </div>
                </div>
              </div>

              {/* LIST CARD */}
              <div className="bg-white/40 dark:bg-zinc-900/35 border border-zinc-200/50 dark:border-zinc-800/60 rounded-[28px] p-5 backdrop-blur-xl shadow-xs">
                <h3 className="text-[14px] font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-500" />
                  Currently Trained Knowledge
                </h3>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {isLoadingData ? (
                    [1, 2].map(i => (
                      <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-900 shrink-0" />
                        <div className="space-y-1.5 w-full">
                          <div className="h-4 bg-zinc-100 dark:bg-zinc-900 rounded w-2/3" />
                          <div className="h-3 bg-zinc-100 dark:bg-zinc-900 rounded w-1/3" />
                        </div>
                      </div>
                    ))
                  ) : !dataSources || dataSources.length === 0 ? (
                    <div className="text-center py-10 px-4 bg-zinc-50/20 dark:bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800/80">
                      <Database className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto mb-2.5" />
                      <p className="text-[13px] font-bold text-zinc-900 dark:text-white">Brain is empty</p>
                      <p className="text-[12px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[200px] mx-auto">
                        Type custom text on the left to start teaching your AI assistant.
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {dataSources.map((source: any) => {
                        const isSelectedForEdit = editingSourceId === source._id;
                        const wordCount = source.content?.split(/\s+/).filter(Boolean).length || 0;
                        
                        return (
                          <motion.div 
                            key={source._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className={`p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all group ${
                              isSelectedForEdit 
                                ? 'bg-orange-500/5 border-orange-500/30' 
                                : 'bg-white dark:bg-zinc-950 border-zinc-200/50 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                                  isSelectedForEdit 
                                    ? 'bg-orange-500 text-white border-orange-500/30' 
                                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                                }`}>
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 truncate pr-2">
                                    {source.name.replace(/\.txt$/, '')}
                                  </h4>
                                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(source.createdAt).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>{wordCount} words</span>
                                  </div>
                                </div>
                              </div>

                              {/* ACTIONS */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                                <button 
                                  onClick={() => handleEdit(source)}
                                  disabled={training}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                                  title="Edit & Retrain"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(source._id)}
                                  disabled={training}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* PREVIEW BODY TEXT */}
                            {source.content && (
                              <p className="text-[12px] text-zinc-500 dark:text-zinc-400 line-clamp-2 bg-zinc-50/50 dark:bg-zinc-900/30 p-2 rounded-lg border border-zinc-200/20 dark:border-zinc-800/40 leading-relaxed italic">
                                "{source.content}"
                              </p>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div></DashboardLayout>}>
      <KnowledgePageContent />
    </Suspense>
  );
}
