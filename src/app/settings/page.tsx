'use client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Save, RefreshCw, ShieldCheck, Globe, Building, Key } from 'lucide-react';
import { toast } from 'sonner';

import { signOut } from 'next-auth/react';
import { Info, Trash2 } from 'lucide-react';

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={`transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
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
  });

  useEffect(() => {
    if (workspace) {
      setFormData({
        name: workspace.name || '',
        slug: workspace.slug || '',
      });
    }
  }, [workspace]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: formData.name,
        })
      });

      if (!res.ok) throw new Error('Request failed');
      toast.success('Settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
    } catch (e) {
      toast.error('Initialization failed. System update error.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('CRITICAL ACTION: Are you absolutely sure you wish to permanently delete this workspace? This removes all associated bots and persistent intelligence logs. This cannot be reversed.')) return;

    setDeleting(true);
    try {
      const res = await fetch('/api/workspace', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Workspace exterminated successfully.');
      setTimeout(() => {
        signOut({ callbackUrl: '/' });
      }, 1500);
    } catch (e) {
      toast.error('Deletion sequence malfunctioned.');
      setDeleting(false);
    }
  };

  if (isLoading) return <DashboardLayout><div className="p-8 animate-pulse space-y-6"><div className="h-8 w-32 bg-muted rounded"/><div className="h-64 bg-muted rounded-3xl"/></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-10 pb-20">
        
        <FadeIn>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">General</h1>
        </FadeIn>

        <div className="space-y-12">
          
          {/* Master Configuration Card */}
          <FadeIn delay={100}>
            <Card className="shadow-sm rounded-3xl border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
              <CardHeader className="p-8 pb-6">
                <CardTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Workspace details</CardTitle>
              </CardHeader>
              
              <CardContent className="px-8 pb-8 space-y-6">
                {/* Input 1: Name */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-zinc-500 tracking-wide">Workspace name</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. x1 media"
                    className="h-12 rounded-xl bg-zinc-50/50 dark:bg-zinc-900 focus:bg-white dark:focus:bg-black border-zinc-200 dark:border-zinc-800 font-medium px-4"
                  />
                </div>

                {/* Input 2: URL (Slug) */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-zinc-500 tracking-wide">Workspace URL</Label>
                  <div className="relative">
                    <Input 
                      value={formData.slug} 
                      disabled
                      className="h-12 rounded-xl bg-zinc-50/50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-medium pl-4 pr-4 opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 px-4 py-3 border border-zinc-100 dark:border-zinc-800/50 mt-2">
                    <Info className="h-4 w-4 text-zinc-400 shrink-0" />
                    <span className="text-xs font-medium text-zinc-500">Changing the workspace URL will redirect you to the new address</span>
                  </div>
                </div>

                {/* Action Footer aligned Right like mockup */}
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-zinc-500 hover:bg-zinc-600 text-white rounded-xl font-bold text-sm px-8 h-11 transition-all active:scale-95 shadow-sm"
                  >
                    {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Separation Gutter */}
          <FadeIn delay={200}>
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
              <span className="flex-shrink mx-6 text-[10px] font-black tracking-widest uppercase text-red-600 dark:text-red-500 bg-background px-2">DANGER ZONE</span>
              <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>
          </FadeIn>

          {/* Nuclear Purge Block */}
          <FadeIn delay={300}>
            <Card className="rounded-3xl border-red-200 dark:border-red-900/30 bg-red-50/20 dark:bg-red-950/10 overflow-hidden relative shadow-sm">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500/30" />
              <CardContent className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Delete workspace</h3>
                  <p className="text-sm font-medium text-zinc-500 mt-1.5 max-w-xl leading-relaxed">
                    Once you delete your workspace, there is no going back. Please be certain. All your uploaded data and trained agents will be deleted.
                  </p>
                </div>
                
                <Button 
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold h-11 px-8 shadow-lg shadow-red-500/20 transition-all active:scale-95 shrink-0"
                >
                  {deleting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete
                </Button>
              </CardContent>
            </Card>
          </FadeIn>

        </div>
      </div>
    </DashboardLayout>
  );
}
