'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
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
  CheckCircle2,
  CircleDot,
  Play,
  XCircle,
  Save,
  RotateCw,
  Trash2,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  ownerId: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  agentNotes?: string
  aiSummary?: string
  source?: string
  sourceUrl?: string
}

const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 }

export default function TicketsDashboardPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest')
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [notesText, setNotesText] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showMobileDetail, setShowMobileDetail] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Unread indicators (never viewed open tickets)
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set())

  // Banner for new tickets
  const [hasNewTickets, setHasNewTickets] = useState(false)
  const [freshTicketsData, setFreshTicketsData] = useState<Ticket[] | null>(null)

  // Redirect if unauthenticated
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace('/login')
    }
  }, [sessionStatus, router])

  // Load viewed tickets from localstorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('keli_viewed_tickets')
      if (stored) {
        setViewedIds(new Set(JSON.parse(stored)))
      }
    } catch (e) {}
  }, [])

  // Fetch tickets API handler
  const fetchTickets = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      let apiStatus: string = activeTab
      if (activeTab === 'in_progress') {
        apiStatus = 'in-progress'
      }
      
      const res = await fetch(`/api/tickets?status=${apiStatus}&page=${page}`)
      if (!res.ok) throw new Error('Failed to retrieve tickets')
      const data = await res.json()
      
      const fetchedTickets = data.tickets || []
      
      if (silent) {
        // If silent refresh and we have MORE tickets, show the banner
        if (fetchedTickets.length > tickets.length) {
          setFreshTicketsData(fetchedTickets)
          setHasNewTickets(true)
        }
      } else {
        setTickets(fetchedTickets)
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
        
        // Sync selected ticket
        if (selectedTicket) {
          const updated = fetchedTickets.find((t: Ticket) => t._id === selectedTicket._id)
          if (updated) {
            setSelectedTicket(updated)
            setNotesText(updated.agentNotes || '')
          }
        }
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to sync tickets')
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  // Trigger initial or filter-dependent fetch
  useEffect(() => {
    if (session) {
      fetchTickets()
    }
  }, [activeTab, page, session])

  // Poll for updates every 60 seconds
  useEffect(() => {
    if (!session) return
    const interval = setInterval(() => {
      fetchTickets(true)
    }, 60000)
    return () => clearInterval(interval)
  }, [activeTab, page, tickets.length, session])

  // When a ticket is clicked, mark as viewed
  useEffect(() => {
    if (selectedTicket) {
      setViewedIds(prev => {
        const next = new Set(prev)
        if (!next.has(selectedTicket._id)) {
          next.add(selectedTicket._id)
          try {
            localStorage.setItem('keli_viewed_tickets', JSON.stringify(Array.from(next)))
          } catch (e) {}
        }
        return next
      })
      setNotesText(selectedTicket.agentNotes || '')
    }
  }, [selectedTicket])

  // Copy helper
  const copyId = (id: string, label: string) => {
    navigator.clipboard.writeText(id)
    setCopiedField(id)
    toast.success(`${label} copied to clipboard`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Date helper
  const isToday = (dateStr?: string | Date) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const today = new Date()
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear()
  }

  // Calculate Metrics from raw tickets list
  const stats = useMemo(() => {
    const totalCount = tickets.length
    const openCount = tickets.filter(t => t.status === 'open').length
    const activeCount = tickets.filter(t => (t.status as string) === 'in-progress' || (t.status as string) === 'in_progress').length
    const resolvedTodayCount = tickets.filter(t => {
      if (t.status !== 'resolved') return false
      return isToday(t.resolvedAt || t.updatedAt || t.createdAt)
    }).length

    return {
      total: totalCount,
      open: openCount,
      active: activeCount,
      resolvedToday: resolvedTodayCount
    }
  }, [tickets])

  // client side filter and sort
  const filteredAndSortedTickets = useMemo(() => {
    let list = [...tickets]

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(t => 
        (t.visitorName || '').toLowerCase().includes(q) ||
        (t.visitorEmail || '').toLowerCase().includes(q) ||
        (t.subject || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      )
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      list = list.filter(t => t.priority === priorityFilter)
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortBy === 'priority') {
        const weightA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0
        const weightB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0
        if (weightB !== weightA) {
          return weightB - weightA
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      return 0
    })

    return list
  }, [tickets, searchQuery, priorityFilter, sortBy])

  // PATCH status and priority (optimistic update)
  const handleUpdateStatus = async (ticketId: string, nextStatus: Ticket['status']) => {
    setIsUpdating(true)
    const prevTickets = [...tickets]
    const prevSelected = selectedTicket ? { ...selectedTicket } : null

    // Optimistic Update
    setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: nextStatus, resolvedAt: nextStatus === 'resolved' ? new Date().toISOString() : t.resolvedAt } as Ticket : t))
    if (selectedTicket && selectedTicket._id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, status: nextStatus, resolvedAt: nextStatus === 'resolved' ? new Date().toISOString() : prev.resolvedAt } as Ticket : null)
    }

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })
      if (!res.ok) throw new Error('Status update failed')
      toast.success('Ticket status updated')
    } catch (err) {
      console.error(err)
      toast.error('Could not save status. Reverting...')
      setTickets(prevTickets)
      setSelectedTicket(prevSelected)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdatePriority = async (ticketId: string, nextPriority: Ticket['priority']) => {
    setIsUpdating(true)
    const prevTickets = [...tickets]
    const prevSelected = selectedTicket ? { ...selectedTicket } : null

    // Optimistic Update
    setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, priority: nextPriority } as Ticket : t))
    if (selectedTicket && selectedTicket._id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, priority: nextPriority } as Ticket : null)
    }

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: nextPriority })
      })
      if (!res.ok) throw new Error('Priority update failed')
      toast.success('Priority updated')
    } catch (err) {
      console.error(err)
      toast.error('Could not save priority. Reverting...')
      setTickets(prevTickets)
      setSelectedTicket(prevSelected)
    } finally {
      setIsUpdating(false)
    }
  }

  // Save notes
  const handleSaveNotes = async () => {
    if (!selectedTicket) return
    setIsUpdating(true)
    
    const prevSelected = { ...selectedTicket }
    const prevTickets = [...tickets]
    
    // Optimistic Notes Update
    setSelectedTicket(prev => prev ? { ...prev, agentNotes: notesText } as Ticket : null)
    setTickets(prev => prev.map(t => t._id === selectedTicket._id ? { ...t, agentNotes: notesText } as Ticket : t))

    try {
      const res = await fetch(`/api/tickets/${selectedTicket._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentNotes: notesText })
      })
      if (!res.ok) throw new Error('Save notes failed')
      toast.success('Notes saved successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to save notes. Reverting...')
      setSelectedTicket(prevSelected)
      setTickets(prevTickets)
    } finally {
      setIsUpdating(false)
    }
  }

  // DELETE ticket handler
  const handleDeleteTicket = async (ticketId: string) => {
    setIsUpdating(true)
    const prevTickets = [...tickets]
    
    // Optimistic Delete
    setTickets(prev => prev.filter(t => t._id !== ticketId))
    setSelectedTicket(null)
    setShowMobileDetail(false)
    setIsDeleteDialogOpen(false)

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Ticket deleted successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete ticket. Reverting...')
      setTickets(prevTickets)
      const restored = prevTickets.find(t => t._id === ticketId)
      if (restored) {
        setSelectedTicket(restored)
        setShowMobileDetail(true)
      }
    } finally {
      setIsUpdating(false)
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
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    if (diffDays === 1) return 'yesterday'
    return `${diffDays}d ago`
  }

  // AI Summary Generator (if not in db schema)
  const getAiSummary = (ticket: Ticket) => {
    if (ticket.aiSummary) return ticket.aiSummary
    // Fallback: build standard modern summaries
    const baseSummary = `Visitor is seeking support concerning: "${ticket.subject}". Description: "${ticket.description.slice(0, 150)}..."`
    if (ticket.conversationHistory && ticket.conversationHistory.length > 0) {
      return `${baseSummary} Conversed with AI agent "${ticket.agentName || 'Support AI'}" for ${ticket.conversationHistory.length} turns before requesting human transfer.`
    }
    return `${baseSummary} Escalated to human queue for personal support.`
  }

  // Priority color config
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'text-red-700 bg-red-50 border-red-200/60'
      case 'medium':
        return 'text-amber-700 bg-amber-50 border-amber-200/60'
      case 'low':
      default:
        return 'text-zinc-650 bg-zinc-100 border-zinc-200/60'
    }
  }

  // Left side colored strip based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-orange-500'
      case 'in_progress':
      case 'in-progress':
        return 'bg-blue-500'
      case 'resolved':
        return 'bg-green-500'
      case 'closed':
      default:
        return 'bg-zinc-400'
    }
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

  if (!session) {
    return null
  }

  return (
    <DashboardLayout>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col h-[calc(100vh-120px)] max-w-7xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4 md:px-0 font-outfit"
      >
        
        {/* PAGE HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 flex-shrink-0">
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 font-space">Tickets Panel</h1>
            <p className="text-[13px] text-zinc-500 font-medium mt-0.5">Manage customer support requests and transfers</p>
          </div>

          {/* Stats Bar (Redesigned with Premium Glassmorphism) */}
          <div className="p-1.5 bg-zinc-100/60 border border-zinc-200/50 rounded-2xl sm:rounded-[20px] grid grid-cols-2 sm:flex sm:flex-row gap-1.5 sm:gap-2 w-full lg:w-auto shadow-xs backdrop-blur-md">
            <div className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white border border-zinc-200/50 rounded-xl sm:rounded-2xl min-w-[80px] sm:min-w-[95px] text-left flex flex-col justify-center shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all hover:shadow-xs">
              <span className="text-[18px] sm:text-[20px] font-black text-zinc-900 leading-none font-space">
                {isLoading ? '—' : stats.total}
              </span>
              <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-widest mt-1.5">Total</span>
            </div>
            
            <div className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white border border-zinc-200/50 rounded-xl sm:rounded-2xl min-w-[80px] sm:min-w-[95px] text-left flex flex-col justify-center shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all hover:shadow-xs">
              <span className="text-[18px] sm:text-[20px] font-black text-orange-600 leading-none font-space animate-pulse">
                {isLoading ? '—' : stats.open}
              </span>
              <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-widest mt-1.5">Open</span>
            </div>

            <div className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white border border-zinc-200/50 rounded-xl sm:rounded-2xl min-w-[80px] sm:min-w-[95px] text-left flex flex-col justify-center shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all hover:shadow-xs">
              <span className="text-[18px] sm:text-[20px] font-black text-blue-600 leading-none font-space">
                {isLoading ? '—' : stats.active}
              </span>
              <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-widest mt-1.5">Active</span>
            </div>

            <div className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white border border-zinc-200/50 rounded-xl sm:rounded-2xl min-w-[80px] sm:min-w-[95px] text-left flex flex-col justify-center shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-all hover:shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[18px] sm:text-[20px] font-black text-emerald-600 leading-none font-space">
                {isLoading ? '—' : stats.resolvedToday}
              </span>
              <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-widest mt-1.5">Resolved</span>
            </div>
          </div>
        </div>

        {/* FILTER TOOLBAR (Redesigned) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 flex-shrink-0 bg-white border border-zinc-200/60 p-2.5 sm:p-3.5 rounded-2xl sm:rounded-[22px] shadow-[0_8px_30px_rgba(0,0,0,0.02)] backdrop-blur-md">
          {/* Status Tabs (Left Side) */}
          <div className="flex bg-zinc-100/70 p-1 rounded-xl text-[11px] sm:text-xs font-semibold overflow-x-auto scrollbar-none gap-0.5 sm:gap-1 w-full lg:w-auto">
            {([
              { id: 'all', label: 'All Requests' },
              { id: 'open', label: 'Open' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'resolved', label: 'Resolved' },
              { id: 'closed', label: 'Closed' }
            ] as const).map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setPage(1)
                  }}
                  className={`flex-1 lg:flex-none py-2 px-3 sm:px-4.5 rounded-lg capitalize whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer ${
                    isActive 
                      ? 'bg-zinc-950 text-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]' 
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Filters (Right Side) */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            {/* Search Input */}
            <div className="relative flex-1 lg:flex-none lg:w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search visitor, email, subject..."
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-200/70 rounded-xl outline-hidden focus:border-orange-500/50 focus:bg-white transition-all text-zinc-800 placeholder:text-zinc-400 font-medium"
              />
            </div>

            {/* Priority Filter */}
            <Select 
              value={priorityFilter} 
              onValueChange={(val) => setPriorityFilter(val as any)}
            >
              <SelectTrigger className="h-10 text-xs font-medium border-zinc-200 w-[125px] rounded-xl bg-white hover:bg-zinc-50 transition-colors">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Filter */}
            <Select 
              value={sortBy} 
              onValueChange={(val) => setSortBy(val as any)}
            >
              <SelectTrigger className="h-10 text-xs font-medium border-zinc-200 w-[125px] rounded-xl bg-white hover:bg-zinc-50 transition-colors">
                <SelectValue placeholder="Newest first" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="priority">Priority weight</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* WORKSPACE VIEWPORTS */}
        <div className="flex-1 flex gap-3 sm:gap-5 min-h-[400px] sm:min-h-[480px] overflow-hidden">
          
          {/* TICKET LIST PANEL (Left Column) */}
          <div className={`w-full md:w-[290px] lg:w-[390px] shrink-0 bg-white border border-zinc-200/60 rounded-3xl flex flex-col overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.015)] ${selectedTicket && showMobileDetail ? 'hidden md:flex' : 'flex'}`}>
            
            {hasNewTickets && (
              <button
                onClick={() => {
                  if (freshTicketsData) {
                    setTickets(freshTicketsData)
                    setHasNewTickets(false)
                    setFreshTicketsData(null)
                  }
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 px-4 text-xs font-medium text-center transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                New tickets. Click to reload
              </button>
            )}

            <ScrollArea className="flex-1 divide-y divide-zinc-100">
              <div className="flex flex-col">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-[96px] p-4.5 flex flex-col justify-between border-b border-zinc-100 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-zinc-200" />
                          <div className="h-4 bg-zinc-200 rounded w-28" />
                        </div>
                        <div className="h-3 bg-zinc-200 rounded w-12" />
                      </div>
                      <div className="h-3.5 bg-zinc-200 rounded w-3/4" />
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-zinc-150 rounded w-36" />
                        <div className="h-4 bg-zinc-150 rounded w-14" />
                      </div>
                    </div>
                  ))
                ) : filteredAndSortedTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 py-28 text-center">
                    <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-5 text-zinc-350 border border-zinc-200/50 shadow-xs">
                      <Inbox className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-800 font-space">No support tickets</h3>
                    <p className="text-[12px] text-zinc-400 font-medium mt-1.5 max-w-[240px] leading-relaxed">
                      Escalations from custom widget chats will automatically display here
                    </p>
                  </div>
                ) : (
                  filteredAndSortedTickets.map(ticket => {
                    const isSelected = selectedTicket?._id === ticket._id
                    const isUnread = ticket.status === 'open' && !viewedIds.has(ticket._id)
                    return (
                      <div
                        key={ticket._id}
                        onClick={() => {
                          setSelectedTicket(ticket)
                          setShowMobileDetail(true)
                        }}
                        className={`relative w-full h-[96px] flex flex-col justify-between py-3 px-4.5 cursor-pointer transition-all border-b border-zinc-100 ${
                          isSelected 
                            ? 'bg-orange-500/[0.04]' 
                            : 'hover:bg-zinc-50/50'
                        }`}
                      >
                        {/* Selected Indicator Bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-[4px] transition-colors ${
                          isSelected ? 'bg-orange-500' : getStatusColor(ticket.status)
                        }`} />

                        {isUnread && (
                          <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-orange-500 shadow-md shadow-orange-500/20" />
                        )}

                        {/* Top: Status Pill + Visitor Name + Timestamp */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              ticket.status === 'open' ? 'bg-orange-500 animate-pulse' :
                              ((ticket.status as string) === 'in-progress' || (ticket.status as string) === 'in_progress') ? 'bg-blue-500' :
                              ticket.status === 'resolved' ? 'bg-green-500' : 'bg-zinc-400'
                            }`} />
                            <span className="font-semibold text-sm text-zinc-800 truncate">
                              {ticket.visitorName || 'Anonymous User'}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-zinc-400 shrink-0">
                            {timeAgo(ticket.createdAt)}
                          </span>
                        </div>

                        {/* Subject */}
                        <div className="text-[12.5px] font-medium text-zinc-500 truncate text-left pr-4">
                          {ticket.subject || 'Support Request'}
                        </div>

                        {/* Info details row */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11.5px] font-medium text-zinc-400 truncate text-left max-w-[140px] lg:max-w-[190px]">
                            {ticket.visitorEmail}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${getPriorityStyle(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                            {ticket.agentName && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium border border-orange-500/30 text-orange-650 bg-orange-50/20 max-w-[70px] truncate">
                                {ticket.agentName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* TICKET DETAILS DETAIL VIEW (Right Column) */}
          <div className={`flex-1 bg-white border border-zinc-200/60 rounded-3xl flex flex-col overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.015)] ${!selectedTicket || !showMobileDetail ? 'hidden md:flex' : 'flex'}`}>
            {selectedTicket ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Detail Header bar */}
                <div className="p-4 sm:p-5 border-b border-zinc-200/60 bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowMobileDetail(false)}
                      className="p-2 border border-zinc-200 rounded-xl md:hidden text-zinc-500 hover:bg-zinc-100 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="min-w-0 text-left">
                      <h2 className="text-[18px] sm:text-[20px] font-black text-zinc-900 font-space truncate">
                        {selectedTicket.visitorName || 'Anonymous Visitor'}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <a 
                          href={`mailto:${selectedTicket.visitorEmail}`}
                          className="text-[13.5px] font-medium text-orange-600 hover:underline truncate"
                        >
                          {selectedTicket.visitorEmail}
                        </a>
                        <span className="text-zinc-350 text-xs font-light">•</span>
                        <span className="text-[12px] font-semibold text-zinc-400">
                          Submitted {timeAgo(selectedTicket.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status selection */}
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(val) => handleUpdateStatus(selectedTicket._id, val as any)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="h-9 text-xs font-medium border-zinc-200 w-[120px] rounded-xl bg-white hover:bg-zinc-50 transition-colors">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">
                          <span className="flex items-center gap-1.5 font-medium text-orange-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            Open
                          </span>
                        </SelectItem>
                        <SelectItem value="in-progress">
                          <span className="flex items-center gap-1.5 font-medium text-blue-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            In Progress
                          </span>
                        </SelectItem>
                        <SelectItem value="resolved">
                          <span className="flex items-center gap-1.5 font-medium text-green-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Resolved
                          </span>
                        </SelectItem>
                        <SelectItem value="closed">
                          <span className="flex items-center gap-1.5 font-medium text-zinc-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                            Closed
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Priority selection */}
                    <Select
                      value={selectedTicket.priority}
                      onValueChange={(val) => handleUpdatePriority(selectedTicket._id, val as any)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="h-9 text-xs font-medium border-zinc-200 w-[100px] rounded-xl bg-white hover:bg-zinc-50 transition-colors">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <span className="font-medium text-zinc-500">Low</span>
                        </SelectItem>
                        <SelectItem value="medium">
                          <span className="font-medium text-amber-500">Medium</span>
                        </SelectItem>
                        <SelectItem value="high">
                          <span className="font-medium text-red-500">High</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {selectedTicket.status !== 'resolved' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedTicket._id, 'resolved')}
                        disabled={isUpdating}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-xl flex items-center gap-1 shadow-xs h-9 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>

                {/* Viewport Details Scroll */}
                <ScrollArea className="flex-1">
                  <div className="p-6 space-y-6">
                    
                    {/* Subject Card */}
                    <div className="text-left bg-zinc-50/50 p-4.5 border border-zinc-200/50 rounded-2xl shadow-xs">
                      <span className="text-[10px] tracking-widest font-black uppercase text-orange-500 block font-space">Subject</span>
                      <h3 className="text-lg font-black text-zinc-800 font-space mt-1 leading-snug">
                        {selectedTicket.subject || 'Support Request'}
                      </h3>
                    </div>

                    {/* AI SUMMARY HIGHLIGHT */}
                    <div className="border-l-3 border-orange-500 bg-orange-500/[0.03] rounded-r-2xl p-5 text-left shadow-xs space-y-2">
                      <div className="flex items-center gap-2 text-[10.5px] font-black tracking-widest text-orange-650 uppercase font-space">
                        <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                        AI Conversation Summary
                      </div>
                      <p className="text-[14px] text-zinc-700 leading-relaxed font-medium">
                        {getAiSummary(selectedTicket)}
                      </p>
                    </div>

                    {/* Visitor Metadata blocks */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                      <div className="bg-zinc-50/30 border border-zinc-200/50 rounded-2xl p-3.5 shadow-xs">
                        <span className="text-[9px] uppercase tracking-wider font-medium text-zinc-400 block font-space">Visitor Name</span>
                        <span className="text-sm font-medium text-zinc-800 mt-1 block truncate">
                          {selectedTicket.visitorName || 'Anonymous'}
                        </span>
                      </div>
                      
                      <div className="bg-zinc-50/30 border border-zinc-200/50 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase tracking-wider font-medium text-zinc-400 block font-space">Email Address</span>
                          <span className="text-sm font-medium text-zinc-800 mt-1 block truncate">
                            {selectedTicket.visitorEmail}
                          </span>
                        </div>
                        <button
                          onClick={() => copyId(selectedTicket.visitorEmail, 'Email')}
                          className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                          {copiedField === selectedTicket.visitorEmail ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      
                      <div className="bg-zinc-50/30 border border-zinc-200/50 rounded-2xl p-3.5 shadow-xs">
                        <span className="text-[9px] uppercase tracking-wider font-medium text-zinc-400 block font-space">Assigned Agent</span>
                        <span className="text-sm font-medium text-zinc-800 mt-1 block truncate flex items-center gap-1.5">
                          <Bot className="w-4 h-4 text-orange-500 animate-pulse" />
                          {selectedTicket.agentName || 'Keli AI'}
                        </span>
                      </div>
                    </div>

                    {/* Chat log visual timeline (Cozy modern iOS style chat bubbles) */}
                    <div className="space-y-3 text-left">
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-space">
                        Previous Chat Dialogue
                      </h4>
                      {selectedTicket.conversationHistory && selectedTicket.conversationHistory.length > 0 ? (
                        <div className="border border-zinc-200/60 rounded-[24px] bg-zinc-50/30 p-5 space-y-4 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar">
                          {selectedTicket.conversationHistory.map((msg, index) => {
                            const isUser = msg.role === 'user'
                            return (
                              <div 
                                key={index} 
                                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                              >
                                <span className="text-[9.5px] text-zinc-400 font-medium mb-1 uppercase tracking-wider font-space">
                                  {isUser ? 'Visitor' : `AI Agent (${selectedTicket.agentName || 'Keli AI'})`}
                                </span>
                                <div className={`px-4.5 py-3 rounded-2xl text-[13px] max-w-[80%] break-words shadow-[0_1px_6px_rgba(0,0,0,0.015)] leading-relaxed font-medium ${
                                  isUser 
                                    ? 'bg-zinc-950 text-white rounded-tr-none' 
                                    : 'bg-white text-zinc-800 rounded-tl-none border border-zinc-200/50'
                                }`}>
                                  {msg.content}
                                </div>
                                <span className="text-[9px] text-zinc-400 font-semibold mt-1">
                                  {timeAgo(selectedTicket.createdAt)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-zinc-400 text-xs border border-dashed border-zinc-200 rounded-[22px] bg-white">
                           No previous conversation history logged
                        </div>
                      )}
                    </div>

                    {/* Visitor original request */}
                    <div className="space-y-3 text-left">
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-space">
                        Visitor original description
                      </h4>
                      <div className="bg-white border border-zinc-200/60 rounded-[22px] p-5 shadow-xs">
                        <p className="text-[13.5px] text-zinc-700 leading-relaxed font-medium whitespace-pre-wrap">
                          {selectedTicket.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    {/* Metadata specs */}
                    <div className="space-y-3 text-left">
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 font-space">
                        Technical specifications
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50/50 border border-zinc-200/60 rounded-[24px] p-5 text-[12px] font-semibold text-zinc-650">
                        <div className="space-y-3.5">
                          <div>
                            <span className="text-[9px] uppercase font-medium text-zinc-400 block mb-1 font-space">Ticket UID</span>
                            <div className="flex items-center gap-1.5 font-mono text-zinc-800">
                              <span>{selectedTicket._id}</span>
                              <button
                                onClick={() => copyId(selectedTicket._id, 'Ticket ID')}
                                className="p-1 hover:bg-zinc-200 rounded-md text-zinc-400 transition-colors"
                              >
                                {copiedField === selectedTicket._id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-[9px] uppercase font-medium text-zinc-400 block mb-1 font-space">Created Timestamp</span>
                            <span className="text-zinc-800">
                              {new Date(selectedTicket.createdAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'medium' })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-3.5">
                          <div>
                            <span className="text-[9px] uppercase font-medium text-zinc-400 block mb-1 font-space">Session ID (Chat Node)</span>
                            <div className="flex items-center gap-1.5 font-mono text-zinc-800">
                              <span className="truncate max-w-[130px]">{selectedTicket.sessionId || 'anonymous'}</span>
                              {selectedTicket.sessionId && selectedTicket.sessionId !== 'unknown' && (
                                <button
                                  onClick={() => copyId(selectedTicket.sessionId, 'Session ID')}
                                  className="p-1 hover:bg-zinc-200 rounded-md text-zinc-400 transition-colors"
                                >
                                  {copiedField === selectedTicket.sessionId ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-[9px] uppercase font-medium text-zinc-400 block mb-1 font-space">Traffic Source URL</span>
                            <span className="text-zinc-800 break-all flex items-center gap-1 leading-snug">
                              {selectedTicket.sourceUrl || selectedTicket.source || 'Direct Dashboard Injection'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Internal Agent Notes Section */}
                    <div className="space-y-3 text-left border-t border-zinc-200/60 pt-6">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-450 font-space">
                          Internal Agent notes
                        </h4>
                        <p className="text-[10px] text-zinc-400 font-semibold italic">
                          Internal team comments only — completely hidden from customer view
                        </p>
                      </div>
                      
                      <div className="space-y-3.5">
                        <Textarea
                          rows={4}
                          value={notesText}
                          onChange={e => setNotesText(e.target.value)}
                          placeholder="Type internal comments, status notes or resolution summary..."
                          className="w-full p-4 text-[13px] bg-white border border-zinc-200 rounded-2xl outline-hidden focus-visible:border-orange-500/50 focus-visible:ring-0 text-zinc-800 placeholder:text-zinc-400 resize-none font-semibold shadow-xs"
                        />
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveNotes}
                            disabled={isUpdating}
                            className="border-orange-500 text-orange-650 hover:bg-orange-500/10 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all h-9 cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Save Internal Notes
                          </Button>
                        </div>
                      </div>
                    </div>

                  </div>
                </ScrollArea>

                {/* Bottom Action controls footer bar */}
                <div className="p-3 sm:p-4.5 border-t border-zinc-200/60 bg-white flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* Mark In Progress */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedTicket._id, 'in-progress')}
                      disabled={isUpdating || selectedTicket.status === 'in-progress'}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-medium rounded-xl flex items-center gap-1.5 h-9 cursor-pointer"
                    >
                      <CircleDot className="w-3.5 h-3.5 shrink-0" />
                      In Progress
                    </Button>
                    
                    {/* Mark Resolved */}
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedTicket._id, 'resolved')}
                      disabled={isUpdating || selectedTicket.status === 'resolved'}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-xs h-9 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Resolve Request
                    </Button>
                    
                    {/* Close Ticket */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedTicket._id, 'closed')}
                      disabled={isUpdating || selectedTicket.status === 'closed'}
                      className="border-zinc-300 text-zinc-650 hover:bg-zinc-50 text-xs font-medium rounded-xl flex items-center gap-1.5 h-9 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      Close Ticket
                    </Button>
                  </div>
                  
                  {/* Delete trigger */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={isUpdating}
                    className="text-red-650 hover:text-red-750 hover:bg-red-50 text-xs font-medium rounded-xl flex items-center gap-1.5 shrink-0 self-end sm:self-auto h-9 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    Delete Ticket
                  </Button>
                </div>

                {/* DELETE DIALOG CONFIRM */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogContent className="sm:max-w-md rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-zinc-900 flex items-center gap-2 text-base font-space font-black">
                        <ShieldAlert className="w-5 h-5 text-red-550 shrink-0" />
                        Delete Support Ticket
                      </DialogTitle>
                      <DialogDescription className="text-zinc-500 mt-2 text-xs leading-relaxed font-semibold">
                        Are you sure you want to permanently delete this ticket? This will purge all message logs, visitor metadata, and agent internal notes from the cloud database. This action is irreversible.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 flex gap-2 font-outfit">
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(false)}
                        className="w-full sm:w-auto rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleDeleteTicket(selectedTicket._id)}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-750 text-white font-medium rounded-xl"
                        disabled={isUpdating}
                      >
                        {isUpdating ? 'Deleting...' : 'Confirm Delete'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

              </div>
            ) : (
              // DEFAULT VIEW INJECTION PLACEHOLDER
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-zinc-50/20">
                <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-5 text-zinc-400 border border-zinc-200/50 shadow-xs">
                  <Inbox className="w-8 h-8 text-zinc-350" />
                </div>
                <h3 className="text-base font-bold text-zinc-800 font-space">Select a ticket</h3>
                <p className="text-xs text-zinc-400 font-medium mt-1 max-w-[240px] leading-relaxed">
                  Click any ticket from the left panel to inspect customer requests, AI history, and resolution actions.
                </p>
              </div>
            )}
          </div>

        </div>

      </motion.div>
    </DashboardLayout>
  )
}
