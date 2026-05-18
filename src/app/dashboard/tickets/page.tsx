'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
      const stored = localStorage.getItem('agentdesk_viewed_tickets')
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
            localStorage.setItem('agentdesk_viewed_tickets', JSON.stringify(Array.from(next)))
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
      toast.success('Ticket status updated successfully')
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
      toast.success('Priority updated successfully')
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
      toast.success('Saved!')
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
        return 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
      case 'medium':
        return 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
      case 'low':
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
    }
  }

  // Left side colored strip based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-[#FF6B35]'
      case 'in_progress':
      case 'in-progress':
        return 'bg-blue-500'
      case 'resolved':
        return 'bg-green-500'
      case 'closed':
      default:
        return 'bg-gray-500'
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
      <div className="flex flex-col h-[calc(100vh-100px)] max-w-7xl mx-auto space-y-6">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-150 tracking-tight">Tickets</h1>
            <p className="text-[13px] text-gray-500 dark:text-zinc-400 mt-0.5">Manage customer support requests</p>
          </div>

          {/* Stats Bar */}
          <div className="p-2.5 bg-gray-50 dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-800 rounded-lg grid grid-cols-2 sm:flex sm:flex-row gap-3 w-full md:w-auto shadow-sm">
            <div className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800/80 rounded-md min-w-[90px] text-left flex flex-col justify-center shadow-xs">
              <span className="text-[20px] font-bold text-gray-800 dark:text-zinc-100 leading-none">
                {isLoading ? '—' : stats.total}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1.5">Total</span>
            </div>
            
            <div className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800/80 rounded-md min-w-[90px] text-left flex flex-col justify-center shadow-xs">
              <span className="text-[20px] font-bold text-[#FF6B35] leading-none">
                {isLoading ? '—' : stats.open}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1.5">Open</span>
            </div>

            <div className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800/80 rounded-md min-w-[90px] text-left flex flex-col justify-center shadow-xs">
              <span className="text-[20px] font-bold text-blue-500 leading-none">
                {isLoading ? '—' : stats.active}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1.5">Active</span>
            </div>

            <div className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800/80 rounded-md min-w-[90px] text-left flex flex-col justify-center shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[20px] font-bold text-green-500 leading-none">
                {isLoading ? '—' : stats.resolvedToday}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1.5">Resolved</span>
            </div>
          </div>
        </div>

        {/* FILTER TOOLBAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-3 rounded-lg shadow-sm">
          {/* Status Tabs (Left Side) */}
          <div className="flex bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-850 p-1 rounded-md text-xs font-semibold overflow-x-auto scrollbar-none gap-1 w-full md:w-auto">
            {([
              { id: 'all', label: 'All' },
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
                  className={`flex-1 md:flex-none py-1.5 px-4 rounded-md capitalize whitespace-nowrap transition-all ${
                    isActive 
                      ? 'bg-[#FF6B35] text-white shadow-xs' 
                      : 'text-gray-550 hover:text-gray-900 dark:hover:text-zinc-150'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Filters on Right Side */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Search Input */}
            <div className="relative flex-1 md:flex-none md:w-[220px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-md outline-hidden focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 transition-all text-gray-800 dark:text-zinc-200 placeholder:text-gray-450"
              />
            </div>

            {/* Priority Filter */}
            <Select 
              value={priorityFilter} 
              onValueChange={(val) => setPriorityFilter(val as any)}
            >
              <SelectTrigger className="h-8 text-xs font-semibold border-gray-250 dark:border-zinc-800 w-[125px]">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Filter */}
            <Select 
              value={sortBy} 
              onValueChange={(val) => setSortBy(val as any)}
            >
              <SelectTrigger className="h-8 text-xs font-semibold border-gray-250 dark:border-zinc-800 w-[120px]">
                <SelectValue placeholder="Newest first" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* TWO-PANEL WORKSPACE CONTAINER */}
        <div className="flex-1 flex gap-5 min-h-[480px] overflow-hidden">
          
          {/* LEFT PANEL: TICKET LIST */}
          <div className={`w-full md:w-[280px] lg:w-[400px] shrink-0 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl flex flex-col overflow-hidden shadow-xs ${selectedTicket && showMobileDetail ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Banner alert if count increased */}
            {hasNewTickets && (
              <button
                onClick={() => {
                  if (freshTicketsData) {
                    setTickets(freshTicketsData)
                    setHasNewTickets(false)
                    setFreshTicketsData(null)
                  }
                }}
                className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/95 text-white py-2 px-4 text-xs font-bold text-center transition-all flex items-center justify-center gap-2"
              >
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                New tickets available. Click to refresh
              </button>
            )}

            {/* Scrollable list */}
            <ScrollArea className="flex-1 divide-y divide-gray-100 dark:divide-zinc-800">
              <div className="flex flex-col">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-[88px] p-4 flex flex-col justify-between border-b border-gray-100 dark:border-zinc-800 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-zinc-800" />
                          <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-28" />
                        </div>
                        <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-12" />
                      </div>
                      <div className="h-3.5 bg-gray-200 dark:bg-zinc-800 rounded w-3/4" />
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-gray-150 dark:bg-zinc-850 rounded w-36" />
                        <div className="flex gap-2">
                          <div className="h-4 bg-gray-150 dark:bg-zinc-850 rounded w-10" />
                          <div className="h-4 bg-gray-150 dark:bg-zinc-850 rounded w-14" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : filteredAndSortedTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 py-24 text-center">
                    <div className="w-14 h-14 bg-gray-50 dark:bg-zinc-950 rounded-2xl flex items-center justify-center mb-4 text-gray-300 dark:text-zinc-755 border border-gray-100 dark:border-zinc-850 shadow-xs">
                      <Inbox className="w-7 h-7" />
                    </div>
                    <h3 className="text-[14px] font-semibold text-gray-700 dark:text-zinc-300">No tickets yet</h3>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1.5 max-w-[230px] leading-relaxed">
                      When visitors request human support, tickets will appear here
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
                        className={`relative w-full h-[88px] flex flex-col justify-between py-2.5 px-4 cursor-pointer transition-all border-b border-gray-100 dark:border-zinc-800 ${
                          isSelected 
                            ? 'bg-[#FFF5F0] dark:bg-orange-950/10 rounded-r-md rounded-l-none' 
                            : 'hover:bg-gray-50/50 dark:hover:bg-zinc-900/30'
                        }`}
                      >
                        {/* Status Left Strip */}
                        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                          isSelected ? 'bg-[#FF6B35]' : getStatusColor(ticket.status)
                        }`} />

                        {/* Unread Orange Dot indicator (top-right) */}
                        {isUnread && (
                          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FF6B35]" />
                        )}

                        {/* Row 1: Status Dot + Visitor Name + Time */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              ticket.status === 'open' ? 'bg-[#FF6B35] animate-pulse' :
                              ((ticket.status as string) === 'in-progress' || (ticket.status as string) === 'in_progress') ? 'bg-blue-500' :
                              ticket.status === 'resolved' ? 'bg-green-500' : 'bg-gray-500'
                            }`} />
                            <span className="font-semibold text-sm text-gray-900 dark:text-zinc-150 truncate">
                              {ticket.visitorName || 'Anonymous'}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400 dark:text-zinc-500 shrink-0">
                            {timeAgo(ticket.createdAt)}
                          </span>
                        </div>

                        {/* Row 2: Truncated Subject Line */}
                        <div className="text-[12.5px] text-gray-500 dark:text-zinc-400 truncate text-left pr-4">
                          {ticket.subject || 'Support Request'}
                        </div>

                        {/* Row 3: Email + priority badge + agent pill */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11.5px] text-gray-400 dark:text-zinc-500 truncate text-left max-w-[150px] lg:max-w-[200px]">
                            {ticket.visitorEmail}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getPriorityStyle(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                            {ticket.agentName && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold border border-[#FF6B35] text-[#FF6B35] max-w-[70px] truncate">
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

          {/* RIGHT PANEL: TICKET DETAIL */}
          <div className={`flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl flex flex-col overflow-hidden shadow-xs ${!selectedTicket || !showMobileDetail ? 'hidden md:flex' : 'flex'}`}>
            {selectedTicket ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* --- DETAIL TOP BAR --- */}
                <div className="p-4 border-b border-gray-150 dark:border-zinc-800 bg-gray-50/20 dark:bg-zinc-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowMobileDetail(false)}
                      className="p-1 border border-gray-250 dark:border-zinc-800 rounded-md md:hidden text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="min-w-0 text-left">
                      <h2 className="text-[20px] font-bold text-gray-900 dark:text-zinc-100 truncate">
                        {selectedTicket.visitorName || 'Anonymous'}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <a 
                          href={`mailto:${selectedTicket.visitorEmail}`}
                          className="text-[14px] font-medium text-[#FF6B35] hover:underline truncate"
                        >
                          {selectedTicket.visitorEmail}
                        </a>
                        <span className="text-gray-300 dark:text-zinc-700 text-xs font-light">•</span>
                        <span className="text-[12px] text-gray-400 dark:text-zinc-500">
                          Submitted {timeAgo(selectedTicket.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Status Dropdown */}
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(val) => handleUpdateStatus(selectedTicket._id, val as any)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="h-8 text-xs font-semibold border-gray-250 dark:border-zinc-800 w-[120px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">
                          <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            Open
                          </span>
                        </SelectItem>
                        <SelectItem value="in-progress">
                          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            In Progress
                          </span>
                        </SelectItem>
                        <SelectItem value="resolved">
                          <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Resolved
                          </span>
                        </SelectItem>
                        <SelectItem value="closed">
                          <span className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                            Closed
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Priority Dropdown */}
                    <Select
                      value={selectedTicket.priority}
                      onValueChange={(val) => handleUpdatePriority(selectedTicket._id, val as any)}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="h-8 text-xs font-semibold border-gray-250 dark:border-zinc-800 w-[100px]">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 font-medium">Low</span>
                        </SelectItem>
                        <SelectItem value="medium">
                          <span className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400 font-medium">Medium</span>
                        </SelectItem>
                        <SelectItem value="high">
                          <span className="flex items-center gap-1.5 text-red-500 dark:text-red-400 font-medium">High</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Mark Resolved Quick button */}
                    {selectedTicket.status !== 'resolved' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedTicket._id, 'resolved')}
                        disabled={isUpdating}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs h-8"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </div>

                {/* scrollable detail viewport */}
                <ScrollArea className="flex-1">
                  <div className="p-5 space-y-6">
                    
                    {/* Subject highlight */}
                    <div className="text-left bg-gray-50/50 dark:bg-zinc-950/20 p-4 border border-gray-150 dark:border-zinc-850 rounded-lg">
                      <span className="text-[10px] tracking-widest font-bold uppercase text-[#FF6B35] block">Subject</span>
                      <h3 className="text-base font-bold text-gray-900 dark:text-zinc-150 mt-1">
                        {selectedTicket.subject || 'Support Request'}
                      </h3>
                    </div>

                    {/* --- AI SUMMARY CARD --- */}
                    <div className="border-l-3 border-[#FF6B35] bg-[#FFF8F5] dark:bg-orange-950/5 rounded-r-lg p-4 text-left shadow-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-[#FF6B35] uppercase">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Summary
                      </div>
                      <p className="text-[14px] text-gray-800 dark:text-zinc-200 leading-relaxed font-medium">
                        {getAiSummary(selectedTicket)}
                      </p>
                    </div>

                    {/* --- VISITOR INFO ROW --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                      <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 shadow-xs">
                        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 block">From</span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mt-1 block truncate">
                          {selectedTicket.visitorName || 'Anonymous'}
                        </span>
                      </div>
                      
                      <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 shadow-xs flex items-center justify-between">
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 block">Email</span>
                          <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mt-1 block truncate">
                            {selectedTicket.visitorEmail}
                          </span>
                        </div>
                        <button
                          onClick={() => copyId(selectedTicket.visitorEmail, 'Email')}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 shrink-0 ml-1 transition-colors"
                        >
                          {copiedField === selectedTicket.visitorEmail ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      
                      <div className="bg-white dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 shadow-xs">
                        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 block">Agent</span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200 mt-1 block truncate flex items-center gap-1.5">
                          <Bot className="w-4 h-4 text-[#FF6B35]" />
                          {selectedTicket.agentName || 'AI Agent'}
                        </span>
                      </div>
                    </div>

                    {/* --- CONVERSATION HISTORY --- */}
                    <div className="space-y-2 text-left">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                        Conversation
                      </h4>
                      {selectedTicket.conversationHistory && selectedTicket.conversationHistory.length > 0 ? (
                        <div className="border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50/20 dark:bg-zinc-950/20 p-4 space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                          {selectedTicket.conversationHistory.map((msg, index) => {
                            const isUser = msg.role === 'user'
                            return (
                              <div 
                                key={index} 
                                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                              >
                                <span className="text-[9px] text-gray-450 dark:text-zinc-500 font-semibold mb-1 uppercase tracking-wider">
                                  {isUser ? 'Visitor' : `AI Agent (${selectedTicket.agentName || 'AgentDesk'})`}
                                </span>
                                <div className={`px-4 py-2.5 rounded-2xl text-xs max-w-[85%] break-words shadow-xs leading-relaxed ${
                                  isUser 
                                    ? 'bg-[#FF6B35] text-white rounded-tr-none' 
                                    : 'bg-gray-100 dark:bg-zinc-850 text-gray-800 dark:text-zinc-200 rounded-tl-none border border-gray-150 dark:border-zinc-800'
                                }`}>
                                  {msg.content}
                                </div>
                                <span className="text-[9px] text-gray-400 mt-1">
                                  {timeAgo(selectedTicket.createdAt)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="py-10 text-center text-gray-400 dark:text-zinc-550 text-xs border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900">
                          No conversation history recorded
                        </div>
                      )}
                    </div>

                    {/* --- CUSTOMER DESCRIPTION --- */}
                    <div className="space-y-2 text-left">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                        Issue description
                      </h4>
                      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4 shadow-xs">
                        <p className="text-sm text-gray-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                          {selectedTicket.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    {/* --- TICKET META --- */}
                    <div className="space-y-2 text-left">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                        Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 dark:bg-zinc-950/20 border border-gray-250 dark:border-zinc-850 rounded-xl p-4 text-xs">
                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 block mb-1">Ticket ID</span>
                            <div className="flex items-center gap-1.5 font-mono text-gray-700 dark:text-zinc-300 font-semibold">
                              <span>{selectedTicket._id}</span>
                              <button
                                onClick={() => copyId(selectedTicket._id, 'Ticket ID')}
                                className="p-1 hover:bg-gray-250 dark:hover:bg-zinc-800 rounded text-gray-400 hover:text-gray-900 dark:hover:text-zinc-150 transition-colors"
                              >
                                {copiedField === selectedTicket._id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 block mb-1">Created At</span>
                            <span className="text-gray-750 dark:text-zinc-300 font-medium">
                              {new Date(selectedTicket.createdAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'medium' })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 block mb-1">Session ID</span>
                            <div className="flex items-center gap-1.5 font-mono text-gray-700 dark:text-zinc-300 font-semibold">
                              <span className="truncate max-w-[130px]">{selectedTicket.sessionId || 'unknown'}</span>
                              {selectedTicket.sessionId && selectedTicket.sessionId !== 'unknown' && (
                                <button
                                  onClick={() => copyId(selectedTicket.sessionId, 'Session ID')}
                                  className="p-1 hover:bg-gray-255 dark:hover:bg-zinc-800 rounded text-gray-400 hover:text-gray-900 dark:hover:text-zinc-150 transition-colors"
                                >
                                  {copiedField === selectedTicket.sessionId ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 block mb-1">Source URL</span>
                            <span className="text-gray-750 dark:text-zinc-300 font-medium break-all flex items-center gap-1">
                              {selectedTicket.sourceUrl || selectedTicket.source || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* --- INTERNAL NOTES --- */}
                    <div className="space-y-2.5 text-left border-t border-gray-150 dark:border-zinc-800 pt-5">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                          Internal notes
                        </h4>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-550 italic">
                          Only visible to you — not shown to the customer
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Textarea
                          rows={4}
                          value={notesText}
                          onChange={e => setNotesText(e.target.value)}
                          placeholder="Add notes about this ticket..."
                          className="w-full p-3 text-xs bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 rounded-lg outline-hidden focus-visible:border-[#FF6B35] focus-visible:ring-[#FF6B35]/15 transition-all text-gray-800 dark:text-zinc-200 placeholder:text-gray-450 resize-none shadow-xs"
                        />
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveNotes}
                            disabled={isUpdating}
                            className="border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35]/10 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Save notes
                          </Button>
                        </div>
                      </div>
                    </div>

                  </div>
                </ScrollArea>

                {/* --- ACTION BUTTONS ROW --- */}
                <div className="p-4 border-t border-gray-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 flex-shrink-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Mark In Progress */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedTicket._id, 'in-progress')}
                      disabled={isUpdating || selectedTicket.status === 'in-progress'}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-xs font-semibold rounded-md flex items-center gap-1.5"
                    >
                      <CircleDot className="w-3.5 h-3.5 shrink-0" />
                      Mark In Progress
                    </Button>
                    
                    {/* Mark Resolved */}
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedTicket._id, 'resolved')}
                      disabled={isUpdating || selectedTicket.status === 'resolved'}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Mark Resolved
                    </Button>
                    
                    {/* Close Ticket */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedTicket._id, 'closed')}
                      disabled={isUpdating || selectedTicket.status === 'closed'}
                      className="border-gray-300 text-gray-650 hover:bg-gray-50 dark:hover:bg-zinc-800 text-xs font-semibold rounded-md flex items-center gap-1.5"
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
                    className="text-red-650 hover:text-red-750 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold rounded-md flex items-center gap-1.5 shrink-0 self-end sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    Delete
                  </Button>
                </div>

                {/* DELETE DIALOG CONFIRM */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900 dark:text-zinc-150 flex items-center gap-2 text-base">
                        <ShieldAlert className="w-5 h-5 text-red-550 shrink-0" />
                        Delete Support Ticket
                      </DialogTitle>
                      <DialogDescription className="text-gray-500 dark:text-zinc-400 mt-2 text-xs leading-relaxed">
                        Are you sure you want to permanently delete this ticket from the system? This will remove all message history, visitor info, and notes. This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(false)}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleDeleteTicket(selectedTicket._id)}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-750 text-white font-semibold"
                        disabled={isUpdating}
                      >
                        {isUpdating ? 'Deleting...' : 'Delete permanently'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

              </div>
            ) : (
              // CENTRED DEFAULT PLACEHOLDER
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50/20 dark:bg-zinc-950/10">
                <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-gray-400 dark:text-zinc-650 border border-gray-150 dark:border-zinc-800 shadow-xs">
                  <Inbox className="w-9 h-9" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-zinc-150">Select a ticket</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-450 mt-1 max-w-[245px] leading-relaxed">
                  Click any ticket on the left to view details
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </DashboardLayout>
  )
}
