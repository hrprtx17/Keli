'use client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Link as LinkIcon, FileText, Database, Bot } from 'lucide-react';

export default function KnowledgePage() {
  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await fetch('/api/agents');
      return res.json();
    }
  });

  const [selectedAgent, setSelectedAgent] = useState<string>('');

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">Train your AI agents with custom data sources.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="col-span-1 h-[fit-content]">
          <CardHeader>
            <CardTitle className="text-lg">Select Agent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoadingAgents ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              agents?.map((agent: any) => (
                <Button 
                  key={agent._id} 
                  variant={selectedAgent === agent._id ? 'default' : 'ghost'} 
                  className="w-full justify-start"
                  onClick={() => setSelectedAgent(agent._id)}
                >
                  <Bot className="mr-2 h-4 w-4" />
                  {agent.name}
                </Button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Data Sources</CardTitle>
            <CardDescription>Upload files or add links to train the selected agent.</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedAgent ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed text-muted-foreground">
                <Database className="h-12 w-12 mb-4 text-muted" />
                <h3 className="text-lg font-medium text-foreground">No Agent Selected</h3>
                <p className="mt-1 text-sm">Please select an agent from the sidebar to manage its knowledge base.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex space-x-2">
                  <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Upload PDF</Button>
                  <Button variant="outline"><LinkIcon className="mr-2 h-4 w-4" /> Add URL</Button>
                  <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Text</Button>
                </div>
                <div className="border rounded-md p-8 text-center text-muted-foreground border-dashed">
                  No data sources added for this agent yet.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
