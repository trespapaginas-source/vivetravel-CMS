'use client'

import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react'
import { useCMSStore, type CMSView } from '@/lib/cms-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
  LogOut,
  Mountain,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Keyboard,
  Bell,
  Sun,
  Moon,
  User,
  Menu,
  X,
  ChevronDown,
  Clock,
  Search,
  Compass,
  Globe,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

// Lazy-load module views to prevent OOM during compilation
const DashboardView = lazy(() => import('./modules/DashboardView'))
const PlansView = lazy(() => import('./modules/PlansView'))
const PlanForm = lazy(() => import('./modules/PlanForm'))
const CabinsView = lazy(() => import('./modules/CabinsView'))
const CabinForm = lazy(() => import('./modules/CabinForm'))
const TestimonialsView = lazy(() => import('./modules/TestimonialsView'))
const MessagesView = lazy(() => import('./modules/MessagesView'))
const SiteContentView = lazy(() => import('./modules/SiteContentView'))
const MediaView = lazy(() => import('./modules/MediaView'))
const CategoriesView = lazy(() => import('./modules/CategoriesView'))
const UsersView = lazy(() => import('./modules/UsersView'))
const ProfileView = lazy(() => import('./modules/ProfileView'))
const ActivityView = lazy(() => import('./modules/ActivityView'))
const CommandPalette = lazy(() => import('./shared/CommandPalette'))

// View loading fallback
function ViewLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin h-8 w-8 border-2 border-cyan-600 border-t-transparent rounded-full" />
        <span className="text-sm text-muted-foreground">Cargando...</span>
      </div>
    </div>
  )
}

interface NavGroup {
  label: string
  items: { view: CMSView; label: string; icon: React.ReactNode; adminOnly?: boolean; shortcut?: string }[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Gestión',
    items: [
      { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, shortcut: 'Ctrl+1' },
      { view: 'plans-pasadias', label: 'Pasadías', icon: <Map className="h-4 w-4" />, shortcut: 'Ctrl+2' },
      { view: 'plans-nacionales', label: 'Destinos Nacionales', icon: <Compass className="h-4 w-4" />, shortcut: 'Ctrl+3' },
      { view: 'plans-internacionales', label: 'Destinos Internacionales', icon: <Globe className="h-4 w-4" />, shortcut: 'Ctrl+4' },
      { view: 'plans-circuitos', label: 'Circuitos', icon: <Compass className="h-4 w-4" />, shortcut: 'Ctrl+5' },
      { view: 'plans-grupales', label: 'Viajes Grupales', icon: <Users className="h-4 w-4" />, shortcut: 'Ctrl+6' },
      { view: 'plans-tours', label: 'Actividades', icon: <Compass className="h-4 w-4" />, shortcut: 'Ctrl+7' },
      { view: 'cabins', label: 'Cabañas', icon: <Home className="h-4 w-4" />, shortcut: 'Ctrl+8' },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { view: 'testimonials', label: 'Testimonios', icon: <MessageSquareQuote className="h-4 w-4" />, shortcut: 'Ctrl+4' },
      { view: 'messages', label: 'Mensajes', icon: <Mail className="h-4 w-4" />, shortcut: 'Ctrl+5' },
      { view: 'site-content', label: 'Contenido del Sitio', icon: <FileText className="h-4 w-4" />, shortcut: 'Ctrl+6' },
      { view: 'media', label: 'Multimedia', icon: <ImageIcon className="h-4 w-4" />, shortcut: 'Ctrl+7' },
    ],
  },
  {
    label: 'Administración',
    items: [
      { view: 'categories', label: 'Categorías', icon: <Tag className="h-4 w-4" />, shortcut: 'Ctrl+8' },
      { view: 'activity', label: 'Actividad', icon: <Clock className="h-4 w-4" />, shortcut: 'Ctrl+9' },
      { view: 'users', label: 'Usuarios', icon: <Users className="h-4 w-4" />, adminOnly: true, shortcut: 'Ctrl+0' },
    ],
  },
]

// Flat navItems for backward compatibility
const navItems = navGroups.flatMap((g) => g.items)

// Helper to find parent group for a view
function getParentGroup(view: CMSView): string | null {
  for (const group of navGroups) {
    if (group.items.some((item) => item.view === view)) {
      return group.label
    }
  }
  return null
}

// Helper to get parent group for form views
function getParentGroupForView(view: CMSView): string | null {
  if (view === 'plan-form' || view.startsWith('plans-')) return 'Gestión'
  if (view === 'cabin-form') return getParentGroup('cabins')
  if (view === 'profile') return null
  return getParentGroup(view)
}

interface UnreadMessage {
  id: string
  name: string
  subject: string | null
  message: string
  createdAt: string
}

export default function CMSLayout() {
  const { currentView, setView, user, setUser, sidebarCollapsed, toggleSidebar, setEditingId, mobileMenuOpen, setMobileMenuOpen, lastPlansView } = useCMSStore()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)

  const { theme, setTheme } = useTheme()
  const mountedRef = useRef(false)

  const isAdmin = user?.role === 'administrador'

  // Fetch unread messages count on mount and poll every 60s
  useEffect(() => {
    let active = true
    const loadUnread = async () => {
      try {
        const res = await fetch('/api/messages')
        if (res.ok && active) {
          const data = await res.json()
          const msgs = (data.messages || []) as Array<{
            id: string
            name: string
            subject: string | null
            message: string
            isRead: boolean
            createdAt: string
          }>
          const unread = msgs.filter((m) => !m.isRead)
          setUnreadMessages(unread.slice(0, 5))
          setUnreadCount(unread.length)
        }
      } catch {
        // silently ignore
      }
    }
    mountedRef.current = true
    loadUnread()
    const interval = setInterval(loadUnread, 60000)
    return () => {
      active = false
      mountedRef.current = false
      clearInterval(interval)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch { /* ignore */ }
    setUser(null)
    toast.success('Sesión cerrada')
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Ahora'
    if (diffMins < 60) return `${diffMins}m`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d`
  }

  // Navigation handler that closes mobile menu
  const handleNavClick = (view: CMSView) => {
    setView(view)
    setMobileMenuOpen(false)
  }

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger in input/textarea elements
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return

    if (e.ctrlKey || e.metaKey) {
      const key = e.key
      // Ctrl+1 through Ctrl+9 for navigation
      if (key >= '1' && key <= '9') {
        e.preventDefault()
        const idx = parseInt(key) - 1
        const allViews = navGroups.flatMap((g) => g.items).filter((item) => !item.adminOnly || isAdmin)
        if (allViews[idx]) {
          setView(allViews[idx].view)
        }
      }
      // Ctrl+N = New Plan
      if (key === 'n' && !e.shiftKey) {
        e.preventDefault()
        setEditingId(null)
        setView('plan-form')
      }
      // Ctrl+Shift+N = New Cabin
      if (key === 'n' && e.shiftKey) {
        e.preventDefault()
        setEditingId(null)
        setView('cabin-form')
      }
      // Ctrl+K = Command Palette
      if (key === 'k') {
        e.preventDefault()
        setCommandOpen((prev) => !prev)
      }
    }
    // Escape = go back to list
    if (e.key === 'Escape') {
      if (currentView === 'plan-form') setView(lastPlansView || 'plans-pasadias')
      else if (currentView === 'cabin-form') setView('cabins')
      else if (currentView === 'profile') setView('dashboard')
    }
    // ? to show shortcuts
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      setShortcutsOpen(true)
    }
  }, [currentView, isAdmin, setView, setEditingId])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const renderView = () => {
    const view = (() => {
      switch (currentView) {
        case 'dashboard': return <DashboardView />
        case 'plans': return <PlansView />
        case 'plans-pasadias': return <PlansView experienceFilter="pasadias" />
        case 'plans-nacionales': return <PlansView experienceFilter="nacionales" />
        case 'plans-internacionales': return <PlansView experienceFilter="internacionales" />
        case 'plans-circuitos': return <PlansView experienceFilter="circuitos" />
        case 'plans-grupales': return <PlansView experienceFilter="grupales" />
        case 'plans-tours': return <PlansView experienceFilter="tours" />
        case 'plan-form': return <PlanForm />
        case 'cabins': return <CabinsView />
        case 'cabin-form': return <CabinForm />
        case 'testimonials': return <TestimonialsView />
        case 'messages': return <MessagesView />
        case 'site-content': return <SiteContentView />
        case 'media': return <MediaView />
        case 'categories': return <CategoriesView />
        case 'users': return isAdmin ? <UsersView /> : <DashboardView />
        case 'profile': return <ProfileView />
        case 'activity': return <ActivityView />
        default: return <DashboardView />
      }
    })()
    return <Suspense fallback={<ViewLoader />}>{view}</Suspense>
  }

  // Breadcrumb logic
  const getBreadcrumbs = () => {
    const crumbs: { label: string; view?: CMSView }[] = [{ label: 'CMS' }]
    const parentGroup = getParentGroupForView(currentView)
    if (parentGroup) {
      crumbs.push({ label: parentGroup })
    }

    const sectionLabels: Record<string, string> = {
      'plans-pasadias': 'Pasadías',
      'plans-nacionales': 'Destinos Nacionales',
      'plans-internacionales': 'Destinos Internacionales',
      'plans-circuitos': 'Circuitos',
      'plans-grupales': 'Viajes Grupales',
      'plans-tours': 'Actividades',
    }

    if (currentView === 'plan-form') {
      const activePlansView = lastPlansView || 'plans-pasadias'
      crumbs.push({ label: sectionLabels[activePlansView] || 'Planes', view: activePlansView })
      crumbs.push({ label: 'Formulario' })
    } else if (currentView === 'cabin-form') {
      crumbs.push({ label: 'Cabañas', view: 'cabins' })
      crumbs.push({ label: 'Formulario' })
    } else if (currentView === 'profile') {
      crumbs.push({ label: 'Mi Perfil' })
    } else {
      const navItem = navItems.find((i) => i.view === currentView)
      if (navItem) {
        crumbs.push({ label: navItem.label })
      }
    }
    return crumbs
  }

  const breadcrumbs = getBreadcrumbs()

  // Get current view label
  const currentViewLabel = currentView === 'profile'
    ? 'Mi Perfil'
    : currentView === 'plan-form'
      ? 'Formulario de Plan'
      : currentView === 'cabin-form'
        ? 'Formulario de Cabaña'
        : navItems.find((i) => i.view === currentView)?.label || 'Dashboard'

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar-noise fixed lg:relative ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        } inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 to-slate-950 dark:from-slate-950 dark:to-black text-white flex flex-col transition-all duration-300 shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500 shrink-0">
            <Mountain className="h-4 w-4 text-white" />
          </div>
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <div className="overflow-hidden lg:block">
              <h2 className="text-sm font-bold tracking-tight whitespace-nowrap text-cyan-400">Vive Travel</h2>
              <p className="text-[10px] text-cyan-300/70 whitespace-nowrap">CMS Admin</p>
            </div>
          )}
          {/* Close button on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {navGroups.map((group, gi) => (
              <div key={group.label}>
                {gi > 0 && (
                  <div className="my-2 px-3">
                    <Separator className="bg-slate-700/50" />
                  </div>
                )}
                {(!sidebarCollapsed || mobileMenuOpen) && (
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 lg:block">
                    {group.label}
                  </p>
                )}
                {group.items
                  .filter((item) => !item.adminOnly || isAdmin)
                  .map((item) => {
                    const isActive =
                      currentView === item.view ||
                      (item.view === lastPlansView && currentView === 'plan-form') ||
                      (item.view === 'cabins' && currentView === 'cabin-form')

                    return (
                      <button
                        key={item.view}
                        onClick={() => handleNavClick(item.view)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 relative ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-700/20 to-cyan-600/10 text-cyan-300 shadow-sm sidebar-active-glow'
                            : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                        } ${sidebarCollapsed && !mobileMenuOpen ? 'lg:justify-center' : ''}`}
                        title={sidebarCollapsed && !mobileMenuOpen ? item.label : undefined}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cyan-400 rounded-r" />
                        )}
                        <span className={`shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
                        {(!sidebarCollapsed || mobileMenuOpen) && <span className="whitespace-nowrap lg:block">{item.label}</span>}
                        {isActive && (!sidebarCollapsed || mobileMenuOpen) && (
                          <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        )}
                      </button>
                    )
                  })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Collapse Toggle - hidden on mobile */}
        <div className="p-2 border-t border-slate-700/50 hidden lg:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
            title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!sidebarCollapsed && <span className="ml-2 text-xs">Colapsar</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Top Bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Button - mobile only */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 lg:hidden text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {currentViewLabel}
              </h2>
            </div>

            {/* Breadcrumbs - hidden on mobile */}
            <div className="hidden md:flex items-center gap-1 ml-3">
              {breadcrumbs.map((crumb, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  {idx > 0 && <ChevronDown className="h-3 w-3 text-muted-foreground -rotate-90" />}
                  {crumb.view ? (
                    <button
                      type="button"
                      onClick={() => setView(crumb.view!)}
                      className="text-xs text-muted-foreground hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className={`text-xs ${idx === breadcrumbs.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Search Button for Command Palette */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => setCommandOpen(true)}
              title="Buscar (Ctrl+K)"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              suppressHydrationWarning
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="h-4 w-4 hidden dark:block" />
            </Button>

            {/* Notification Bell */}
            <Popover open={bellOpen} onOpenChange={setBellOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 relative text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
                  title="Notificaciones"
                >
                  <Bell className={`h-4 w-4 ${unreadCount > 0 ? 'bell-ring' : ''}`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white badge-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Mensajes no leídos</h4>
                    {unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
                {unreadMessages.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No hay mensajes sin leer
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {unreadMessages.map((msg) => (
                      <button
                        key={msg.id}
                        type="button"
                        className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b last:border-b-0 transition-colors"
                        onClick={() => {
                          setBellOpen(false)
                          setView('messages')
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {msg.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatTimeAgo(msg.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {msg.subject || msg.message.slice(0, 60)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                {unreadCount > 0 && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-cyan-700 dark:text-cyan-400 hover:text-cyan-800"
                      onClick={() => {
                        setBellOpen(false)
                        setView('messages')
                      }}
                    >
                      Ver todos los mensajes
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Help */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hidden sm:inline-flex"
              onClick={() => setShortcutsOpen(true)}
              title="Atajos de teclado (?)"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>

            {/* User Info - clickable to profile */}
            <button
              type="button"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={() => setView('profile')}
              title="Ver perfil"
            >
              <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold shrink-0">
                {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : <User className="h-4 w-4" />}
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.fullName || user?.email}</p>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    isAdmin
                      ? 'border-cyan-600 text-cyan-700 bg-cyan-50 dark:border-cyan-500 dark:text-cyan-400 dark:bg-cyan-950'
                      : 'border-slate-400 text-slate-600 bg-slate-50 dark:border-slate-500 dark:text-slate-400 dark:bg-slate-800'
                  }`}
                >
                  {isAdmin ? 'Administrador' : 'Editor'}
                </Badge>
              </div>
            </button>
            <Separator orientation="vertical" className="h-8 hidden sm:block" />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-destructive dark:text-slate-400">
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 shadow-inner dark:shadow-slate-950 scroll-smooth-thin">
          <div key={currentView} className="view-transition">
            {renderView()}
          </div>
        </main>

        {/* Footer */}
        <footer className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-2 text-center">
          <p className="text-xs text-muted-foreground">
            Vive Travel CMS v1.0 · {new Date().getFullYear()}
          </p>
        </footer>
      </div>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="max-w-md dialog-enter rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Atajos de Teclado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Navegación</p>
              {navGroups.flatMap((g) => g.items).filter((i) => !i.adminOnly || isAdmin).map((item, idx) => (
                <div key={item.view} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                  <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-600 dark:text-slate-400 border dark:border-slate-700">
                    Ctrl+{idx + 1}
                  </kbd>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Acciones</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">Nuevo Plan</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-600 dark:text-slate-400 border dark:border-slate-700">Ctrl+N</kbd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">Nueva Cabaña</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-600 dark:text-slate-400 border dark:border-slate-700">Ctrl+Shift+N</kbd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">Volver al listado</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-600 dark:text-slate-400 border dark:border-slate-700">Escape</kbd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">Mostrar atajos</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-600 dark:text-slate-400 border dark:border-slate-700">?</kbd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">Paleta de comandos</span>
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-600 dark:text-slate-400 border dark:border-slate-700">Ctrl+K</kbd>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Command Palette */}
      <Suspense fallback={null}>
        <CommandPalette />
      </Suspense>
    </div>
  )
}
