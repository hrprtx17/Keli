'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { 
  Inbox, 
  Search, 
  Clock, 
  UserCircle, 
  Mail, 
  Bot, 
  Copy, 
  Check, 
  ChevronLeft, 
  MessageSquare,
  AlertCircle,
  FileText,
  Bookmark,
  Play,
  RotateCw,
  Send,
  Sparkles,
  Layers,
  HelpCircle,
  MonitorPlay,
  ArrowRight,
  ExternalLink,
  Laptop
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

interface Agent {
  _id: string
  name: string
  model?: string
  welcomeMessage?: string
}

export default function InboxDashboardPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  // Layout View Mode: 'inbox' (customer chats) or 'playground' (AI preview sandbox)
  const [viewMode, setViewMode] = useState<'inbox' | 'playground'>('inbox')

  // Inbox State
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeFilter, setActiveFilter] = useState<'all' | 'widget' | 'preview'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showMobileDetail, setShowMobileDetail] = useState(false)
  const [viewedSessionIds, setViewedSessionIds] = useState<Set<string>>(new Set())

  // AI Preview Sandbox State
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [sandboxMessages, setSandboxMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [sandboxInput, setSandboxInput] = useState('')
  const [isSandboxSending, setIsSandboxSending] = useState(false)
  const [sandboxConvId, setSandboxConvId] = useState<string | null>(null)

  const messageEndRef = useRef<HTMLDivElement>(null)
  const sandboxEndRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    sandboxEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sandboxMessages])

  // AI Sandbox Chat Simulator handler
  const resetSandboxChat = (agent: Agent) => {
    setSandboxMessages([
      { role: 'assistant', content: agent.welcomeMessage || `Hi! I'm ${agent.name}. How can I assist you today?` }
    ])
    setSandboxInput('')
    setSandboxConvId(null)
  }

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

  // Fetch agents for Sandbox Preview
  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents')
      if (!res.ok) return
      const data = await res.json()
      setAgents(data || [])
      if (data && data.length > 0) {
        setSelectedAgent(data[0])
        resetSandboxChat(data[0])
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (session) {
      fetchConversations()
      fetchAgents()
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

    // Active tab filters
    if (activeFilter === 'widget') {
      list = list.filter(c => c.source === 'widget')
    } else if (activeFilter === 'preview') {
      list = list.filter(c => c.source !== 'widget')
    }

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
  }, [conversations, activeFilter, searchQuery])



  const handleSendSandboxMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sandboxInput.trim() || !selectedAgent || isSandboxSending) return

    const promptText = sandboxInput.trim()
    setSandboxInput('')
    
    // Add user message immediately
    const nextMessages = [...sandboxMessages, { role: 'user' as const, content: promptText }]
    setSandboxMessages(nextMessages)
    setIsSandboxSending(true)

    try {
      const payload: any = {
        messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
        agentId: selectedAgent._id
      }
      if (sandboxConvId) {
        payload.conversationId = sandboxConvId
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'AI request failed')
      }

      const data = await res.json()
      setSandboxMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Sorry, no response returned.' }])
      if (data.conversationId) {
        setSandboxConvId(data.conversationId)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'AI engine error. Please check your system credits.')
      setSandboxMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Service error: Please confirm your Groq API keys and credit usage.' }])
    } finally {
      setIsSandboxSending(false)
    }
  }

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
        <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
          <RotateCw className="w-8 h-8 animate-spin text-[#FF6B35]" />
        </div>
      </DashboardLayout>
    )
  }

  if (!session) return null

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-100px)] max-w-7xl mx-auto space-y-4 antialiased">
        
        {/* HEADER TOOLBAR & TAB PICKER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-150 tracking-tight flex items-center gap-2">
              <Inbox className="w-6 h-6 text-[#FF6B35]" />
              Inbox
            </h1>
            <p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-0.5">
              Review visitor interactions, widget chats, and simulate agent behavior.
            </p>
          </div>

          {/* Switch Mode Tab Selector */}
          <div className="flex bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-1 rounded-xl gap-1">
            <button
              onClick={() => setViewMode('inbox')}
              className={`flex items-center gap-2 py-1.5 px-4 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'inbox'
                  ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-zinc-350'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Live Widget Chats
            </button>
            
            <button
              onClick={() => setViewMode('playground')}
              className={`flex items-center gap-2 py-1.5 px-4 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'playground'
                  ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-zinc-350'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" />
              AI Preview Sandbox
            </button>
          </div>
        </div>

        {/* MAIN DISPLAY VIEW */}
        {viewMode === 'inbox' ? (
          /* ========================================================================= */
          /*                       MODE 1: LIVE CHATS VIEW                             */
          /* ========================================================================= */
          <div className="flex-1 flex gap-5 overflow-hidden">
            
            {/* LEFT SIDEBAR: ALL SESSIONS LIST */}
            <div className={`w-full md:w-[320px] lg:w-[380px] shrink-0 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-xs ${selectedConversation && showMobileDetail ? 'hidden md:flex' : 'flex'}`}>
              
              {/* Header inside sidebar */}
              <div className="p-4 border-b border-gray-100 dark:border-zinc-800 space-y-3 flex-shrink-0 bg-gray-50/30 dark:bg-zinc-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    Conversations
                  </span>
                  <button
                    onClick={() => fetchConversations(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-450 hover:text-[#FF6B35] rounded-md transition-colors"
                    title="Reload conversations"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sub-Filters: All | User Widget | AI Preview */}
                <div className="flex bg-gray-100 dark:bg-zinc-950 p-0.5 rounded-lg text-[11px] font-semibold gap-0.5">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'widget', label: 'Widget' },
                    { id: 'preview', label: 'Playground' }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id as any)}
                      className={`flex-1 py-1 rounded-md text-center transition-all ${
                        activeFilter === filter.id
                          ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-2xs'
                          : 'text-gray-500 hover:text-gray-900 dark:hover:text-zinc-400'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by session or customer info..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-gray-255 dark:border-zinc-800 rounded-lg outline-hidden focus:border-[#FF6B35] transition-all text-gray-800 dark:text-zinc-200 placeholder:text-gray-450"
                  />
                </div>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-zinc-800">
                {isLoadingList ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4 flex flex-col gap-2 animate-pulse border-b border-gray-100 dark:border-zinc-800">
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded w-1/3" />
                        <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-10" />
                      </div>
                      <div className="h-3.5 bg-gray-100 dark:bg-zinc-800 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded w-1/2" />
                    </div>
                  ))
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 py-20 text-center">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-zinc-950 rounded-2xl flex items-center justify-center mb-3 border border-gray-100 dark:border-zinc-800 text-gray-300">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <h3 className="text-xs font-bold text-gray-700 dark:text-zinc-350">No chat sessions</h3>
                    <p className="text-[10.5px] text-gray-400 dark:text-zinc-500 mt-1 max-w-[200px] leading-relaxed">
                      Widget interactions and test playground logs will appear here
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv: Conversation) => {
                    const isSelected = selectedConversation?._id === conv._id
                    const isUnread = !viewedSessionIds.has(conv._id)
                    
                    return (
                      <div
                        key={conv._id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`relative p-4 cursor-pointer text-left transition-all border-b border-gray-100 dark:border-zinc-800/80 ${
                          isSelected
                            ? 'bg-[#FFF5F0] dark:bg-orange-950/10'
                            : 'hover:bg-gray-50/50 dark:hover:bg-zinc-900/30'
                        }`}
                      >
                        {/* Status side bar indicator */}
                        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                          isSelected ? 'bg-[#FF6B35]' : 'bg-transparent'
                        }`} />

                        {/* Unread Indicator Dot */}
                        {isUnread && (
                          <span className="absolute top-4 right-4 w-2 h-2 bg-[#FF6B35] rounded-full shrink-0" />
                        )}

                        <div className="flex justify-between items-start gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-gray-900 dark:text-zinc-200">
                            {conv.sessionId?.slice(-8) || conv._id?.slice(-8)}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                            {timeAgo(conv.createdAt)}
                          </span>
                        </div>

                        <div className="text-xs font-medium text-gray-550 dark:text-zinc-400 truncate mb-2">
                          {conv.customerEmail || conv.customerName || 'Anonymous Visitor'}
                        </div>

                        <div className="flex items-center justify-between gap-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                            conv.source === 'widget'
                              ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30'
                              : 'bg-zinc-100 text-zinc-650 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-350 dark:border-zinc-700'
                          }`}>
                            {conv.source || 'widget'}
                          </span>
                          
                          <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                            {conv.messageCount || 0} messages
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

            </div>

            {/* RIGHT WORKSPACE: ACTIVE CONVERSATION DETAILS & TRANSCRIPT */}
            <div className={`flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-xs ${!selectedConversation || !showMobileDetail ? 'hidden md:flex' : 'flex'}`}>
              {selectedConversation ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  
                  {/* Top Header Card */}
                  <div className="p-4 border-b border-gray-150 dark:border-zinc-800 bg-gray-50/20 dark:bg-zinc-950/20 flex items-center justify-between gap-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowMobileDetail(false)}
                        className="p-1 border border-gray-250 dark:border-zinc-800 rounded-md md:hidden text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 font-mono">
                            Session: {selectedConversation.sessionId}
                          </h3>
                          <button
                            onClick={() => handleCopy(selectedConversation.sessionId, 'Session ID')}
                            className="text-gray-400 hover:text-gray-900 dark:hover:text-zinc-200 p-0.5"
                          >
                            {copiedField === selectedConversation.sessionId ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400 dark:text-zinc-500 font-medium">
                          <span>Source: <strong className="capitalize">{selectedConversation.source}</strong></span>
                          <span>•</span>
                          <span>Created {new Date(selectedConversation.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-green-600 dark:text-green-400">
                        {selectedConversation.status || 'open'}
                      </span>
                    </div>
                  </div>

                  {/* Transcript Scroll Area */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-50/25 dark:bg-zinc-950/5 flex flex-col space-y-4">
                    {isLoadingMessages ? (
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <RotateCw className="w-6 h-6 animate-spin text-[#FF6B35]" />
                        <span className="text-xs text-gray-400 mt-2 font-medium">Loading session transcript...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
                        <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                        <h4 className="text-xs font-bold">No recorded messages</h4>
                        <p className="text-[10.5px] mt-1">This chat session has not recorded any text exchange yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 flex-1">
                        {messages.map((msg, index) => {
                          const isUser = msg.role === 'user'
                          return (
                            <div
                              key={msg._id || index}
                              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                            >
                              <span className="text-[9px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest font-bold mb-1">
                                {isUser ? 'Visitor' : 'AI Agent'}
                              </span>
                              <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed max-w-[80%] break-words shadow-2xs ${
                                isUser
                                  ? 'bg-[#FF6B35] text-white rounded-tr-none'
                                  : 'bg-white dark:bg-zinc-800 border border-gray-150 dark:border-zinc-800 text-gray-800 dark:text-zinc-200 rounded-tl-none'
                              }`}>
                                {msg.content}
                              </div>
                              <span className="text-[9px] text-gray-400 mt-1 font-medium">
                                {timeAgo(msg.createdAt)}
                              </span>
                            </div>
                          )
                        })}
                        <div ref={messageEndRef} />
                      </div>
                    )}
                  </div>

                  {/* Metadata and Stats card footer */}
                  <div className="p-4 border-t border-gray-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 grid grid-cols-2 md:grid-cols-4 gap-3 text-left text-xs font-medium">
                    <div className="bg-gray-50/50 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-gray-150 dark:border-zinc-800/80 shadow-3xs">
                      <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Customer Name</span>
                      <span className="text-gray-800 dark:text-zinc-200 mt-1 block truncate">
                        {selectedConversation.customerName || 'Anonymous'}
                      </span>
                    </div>

                    <div className="bg-gray-50/50 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-gray-150 dark:border-zinc-800/80 shadow-3xs flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Customer Email</span>
                        <span className="text-gray-800 dark:text-zinc-200 mt-1 block truncate">
                          {selectedConversation.customerEmail || 'none'}
                        </span>
                      </div>
                      {selectedConversation.customerEmail && (
                        <button
                          onClick={() => handleCopy(selectedConversation.customerEmail!, 'Email')}
                          className="text-gray-400 hover:text-gray-900 p-0.5"
                        >
                          {copiedField === selectedConversation.customerEmail ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>

                    <div className="bg-gray-50/50 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-gray-150 dark:border-zinc-800/80 shadow-3xs">
                      <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">AI Model Assigned</span>
                      <span className="text-gray-800 dark:text-zinc-200 mt-1 block truncate flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5 text-[#FF6B35]" />
                        Llama 3.1
                      </span>
                    </div>

                    <div className="bg-gray-50/50 dark:bg-zinc-950/40 p-2.5 rounded-lg border border-gray-150 dark:border-zinc-800/80 shadow-3xs">
                      <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Platform Context</span>
                      <span className="text-gray-800 dark:text-zinc-200 mt-1 block truncate capitalize">
                        {selectedConversation.source || 'web widget'}
                      </span>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 text-gray-400 rounded-full flex items-center justify-center mb-3 shadow-3xs">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-200">Inspect Conversational Sessions</h3>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 max-w-[240px] leading-relaxed">
                    Select a conversation on the left to read customer questions and AI replies in real-time.
                  </p>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /*                    MODE 2: AI PLAYGROUND SANDBOX                          */
          /* ========================================================================= */
          <div className="flex-1 flex gap-5 overflow-hidden">
            
            {/* LEFT SELECTOR: CHOOSE AI AGENT TO PREVIEW */}
            <div className="w-full md:w-[300px] lg:w-[340px] shrink-0 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-xs">
              
              <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex-shrink-0 bg-gray-50/30 dark:bg-zinc-950/20 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35] block mb-1">
                  Agent Preview Configuration
                </span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-200">
                  Select AI Agent to Test
                </h3>
              </div>

              {/* Agents list select */}
              <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-2">
                {agents.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400">
                    No agents found. Create one first!
                  </div>
                ) : (
                  agents.map(agent => {
                    const isSelected = selectedAgent?._id === agent._id
                    return (
                      <div
                        key={agent._id}
                        onClick={() => {
                          setSelectedAgent(agent)
                          resetSandboxChat(agent)
                        }}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#FFF5F0] border-[#FF6B35] dark:bg-orange-950/10 dark:border-orange-500/80 shadow-2xs'
                            : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50/50 dark:hover:bg-zinc-900/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Bot className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#FF6B35]' : 'text-gray-400'}`} />
                          <span className="font-bold text-xs text-gray-800 dark:text-zinc-200 truncate flex-1">
                            {agent.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 truncate">
                          Engine: {agent.model || 'Llama 3.1 8B'}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Informative info footer */}
              <div className="p-3 bg-gray-50 dark:bg-zinc-950/30 border-t border-gray-100 dark:border-zinc-800 text-[11px] text-gray-400 text-left leading-relaxed flex gap-2">
                <HelpCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>
                  The sandbox lets you converse instantly with your trained agent. This simulates the exact live widget behavior.
                </span>
              </div>

            </div>

            {/* RIGHT SIDEBAR: SANDBOX SIMULATOR GRAPHICS */}
            <div className="flex-1 bg-[#FAFAFA] dark:bg-zinc-950/10 border border-gray-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center p-4">
              
              {/* WIDGET PHONE SIMULATOR SHELL */}
              <div className="w-full max-w-[380px] h-[520px] bg-white dark:bg-zinc-900 border-4 border-gray-800 dark:border-zinc-800 rounded-[32px] flex flex-col shadow-2xl overflow-hidden relative">
                
                {/* Simulator speaker camera header notch */}
                <div className="w-32 h-4 bg-gray-800 dark:bg-zinc-800 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-50 flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-650" />
                  <span className="w-8 h-1 bg-zinc-650 rounded-full" />
                </div>

                {/* Simulated Widget Top Header */}
                <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C64] p-4 pt-6 text-white text-left flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-white/20 backdrop-blur-xs rounded-full flex items-center justify-center shadow-2xs shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate leading-tight">
                        {selectedAgent?.name || 'Support Agent'}
                      </h4>
                      <span className="text-[9px] text-orange-100 font-medium flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full shrink-0 animate-ping" />
                        AI Online
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (selectedAgent) resetSandboxChat(selectedAgent)
                    }} 
                    className="p-1 hover:bg-white/10 rounded-md text-white"
                    title="Reset Simulator Chat"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Simulated Chat Feed viewport */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-[#FCFCFD] dark:bg-zinc-950/20 flex flex-col">
                  {sandboxMessages.map((msg, index) => {
                    const isUser = msg.role === 'user'
                    return (
                      <div
                        key={index}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`px-3.5 py-2.5 rounded-xl text-xs max-w-[85%] break-words leading-relaxed shadow-3xs ${
                          isUser
                            ? 'bg-[#FF6B35] text-white rounded-tr-none'
                            : 'bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 text-gray-800 dark:text-zinc-200 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    )
                  })}
                  
                  {isSandboxSending && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                      <Bot className="w-3.5 h-3.5 text-[#FF6B35] animate-bounce shrink-0" />
                      <span>Agent is searching knowledge & replying...</span>
                    </div>
                  )}
                  <div ref={sandboxEndRef} />
                </div>

                {/* Simulated Input Bar Footer */}
                <form 
                  onSubmit={handleSendSandboxMessage}
                  className="p-2.5 bg-white dark:bg-zinc-900 border-t border-gray-150 dark:border-zinc-800 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={sandboxInput}
                    onChange={e => setSandboxInput(e.target.value)}
                    placeholder="Type message to test AI..."
                    disabled={isSandboxSending}
                    className="flex-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-zinc-950 border border-gray-255 dark:border-zinc-800 rounded-xl outline-hidden focus:border-[#FF6B35] transition-all text-gray-850 dark:text-zinc-250 placeholder:text-gray-450"
                  />
                  <button
                    type="submit"
                    disabled={!sandboxInput.trim() || isSandboxSending}
                    className="w-7 h-7 bg-[#FF6B35] hover:bg-[#FF6B35]/95 disabled:bg-gray-200 dark:disabled:bg-zinc-800 text-white rounded-full flex items-center justify-center shrink-0 shadow-2xs hover:shadow transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

              </div>

            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
