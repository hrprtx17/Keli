'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { 
  Inbox, 
  Search, 
  Clock, 
  User, 
  Mail, 
  Bot, 
  Copy, 
  Check, 
  ChevronLeft, 
  MessageSquare,
  AlertCircle,
  FileText,
  Bookmark,
  CheckCircle,
  Play,
  XCircle,
  Save,
  RotateCw
} from 'lucide-react'
import { toast } from 'sonner'

interface Ticket {
  _id: string
  agentId: string
  agentName: string
  sessionId: string
  visitorName: string
  visitorEmail: string
  subject: string
  description: string
  conversationHistory: Array<{ role: string, content: string }>
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  ownerId: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  agentNotes?: string
}

export default function InboxPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [notesText, setNotesText] = useState('')
  const [copiedId, setCopiedId] = useState(false)
  const [showMobileDetail, setShowMobileDetail] = useState(false)

  // Fetch Tickets
  const fetchTickets = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const statusParam = activeTab === 'all' ? 'all' : activeTab
      const res = await fetch(`/api/tickets?status=${statusParam}&page=${page}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      
      setTickets(data.tickets || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
      
      // Update selected ticket ref to stay fresh
      if (selectedTicket) {
        const updated = (data.tickets as Ticket[]).find(t => t._id === selectedTicket._id)
        if (updated) {
          setSelectedTicket(updated)
          setNotesText(updated.agentNotes || '')
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to reload tickets')
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  // Initial and reactive fetch
  useEffect(() => {
    fetchTickets()
  }, [activeTab, page])

  // Polling every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTickets(true)
    }, 60000)
    return () => clearInterval(interval)
  }, [activeTab, page, selectedTicket])

  // Reset selected ticket notes when selection changes
  useEffect(() => {
    if (selectedTicket) {
      setNotesText(selectedTicket.agentNotes || '')
    }
  }, [selectedTicket])

  // Filter local tickets based on search query
  const filteredTickets = tickets.filter(ticket => {
    const query = searchQuery.toLowerCase()
    return (
      ticket.visitorName.toLowerCase().includes(query) ||
      ticket.visitorEmail.toLowerCase().includes(query) ||
      ticket.subject.toLowerCase().includes(query) ||
      ticket.description.toLowerCase().includes(query)
    )
  })

  // Handle patch updates (optimistic update)
  const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    setIsUpdating(true)
    
    // Optimistic Update
    const prevTickets = [...tickets]
    const prevSelected = selectedTicket ? { ...selectedTicket } : null
    
    setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, ...updates } as Ticket : t))
    if (selectedTicket && selectedTicket._id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, ...updates } as Ticket : null)
    }

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!res.ok) throw new Error('Failed to update ticket')
      toast.success('Ticket updated successfully')
    } catch (err) {
      console.error(err)
      toast.error('Could not save changes. Reverting...')
      setTickets(prevTickets)
      setSelectedTicket(prevSelected)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle Save Notes
  const saveNotes = () => {
    if (!selectedTicket) return
    updateTicket(selectedTicket._id, { agentNotes: notesText })
  }

  // Copy Ticket ID helper
  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(true)
    toast.success('Ticket ID copied to clipboard')
    setTimeout(() => setCopiedId(false), 2000)
  }

  // Time format helper
  const timeAgo = (dateStr: string) => {
    const now = new Date()
    const then = new Date(dateStr)
    const diffMs = now.getTime() - then.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHr = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHr / 24)

    if (diffSec < 60) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    if (diffDays === 1) return 'yesterday'
    return `${diffDays}d ago`
  }

  // Status badge styling
  const getStatusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'open':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> Open</span>
      case 'in_progress':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> In Progress</span>
      case 'resolved':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Resolved</span>
      case 'closed':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-gray-150 dark:border-zinc-700"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Closed</span>
    }
  }

  // Priority badge styling
  const getPriorityBadge = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-150 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50">High</span>
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">Medium</span>
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-650 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">Low</span>
    }
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-900 rounded-[32px] overflow-hidden shadow-xl">
        
        {/* LEFT PANEL: Ticket List */}
        <div className={`w-full md:w-[380px] flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-zinc-900 ${showMobileDetail ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-zinc-900 bg-[#FAFAFA]/50 dark:bg-zinc-950/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-500 tracking-tight">Inbox</h1>
                {total > 0 && (
                  <span className="bg-orange-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {total}
                  </span>
                )}
              </div>
              <button 
                onClick={() => fetchTickets(false)} 
                className="p-2 text-gray-400 hover:text-orange-500 hover:bg-gray-50 dark:hover:bg-zinc-900 rounded-lg transition-all"
                title="Refresh Tickets"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-gray-100 dark:bg-zinc-900 p-0.5 rounded-xl text-[12px] font-medium overflow-x-auto scrollbar-none">
              {(['all', 'open', 'in_progress', 'resolved'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setPage(1); }}
                  className={`flex-1 py-1.5 px-3 rounded-lg capitalize whitespace-nowrap transition-all ${
                    activeTab === tab 
                      ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm font-semibold' 
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab === 'in_progress' ? 'In Progress' : tab}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search visitor, email, subject..."
                className="w-full pl-9 pr-4 py-2 text-[13px] bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-xl outline-none focus:border-orange-500 dark:focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-gray-800 dark:text-zinc-200 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Ticket Row List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-zinc-900">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="p-5 animate-pulse space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-150 dark:bg-zinc-800 rounded w-1/2" />
                    <div className="h-3 bg-gray-150 dark:bg-zinc-800 rounded w-1/4" />
                  </div>
                  <div className="h-3.5 bg-gray-150 dark:bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 dark:bg-zinc-850 rounded w-5/6" />
                </div>
              ))
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 py-20 text-center text-gray-400 dark:text-zinc-600">
                <div className="w-14 h-14 bg-gray-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 text-gray-300 dark:text-zinc-700">
                  <Inbox className="w-7 h-7" />
                </div>
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-zinc-300">No tickets yet</h3>
                <p className="text-[12px] text-gray-500 dark:text-zinc-500 mt-1 max-w-[240px]">
                  When visitors request human support via the chat widget, new tickets will appear here.
                </p>
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const isSelected = selectedTicket?._id === ticket._id
                return (
                  <div
                    key={ticket._id}
                    onClick={() => {
                      setSelectedTicket(ticket)
                      setShowMobileDetail(true)
                    }}
                    className={`p-5 cursor-pointer text-left transition-all border-l-3 ${
                      isSelected
                        ? 'bg-orange-50/20 dark:bg-orange-950/10 border-orange-500'
                        : 'border-transparent hover:bg-gray-50/50 dark:hover:bg-zinc-900/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="font-bold text-[14px] text-gray-900 dark:text-zinc-200 truncate flex-1">
                        {ticket.visitorName}
                      </div>
                      <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium shrink-0">
                        {timeAgo(ticket.createdAt)}
                      </span>
                    </div>

                    <div className="text-[12px] text-gray-500 dark:text-zinc-400 truncate mb-2">
                      {ticket.visitorEmail}
                    </div>

                    <div className="text-[13px] font-medium text-gray-800 dark:text-zinc-300 truncate mb-3">
                      {ticket.subject}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          ticket.status === 'open' ? 'bg-orange-500' :
                          ticket.status === 'in_progress' ? 'bg-blue-500' :
                          ticket.status === 'resolved' ? 'bg-green-500' : 'bg-gray-500'
                        }`} />
                        <span className="text-[11px] font-semibold text-gray-600 dark:text-zinc-400 capitalize">
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                      {ticket.agentName && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border border-gray-150 dark:border-zinc-700/60 max-w-[120px] truncate">
                          🤖 {ticket.agentName}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 dark:border-zinc-900 bg-[#FAFAFA]/30 dark:bg-zinc-950/20 flex items-center justify-between">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-[12px] font-semibold disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-zinc-900"
              >
                Previous
              </button>
              <span className="text-[12px] text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-[12px] font-semibold disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-zinc-900"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Ticket Details */}
        <div className={`flex-1 flex flex-col min-w-0 bg-[#FCFCFD] dark:bg-zinc-950/30 ${showMobileDetail ? 'flex' : 'hidden md:flex'}`}>
          {selectedTicket ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* DETAIL TOP BAR */}
              <div className="p-6 border-b border-gray-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileDetail(false)}
                    className="p-1.5 border border-gray-200 dark:border-zinc-800 rounded-lg md:hidden text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-900"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0 text-left">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 truncate">
                      {selectedTicket.visitorName}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />
                      {selectedTicket.visitorEmail}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Priority display */}
                  {getPriorityBadge(selectedTicket.priority)}

                  {/* Status Dropdown selector */}
                  <div className="relative">
                    <select
                      value={selectedTicket.status}
                      disabled={isUpdating}
                      onChange={e => updateTicket(selectedTicket._id, { status: e.target.value as any })}
                      className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-zinc-300 outline-none focus:border-orange-500 transition-all cursor-pointer"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  {/* Quick action: Mark Resolved if open */}
                  {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
                    <button
                      onClick={() => updateTicket(selectedTicket._id, { status: 'resolved' })}
                      className="px-3.5 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>

              {/* CONSOLE SPLIT: Detail Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                
                {/* Subject Header */}
                <div className="bg-white dark:bg-zinc-900/50 p-5 rounded-2xl border border-gray-150 dark:border-zinc-900/60 shadow-sm text-left">
                  <span className="text-[10px] font-bold tracking-wider text-orange-600 dark:text-orange-400 uppercase">
                    TICKET SUBJECT
                  </span>
                  <h3 className="text-base font-bold text-gray-900 dark:text-zinc-150 mt-1">
                    {selectedTicket.subject}
                  </h3>
                </div>

                {/* Description Highlight */}
                <div className="bg-orange-50/10 dark:bg-orange-950/5 border border-orange-100 dark:border-orange-900/10 rounded-2xl p-5 text-left">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-orange-650 dark:text-orange-400 uppercase tracking-wide">
                    <FileText className="w-4 h-4 shrink-0" />
                    Visitor's Problem Description
                  </div>
                  <p className="text-[14px] text-gray-800 dark:text-zinc-250 leading-relaxed font-medium">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Conversation History Stream */}
                {selectedTicket.conversationHistory && selectedTicket.conversationHistory.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 text-left">
                      Chat Context Transcript ({selectedTicket.conversationHistory.length} messages)
                    </h4>
                    
                    <div className="border border-gray-150 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-900 p-5 space-y-4 max-h-[360px] overflow-y-auto custom-scrollbar">
                      {selectedTicket.conversationHistory.map((msg, index) => {
                        const isUser = msg.role === 'user'
                        return (
                          <div 
                            key={index} 
                            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                          >
                            <div className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold mb-1 uppercase tracking-wider">
                              {isUser ? 'Visitor' : `AI Agent (${selectedTicket.agentName})`}
                            </div>
                            <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed max-w-[85%] break-words shadow-sm ${
                              isUser 
                                ? 'bg-orange-500 text-white font-medium rounded-tr-none' 
                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 rounded-tl-none border border-gray-150 dark:border-zinc-800'
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Ticket Metadata Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 dark:bg-zinc-900/30 p-5 rounded-2xl border border-gray-200 dark:border-zinc-900/60 text-left">
                  <div className="space-y-3.5">
                    <div>
                      <div className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Ticket ID</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs font-semibold text-gray-800 dark:text-zinc-300">
                          {selectedTicket._id}
                        </span>
                        <button
                          onClick={() => copyId(selectedTicket._id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-gray-400 hover:text-gray-900"
                        >
                          {copiedId ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Created Date</div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(selectedTicket.createdAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <div className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Assigned Agent</div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mt-1 flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-orange-500" />
                        {selectedTicket.agentName} (ID: {selectedTicket.agentId})
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Session Identifier</div>
                      <div className="text-xs font-mono text-gray-500 dark:text-zinc-400 mt-1 truncate">
                        {selectedTicket.sessionId}
                      </div>
                    </div>
                  </div>
                </div>

                {/* NOTES SECTION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-450 dark:text-zinc-400 uppercase tracking-wider">
                      <Bookmark className="w-4 h-4 text-orange-500 shrink-0" />
                      Internal Agent Notes
                    </div>
                    <span className="text-[10px] font-semibold text-gray-400 italic">
                      Private — only visible to you
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-right">
                    <textarea
                      rows={3}
                      value={notesText}
                      onChange={e => setNotesText(e.target.value)}
                      placeholder="Write private details, logs, reminders, or resolution progress here..."
                      className="w-full p-4 text-[13.5px] bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-2xl outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-gray-800 dark:text-zinc-200 placeholder:text-gray-400 resize-none shadow-sm"
                    />
                    <button
                      onClick={saveNotes}
                      disabled={isUpdating}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5 ml-auto"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Internal Notes
                    </button>
                  </div>
                </div>

                {/* STATUS ACTIONS ROW */}
                <div className="border-t border-gray-150 dark:border-zinc-900 pt-6">
                  <div className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3 text-left">
                    Workflow Actions
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => updateTicket(selectedTicket._id, { status: 'in_progress' })}
                      className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-150 dark:border-blue-900/30 transition-all flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Mark In Progress
                    </button>

                    <button
                      onClick={() => updateTicket(selectedTicket._id, { status: 'resolved' })}
                      className="px-4 py-2 rounded-xl bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-semibold border border-green-150 dark:border-green-900/30 transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Mark Resolved
                    </button>

                    <button
                      onClick={() => updateTicket(selectedTicket._id, { status: 'closed' })}
                      className="px-4 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 text-gray-650 dark:text-zinc-350 text-xs font-semibold border border-gray-150 dark:border-zinc-800 transition-all flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Close Ticket
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-zinc-650 p-6 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-4 text-gray-300 dark:text-zinc-700 shadow-sm border border-gray-100 dark:border-zinc-900">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-zinc-400">No ticket selected</h3>
              <p className="text-[13px] text-gray-500 dark:text-zinc-550 mt-1 max-w-[280px]">
                Click on a ticket from the left panel to inspect visitor details, AI conversations, and internal notes.
              </p>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}
