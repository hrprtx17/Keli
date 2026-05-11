'use client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export default function AgentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${id}`);
      if (!res.ok) throw new Error('Failed to fetch agent');
      return res.json();
    }
  });

  if (isLoading) {
    return <DashboardLayout><div className="p-8 text-muted-foreground">Loading agent...</div></DashboardLayout>;
  }

  if (!agent) {
    return <DashboardLayout><div className="p-8 text-muted-foreground">Agent not found</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
          <p className="text-muted-foreground mt-1">Manage and configure this agent.</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="widget">Widget</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agent.totalConversations}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agent.totalMessages}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Model</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{agent.model}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>Train your agent by uploading PDFs, adding URLs, or pasting text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button variant="outline">Upload PDF</Button>
                <Button variant="outline">Add URL</Button>
                <Button variant="outline">Add Text</Button>
              </div>
              <div className="border border-dashed rounded-md p-8 text-center text-muted-foreground">
                No data sources added yet.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="widget" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Widget Configuration</CardTitle>
                <CardDescription>Customize how the widget appears on your website.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input type="color" className="w-12 h-10 p-1 bg-background" defaultValue={agent.widgetConfig?.primaryColor || '#F97316'} />
                    <Input defaultValue={agent.widgetConfig?.primaryColor || '#F97316'} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Welcome Message</Label>
                  <Input defaultValue={agent.widgetConfig?.welcomeMessage || 'Hello! How can I help you today?'} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Branding</Label>
                  <Switch defaultChecked={agent.widgetConfig?.showBranding !== false} />
                </div>
                <Button className="w-full">Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Embed Code</CardTitle>
                <CardDescription>Copy and paste this snippet before the closing body tag.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm text-muted-foreground">
{`<script 
  src="https://agentdesk.vercel.app/widget/embed.js"
  data-agent="${agent._id}"
  data-color="${agent.widgetConfig?.primaryColor || '#F97316'}">
</script>`}
                  </pre>
                  <Button variant="secondary" className="absolute top-2 right-2 h-8 text-xs">Copy</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input defaultValue={agent.name} />
              </div>
              <div className="space-y-2">
                <Label>System Prompt (Instructions)</Label>
                <textarea 
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="You are a helpful customer support assistant..."
                  defaultValue={agent.systemPrompt}
                />
              </div>
              <Button>Save Settings</Button>
            </CardContent>
          </Card>
          
          <Card className="border-destructive border">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Deleting this agent will permanently remove it and all its associated knowledge base data.</p>
              <Button variant="destructive">Delete Agent</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
