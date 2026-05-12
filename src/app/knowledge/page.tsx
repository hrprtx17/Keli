'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Database, FileText, Globe, UploadCloud, Bot, Trash2, 
  RefreshCcw, Loader2, AlertCircle, ChevronRight, Link as LinkIcon, Blocks
} from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, y: 0,
    transition: { staggerChildren: 0.04, delayChildren: 0.02, type: 'spring', stiffness: 300, damping: 25 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.99 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 350, damping: 28 } }
};

function KnowledgePageContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const urlAgentId = searchParams.get('agentId');
  
  const [selectedAgent, setSelectedAgent] = useState<string>(urlAgentId || '');
  
  useEffect(() => {
    if (urlAgentId) setSelectedAgent(urlAgentId);
  }, [urlAgentId]);

  const [activeTab, setActiveTab] = useState<'document' | 'website' | null>(null);
  const [crawlUrl, setCrawlUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [ingestStage, setIngestStage] = useState<string | null>(null);
  const [ingestProgress, setIngestProgress] = useState<{current: number, total: number} | null>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      return res.json();
    }
  });

  const { data: dataSources, isLoading: isLoadingData } = useQuery({
    queryKey: ['datasources', selectedAgent],
    queryFn: async () => {
      if (!selectedAgent) return [];
      const res = await fetch(`/api/datasources?agentId=${selectedAgent}`);
      return res.json();
    },
    enabled: !!selectedAgent,
  });

  useEffect(() => {
    if (!selectedAgent && agents && agents.length > 0) {
       setSelectedAgent(agents[0]._id);
    }
  }, [agents, selectedAgent]);

  const formatSize = (bytes: number) => {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => setIsDragging(false);
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const validateAndSetFile = (file: File) => {
    const allowed = ['.pdf', '.docx', '.txt', '.csv', '.md'];
    const isAllowed = allowed.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isAllowed) {
      toast.error('Format not supported. Use PDF, DOCX, TXT, CSV, MD.');
      return;
    }
    setSelectedFile(file);
    setActiveTab('document');
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedAgent) return;
    setUploading(true);
    setIngestStage('Starting Upload');
    
    try {
      const formData = new FormData();
      formData.append('agentId', selectedAgent);
      formData.append('file', selectedFile);

      const res = await fetch('/api/datasources', { method: 'POST', body: formData });
      if (!res.ok || !res.body) throw new Error('Ingestion channel creation failed');

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

            if (stage === 'Failed') throw new Error(error || 'Internal pipeline fault');
            setIngestStage(stage);
            if (current && total) setIngestProgress({ current, total });

            if (stage === 'Completed') {
               toast.success(`Training complete! ${selectedFile.name} successfully synced.`);
               queryClient.invalidateQueries({ queryKey: ['datasources', selectedAgent] });
               resetState();
            }
          } catch (e: any) { if (e.message.includes('fault')) throw e; }
        }
      }
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
      setIngestStage('Failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCrawl = async () => {
    if (!crawlUrl || !selectedAgent) return;
    
    let validUrl = crawlUrl;
    if (!validUrl.startsWith('http')) validUrl = 'https://' + validUrl;

    setUploading(true);
    setIngestStage('Connecting');
    
    try {
      const res = await fetch('/api/datasources/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent, url: validUrl })
      });

      if (!res.ok || !res.body) throw new Error('Crawler offline');

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

            if (stage === 'Failed') throw new Error(error || 'Crawl failed');
            setIngestStage(stage);
            if (current && total) setIngestProgress({ current, total });

            if (stage === 'Completed') {
               toast.success(`Website synced successfully.`);
               queryClient.invalidateQueries({ queryKey: ['datasources', selectedAgent] });
               resetState();
            }
          } catch (e: any) { if (e.message.includes('crashed')) throw e; }
        }
      }
    } catch (err: any) {
      toast.error(`Connection failed: ${err.message}`);
      setIngestStage('Failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
     try {
        const res = await fetch(`/api/datasources?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed deleting source');
        toast.success('Source deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['datasources', selectedAgent] });
     } catch(e: any) {
        toast.error('Could not delete source.');
     }
  };

  const resetState = () => {
    setSelectedFile(null);
    setActiveTab(null);
    setIngestStage(null);
    setIngestProgress(null);
    setCrawlUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerInput = () => fileInputRef.current?.click();

  const activeAgentName = agents?.find((a: any) => a._id === selectedAgent)?.name || 'Select Agent';

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pb-24">
        
        {/* Global Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
           <div>
              <div className="flex items-center gap-2 text-[11px] font-medium text-orange-600 tracking-wider uppercase mb-2">
                 KNOWLEDGE
              </div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Training Data</h1>
              <p className="text-[14px] text-gray-500 mt-2 max-w-lg leading-relaxed">
                 Manage the content your AI uses to answer questions and assist customers.
              </p>
           </div>

           {/* Agent Quick Selector */}
           <div className="relative shrink-0">
              <select 
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg pl-10 pr-10 py-2.5 text-[14px] font-medium text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all cursor-pointer min-w-[200px]"
              >
                {!agents?.length && <option>No agents found</option>}
                {agents?.map((a: any) => (
                   <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
              <Bot className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
           </div>
        </div>

        {!selectedAgent ? (
           <div className="bg-white border border-gray-200/80 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                 <Database className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-[15px] font-medium text-gray-900">No agent selected</h3>
              <p className="text-[14px] text-gray-500 mt-1">Please select an AI assistant to manage its knowledge base.</p>
           </div>
        ) : (
           <motion.div 
             variants={containerVariants} initial="hidden" animate="visible"
             className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
           >
              {/* MAIN INGESTION SYSTEM */}
              <div className="lg:col-span-8 space-y-8">
                 
                 <motion.div variants={itemVariants} className="space-y-4">
                    <div>
                       <h2 className="text-[16px] font-semibold text-gray-900">Add Training Data</h2>
                       <p className="text-[14px] text-gray-500 mt-1">Upload documents or connect your website to train your AI assistant.</p>
                    </div>

                    <div className="bg-white border border-gray-200/80 rounded-[20px] shadow-sm overflow-hidden group hover:border-orange-200 transition-colors">
                       <div className="p-6">
                          {!activeTab ? (
                             <div className="space-y-4">
                                {/* Drag Zone */}
                                <div 
                                  onDragOver={handleDragOver}
                                  onDragLeave={handleDragLeave}
                                  onDrop={handleDrop}
                                  onClick={triggerInput}
                                  className={`border border-dashed rounded-xl flex flex-col items-center justify-center py-10 px-6 cursor-pointer transition-all duration-200 ${
                                     isDragging 
                                      ? 'border-orange-400 bg-orange-50/50' 
                                      : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50/30'
                                  }`}
                                >
                                   <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.txt,.csv,.md" onChange={handleFileChange} />
                                   <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${isDragging ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-400 group-hover:text-orange-500 group-hover:bg-orange-100'}`}>
                                      <UploadCloud className="w-5 h-5" />
                                   </div>
                                   <p className="text-[14px] font-medium text-gray-900">Drop files here or browse to upload</p>
                                   <p className="text-[13px] text-gray-500 mt-1">PDF, DOCX, TXT, CSV, Markdown</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   <button 
                                     onClick={() => setActiveTab('website')}
                                     className="border border-gray-200 rounded-xl p-4 text-left flex items-start gap-3 hover:bg-gray-50 hover:border-gray-300 transition-all hover:shadow-sm"
                                   >
                                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                                         <LinkIcon className="w-4 h-4"/>
                                      </div>
                                      <div>
                                         <h4 className="text-[14px] font-medium text-gray-900">Website Crawl</h4>
                                         <p className="text-[13px] text-gray-500 mt-0.5">Train your AI using pages from your website.</p>
                                      </div>
                                   </button>
                                   
                                   <div className="border border-gray-200 rounded-xl p-4 text-left flex items-start gap-3 opacity-60 bg-gray-50/50 cursor-default">
                                      <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                                         <Blocks className="w-4 h-4"/>
                                      </div>
                                      <div>
                                         <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="text-[14px] font-medium text-gray-900">Integrations</h4>
                                            <span className="text-[10px] font-medium bg-gray-200/80 text-gray-600 px-1.5 py-0.5 rounded-md">Coming Soon</span>
                                         </div>
                                         <p className="text-[13px] text-gray-500 mt-0.5">Connect tools like Notion, Slack, and Zendesk.</p>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          ) : activeTab === 'document' ? (
                             <div className="animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center justify-between mb-4">
                                   <h3 className="text-[14px] font-medium text-gray-900">Upload Document</h3>
                                   <button onClick={resetState} className="text-[13px] text-gray-500 hover:text-gray-900">Cancel</button>
                                </div>
                                <div className="bg-gray-50 border border-gray-200/60 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                   <div className="flex items-center gap-4 min-w-0 w-full">
                                      <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center shrink-0">
                                         <FileText className="w-5 h-5 text-gray-500" />
                                      </div>
                                      <div className="min-w-0">
                                         <h4 className="text-[14px] font-medium text-gray-900 truncate">{selectedFile?.name || 'Loading file...'}</h4>
                                         <p className="text-[13px] text-gray-500">{formatSize(selectedFile?.size || 0)}</p>
                                      </div>
                                   </div>
                                   
                                   {!uploading ? (
                                      <button 
                                        onClick={handleUpload}
                                        className="w-full sm:w-auto bg-gray-900 text-white h-9 px-5 rounded-lg font-medium text-[13px] hover:bg-gray-800 transition-all whitespace-nowrap shadow-sm"
                                      >
                                         Upload & Train
                                      </button>
                                   ) : (
                                      <div className="flex items-center gap-2 bg-white px-4 h-9 rounded-lg border border-gray-200 text-[13px] font-medium text-gray-900 whitespace-nowrap shadow-sm">
                                         <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" /> 
                                         {ingestStage === 'Embedding' && ingestProgress ? `${ingestProgress.current}/${ingestProgress.total}` : ingestStage || 'Processing...'}
                                      </div>
                                   )}
                                </div>
                             </div>
                          ) : (
                             <div className="animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center justify-between mb-4">
                                   <h3 className="text-[14px] font-medium text-gray-900">Website Crawl</h3>
                                   <button onClick={resetState} className="text-[13px] text-gray-500 hover:text-gray-900">Cancel</button>
                                </div>
                                <div className="relative">
                                   <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                   <input 
                                      type="text" 
                                      placeholder="https://example.com" 
                                      value={crawlUrl}
                                      onChange={e => setCrawlUrl(e.target.value)}
                                      disabled={uploading}
                                      className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-[120px] py-2.5 text-[14px] outline-none focus:bg-white focus:border-orange-400 focus:ring-[3px] focus:ring-orange-500/10 transition-all"
                                   />
                                   <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                                      <button 
                                        onClick={handleCrawl}
                                        disabled={uploading || !crawlUrl}
                                        className="bg-gray-900 text-white h-7 px-3 rounded-md font-medium text-[12px] hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
                                      >
                                         {uploading ? <><Loader2 className="w-3 h-3 animate-spin" /> Training</> : 'Start Crawl'}
                                      </button>
                                   </div>
                                </div>
                                <p className="text-[12px] text-gray-500 mt-2 px-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Crawls up to 10 subpages automatically.</p>
                             </div>
                          )}
                       </div>
                    </div>
                 </motion.div>

                 {/* LIVE TRACKING BAR */}
                 <AnimatePresence>
                    {uploading && (
                       <motion.div 
                         initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                         className="overflow-hidden"
                       >
                          <div className="bg-white border border-gray-200 rounded-[20px] p-5 shadow-sm mt-4">
                             <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2 text-[13px] font-medium text-gray-900">
                                   <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" /> Training in progress
                                </div>
                                <div className="text-[12px] text-gray-500">{ingestStage}...</div>
                             </div>
                             {ingestProgress ? (
                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden relative">
                                   <motion.div 
                                     initial={{ width: '5%' }}
                                     animate={{ width: `${Math.min(100, (ingestProgress.current / ingestProgress.total) * 100)}%` }}
                                     className="h-full bg-orange-500 rounded-full"
                                   />
                                </div>
                             ) : (
                                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                   <div className="h-full w-1/3 bg-orange-500 rounded-full animate-[shimmer_1.5s_infinite]" />
                                </div>
                             )}
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>

                 {/* REPOSITORY LIST */}
                 <motion.div variants={itemVariants} className="space-y-4">
                    <div>
                       <h2 className="text-[16px] font-semibold text-gray-900 flex items-center gap-2">Connected Sources</h2>
                       <p className="text-[14px] text-gray-500 mt-1">Content currently used to train your AI assistant.</p>
                    </div>

                    <div className="bg-white border border-gray-200/80 rounded-[20px] shadow-sm overflow-hidden">
                       <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                             <thead>
                                <tr className="text-[12px] font-medium text-gray-500 border-b border-gray-100 bg-gray-50/50">
                                   <th className="px-6 py-3">Source</th>
                                   <th className="px-6 py-3">Status</th>
                                   <th className="px-6 py-3">Size</th>
                                   <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-50">
                                {isLoadingData ? (
                                   [1, 2].map(k => (
                                      <tr key={k} className="animate-pulse">
                                         <td colSpan={4} className="px-6 py-4"><div className="h-5 bg-gray-100 rounded w-1/2" /></td>
                                      </tr>
                                   ))
                                ) : !dataSources || dataSources.length === 0 ? (
                                   <tr>
                                      <td colSpan={4} className="px-6 py-12 text-center">
                                         <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                               <Database className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <p className="text-[14px] font-medium text-gray-900">No training data yet</p>
                                            <p className="text-[13px] text-gray-500 mt-1 max-w-[240px]">Upload documents or connect your website to start training your AI.</p>
                                            <button 
                                              onClick={triggerInput}
                                              className="mt-4 text-[13px] font-medium text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                                            >
                                               Add First Source
                                            </button>
                                         </div>
                                      </td>
                                   </tr>
                                ) : (
                                   dataSources.map((source: any) => {
                                      const isReady = source.status === 'ready';
                                      const isUrl = source.type === 'url';
                                      return (
                                         <tr key={source._id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 min-w-[220px]">
                                               <div className="flex items-center gap-3">
                                                  <div className={`w-8 h-8 rounded-md flex items-center justify-center border shrink-0 ${isUrl ? 'bg-white border-gray-200 text-gray-500' : 'bg-white border-gray-200 text-gray-500'}`}>
                                                     {isUrl ? <Globe className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                                  </div>
                                                  <div className="min-w-0">
                                                     <p className="text-[13px] font-medium text-gray-900 truncate max-w-[200px]">{source.name}</p>
                                                     <p className="text-[12px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                        Added {source.createdAt ? new Date(source.createdAt).toLocaleDateString() : 'Recently'}
                                                     </p>
                                                  </div>
                                               </div>
                                            </td>
                                            <td className="px-6 py-4">
                                               <div className="flex items-center gap-1.5">
                                                  {isReady ? (
                                                     <>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                        <span className="text-[13px] text-gray-600">Trained</span>
                                                     </>
                                                  ) : (
                                                     <>
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                                                        <span className="text-[13px] text-gray-600">Training...</span>
                                                     </>
                                                  )}
                                               </div>
                                            </td>
                                            <td className="px-6 py-4">
                                               <div className="text-[13px] text-gray-500">
                                                  {isUrl ? `${source.metadata?.pages || '?'} pages` : formatSize(source.metadata?.size)}
                                               </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                               <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button 
                                                    onClick={() => toast.info("Retraining scheduled.")}
                                                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
                                                    title="Refresh"
                                                  >
                                                     <RefreshCcw className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button 
                                                    onClick={() => handleDelete(source._id)}
                                                    className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                    title="Delete"
                                                  >
                                                     <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                               </div>
                                            </td>
                                         </tr>
                                      )
                                   })
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                 </motion.div>
              </div>

              {/* SIDEBAR STATS/ACTIONS */}
              <div className="lg:col-span-4 space-y-6">
                 <motion.div variants={itemVariants} className="bg-[#18181B] text-white rounded-[20px] p-6 shadow-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 group-hover:bg-orange-500/30 transition-colors duration-500" />
                    
                    <div className="relative z-10">
                       <h3 className="text-[13px] font-medium text-zinc-400 mb-6 flex items-center gap-2">
                          <Bot className="w-4 h-4" /> AI Status
                       </h3>

                       <div className="space-y-6">
                          <div>
                             <div className="text-[12px] text-zinc-500 mb-1">Target Assistant</div>
                             <div className="text-[15px] font-medium text-zinc-100">{activeAgentName}</div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-800">
                             <div>
                                <div className="text-[24px] font-semibold text-white mb-0.5">
                                   {dataSources?.length || 0}
                                </div>
                                <div className="text-[12px] text-zinc-500">Sources Added</div>
                             </div>
                             <div>
                                <div className="text-[24px] font-semibold text-white flex items-center gap-1 mb-0.5">
                                   100<span className="text-[16px] text-zinc-500">%</span>
                                </div>
                                <div className="text-[12px] text-zinc-500">Training Health</div>
                             </div>
                          </div>

                          <button 
                             onClick={() => toast.success('Retraining initiated.')}
                             className="w-full h-[40px] bg-white text-zinc-900 rounded-lg font-medium text-[13px] flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all active:scale-[0.98]"
                          >
                             <RefreshCcw className="w-3.5 h-3.5" /> Retrain AI
                          </button>
                       </div>
                    </div>
                 </motion.div>

                 <motion.div variants={itemVariants} className="bg-white border border-gray-200/80 rounded-[20px] p-6 shadow-sm">
                    <h4 className="text-[14px] font-semibold text-gray-900 mb-4">AI Configuration</h4>
                    <div className="space-y-3">
                       {[
                          { t: 'Training Method', v: 'Semantic Search' },
                          { t: 'AI Model', v: 'GPT-4 Optimized' },
                          { t: 'Storage', v: 'Secure Vector DB' }
                       ].map((inf, i) => (
                          <div key={i} className="flex justify-between items-center text-[13px] border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                             <span className="text-gray-500">{inf.t}</span>
                             <span className="text-gray-900 font-medium">{inf.v}</span>
                          </div>
                       ))}
                    </div>
                 </motion.div>
              </div>
           </motion.div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default function KnowledgePage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div></DashboardLayout>}>
      <KnowledgePageContent />
    </Suspense>
  );
}
