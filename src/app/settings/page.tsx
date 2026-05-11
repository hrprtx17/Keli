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
    allowedDomains: ''
  });

  useEffect(() => {
    if (workspace) {
      setFormData({
        name: workspace.name || '',
        slug: workspace.slug || '',
        allowedDomains: (workspace.allowedDomains || []).join(', ')
      });
    }
  }, [workspace]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const domains = formData.allowedDomains.split(',').map(d => d.trim()).filter(Boolean);
      
      const res = await fetch('/api/workspace', {
        method: 'PATCH', // You will want to make sure PATCH is set in API
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: formData.name,
          allowedDomains: domains
        })
      });

      if (!res.ok) throw new Error('Request failed');
      toast.success('Settings updated!');
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
    } catch (e) {
      toast.error('Update failed. Ensure backend is wired for PATCH.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <DashboardLayout><div className="p-8 animate-pulse space-y-6"><div className="h-8 w-32 bg-muted rounded"/><div className="h-64 bg-muted rounded-xl"/></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-8">
        <FadeIn>
          <div className="flex items-center justify-between border-b pb-5 border-border">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Workspace Configuration</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage identity, security and global rules.</p>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 shadow-md transition-all"
            >
              {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Workspace
            </Button>
          </div>
        </FadeIn>

        <div className="grid gap-6">
          <FadeIn delay={100}>
            <Card className="shadow-sm hover:shadow-md transition-all">
              <CardHeader className="bg-muted/30 rounded-t-xl border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Building className="h-5 w-5"/></div>
                  <div>
                    <CardTitle className="text-lg">Profile</CardTitle>
                    <CardDescription>Identify this account externally.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">Business Name</Label>
                    <Input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">Workspace Slug</Label>
                    <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-input overflow-hidden bg-muted/50 group focus-within:ring-2 focus-within:ring-primary">
                      <span className="flex items-center px-3 text-muted-foreground sm:text-sm select-none font-mono bg-muted h-10 border-r">agentdesk.ai/</span>
                      <input 
                        type="text" 
                        disabled
                        value={formData.slug} 
                        className="block min-w-0 flex-1 border-0 bg-transparent py-1.5 pl-3 text-muted-foreground placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6 font-mono cursor-not-allowed"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">URL address is immutable once created.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={200}>
            <Card className="shadow-sm hover:shadow-md transition-all">
              <CardHeader className="bg-muted/30 rounded-t-xl border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center"><ShieldCheck className="h-5 w-5"/></div>
                  <div>
                    <CardTitle className="text-lg">Widget Firewall</CardTitle>
                    <CardDescription>Restrict where your chat agent operates to prevent abuse.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground"/> Allowed Domains
                  </Label>
                  <textarea
                    className="min-h-[100px] w-full rounded-lg border border-input bg-background p-3 text-sm focus-visible:ring-2 focus-visible:ring-primary outline-none font-mono placeholder:text-muted-foreground/60"
                    placeholder="e.g. mysite.com, store.myshop.net"
                    value={formData.allowedDomains}
                    onChange={e => setFormData({...formData, allowedDomains: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">Separate domains with commas. Leave empty to allow testing everywhere (Not secure for production).</p>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
          
          <FadeIn delay={300}>
            <Card className="bg-muted/20 border-dashed opacity-75 cursor-not-allowed">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground"><Key className="h-5 w-5"/></div>
                  <div>
                    <p className="font-medium text-sm text-foreground">Team Member Access</p>
                    <p className="text-xs text-muted-foreground">Invite and manage administrators.</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-1 rounded-md border">COMING SOON</span>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </DashboardLayout>
  );
}
