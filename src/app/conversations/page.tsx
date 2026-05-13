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
      <div className="max-w-5xl mx-auto pb-16 space-y-8">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-orange-600 tracking-wider uppercase mb-2">
            INTERACTIONS
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">Inbox</h1>
          <p className="text-[14px] text-gray-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
            Review and manage your active AI conversational sessions.
          </p>
        </div>

        {/* Content Wrapper */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-[24px] shadow-sm overflow-hidden">
          
          <div className="border-b border-gray-100 dark:border-zinc-800 px-6 py-4 bg-gray-50/30 dark:bg-zinc-950/20 flex items-center justify-between">
             <h2 className="text-[14px] font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-orange-500" />
                Recent Activity
             </h2>
             {!isLoading && conversations && conversations.length > 0 && (
               <span className="text-[11px] font-semibold tracking-wide uppercase bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-full border border-orange-100 dark:border-orange-900/30">
                 {conversations.length} Total Sessions
               </span>
             )}
          </div>

          <div className="p-2 sm:p-3">
            {isLoading ? (
              <div className="space-y-3 p-3">
                {[1, 2, 3].map(i => (
                   <div key={i} className="h-16 rounded-xl bg-gray-50 dark:bg-zinc-800/40 animate-pulse" />
                ))}
              </div>
            ) : !conversations?.length ? (
              <div className="flex flex-col items-center py-20 text-center p-6">
                <div className="w-14 h-14 bg-gray-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-gray-300 dark:text-zinc-600">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-[15px] font-medium text-gray-900 dark:text-zinc-100">No conversations yet</h3>
                <p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-1 max-w-[280px]">
                   Conversations will populate dynamically as users begin chatting with your deployed widget.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv: any) => (
                  <div 
                    key={conv._id} 
                    className="flex items-center gap-4 p-3.5 hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 rounded-xl transition-all cursor-pointer group border border-transparent hover:border-gray-100 dark:hover:border-zinc-800/50"
                  >
                    <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-[1.02] transition-transform">
                      <Bot className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                         <p className="font-semibold text-[14px] text-gray-900 dark:text-zinc-100">
                            Session {conv.sessionId?.slice(-8) || conv._id.slice(-8)}
                         </p>
                         <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold capitalize tracking-wide border ${
                            conv.source === 'widget' 
                              ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30' 
                              : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700'
                         }`}>
                            {conv.source || 'widget'}
                         </span>
                      </div>
                      
                      <p className="text-[12px] text-gray-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                        <span>{new Date(conv.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        <span className="text-gray-300 dark:text-zinc-700 font-light">•</span>
                        <span>{conv.messageCount || 0} messages</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                       <div className="opacity-0 group-hover:opacity-100 text-[12px] font-medium text-orange-500 transition-opacity pr-2 hidden sm:block">
                          Inspect logs
                       </div>
                       <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-800 group-hover:bg-white dark:group-hover:bg-zinc-700 border border-gray-100 dark:border-zinc-750 flex items-center justify-center text-gray-400 dark:text-zinc-500 group-hover:text-gray-900 dark:group-hover:text-zinc-100 shadow-sm group-hover:shadow transition-all">
                          <ArrowRight className="h-4 w-4" />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
