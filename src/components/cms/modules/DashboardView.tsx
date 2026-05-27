'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Map, FileEdit, Home, Mail, Plus, Eye, ArrowRight, Download, Upload, Clock, MapPin, Home as HomeIcon, Map as MapIcon, MessageSquareQuote, Tag, FileText, Loader2, BarChart3, TrendingUp, CheckCircle2, AlertCircle, Sun, CloudSun, Moon, PieChart, Trophy, DollarSign, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useCMSStore } from '@/lib/cms-store'
import { toast } from 'sonner'
import MiniChart from '../shared/MiniChart'

interface DashboardStats {
  totalPlansPublished: number
  totalPlansDraft: number
  totalCabins: number
  unreadMessages: number
  avgTestimonialRating: number
}

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  isRead: boolean
  createdAt: string
}

interface RecentActivity {
  id: string
  type: 'plan' | 'cabin'
  name: string
  action: 'created' | 'updated'
  createdAt: string
}

interface CategoryForChart {
  id: string
  name: string
  _count?: { plans: number }
}

interface MessageForChart {
  createdAt: string
}

interface ImportPreview {
  plans: number
  cabins: number
  testimonials: number
  categories: number
  siteContent: number
}

interface ImportResult {
  plans: { created: number; updated: number; errors: number }
  cabins: { created: number; updated: number; errors: number }
  testimonials: { created: number; updated: number; errors: number }
  categories: { created: number; updated: number; errors: number }
  siteContent: { created: number; updated: number; errors: number }
}

// Animated counter hook
function useAnimatedCounter(target: number, duration = 800) {
  const [count, setCount] = useState(0)
  const prevTarget = useRef(0)

  useEffect(() => {
    if (target === prevTarget.current) return
    prevTarget.current = target
    const start = 0
    const startTime = performance.now()
    let rafId: number

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(start + (target - start) * eased))
      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      }
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])

  return count
}

// Animated stat card component
function AnimatedStatCard({ label, value, icon, gradient, sparkline }: {
  label: string
  value: number
  icon: React.ReactNode
  gradient: string
  sparkline: React.ReactNode
}) {
  const animatedValue = useAnimatedCounter(value)

  return (
    <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg card-hover-lift relative cursor-default">
      <div className={`bg-gradient-to-br ${gradient} p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">{label}</p>
            <p className="text-3xl font-extrabold mt-1">{animatedValue}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              {icon}
            </div>
            {sparkline}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function DashboardView() {
  const { setView, user } = useCMSStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentMessages, setRecentMessages] = useState<ContactMessage[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    plans: true,
    cabins: true,
    testimonials: true,
    categories: true,
    siteContent: true,
  })
  const [exporting, setExporting] = useState(false)
  const [plansPerCategory, setPlansPerCategory] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] })
  const [messagesPerMonth, setMessagesPerMonth] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] })

  // Analytics state
  const [analytics, setAnalytics] = useState<{
    contentCompletion: number
    difficultyDistribution: Record<string, number>
    priceStats: { avgPrice: number; minPrice: number; maxPrice: number }
    mostPopularPlan: { id: string; name: string; rating: number; reviewCount: number; popularityScore: number; price: number; published: boolean; category: string | null; categoryColor: string | null } | null
    topPlans: Array<{ id: string; name: string; rating: number; reviewCount: number; popularityScore: number; price: number; published: boolean; category: string | null; categoryColor: string | null }>
    missingSections: string[]
    additionalStats: { totalTestimonials: number; avgRating: number; totalMessages: number; unreadMessages: number; repliedMessages: number; totalCabins: number; publishedCabins: number }
    categoryDistribution: Array<{ id: string; name: string; color: string; planCount: number }>
  } | null>(null)

  // Import state
  const [importOpen, setImportOpen] = useState(false)
  const [importData, setImportData] = useState<Record<string, unknown> | null>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [importOptions, setImportOptions] = useState({
    plans: true,
    cabins: true,
    testimonials: true,
    categories: true,
    siteContent: true,
  })
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ result: ImportResult; totals: { created: number; updated: number; errors: number } } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Live clock state
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update clock every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // update every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, msgRes, plansRes, cabinsRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/messages'),
          fetch('/api/plans'),
          fetch('/api/cabins'),
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        let messages: MessageForChart[] = []
        if (msgRes.ok) {
          const msgData = await msgRes.json()
          const rawMsgs = msgData.messages || []
          messages = rawMsgs
          setRecentMessages(rawMsgs.slice(0, 5))
        }

        // Build recent activity from plans and cabins
        const activity: RecentActivity[] = []
        if (plansRes.ok) {
          const plansData = await plansRes.json()
          const plans = plansData.plans || []
          plans.forEach((p: { id: string; name: string; createdAt: string; updatedAt: string }) => {
            activity.push({ id: p.id, type: 'plan', name: p.name, action: 'created', createdAt: p.createdAt || p.updatedAt })
          })
        }
        if (cabinsRes.ok) {
          const cabinsData = await cabinsRes.json()
          const cabins = cabinsData.cabins || []
          cabins.forEach((c: { id: string; name: string; createdAt: string; updatedAt: string }) => {
            activity.push({ id: c.id, type: 'cabin', name: c.name, action: 'created', createdAt: c.createdAt || c.updatedAt })
          })
        }
        activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setRecentActivity(activity.slice(0, 6))

        // Compute plans per category for chart
        const catRes = await fetch('/api/categories')
        if (catRes.ok) {
          const catData = await catRes.json()
          const cats = (catData.categories || []) as CategoryForChart[]
          setPlansPerCategory({
            labels: cats.map((c: CategoryForChart) => c.name),
            data: cats.map((c: CategoryForChart) => c._count?.plans ?? 0),
          })
        }

        // Fetch analytics data
        try {
          const analyticsRes = await fetch('/api/analytics')
          if (analyticsRes.ok) {
            const analyticsData = await analyticsRes.json()
            setAnalytics(analyticsData)
          }
        } catch {
          // silently ignore analytics errors
        }

        // Compute messages per month for chart
        if (msgRes.ok) {
          const monthMap: Record<string, number> = {}
          const now = new Date()
          // Initialize last 6 months
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const key = d.toLocaleDateString('es-CO', { month: 'short' })
            monthMap[key] = 0
          }
          messages.forEach((m: MessageForChart) => {
            const d = new Date(m.createdAt)
            const key = d.toLocaleDateString('es-CO', { month: 'short' })
            if (key in monthMap) {
              monthMap[key]++
            }
          })
          setMessagesPerMonth({
            labels: Object.keys(monthMap),
            data: Object.values(monthMap),
          })
        }
      } catch {
        toast.error('Error al cargar datos del dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const exportData: Record<string, unknown> = {}
      const promises: Promise<void>[] = []

      if (exportOptions.plans) {
        promises.push(
          fetch('/api/plans').then(res => res.ok ? res.json() : { plans: [] }).then(data => { exportData.plans = data.plans || [] })
        )
      }
      if (exportOptions.cabins) {
        promises.push(
          fetch('/api/cabins').then(res => res.ok ? res.json() : { cabins: [] }).then(data => { exportData.cabins = data.cabins || [] })
        )
      }
      if (exportOptions.testimonials) {
        promises.push(
          fetch('/api/testimonials').then(res => res.ok ? res.json() : { testimonials: [] }).then(data => { exportData.testimonials = data.testimonials || [] })
        )
      }
      if (exportOptions.categories) {
        promises.push(
          fetch('/api/categories').then(res => res.ok ? res.json() : { categories: [] }).then(data => { exportData.categories = data.categories || [] })
        )
      }
      if (exportOptions.siteContent) {
        promises.push(
          fetch('/api/site-content').then(res => res.ok ? res.json() : { sections: [] }).then(data => { exportData.siteContent = data.sections || [] })
        )
      }

      await Promise.all(promises)

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vive-travel-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setExportOpen(false)
      toast.success('Datos exportados correctamente')
    } catch {
      toast.error('Error al exportar datos')
    } finally {
      setExporting(false)
    }
  }

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError(null)
    setImportResult(null)
    setImportPreview(null)
    setImportData(null)

    if (!file.name.endsWith('.json')) {
      setImportError('El archivo debe ser un archivo .json válido')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        if (typeof parsed !== 'object' || parsed === null) {
          setImportError('El archivo no contiene un objeto JSON válido')
          return
        }

        setImportData(parsed)

        // Compute preview counts
        const preview: ImportPreview = {
          plans: Array.isArray(parsed.plans) ? parsed.plans.length : 0,
          cabins: Array.isArray(parsed.cabins) ? parsed.cabins.length : 0,
          testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials.length : 0,
          categories: Array.isArray(parsed.categories) ? parsed.categories.length : 0,
          siteContent: Array.isArray(parsed.siteContent) ? parsed.siteContent.length : 0,
        }
        setImportPreview(preview)

        // Auto-check only entities that exist in the file
        setImportOptions({
          plans: preview.plans > 0,
          cabins: preview.cabins > 0,
          testimonials: preview.testimonials > 0,
          categories: preview.categories > 0,
          siteContent: preview.siteContent > 0,
        })

        // Check if there's anything to import
        const totalItems = Object.values(preview).reduce((a, b) => a + b, 0)
        if (totalItems === 0) {
          setImportError('El archivo no contiene datos reconocibles para importar')
        }
      } catch {
        setImportError('Error al leer el archivo JSON. Asegúrate de que el formato sea válido.')
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!importData) return

    setImporting(true)
    setImportError(null)

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: importData,
          entities: Object.entries(importOptions)
            .filter(([, checked]) => checked)
            .map(([key]) => key),
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Error al importar datos')
      }

      const resultData = await res.json()
      setImportResult(resultData)

      const { totals } = resultData
      if (totals.errors > 0) {
        toast.warning(`Importación completada con ${totals.errors} error${totals.errors > 1 ? 'es' : ''}`)
      } else {
        toast.success(`${totals.created} registro${totals.created !== 1 ? 's' : ''} creado${totals.created !== 1 ? 's' : ''}, ${totals.updated} actualizado${totals.updated !== 1 ? 's' : ''}`)
      }

      // Refresh dashboard data
      setLoading(true)
      setImportData(null)
      setImportPreview(null)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Error al importar datos')
    } finally {
      setImporting(false)
    }
  }

  const resetImportDialog = () => {
    setImportOpen(false)
    setImportData(null)
    setImportPreview(null)
    setImportResult(null)
    setImportError(null)
    setImporting(false)
    setImportOptions({
      plans: true,
      cabins: true,
      testimonials: true,
      categories: true,
      siteContent: true,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Simple sparkline bar data
  const sparklineData = (value: number, max: number, color: string) => {
    const bars = [0.3, 0.6, 0.45, 0.8, 0.55, value / Math.max(max, 1)]
    return (
      <div className="flex items-end gap-0.5 h-8">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-t ${color} opacity-60`}
            style={{ height: `${Math.max(h * 100, 10)}%` }}
          />
        ))}
      </div>
    )
  }

  const statCards = stats
    ? [
        {
          label: 'Planes Publicados',
          value: stats.totalPlansPublished,
          icon: <Map className="h-5 w-5 text-white" />,
          gradient: 'from-emerald-500 to-emerald-700',
          sparkline: sparklineData(stats.totalPlansPublished, 10, 'bg-emerald-300'),
        },
        {
          label: 'Planes Borrador',
          value: stats.totalPlansDraft,
          icon: <FileEdit className="h-5 w-5 text-white" />,
          gradient: 'from-amber-400 to-amber-600',
          sparkline: sparklineData(stats.totalPlansDraft, 5, 'bg-amber-300'),
        },
        {
          label: 'Cabañas',
          value: stats.totalCabins,
          icon: <Home className="h-5 w-5 text-white" />,
          gradient: 'from-cyan-500 to-cyan-700',
          sparkline: sparklineData(stats.totalCabins, 5, 'bg-cyan-300'),
        },
        {
          label: 'Mensajes Sin Leer',
          value: stats.unreadMessages,
          icon: <Mail className="h-5 w-5 text-white" />,
          gradient: 'from-rose-400 to-rose-600',
          sparkline: sparklineData(stats.unreadMessages, 10, 'bg-rose-300'),
        },
      ]
    : []

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour >= 6 && hour < 12) return 'Buenos días'
    if (hour >= 12 && hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const getTimeOfDayIcon = () => {
    const hour = currentTime.getHours()
    if (hour >= 6 && hour < 12) return <Sun className="h-5 w-5 text-amber-300" />
    if (hour >= 12 && hour < 18) return <CloudSun className="h-5 w-5 text-orange-300" />
    return <Moon className="h-5 w-5 text-blue-200" />
  }

  const formatClockTime = () => {
    const hours = currentTime.getHours().toString().padStart(2, '0')
    const minutes = currentTime.getMinutes().toString().padStart(2, '0')
    return { hours, minutes }
  }

  const formatSpanishDate = () => {
    return currentTime.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric',
    })
  }

  const hasImportableData = importPreview && Object.values(importPreview).some(v => v > 0)
  const selectedEntities = Object.entries(importOptions).filter(([, checked]) => checked).map(([key]) => key)

  return (
    <div className="space-y-6">
      {/* Decorative Mountain/Wave SVG Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-700 via-teal-600 to-emerald-700 dark:from-cyan-900 dark:via-teal-900 dark:to-emerald-900 p-6 lg:p-8 text-white">
        <svg
          className="absolute bottom-0 left-0 w-full h-24 text-white/10"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,80 C150,20 350,100 500,50 C650,0 750,90 900,40 C1000,10 1100,70 1200,30 L1200,120 L0,120 Z"
            fill="currentColor"
          />
        </svg>
        <svg
          className="absolute top-0 right-0 w-64 h-64 text-white/5 -translate-y-1/2 translate-x-1/4"
          viewBox="0 0 200 200"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="100" fill="currentColor" />
        </svg>

        {/* Greeting */}
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'Admin'} 👋
            </h1>
            <p className="text-sm text-white/80 mt-1">Aquí tienes un resumen de tu sitio</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Live Clock & Date */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1 text-2xl font-bold text-white tabular-nums">
                  {formatClockTime().hours}
                  <span className="colon-pulse">:</span>
                  {formatClockTime().minutes}
                </div>
                <p className="text-xs text-white/70 capitalize">{formatSpanishDate()}</p>
              </div>
              <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                {getTimeOfDayIcon()}
              </div>
            </div>
            <Badge
              className={
                user?.role === 'administrador'
                  ? 'bg-white/20 text-white border-white/30 backdrop-blur-sm'
                  : 'bg-white/10 text-white/80 border-white/20 backdrop-blur-sm'
              }
            >
              {user?.role === 'administrador' ? 'Administrador' : 'Editor'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg skeleton-wave" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 skeleton-wave" />
                    <Skeleton className="h-8 w-12 skeleton-wave" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((card) => (
            <AnimatedStatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              gradient={card.gradient}
              sparkline={card.sparkline}
            />
          ))
        )}
      </div>

      {/* Mini Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2 dark:text-slate-100">
              <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Planes por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-16 w-full skeleton-wave" />
            ) : plansPerCategory.data.length > 0 ? (
              <MiniChart
                data={plansPerCategory.data}
                color="#059669"
                type="bar"
                labels={plansPerCategory.labels}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No hay datos</p>
            )}
            {plansPerCategory.labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {plansPerCategory.labels.map((label, i) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    {label}: {plansPerCategory.data[i]}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2 dark:text-slate-100">
              <TrendingUp className="h-4 w-4 text-rose-500 dark:text-rose-400" />
              Mensajes por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-16 w-full skeleton-wave" />
            ) : messagesPerMonth.data.length > 0 ? (
              <MiniChart
                data={messagesPerMonth.data}
                color="#e11d48"
                type="line"
                labels={messagesPerMonth.labels}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No hay datos</p>
            )}
            {messagesPerMonth.labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {messagesPerMonth.labels.map((label, i) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    {label}: {messagesPerMonth.data[i]}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Statistics Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Content Completion */}
        <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900">
                <BarChart3 className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Completitud del Contenido</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all duration-1000"
                      style={{ width: `${analytics?.contentCompletion ?? 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-cyan-700 dark:text-cyan-400">{analytics?.contentCompletion ?? 0}%</span>
                </div>
                {analytics && analytics.missingSections.length > 0 && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {analytics.missingSections.length} secciones sin datos
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans by Difficulty - SVG Pie Chart */}
        <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900">
                <PieChart className="h-5 w-5 text-violet-700 dark:text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Planes por Dificultad</p>
                {analytics && Object.keys(analytics.difficultyDistribution).length > 0 ? (
                  <div className="flex items-center gap-3 mt-1">
                    <svg viewBox="0 0 36 36" className="w-12 h-12 shrink-0">
                      {(() => {
                        const data = analytics.difficultyDistribution
                        const total = Object.values(data).reduce((a, b) => a + b, 0)
                        const colors: Record<string, string> = { 'Fácil': '#10b981', 'Moderado': '#f59e0b', 'Avanzado': '#ef4444', 'Sin asignar': '#94a3b8' }
                        let offset = 0
                        return Object.entries(data).map(([key, value]) => {
                          const pct = total > 0 ? (value / total) * 100 : 0
                          const el = (
                            <circle
                              key={key}
                              cx="18" cy="18" r="15.915"
                              fill="none"
                              stroke={colors[key] || '#94a3b8'}
                              strokeWidth="3.5"
                              strokeDasharray={`${pct} ${100 - pct}`}
                              strokeDashoffset={`${-offset}`}
                              transform="rotate(-90 18 18)"
                            />
                          )
                          offset += pct
                          return el
                        })
                      })()}
                    </svg>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {Object.entries(analytics.difficultyDistribution).map(([key, value]) => {
                        const colors: Record<string, string> = { 'Fácil': 'bg-emerald-500', 'Moderado': 'bg-amber-500', 'Avanzado': 'bg-red-500', 'Sin asignar': 'bg-slate-400' }
                        return (
                          <div key={key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <div className={`w-1.5 h-1.5 rounded-full ${colors[key] || 'bg-slate-400'}`} />
                            {key}: {value}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Sin datos</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Average Price Range */}
        <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <DollarSign className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rango de Precios</p>
                {analytics ? (
                  <>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      ${analytics.priceStats.avgPrice.toLocaleString('es-CO')}
                      <span className="text-xs font-normal text-muted-foreground"> prom.</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      ${analytics.priceStats.minPrice.toLocaleString('es-CO')} — ${analytics.priceStats.maxPrice.toLocaleString('es-CO')}
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">—</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Most Popular Plan */}
        <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                <Trophy className="h-5 w-5 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Plan Más Popular</p>
                {analytics?.mostPopularPlan ? (
                  <>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {analytics.mostPopularPlan.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                        ★ {analytics.mostPopularPlan.rating}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {analytics.mostPopularPlan.reviewCount} reseñas
                      </span>
                      {analytics.mostPopularPlan.category && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                          {analytics.mostPopularPlan.category}
                        </Badge>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Sin datos</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2 dark:text-slate-100">
              <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              Actividad Reciente
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setView('plans')} className="text-cyan-700 dark:text-cyan-400">
              Ver todo <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full skeleton-wave" />
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay actividad reciente</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id + activity.type}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className={`p-1.5 rounded-md ${
                      activity.type === 'plan' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400'
                    }`}>
                      {activity.type === 'plan' ? <MapPin className="h-3.5 w-3.5" /> : <HomeIcon className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{activity.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.type === 'plan' ? 'Plan' : 'Cabaña'} · {activity.action === 'created' ? 'Creado' : 'Actualizado'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(activity.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2 dark:text-slate-100">
              <Mail className="h-4 w-4 text-rose-500 dark:text-rose-400" />
              Mensajes Recientes
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setView('messages')} className="text-cyan-700 dark:text-cyan-400">
              Ver todos <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full skeleton-wave" />
                ))}
              </div>
            ) : recentMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay mensajes</p>
            ) : (
              <div className="space-y-2">
                {recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${
                      msg.isRead
                        ? 'hover:bg-muted/30 dark:hover:bg-slate-800'
                        : 'bg-cyan-50/50 border border-cyan-100 hover:bg-cyan-50/70 dark:bg-cyan-950/30 dark:border-cyan-900 dark:hover:bg-cyan-950/50'
                    }`}
                  >
                    {!msg.isRead && <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${!msg.isRead ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                          {msg.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{msg.email}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {msg.subject || msg.message.slice(0, 80)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold dark:text-slate-100">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="h-auto py-3 flex items-center gap-3 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 dark:hover:border-emerald-700 justify-start"
                onClick={() => {
                  setView('plan-form')
                  useCMSStore.getState().setEditingId(null)
                }}
              >
                <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-sm">Crear Plan</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex items-center gap-3 hover:border-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950 dark:hover:border-cyan-700 justify-start"
                onClick={() => {
                  setView('cabin-form')
                  useCMSStore.getState().setEditingId(null)
                }}
              >
                <div className="p-1.5 rounded-md bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-400">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-sm">Crear Cabaña</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex items-center gap-3 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950 dark:hover:border-rose-700 justify-start"
                onClick={() => setView('messages')}
              >
                <div className="p-1.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-400">
                  <Eye className="h-4 w-4" />
                </div>
                <span className="text-sm">Ver Mensajes</span>
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-3 flex items-center gap-2 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 dark:hover:border-amber-700 justify-start"
                  onClick={() => setExportOpen(true)}
                >
                  <div className="p-1.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-400">
                    <Download className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Exportar</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex items-center gap-2 hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950 dark:hover:border-violet-700 justify-start"
                  onClick={() => setImportOpen(true)}
                >
                  <div className="p-1.5 rounded-md bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-400">
                    <Upload className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Importar</span>
                </Button>
              </div>
            </div>

            {stats && (
              <div className="mt-4 pt-3 border-t dark:border-slate-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Valoración promedio</span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{stats.avgTestimonialRating}</span>
                    <span className="text-amber-400">★</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-md dialog-enter rounded-xl shadow-2xl backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-amber-600" />
              Exportar Datos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">Selecciona los datos que deseas incluir en la exportación:</p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="exp-plans"
                  checked={exportOptions.plans}
                  onCheckedChange={(checked) => setExportOptions({ ...exportOptions, plans: !!checked })}
                />
                <label htmlFor="exp-plans" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                  <MapIcon className="h-4 w-4 text-emerald-500" />
                  Planes
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="exp-cabins"
                  checked={exportOptions.cabins}
                  onCheckedChange={(checked) => setExportOptions({ ...exportOptions, cabins: !!checked })}
                />
                <label htmlFor="exp-cabins" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                  <HomeIcon className="h-4 w-4 text-cyan-500" />
                  Cabañas
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="exp-testimonials"
                  checked={exportOptions.testimonials}
                  onCheckedChange={(checked) => setExportOptions({ ...exportOptions, testimonials: !!checked })}
                />
                <label htmlFor="exp-testimonials" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                  <MessageSquareQuote className="h-4 w-4 text-amber-500" />
                  Testimonios
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="exp-categories"
                  checked={exportOptions.categories}
                  onCheckedChange={(checked) => setExportOptions({ ...exportOptions, categories: !!checked })}
                />
                <label htmlFor="exp-categories" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                  <Tag className="h-4 w-4 text-slate-500" />
                  Categorías
                </label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="exp-site-content"
                  checked={exportOptions.siteContent}
                  onCheckedChange={(checked) => setExportOptions({ ...exportOptions, siteContent: !!checked })}
                />
                <label htmlFor="exp-site-content" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4 text-rose-500" />
                  Contenido del Sitio
                </label>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Formato:</strong> JSON · Los datos se descargarán como un archivo .json
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleExport}
              disabled={exporting || !Object.values(exportOptions).some(Boolean)}
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={(open) => { if (!open) resetImportDialog() }}>
        <DialogContent className="max-w-lg dialog-enter rounded-xl shadow-2xl backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              Importar Datos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* File Upload */}
            {!importResult && (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                  <Upload className="h-8 w-8 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">Selecciona un archivo JSON para importar</p>
                  <label className="cursor-pointer">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImportFileSelect}
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 text-sm font-medium hover:bg-violet-200 dark:hover:bg-violet-800 transition-colors">
                      <Upload className="h-4 w-4" />
                      Seleccionar archivo
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">Solo archivos .json</p>
                </div>

                {/* Error message */}
                {importError && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-400">{importError}</p>
                  </div>
                )}

                {/* Preview */}
                {hasImportableData && !importResult && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Vista previa de los datos:</p>
                    <div className="space-y-2">
                      {importPreview!.plans > 0 && (
                        <div className="flex items-center space-x-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                          <Checkbox
                            id="imp-plans"
                            checked={importOptions.plans}
                            onCheckedChange={(checked) => setImportOptions({ ...importOptions, plans: !!checked })}
                          />
                          <label htmlFor="imp-plans" className="text-sm flex items-center gap-2 cursor-pointer flex-1">
                            <MapIcon className="h-4 w-4 text-emerald-500" />
                            Planes
                          </label>
                          <Badge variant="outline" className="text-xs">{importPreview!.plans}</Badge>
                        </div>
                      )}
                      {importPreview!.cabins > 0 && (
                        <div className="flex items-center space-x-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                          <Checkbox
                            id="imp-cabins"
                            checked={importOptions.cabins}
                            onCheckedChange={(checked) => setImportOptions({ ...importOptions, cabins: !!checked })}
                          />
                          <label htmlFor="imp-cabins" className="text-sm flex items-center gap-2 cursor-pointer flex-1">
                            <HomeIcon className="h-4 w-4 text-cyan-500" />
                            Cabañas
                          </label>
                          <Badge variant="outline" className="text-xs">{importPreview!.cabins}</Badge>
                        </div>
                      )}
                      {importPreview!.testimonials > 0 && (
                        <div className="flex items-center space-x-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                          <Checkbox
                            id="imp-testimonials"
                            checked={importOptions.testimonials}
                            onCheckedChange={(checked) => setImportOptions({ ...importOptions, testimonials: !!checked })}
                          />
                          <label htmlFor="imp-testimonials" className="text-sm flex items-center gap-2 cursor-pointer flex-1">
                            <MessageSquareQuote className="h-4 w-4 text-amber-500" />
                            Testimonios
                          </label>
                          <Badge variant="outline" className="text-xs">{importPreview!.testimonials}</Badge>
                        </div>
                      )}
                      {importPreview!.categories > 0 && (
                        <div className="flex items-center space-x-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                          <Checkbox
                            id="imp-categories"
                            checked={importOptions.categories}
                            onCheckedChange={(checked) => setImportOptions({ ...importOptions, categories: !!checked })}
                          />
                          <label htmlFor="imp-categories" className="text-sm flex items-center gap-2 cursor-pointer flex-1">
                            <Tag className="h-4 w-4 text-slate-500" />
                            Categorías
                          </label>
                          <Badge variant="outline" className="text-xs">{importPreview!.categories}</Badge>
                        </div>
                      )}
                      {importPreview!.siteContent > 0 && (
                        <div className="flex items-center space-x-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                          <Checkbox
                            id="imp-site-content"
                            checked={importOptions.siteContent}
                            onCheckedChange={(checked) => setImportOptions({ ...importOptions, siteContent: !!checked })}
                          />
                          <label htmlFor="imp-site-content" className="text-sm flex items-center gap-2 cursor-pointer flex-1">
                            <FileText className="h-4 w-4 text-rose-500" />
                            Contenido del Sitio
                          </label>
                          <Badge variant="outline" className="text-xs">{importPreview!.siteContent}</Badge>
                        </div>
                      )}
                    </div>
                    <div className="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-3 border border-violet-100 dark:border-violet-900">
                      <p className="text-xs text-violet-700 dark:text-violet-300">
                        <strong>Nota:</strong> Los registros existentes se actualizarán si coinciden por slug (planes/cabañas/categorías), por nombre+texto (testimonios) o por sección (contenido del sitio). Los registros nuevos se crearán.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Import Results */}
            {importResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Importación completada</span>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{importResult.totals.created}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400/70">Creados</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900">
                    <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">{importResult.totals.updated}</p>
                    <p className="text-xs text-cyan-600 dark:text-cyan-400/70">Actualizados</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900">
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">{importResult.totals.errors}</p>
                    <p className="text-xs text-red-600 dark:text-red-400/70">Errores</p>
                  </div>
                </div>

                {/* Detailed results */}
                <div className="space-y-1.5">
                  {importResult.result.plans.created + importResult.result.plans.updated + importResult.result.plans.errors > 0 && (
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <MapIcon className="h-4 w-4 text-emerald-500" />
                      <span className="flex-1">Planes</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{importResult.result.plans.created} creados</span>
                      <span className="text-cyan-600 dark:text-cyan-400">{importResult.result.plans.updated} act.</span>
                      {importResult.result.plans.errors > 0 && (
                        <span className="text-red-600 dark:text-red-400">{importResult.result.plans.errors} err.</span>
                      )}
                    </div>
                  )}
                  {importResult.result.cabins.created + importResult.result.cabins.updated + importResult.result.cabins.errors > 0 && (
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <HomeIcon className="h-4 w-4 text-cyan-500" />
                      <span className="flex-1">Cabañas</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{importResult.result.cabins.created} creados</span>
                      <span className="text-cyan-600 dark:text-cyan-400">{importResult.result.cabins.updated} act.</span>
                      {importResult.result.cabins.errors > 0 && (
                        <span className="text-red-600 dark:text-red-400">{importResult.result.cabins.errors} err.</span>
                      )}
                    </div>
                  )}
                  {importResult.result.testimonials.created + importResult.result.testimonials.updated + importResult.result.testimonials.errors > 0 && (
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <MessageSquareQuote className="h-4 w-4 text-amber-500" />
                      <span className="flex-1">Testimonios</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{importResult.result.testimonials.created} creados</span>
                      <span className="text-cyan-600 dark:text-cyan-400">{importResult.result.testimonials.updated} act.</span>
                      {importResult.result.testimonials.errors > 0 && (
                        <span className="text-red-600 dark:text-red-400">{importResult.result.testimonials.errors} err.</span>
                      )}
                    </div>
                  )}
                  {importResult.result.categories.created + importResult.result.categories.updated + importResult.result.categories.errors > 0 && (
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <Tag className="h-4 w-4 text-slate-500" />
                      <span className="flex-1">Categorías</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{importResult.result.categories.created} creados</span>
                      <span className="text-cyan-600 dark:text-cyan-400">{importResult.result.categories.updated} act.</span>
                      {importResult.result.categories.errors > 0 && (
                        <span className="text-red-600 dark:text-red-400">{importResult.result.categories.errors} err.</span>
                      )}
                    </div>
                  )}
                  {importResult.result.siteContent.created + importResult.result.siteContent.updated + importResult.result.siteContent.errors > 0 && (
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <FileText className="h-4 w-4 text-rose-500" />
                      <span className="flex-1">Contenido del Sitio</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{importResult.result.siteContent.created} creados</span>
                      <span className="text-cyan-600 dark:text-cyan-400">{importResult.result.siteContent.updated} act.</span>
                      {importResult.result.siteContent.errors > 0 && (
                        <span className="text-red-600 dark:text-red-400">{importResult.result.siteContent.errors} err.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {importResult ? (
              <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={resetImportDialog}>
                Cerrar
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={resetImportDialog}>
                  Cancelar
                </Button>
                <Button
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={handleImport}
                  disabled={importing || !hasImportableData || selectedEntities.length === 0}
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
