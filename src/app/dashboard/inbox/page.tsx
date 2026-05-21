'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { 
  Inbox, 
  Search, 
  Bot, 
  Copy, 
  Check, 
  ChevronLeft, 
  MessageSquare,
  RotateCw,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface Conversation {
  _id: string
  agentId: string
  workspaceId: string
  sessionId: string
  customerEmail?: string
  customerName?: string
  source: 'widget' | 'dashboard' | 'api'
  status: 'open' | 'resolved'
  messageCount: number
  createdAt: string
  updatedAt: string
}

interface Message {
  _id: string
  conversationId: string
  agentId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

export default function InboxDashboardPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  // Inbox State
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showMobileDetail, setShowMobileDetail] = useState(false)
  const [viewedSessionIds, setViewedSessionIds] = useState<Set<string>>(new Set())

  const messageEndRef = useRef<HTMLDivElement>(null)

  // Redirect if unauthenticated
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace('/login')
    }
  }, [sessionStatus, router])

  // Load viewed conversations from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('keli_viewed_sessions')
      if (stored) {
        setViewedSessionIds(new Set(JSON.parse(stored)))
      }
    } catch (e) {}
  }, [])

  // Auto-scroll messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch all conversations
  const fetchConversations = async (silent = false) => {
    if (!silent) setIsLoadingList(true)
    try {
      const res = await fetch('/api/conversations')
      if (!res.ok) throw new Error('Failed to retrieve conversations')
      const data = await res.json()
      setConversations(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to sync conversations list')
    } finally {
      if (!silent) setIsLoadingList(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchConversations()
    }
  }, [session])

  // Poll conversations every 30 seconds
  useEffect(() => {
    if (!session) return
    const interval = setInterval(() => {
      fetchConversations(true)
    }, 30000)
    return () => clearInterval(interval)
  }, [session])

  // Mark session as viewed when clicked
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    setShowMobileDetail(true)
    
    setViewedSessionIds(prev => {
      const next = new Set(prev)
      if (!next.has(conv._id)) {
        next.add(conv._id)
        try {
          localStorage.setItem('keli_viewed_sessions', JSON.stringify(Array.from(next)))
        } catch (e) {}
      }
      return next
    })
  }

  // Load message logs for selected conversation
  useEffect(() => {
    if (!selectedConversation) return

    const loadMessages = async () => {
      setIsLoadingMessages(true)
      try {
        const res = await fetch(`/api/conversations?conversationId=${selectedConversation._id}`)
        if (!res.ok) throw new Error('Failed to load message history')
        const data = await res.json()
        setMessages(data || [])
      } catch (err) {
        console.error(err)
        toast.error('Failed to load message transcript')
      } finally {
        setIsLoadingMessages(false)
      }
    }

    loadMessages()
  }, [selectedConversation])

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(text)
    toast.success(`${label} copied to clipboard`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Local client side filtering & search
  const filteredConversations = useMemo(() => {
    let list = [...conversations]
    
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(c => 
        c.sessionId.toLowerCase().includes(q) ||
        (c.customerName || '').toLowerCase().includes(q) ||
        (c.customerEmail || '').toLowerCase().includes(q) ||
        c._id.toLowerCase().includes(q)
      )
    }
    return list
  }, [conversations, searchQuery])

  // Relative time helper
  const timeAgo = (dateStr: string) => {
    if (!dateStr) return ''
    const now = new Date()
    const then = new Date(dateStr)
    const diffMs = now.getTime() - then.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHr = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHr / 24)

    if (diffSec < 60) return 'just now'
    if (diffMin < 60) return `${diffMin}m`
    if (diffHr < 24) return `${diffHr}h`
    if (diffDays === 1) return 'yesterday'
    return `${diffDays}d`
  }

  if (sessionStatus === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
          <RotateCw className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </DashboardLayout>
    )
  }

  if (!session) return null

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-60px)] max-w-[1400px] mx-auto px-4 py-6 antialiased font-jakarta">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-3">
              <Inbox className="w-7 h-7 text-orange-500" />
              Inbox
            </h1>
            <p className="text-[14px] text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
              Manage and review your live customer interactions in real-time.
            </p>
          </div>
        </div>

        {/* MAIN DISPLAY VIEW */}
        <div className="flex-1 flex gap-6 overflow-hidden rounded-3xl bg-white dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
          
          {/* LEFT SIDEBAR: ALL SESSIONS LIST */}
          <div className={`w-full md:w-[360px] shrink-0 border-r border-zinc-200/60 dark:border-zinc-800/60 flex flex-col overflow-hidden ${selectedConversation && showMobileDetail ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Header inside sidebar */}
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/60 space-y-4 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/20">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search interactions..."
                  className="w-full pl-10 pr-4 py-2.5 text-[13px] font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 shadow-sm"
                />
              </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {isLoadingList ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-5 flex flex-col gap-3 animate-pulse border-b border-zinc-100 dark:border-zinc-800/50">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/3" />
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-10" />
                    </div>
                    <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-2/3" />
                  </div>
                ))
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 py-20 text-center h-full">
                  <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-200/50 dark:border-zinc-800 shadow-sm text-zinc-400">
                    <Inbox className="w-7 h-7 opacity-50" />
                  </div>
                  <h3 className="text-[14px] font-bold text-zinc-700 dark:text-zinc-300">No active sessions</h3>
                  <p className="text-[12px] text-zinc-400 dark:text-zinc-500 mt-1.5 max-w-[200px] leading-relaxed">
                    Customer conversations will appear here instantly.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv: Conversation) => {
                  const isSelected = selectedConversation?._id === conv._id
                  const isUnread = !viewedSessionIds.has(conv._id)
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={conv._id}
                      onClick={() => handleSelectConversation(conv)}
                      className={`relative p-5 cursor-pointer text-left transition-all ${
                        isSelected
                          ? 'bg-orange-50/50 dark:bg-orange-500/[0.04]'
                          : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30'
                      }`}
                    >
                      {isSelected && (
                        <motion.div 
                          layoutId="active-indicator"
                          className="absolute left-0 top-0 bottom-0 w-[4px] bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)]" 
                        />
                      )}

                      {isUnread && !isSelected && (
                        <span className="absolute top-5 right-5 w-2 h-2 bg-orange-500 rounded-full shrink-0 shadow-sm" />
                      )}

                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span className="font-mono text-[12px] font-bold text-zinc-900 dark:text-zinc-200 tracking-tight">
                          #{conv.sessionId?.slice(-6) || conv._id?.slice(-6)}
                        </span>
                        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(conv.createdAt)}
                        </span>
                      </div>

                      <div className="text-[13.5px] font-semibold text-zinc-700 dark:text-zinc-300 truncate mb-3">
                        {conv.customerEmail || conv.customerName || 'Anonymous Visitor'}
                      </div>

                      <div className="flex items-center justify-between gap-1.5 mt-auto">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest border ${
                          conv.source === 'widget'
                            ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/40'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                        }`}>
                          {conv.source || 'widget'}
                        </span>
                        
                        <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                          {conv.messageCount || 0} msgs
                        </span>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>

          {/* RIGHT WORKSPACE: ACTIVE CONVERSATION DETAILS & TRANSCRIPT */}
          <div className={`flex-1 flex flex-col bg-zinc-50/30 dark:bg-zinc-950/20 overflow-hidden ${!selectedConversation || !showMobileDetail ? 'hidden md:flex' : 'flex'}`}>
            {selectedConversation ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                
                {/* Top Header Card */}
                <div className="px-6 py-5 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md flex items-center justify-between gap-4 shrink-0 shadow-sm relative z-10">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setShowMobileDetail(false)}
                      className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg md:hidden text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-xs"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[15px] font-extrabold text-zinc-900 dark:text-zinc-100 font-mono tracking-tight">
                          Session {selectedConversation.sessionId}
                        </h3>
                        <button
                          onClick={() => handleCopy(selectedConversation.sessionId, 'Session ID')}
                          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                          title="Copy Session ID"
                        >
                          {copiedField === selectedConversation.sessionId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-zinc-500 dark:text-zinc-400 font-medium">
                        <span className="flex items-center gap-1"><Bot className="w-3.5 h-3.5" /> AI Agent</span>
                        <span>•</span>
                        <span>{new Date(selectedConversation.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                      {selectedConversation.status || 'Active'}
                    </span>
                  </div>
                </div>

                {/* Transcript Scroll Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 flex flex-col relative">
                  {isLoadingMessages ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm z-10">
                      <RotateCw className="w-8 h-8 animate-spin text-orange-500" />
                      <span className="text-[13px] text-zinc-500 font-bold mt-4">Loading transcript...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                      <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-800 mb-4 text-zinc-300 dark:text-zinc-600">
                        <MessageSquare className="w-8 h-8" />
                      </div>
                      <h4 className="text-[14px] font-bold text-zinc-700 dark:text-zinc-300">No messages yet</h4>
                      <p className="text-[12.5px] mt-1.5 text-zinc-500 max-w-[250px]">The user hasn't sent any messages in this session.</p>
                    </div>
                  ) : (
                    <div className="space-y-5 pb-6">
                      {messages.map((msg, index) => {
                        const isUser = msg.role === 'user'
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            key={msg._id || index}
                            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                          >
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-extrabold mb-1.5 px-1">
                              {isUser ? (selectedConversation.customerName || 'Visitor') : 'AI Agent'}
                            </span>
                            <div className={`px-5 py-3.5 rounded-2xl text-[14px] font-medium leading-relaxed max-w-[80%] break-words shadow-sm ${
                              isUser
                                ? 'bg-orange-500 text-white rounded-tr-[4px]'
                                : 'bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-[4px]'
                            }`}>
                              {msg.content}
                            </div>
                            <span className="text-[10px] text-zinc-400 font-semibold mt-1.5 px-1">
                              {timeAgo(msg.createdAt)}
                            </span>
                          </motion.div>
                        )
                      })}
                      <div ref={messageEndRef} />
                    </div>
                  )}
                </div>

                {/* Metadata card footer */}
                <div className="p-4 border-t border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md grid grid-cols-2 lg:grid-cols-4 gap-3 text-left shrink-0">
                  <div className="bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-widest block mb-1">Name</span>
                    <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 block truncate">
                      {selectedConversation.customerName || 'Anonymous'}
                    </span>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs flex items-center justify-between group">
                    <div className="min-w-0">
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-widest block mb-1">Email</span>
                      <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 block truncate">
                        {selectedConversation.customerEmail || 'Not provided'}
                      </span>
                    </div>
                    {selectedConversation.customerEmail && (
                      <button
                        onClick={() => handleCopy(selectedConversation.customerEmail!, 'Email')}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-all p-1"
                      >
                        {copiedField === selectedConversation.customerEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-widest block mb-1">Model</span>
                    <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 block truncate flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-orange-500" />
                      Llama 3.1
                    </span>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-widest block mb-1">Source</span>
                    <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-200 block truncate capitalize">
                      {selectedConversation.source || 'Web Widget'}
                    </span>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/30 dark:bg-zinc-900/10">
                <div className="w-20 h-20 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 shadow-sm text-zinc-300 dark:text-zinc-600 rounded-full flex items-center justify-center mb-5">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-[16px] font-extrabold text-zinc-800 dark:text-zinc-200 tracking-tight">Select a conversation</h3>
                <p className="text-[13.5px] text-zinc-500 dark:text-zinc-400 mt-2 max-w-[280px] leading-relaxed">
                  Click on any chat session from the list to view the full transcript and customer details.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
