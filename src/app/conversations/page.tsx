'use client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Clock, ArrowRight, Bot } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function ConversationsPage() {
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await fetch('/api/conversations');
      if (!res.ok) return [];
      return res.json();
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All AI-customer chat sessions across your agents.</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Conversations</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
              </div>
            ) : !conversations?.length ? (
              <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mb-3 text-muted" />
                <h3 className="font-semibold text-foreground">No conversations yet</h3>
                <p className="text-sm mt-1">Conversations will appear after users chat with your widget.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {conversations.map((conv: any) => (
                  <div key={conv._id} className="flex items-center gap-4 py-4 hover:bg-muted/30 px-2 rounded-lg transition-colors">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">Session {conv.sessionId?.slice(-8) || conv._id.slice(-8)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(conv.createdAt).toLocaleString()} · {conv.messageCount || 0} messages
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${conv.source === 'widget' ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                      {conv.source || 'widget'}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
