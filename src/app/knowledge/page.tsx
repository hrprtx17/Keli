'use client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { FileText, Database, Bot, Loader2, Trash, UploadCloud, AlertCircle, CheckCircle2, X, File } from 'lucide-react';
import { toast } from 'sonner';

import { useSearchParams } from 'next/navigation';

export default function KnowledgePage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const urlAgentId = searchParams.get('agentId');
  
  const [selectedAgent, setSelectedAgent] = useState<string>(urlAgentId || '');
  
  // Keep component robust if param changes
  useEffect(() => {
    if (urlAgentId) setSelectedAgent(urlAgentId);
  }, [urlAgentId]);

  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  const formatSize = (bytes: number) => {
    if (!bytes) return '—';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Currently only PDF ingestion is supported.');
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedAgent) return;

    setUploading(true);
    try {
      const res = await fetch('/api/datasources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent,
          type: 'pdf',
          name: selectedFile.name,
          content: `[EXTRACTED_PDF_BLOB] Simulate vectors for: ${selectedFile.name}`,
          metadata: {
            size: selectedFile.size,
            type: selectedFile.type,
          }
        })
      });

      if (!res.ok) throw new Error('Upload failed');
      
      toast.success(`Successfully indexed "${selectedFile.name}"`);
      queryClient.invalidateQueries({ queryKey: ['datasources', selectedAgent] });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      toast.error('Processing pipeline failure.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
     toast.error('Permanent deletion disabled in simulation runtime.');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-foreground flex items-center gap-3">
            <Database className="h-5 w-5 text-primary" /> Data Sources
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Supply domain documentation for targeted agent context retrieval.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-border shadow-none h-full flex flex-col">
            <CardHeader className="py-3 border-b bg-muted/5">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Target Node</CardTitle>
            </CardHeader>
            <CardContent className="p-2 flex-1">
              {isLoadingAgents ? (
                <div className="p-4 space-y-2">
                   <div className="h-9 bg-muted rounded animate-pulse" />
                   <div className="h-9 bg-muted rounded animate-pulse" />
                </div>
              ) : !agents || agents.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">Zero active agents available.</div>
              ) : (
                <div className="space-y-1">
                  {agents.map((agent: any) => (
                    <button 
                      key={agent._id} 
                      onClick={() => { setSelectedAgent(agent._id); setSelectedFile(null); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all text-left ${selectedAgent === agent._id ? 'bg-primary text-white shadow-sm' : 'text-foreground hover:bg-muted'}`}
                    >
                       <div className={`h-5 w-5 rounded flex items-center justify-center shrink-0 ${selectedAgent === agent._id ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                         <Bot className="h-3 w-3" />
                       </div>
                       <span className="truncate">{agent.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-9 space-y-6">
          {!selectedAgent ? (
            <div className="h-64 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center bg-muted/5">
               <Bot className="h-8 w-8 text-muted-foreground mb-3" />
               <h3 className="text-base font-medium text-foreground">Provisioning Required</h3>
               <p className="text-muted-foreground text-xs mt-1 max-w-xs">Establish an agent target from the sidebar to begin injection.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <Card className="border shadow-none overflow-hidden">
                <CardHeader className="bg-muted/5 border-b py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white border rounded shadow-sm"><UploadCloud className="h-4 w-4 text-primary"/></div>
                    <div>
                      <CardTitle className="text-base font-medium">Document Pipeline</CardTitle>
                      <CardDescription className="text-xs">Inject documents for contextual data retrieval.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {!selectedFile ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center text-center hover:border-primary/40 hover:bg-muted/10 transition-all cursor-pointer group"
                    >
                      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3 transition-colors group-hover:bg-primary/5">
                        <FileText className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <h4 className="font-medium text-base text-foreground">Drop training data here</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Select an official PDF file.</p>
                      <div className="mt-4 px-3 py-1 bg-muted rounded text-[11px] font-medium text-muted-foreground flex items-center gap-2">
                         <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Validated
                      </div>
                    </div>
                  ) : (
                    <div className="border border-primary/20 bg-primary/5 rounded-lg p-4 animate-in zoom-in-95 duration-200">
                       <div className="flex items-center justify-between gap-4">
                         <div className="flex items-center gap-3 overflow-hidden">
                           <div className="h-10 w-10 bg-white rounded border shadow-sm flex items-center justify-center shrink-0">
                             <FileText className="h-5 w-5 text-red-500" />
                           </div>
                           <div className="min-w-0">
                             <p className="font-medium text-sm text-foreground truncate">{selectedFile.name}</p>
                             <p className="text-[11px] text-muted-foreground font-mono">{formatSize(selectedFile.size)}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-2 shrink-0">
                           <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} disabled={uploading} className="h-8 text-xs">
                              <X className="h-3 w-3 mr-1" /> Cancel
                           </Button>
                           <Button onClick={handleUpload} disabled={uploading} className="h-8 text-xs bg-primary hover:bg-primary/90 shadow-none px-4">
                             {uploading ? <><Loader2 className="h-3 w-3 animate-spin mr-2" /> Processing...</> : 'Ingest'}
                           </Button>
                         </div>
                       </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-none border">
                <CardHeader className="py-3 border-b bg-muted/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-foreground">Active Repository</CardTitle>
                    <span className="text-[10px] border bg-white px-2 py-0.5 rounded font-medium text-muted-foreground">{dataSources?.length || 0} Files</span>
                  </div>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[11px] uppercase font-medium text-muted-foreground tracking-wider border-b bg-muted/5">
                        <th className="px-4 py-2.5 font-medium">Name</th>
                        <th className="px-4 py-2.5 font-medium">Status</th>
                        <th className="px-4 py-2.5 font-medium">Size</th>
                        <th className="px-4 py-2.5 font-medium text-right">Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {isLoadingData ? (
                        [1,2].map(i => (
                          <tr key={i} className="animate-pulse"><td colSpan={4} className="px-4 py-3"><div className="h-4 bg-muted rounded w-3/4" /></td></tr>
                        ))
                      ) : !dataSources || dataSources.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center">
                             <p className="text-xs text-muted-foreground">Repository empty. Upload artifacts above.</p>
                          </td>
                        </tr>
                      ) : (
                        dataSources.map((source: any) => (
                          <tr key={source._id} className="hover:bg-muted/20 transition-colors group text-xs">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2 font-medium text-foreground">
                                 <FileText className="h-3.5 w-3.5 text-red-500" />
                                 <span className="truncate">{source.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 text-[10px] font-medium">Synced</span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground font-mono">{formatSize(source.metadata?.size)}</td>
                            <td className="px-4 py-3 text-right">
                              <button 
                                onClick={() => handleDelete(source._id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                              >
                                <Trash className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
