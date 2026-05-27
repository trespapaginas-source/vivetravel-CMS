'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Mail,
  MailOpen,
  Phone,
  MessageCircle,
  Trash2,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Hash,
  Search,
  Send,
  CheckCircle2,
  Reply,
  Clock,
  Loader2,
  X,
} from 'lucide-react'
import { useCMSStore } from '@/lib/cms-store'
import { toast } from 'sonner'
import ConfirmDialog from '../shared/ConfirmDialog'

interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  contactMethod: string | null
  isRead: boolean
  replyMessage: string | null
  repliedAt: string | null
  createdAt: string
}

export default function MessagesView() {
  const { user } = useCMSStore()
  const isAdmin = user?.role === 'administrador'

  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)

  const unreadCount = messages.filter((m) => !m.isRead).length

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter messages by search query
  const filteredMessages = messages.filter((msg) => {
    if (!debouncedSearch) return true
    const q = debouncedSearch.toLowerCase()
    return (
      msg.name.toLowerCase().includes(q) ||
      msg.email.toLowerCase().includes(q) ||
      (msg.subject && msg.subject.toLowerCase().includes(q)) ||
      msg.message.toLowerCase().includes(q)
    )
  })

  // Selection helpers
  const allFilteredSelected = filteredMessages.length > 0 && filteredMessages.every((m) => selectedIds.has(m.id))
  const someFilteredSelected = filteredMessages.some((m) => selectedIds.has(m.id)) && !allFilteredSelected

  const handleSelectAll = useCallback(() => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredMessages.map((m) => m.id)))
    }
  }, [allFilteredSelected, filteredMessages])

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Batch operations
  const handleBatchMarkRead = async () => {
    setBatchLoading(true)
    let success = 0
    let failed = 0
    const promises = Array.from(selectedIds).map(async (id) => {
      try {
        const res = await fetch(`/api/messages/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true }),
        })
        if (!res.ok) throw new Error()
        success++
      } catch {
        failed++
      }
    })
    await Promise.all(promises)
    setMessages(messages.map((m) => (selectedIds.has(m.id) ? { ...m, isRead: true } : m)))
    setSelectedIds(new Set())
    setBatchLoading(false)
    if (failed === 0) {
      toast.success(`${success} mensaje${success !== 1 ? 's' : ''} marcado${success !== 1 ? 's' : ''} como leído${success !== 1 ? 's' : ''}`)
    } else {
      toast.error(`${success} actualizado${success !== 1 ? 's' : ''}, ${failed} fallido${failed !== 1 ? 's' : ''}`)
    }
  }

  const handleBatchMarkUnread = async () => {
    setBatchLoading(true)
    let success = 0
    let failed = 0
    const promises = Array.from(selectedIds).map(async (id) => {
      try {
        const res = await fetch(`/api/messages/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: false }),
        })
        if (!res.ok) throw new Error()
        success++
      } catch {
        failed++
      }
    })
    await Promise.all(promises)
    setMessages(messages.map((m) => (selectedIds.has(m.id) ? { ...m, isRead: false } : m)))
    setSelectedIds(new Set())
    setBatchLoading(false)
    if (failed === 0) {
      toast.success(`${success} mensaje${success !== 1 ? 's' : ''} marcado${success !== 1 ? 's' : ''} como no leído${success !== 1 ? 's' : ''}`)
    } else {
      toast.error(`${success} actualizado${success !== 1 ? 's' : ''}, ${failed} fallido${failed !== 1 ? 's' : ''}`)
    }
  }

  const handleBatchDelete = async () => {
    setBatchLoading(true)
    let success = 0
    let failed = 0
    const promises = Array.from(selectedIds).map(async (id) => {
      try {
        const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error()
        success++
      } catch {
        failed++
      }
    })
    await Promise.all(promises)
    setMessages(messages.filter((m) => !selectedIds.has(m.id)))
    setSelectedIds(new Set())
    setBatchLoading(false)
    setBatchDeleteOpen(false)
    if (failed === 0) {
      toast.success(`${success} mensaje${success !== 1 ? 's' : ''} eliminado${success !== 1 ? 's' : ''}`)
    } else {
      toast.error(`${success} eliminado${success !== 1 ? 's' : ''}, ${failed} fallido${failed !== 1 ? 's' : ''}`)
    }
  }

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/messages')
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])
        }
      } catch {
        toast.error('Error al cargar mensajes')
      } finally {
        setLoading(false)
      }
    }
    fetchMessages()
  }, [])

  const handleToggleRead = async (msg: ContactMessage) => {
    try {
      const res = await fetch(`/api/messages/${msg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !msg.isRead }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      setMessages(messages.map((m) => (m.id === msg.id ? { ...m, isRead: !m.isRead } : m)))
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const handleMarkAllRead = useCallback(async () => {
    try {
      const unreadIds = messages.filter((m) => !m.isRead).map((m) => m.id)
      await Promise.all(
        unreadIds.map((id) =>
          fetch(`/api/messages/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true }),
          })
        )
      )
      setMessages(messages.map((m) => ({ ...m, isRead: true })))
      toast.success('Todos los mensajes marcados como leídos', {
        action: {
          label: 'Ver mensajes',
          onClick: () => { /* already on this view */ },
        },
      })
    } catch {
      toast.error('Error al marcar mensajes')
    }
  }, [messages])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/messages/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      setMessages(messages.filter((m) => m.id !== deleteId))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(deleteId)
        return next
      })
      toast.success('Mensaje eliminado')
    } catch {
      toast.error('Error al eliminar mensaje')
    } finally {
      setDeleteId(null)
    }
  }

  const handleReply = async (msgId: string) => {
    const replyMessage = replyTexts[msgId]?.trim()
    if (!replyMessage) {
      toast.error('Escribe un mensaje de respuesta')
      return
    }

    setReplyingTo(msgId)
    try {
      const res = await fetch(`/api/messages/${msgId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyMessage }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al responder')
      }
      const data = await res.json()
      setMessages(messages.map((m) => (m.id === msgId ? { ...m, ...data.message } : m)))
      setReplyTexts((prev) => {
        const next = { ...prev }
        delete next[msgId]
        return next
      })
      toast.success('Respuesta enviada correctamente', {
        action: {
          label: 'Ver',
          onClick: () => { /* already on this view, message is expanded */ },
        },
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar respuesta')
    } finally {
      setReplyingTo(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getContactMethodBadge = (method: string | null) => {
    if (!method) return null
    const lower = method.toLowerCase()
    if (lower.includes('whatsapp') || lower.includes('whats')) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
          <MessageCircle className="h-3 w-3 mr-0.5" />
          WhatsApp
        </Badge>
      )
    }
    if (lower.includes('email') || lower.includes('correo')) {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
          <Mail className="h-3 w-3 mr-0.5" />
          Email
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
        {method}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full skeleton-wave" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mensajes</h1>
          <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
            <Hash className="h-3 w-3 mr-0.5" />
            {messages.length}
          </Badge>
          {unreadCount > 0 && (
            <Badge className="bg-cyan-700">{unreadCount} sin leer</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Select All checkbox when there are messages */}
          {filteredMessages.length > 0 && (
            <div className="flex items-center gap-2 mr-2">
              <Checkbox
                checked={allFilteredSelected}
                {...(someFilteredSelected && { 'data-state': 'indeterminate' as const })}
                onCheckedChange={handleSelectAll}
                aria-label="Seleccionar todos"
              />
              <span className="text-xs text-muted-foreground hidden sm:inline">Seleccionar todos</span>
            </div>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar todo como leído
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, asunto o mensaje..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 focus-visible:ring-cyan-500"
          />
        </div>
        {debouncedSearch && (
          <p className="text-sm text-muted-foreground">
            {filteredMessages.length} resultado{filteredMessages.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 mb-4 empty-float">
            <Mail className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">No hay mensajes</h3>
          <p className="text-base text-muted-foreground">Los mensajes de contacto aparecerán aquí</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 mb-4 empty-float">
            <Search className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">Sin resultados</h3>
          <p className="text-base text-muted-foreground">No se encontraron mensajes que coincidan con &quot;{debouncedSearch}&quot;</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-260px)] scroll-smooth-thin">
          <div className="space-y-2">
            {filteredMessages.map((msg) => {
              const isExpanded = expandedId === msg.id
              const isReplied = !!msg.repliedAt && !!msg.replyMessage
              const isSelected = selectedIds.has(msg.id)
              return (
                <Card
                  key={msg.id}
                  className={`transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-cyan-500/40 border-cyan-400 dark:border-cyan-600'
                      : !msg.isRead
                        ? 'border-cyan-200 bg-cyan-50/30 shadow-sm dark:border-cyan-800 dark:bg-cyan-950/20'
                        : isReplied
                          ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-800 dark:bg-emerald-950/10'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className="pt-1 shrink-0">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectOne(msg.id)}
                          aria-label={`Seleccionar mensaje de ${msg.name}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* Message content - clickable */}
                      <button
                        type="button"
                        className="flex-1 text-left min-w-0"
                        onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                      >
                        <div className="flex items-start gap-3">
                          {!msg.isRead ? (
                            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 mt-2 shrink-0" />
                          ) : isReplied ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-1 shrink-0" />
                          ) : (
                            <MailOpen className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`text-sm ${
                                    !msg.isRead
                                      ? 'font-semibold text-slate-900 dark:text-slate-100'
                                      : 'font-medium text-slate-600 dark:text-slate-400'
                                  } truncate`}
                                >
                                  {msg.name}
                                </span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {msg.email}
                                </span>
                                {msg.contactMethod && (
                                  <span className="shrink-0">{getContactMethodBadge(msg.contactMethod)}</span>
                                )}
                                {/* ReplyBadge */}
                                {isReplied && (
                                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                                    <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                    Respondido
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(msg.createdAt)}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                            {!isExpanded && (
                              <p className="text-sm text-muted-foreground truncate mt-0.5">
                                {msg.subject || msg.message.slice(0, 100)}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t dark:border-slate-700 ml-8">
                        {/* Card-like layout for expanded message */}
                        <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-4 space-y-4 shadow-sm">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold">
                                {msg.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{msg.name}</p>
                                <p className="text-xs text-muted-foreground">{msg.email}</p>
                              </div>
                            </div>
                            {msg.contactMethod && (
                              <div className="ml-auto">
                                {getContactMethodBadge(msg.contactMethod)}
                              </div>
                            )}
                          </div>

                          {msg.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-slate-700 dark:text-slate-300">{msg.phone}</span>
                            </div>
                          )}

                          {msg.subject && (
                            <div>
                              <span className="text-xs font-medium text-muted-foreground uppercase">Asunto</span>
                              <p className="text-sm mt-0.5 font-medium text-slate-900 dark:text-slate-100">{msg.subject}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-xs font-medium text-muted-foreground uppercase">Mensaje</span>
                            <p className="text-sm mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{msg.message}</p>
                          </div>
                        </div>

                        {/* Reply History */}
                        {isReplied && (
                          <div className="mt-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800 p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Respuesta enviada</span>
                              {msg.repliedAt && (
                                <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 flex items-center gap-1 ml-auto">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(msg.repliedAt)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-900 rounded-md p-3 border border-emerald-100 dark:border-emerald-900">
                              {msg.replyMessage}
                            </p>
                          </div>
                        )}

                        {/* Reply Textarea */}
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Reply className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {isReplied ? 'Enviar otra respuesta' : 'Responder'}
                            </span>
                          </div>
                          <Textarea
                            placeholder="Escribe tu respuesta aquí..."
                            value={replyTexts[msg.id] || ''}
                            onChange={(e) => setReplyTexts((prev) => ({ ...prev, [msg.id]: e.target.value }))}
                            rows={3}
                            className="resize-none focus-visible:ring-cyan-500 transition-all duration-200"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              className="bg-cyan-700 hover:bg-cyan-800 text-white"
                              disabled={replyingTo === msg.id || !replyTexts[msg.id]?.trim()}
                              onClick={() => handleReply(msg.id)}
                            >
                              {replyingTo === msg.id ? (
                                <>
                                  <span className="h-3.5 w-3.5 mr-1 animate-spin rounded-full border-2 border-white/30 border-t-white inline-block" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Send className="h-3.5 w-3.5 mr-1" />
                                  Enviar Respuesta
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleRead(msg)}
                          >
                            {msg.isRead ? (
                              <><Mail className="h-3.5 w-3.5 mr-1" />Marcar no leído</>
                            ) : (
                              <><MailOpen className="h-3.5 w-3.5 mr-1" />Marcar leído</>
                            )}
                          </Button>
                          {msg.phone && (
                            <Button variant="outline" size="sm" asChild className="text-green-700 hover:text-green-800 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950">
                              <a
                                href={`https://wa.me/${msg.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MessageCircle className="h-3.5 w-3.5 mr-1" />
                                WhatsApp
                              </a>
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <a href={`mailto:${msg.email}`}>
                              <Mail className="h-3.5 w-3.5 mr-1" />
                              Email
                            </a>
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive ml-auto"
                              onClick={() => setDeleteId(msg.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      )}

      {/* Floating Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-xl shadow-2xl px-6 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-200">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
          <Button
            size="sm"
            variant="outline"
            className="text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
            onClick={handleBatchMarkRead}
            disabled={batchLoading}
          >
            {batchLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <MailOpen className="h-3.5 w-3.5 mr-1" />}
            Marcar leído
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
            onClick={handleBatchMarkUnread}
            disabled={batchLoading}
          >
            {batchLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Mail className="h-3.5 w-3.5 mr-1" />}
            Marcar no leído
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-red-50 dark:hover:bg-red-950"
              onClick={() => setBatchDeleteOpen(true)}
              disabled={batchLoading}
            >
              {batchLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
              Eliminar
            </Button>
          )}
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearSelection}
            disabled={batchLoading}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancelar
          </Button>
        </div>
      )}

      {/* Single Delete Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar este mensaje?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        destructive
      />

      {/* Batch Delete Dialog */}
      <ConfirmDialog
        open={batchDeleteOpen}
        onOpenChange={(open) => !open && setBatchDeleteOpen(false)}
        title={`¿Eliminar ${selectedIds.size} mensaje${selectedIds.size !== 1 ? 's' : ''}?`}
        description="Esta acción no se puede deshacer. Los mensajes seleccionados serán eliminados permanentemente."
        confirmLabel="Eliminar seleccionados"
        onConfirm={handleBatchDelete}
        destructive
      />
    </div>
  )
}
