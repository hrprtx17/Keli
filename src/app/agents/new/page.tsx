'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot, ArrowLeft, Sparkles, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CreateAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create agent');
      }

      toast.success('Agent created successfully!');
      router.push('/agents');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
          <Link href="/agents">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create New Agent</h1>
            <p className="text-sm text-muted-foreground">Configure your next AI team member.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="bg-muted/30 rounded-t-xl border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Agent Identity</CardTitle>
                  <CardDescription>Define who this agent is and how it talks.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Sales Assistant"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="focus-visible:ring-primary"
                />
                <p className="text-[11px] text-muted-foreground">Customers will see this name in the chat window.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Internal Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="e.g. Handles presale questions"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="systemPrompt">System Prompt / Instructions</Label>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setFormData({ ...formData, systemPrompt: `You are a professional, friendly support assistant named ${formData.name || 'Assistant'}. Your goal is to help users efficiently and accurately using facts. Never offer financial advice. Keep responses concise.` })}
                  >
                    Load Template
                  </button>
                </div>
                <textarea
                  id="systemPrompt"
                  className="w-full min-h-[150px] p-3 text-sm rounded-lg border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent resize-none"
                  placeholder="e.g. You are a customer support bot for our store. Be helpful, polite and professional..."
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">This dictates your AI's personality and behavior boundaries.</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4 mt-6">
            <Link href="/agents">
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading || !formData.name} className="bg-primary hover:bg-primary/90 text-white shadow-md rounded-full px-8">
              {loading ? <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin"/> Creating...</span> : 'Create Agent'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
