'use client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function BillingPage() {
  const [checkingOut, setCheckingOut] = useState(false);

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace'],
    queryFn: async () => {
      const res = await fetch('/api/workspace');
      return res.json();
    }
  });

  const handleCheckout = async (type: 'premium' | 'addon') => {
    setCheckingOut(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || 'Failed to initiate checkout');
      }
    } catch (error) {
      alert('Checkout error');
    } finally {
      setCheckingOut(false);
    }
  };

  if (isLoading || !workspace) {
    return <DashboardLayout><div className="p-8 text-muted-foreground">Loading...</div></DashboardLayout>;
  }

  const isPremium = workspace.plan === 'premium';
  const totalCredits = workspace.usage.monthlyCredits + workspace.usage.addonCredits;
  const creditsUsed = workspace.usage.creditsUsedThisMonth || 0;
  const progressPct = Math.min((creditsUsed / Math.max(totalCredits, 1)) * 100, 100);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Credits</h1>
          <p className="text-muted-foreground mt-1">Manage your subscription and AI credit usage.</p>
        </div>
      </div>
      
      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Credit Usage</CardTitle>
            <CardDescription>Your AI generation credits cycle resets on {new Date(workspace.usage.resetDate).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>{creditsUsed} used</span>
              <span className="font-medium">{totalCredits} total available</span>
            </div>
            <Progress value={progressPct} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground pt-2">
              <span>Monthly: {workspace.usage.monthlyCredits}</span>
              <span>Add-on: {workspace.usage.addonCredits}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className={!isPremium ? 'border-primary bg-primary/5' : ''}>
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
            <CardDescription>{!isPremium ? 'Current Plan' : 'Basic limits'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            <ul className="space-y-2 text-sm mb-6 text-muted-foreground">
              <li>1 AI Agent</li>
              <li>500 Credits/mo</li>
              <li>Basic Support</li>
            </ul>
            <Button className="w-full" variant="outline" disabled={!isPremium}>
              {!isPremium ? 'Active' : 'Downgrade'}
            </Button>
          </CardContent>
        </Card>
        
        <Card className={isPremium ? 'border-primary bg-primary/5' : ''}>
          <CardHeader>
            <CardTitle>Premium Plan</CardTitle>
            <CardDescription>{isPremium ? 'Current Plan' : 'For growing teams'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            <ul className="space-y-2 text-sm mb-6 text-muted-foreground">
              <li>5 AI Agents</li>
              <li>20,000 Credits/mo</li>
              <li>Priority Support</li>
              <li>Custom Widget Branding</li>
            </ul>
            <Button 
              className="w-full" 
              onClick={() => handleCheckout('premium')}
              disabled={checkingOut || isPremium}
            >
              {isPremium ? 'Active' : (checkingOut ? 'Loading...' : 'Upgrade to Premium')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top-Up Credits</CardTitle>
            <CardDescription>Never-expiring add-on</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">$9<span className="text-sm font-normal text-muted-foreground"> one-time</span></div>
            <ul className="space-y-2 text-sm mb-6 text-muted-foreground">
              <li>10,000 AI Credits</li>
              <li>Never expires</li>
              <li>Rollover indefinitely</li>
              <li>No subscription required</li>
            </ul>
            <Button 
              variant="secondary"
              className="w-full" 
              onClick={() => handleCheckout('addon')}
              disabled={checkingOut}
            >
              {checkingOut ? 'Loading...' : 'Buy 10,000 Credits'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
