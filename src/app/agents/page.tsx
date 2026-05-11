'use client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot, Plus, Activity } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

export default function AgentsPage() {
  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json();
    }
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
          <p className="text-muted-foreground mt-1">Manage your intelligent support agents.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Agent
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground">Loading agents...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents?.map((agent: any) => (
            <Link href={`/agents/${agent._id}`} key={agent._id}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{agent.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                      Active
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {agent.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground space-x-4 border-t border-border pt-4">
                    <div className="flex items-center">
                      <Activity className="mr-1 h-3 w-3" />
                      {agent.totalConversations} conversations
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {agents?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card text-muted-foreground">
              <Bot className="h-12 w-12 mb-4 text-muted" />
              <h3 className="text-lg font-bold text-foreground">No agents found</h3>
              <p className="mt-1">Get started by creating your first AI agent.</p>
              <Button className="mt-4"><Plus className="mr-2 h-4 w-4" /> Create Agent</Button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
