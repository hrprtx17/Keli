'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

function ChatWidgetContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agent');
  
  const [messages, setMessages] = useState<{role: 'user'|'agent', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (agentId) {
      fetch(`/api/widget/config?agent=${agentId}`)
        .then(res => res.json())
        .then(data => {
          if (data.welcomeMessage) {
            setMessages([{ role: 'agent', text: data.welcomeMessage }]);
          }
        });
    }
  }, [agentId]);

  const handleSend = async () => {
    if (!input.trim() || !agentId) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/widget/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agentId, 
          message: userMessage,
          conversationId
        })
      });
      
      const data = await res.json();
      
      if (data.conversationId) setConversationId(data.conversationId);
      
      setMessages(prev => [...prev, { 
        role: 'agent', 
        text: data.reply || 'Sorry, an error occurred.' 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'agent', text: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background font-sans">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
              m.role === 'user' 
                ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                : 'bg-muted text-foreground rounded-tl-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground rounded-2xl rounded-tl-sm px-4 py-2">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 bg-background border-t border-border">
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex space-x-2">
          <Input 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-full border-border bg-background focus-visible:ring-primary"
            disabled={loading || !agentId}
          />
          <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={loading || !input.trim() || !agentId}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <div className="text-center mt-2">
          <a href="https://agentdesk.vercel.app" target="_blank" className="text-[10px] text-muted-foreground hover:underline">
            Powered by AgentDesk
          </a>
        </div>
      </div>
    </div>
  );
}

export default function WidgetChatPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <ChatWidgetContent />
    </Suspense>
  );
}
