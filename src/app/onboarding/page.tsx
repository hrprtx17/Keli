'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  
  const [agentName, setAgentName] = useState('');
  const [agentPurpose, setAgentPurpose] = useState('');

  const [plan, setPlan] = useState('free');

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    // In a real MVP, we'd PUT to /api/workspace and /api/agents here
    // For now, we simulate success and redirect to dashboard
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    router.push('/dashboard');
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${step >= i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {i}
              </div>
              {i < 3 && <div className={`h-1 w-16 mx-2 rounded ${step > i ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Create your workspace</h2>
              <p className="text-sm text-muted-foreground mt-1">This is your company's home in AgentDesk.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Workspace Name</Label>
                <Input value={workspaceName} onChange={e => {
                  setWorkspaceName(e.target.value);
                  setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }} placeholder="Acme Corp" />
              </div>
              <div className="space-y-2">
                <Label>Workspace URL</Label>
                <div className="flex items-center">
                  <span className="bg-muted px-3 py-2 text-sm text-muted-foreground rounded-l-md border border-r-0 border-border">agentdesk.ai/</span>
                  <Input className="rounded-l-none" value={workspaceSlug} onChange={e => setWorkspaceSlug(e.target.value)} placeholder="acme" />
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={handleNext} disabled={!workspaceName || !workspaceSlug}>Continue</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Configure your first Agent</h2>
              <p className="text-sm text-muted-foreground mt-1">Give your AI assistant an identity.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Agent Name</Label>
                <Input value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="Support Bot" />
              </div>
              <div className="space-y-2">
                <Label>Primary Purpose</Label>
                <Input value={agentPurpose} onChange={e => setAgentPurpose(e.target.value)} placeholder="e.g. Answer billing questions and technical support" />
              </div>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" className="w-1/3" onClick={handleBack}>Back</Button>
              <Button className="w-2/3" onClick={handleNext} disabled={!agentName}>Continue</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Select a plan</h2>
              <p className="text-sm text-muted-foreground mt-1">You can always change this later.</p>
            </div>
            <div className="space-y-4">
              {[
                { id: 'free', name: 'Free', price: '$0', desc: '1 Agent, 1,000 msgs/mo' },
                { id: 'pro', name: 'Pro', price: '$19', desc: '5 Agents, 10,000 msgs/mo' },
                { id: 'business', name: 'Business', price: '$49', desc: 'Unlimited Agents, 50,000 msgs/mo' }
              ].map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setPlan(p.id)}
                  className={`cursor-pointer rounded-lg border p-4 transition-all ${plan === p.id ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-foreground">{p.name}</h3>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                    <div className="font-bold text-lg">{p.price}<span className="text-xs text-muted-foreground font-normal">/mo</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" className="w-1/3" onClick={handleBack}>Back</Button>
              <Button className="w-2/3" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Setting up...' : 'Go to Dashboard'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
