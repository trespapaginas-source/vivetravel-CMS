'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCMSStore, type CMSView } from '@/lib/cms-store'
import {
  LayoutDashboard,
  Map,
  Home,
  MessageSquareQuote,
  Mail,
  FileText,
  ImageIcon,
  Tag,
  Users,
  Plus,
  LogOut,
  Search,
  Clock,
} from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  category: 'navigation' | 'action'
}

export default function CommandPalette() {
  const { setView, setEditingId, setUser } = useCMSStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const isAdmin = useCMSStore((s) => s.user?.role === 'administrador')

  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, action: () => setView('dashboard'), category: 'navigation' },
    { id: 'nav-plans', label: 'Planes', icon: <Map className="h-4 w-4" />, action: () => setView('plans'), category: 'navigation' },
    { id: 'nav-cabins', label: 'Cabañas', icon: <Home className="h-4 w-4" />, action: () => setView('cabins'), category: 'navigation' },
    { id: 'nav-testimonials', label: 'Testimonios', icon: <MessageSquareQuote className="h-4 w-4" />, action: () => setView('testimonials'), category: 'navigation' },
    { id: 'nav-messages', label: 'Mensajes', icon: <Mail className="h-4 w-4" />, action: () => setView('messages'), category: 'navigation' },
    { id: 'nav-site-content', label: 'Contenido del Sitio', icon: <FileText className="h-4 w-4" />, action: () => setView('site-content'), category: 'navigation' },
    { id: 'nav-media', label: 'Multimedia', icon: <ImageIcon className="h-4 w-4" />, action: () => setView('media'), category: 'navigation' },
    { id: 'nav-categories', label: 'Categorías', icon: <Tag className="h-4 w-4" />, action: () => setView('categories'), category: 'navigation' },
    { id: 'nav-activity', label: 'Actividad', icon: <Clock className="h-4 w-4" />, action: () => setView('activity'), category: 'navigation' },
    ...(isAdmin ? [{ id: 'nav-users', label: 'Usuarios', icon: <Users className="h-4 w-4" />, action: () => setView('users'), category: 'navigation' as const }] : []),
    // Actions
    { id: 'action-new-plan', label: 'Crear Plan', icon: <Plus className="h-4 w-4" />, action: () => { setEditingId(null); setView('plan-form') }, category: 'action' },
    { id: 'action-new-cabin', label: 'Crear Cabaña', icon: <Plus className="h-4 w-4" />, action: () => { setEditingId(null); setView('cabin-form') }, category: 'action' },
    { id: 'action-logout', label: 'Cerrar Sesión', icon: <LogOut className="h-4 w-4" />, action: () => { setUser(null) }, category: 'action' },
  ]

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands

  // Reset selection when query changes - use derived state instead of effect
  const effectiveSelectedIndex = Math.min(selectedIndex, filtered.length - 1)

  // Focus input when dialog opens
  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [])

  const executeItem = useCallback((item: CommandItem) => {
    item.action()
    setOpen(false)
    setQuery('')
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && filtered[effectiveSelectedIndex]) {
      e.preventDefault()
      executeItem(filtered[effectiveSelectedIndex])
    }
  }, [filtered, effectiveSelectedIndex, executeItem])

  // Scroll selected item into view
  useEffect(() => {
    const listEl = listRef.current
    if (!listEl) return
    const selected = listEl.children[effectiveSelectedIndex] as HTMLElement
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' })
    }
  }, [effectiveSelectedIndex])

  // Ctrl+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const navItems = filtered.filter((c) => c.category === 'navigation')
  const actionItems = filtered.filter((c) => c.category === 'action')

  // Compute global index offset for action items
  const navLength = navItems.length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden dark:bg-slate-900 dark:border-slate-700">
        <DialogHeader className="sr-only">
          <DialogTitle>Paleta de Comandos</DialogTitle>
        </DialogHeader>
        {/* Search Input */}
        <div className="flex items-center border-b dark:border-slate-700 px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar vistas o acciones..."
            className="flex-1 border-0 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground dark:text-slate-100"
          />
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 border dark:border-slate-700">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No se encontraron resultados para &quot;{query}&quot;
            </div>
          ) : (
            <>
              {navItems.length > 0 && (
                <>
                  <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Navegación</p>
                  {navItems.map((item, i) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        i === effectiveSelectedIndex
                          ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(i)}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </>
              )}
              {actionItems.length > 0 && (
                <>
                  <p className="px-4 py-1.5 mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Acciones</p>
                  {actionItems.map((item, i) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        (navLength + i) === effectiveSelectedIndex
                          ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400'
                          : item.id === 'action-logout'
                            ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(navLength + i)}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t dark:border-slate-700 px-4 py-2 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono border dark:border-slate-700">↑↓</kbd>
            Navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono border dark:border-slate-700">↵</kbd>
            Seleccionar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono border dark:border-slate-700">Ctrl+K</kbd>
            Abrir/Cerrar
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
