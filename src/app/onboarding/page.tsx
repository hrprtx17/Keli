'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, CheckCircle2 } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentPurpose, setAgentPurpose] = useState('');

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // Step 1: Create workspace
      const wsRes = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceName, slug: workspaceSlug })
      });
      const wsData = await wsRes.json();
      if (!wsRes.ok) throw new Error(wsData.error || 'Failed to create workspace');

      // The workspace _id from MongoDB response
      const workspaceId = wsData._id?.toString() || wsData.id?.toString();

      // Step 2: Create first agent
      const agentRes = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName,
          description: agentPurpose,
          systemPrompt: `You are ${agentName}, a helpful AI assistant. ${agentPurpose || 'Help users with their questions'}. Be concise and friendly.`,
          workspaceId
        })
      });
      if (!agentRes.ok) {
        const d = await agentRes.json();
        throw new Error(d.error || 'Failed to create agent');
      }

      router.push('/agents');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: 'Workspace' },
    { label: 'Your Agent' },
    { label: 'Done!' },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">AgentDesk</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          {/* Step Indicator */}
          <div className="mb-8 flex items-center justify-center">
            {steps.map((s, i) => {
              const num = i + 1;
              const isComplete = step > num;
              const isCurrent = step === num;
              return (
                <div key={s.label} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                      isComplete ? 'bg-primary text-white' :
                      isCurrent ? 'bg-primary text-white ring-4 ring-primary/20' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isComplete ? <CheckCircle2 className="w-5 h-5" /> : num}
                    </div>
                    <span className={`text-xs font-medium ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>{s.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-0.5 w-16 mx-3 mb-4 rounded transition-colors ${step > num ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Step 1: Workspace */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Create your workspace</h2>
                <p className="text-sm text-muted-foreground mt-1">This is your company's home in AgentDesk. You'll start on the <strong>Free plan</strong> and can upgrade anytime.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Workspace Name</Label>
                  <Input
                    value={workspaceName}
                    onChange={e => {
                      setWorkspaceName(e.target.value);
                      setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
                    }}
                    placeholder="Acme Corp"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>Workspace URL</Label>
                  <div className="flex items-center">
                    <span className="bg-muted px-3 py-2 text-sm text-muted-foreground rounded-l-md border border-r-0 border-input h-10 flex items-center">agentdesk.ai/</span>
                    <Input
                      className="rounded-l-none"
                      value={workspaceSlug}
                      onChange={e => setWorkspaceSlug(e.target.value)}
                      placeholder="acme"
                    />
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={handleNext} disabled={!workspaceName.trim() || !workspaceSlug.trim()}>
                Continue →
              </Button>
            </div>
          )}

          {/* Step 2: Agent */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Create your first AI Agent</h2>
                <p className="text-sm text-muted-foreground mt-1">Give your agent a name and describe its role. You can fine-tune it later.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Agent Name</Label>
                  <Input
                    value={agentName}
                    onChange={e => setAgentName(e.target.value)}
                    placeholder="Aria — Support Bot"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label>What does this agent do?</Label>
                  <Input
                    value={agentPurpose}
                    onChange={e => setAgentPurpose(e.target.value)}
                    placeholder="e.g. Answer billing and technical support questions"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" className="w-1/3" onClick={handleBack}>Back</Button>
                <Button className="w-2/3" onClick={handleNext} disabled={!agentName.trim()}>
                  Continue →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Launch */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 text-center">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">You're all set! 🎉</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>{workspaceName}</strong> workspace with <strong>{agentName}</strong> agent will be created.
                  <br />You start on the <strong>Free plan</strong> with 500 AI credits.
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex flex-col gap-3">
                <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Setting up your workspace...' : 'Go to Dashboard →'}
                </Button>
                <Button variant="ghost" className="w-full text-muted-foreground text-sm" onClick={handleBack} disabled={loading}>
                  ← Go back
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          You can upgrade to Premium anytime from the Billing page.
        </p>
      </div>
    </div>
  );
}
