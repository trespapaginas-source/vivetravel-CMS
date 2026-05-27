'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Clock,
  MapPin,
  Home as HomeIcon,
  MessageSquareQuote,
  Tag,
  FileText,
  Mail,
} from 'lucide-react'
import { toast } from 'sonner'

interface ActivityUser {
  id: string
  fullName: string | null
  email: string
  role: string
}

interface ActivityLogEntry {
  id: string
  userId: string
  action: string
  entity: string
  entityId: string | null
  details: string | null
  createdAt: string
  user: ActivityUser
}

const actionConfig: Record<string, { icon: React.ElementType; color: string; bg: string; verb: string }> = {
  create: { icon: Plus, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950', verb: 'creó' },
  update: { icon: Pencil, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950', verb: 'actualizó' },
  delete: { icon: Trash2, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950', verb: 'eliminó' },
  publish: { icon: Eye, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950', verb: 'publicó' },
  unpublish: { icon: EyeOff, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950', verb: 'despublicó' },
  duplicate: { icon: Copy, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800', verb: 'duplicó' },
}

const entityConfig: Record<string, { icon: React.ElementType; label: string; article: string; indefinite: string }> = {
  plan: { icon: MapPin, label: 'plan', article: 'el', indefinite: 'un' },
  cabin: { icon: HomeIcon, label: 'cabaña', article: 'la', indefinite: 'una' },
  testimonial: { icon: MessageSquareQuote, label: 'testimonio', article: 'el', indefinite: 'un' },
  category: { icon: Tag, label: 'categoría', article: 'la', indefinite: 'una' },
  site_content: { icon: FileText, label: 'contenido del sitio', article: 'el', indefinite: 'un' },
  message: { icon: Mail, label: 'mensaje', article: 'el', indefinite: 'un' },
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'ahora'
  if (diffMins < 60) return `hace ${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `hace ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `hace ${diffDays}d`
  const diffMonths = Math.floor(diffDays / 30)
  return `hace ${diffMonths}mes`
}

function getEntityName(details: string | null): string | null {
  if (!details) return null
  try {
    const parsed = JSON.parse(details)
    return parsed.name || null
  } catch {
    return details
  }
}

export default function ActivityView() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEntity, setFilterEntity] = useState<string>('all')
  const [filterAction, setFilterAction] = useState<string>('all')

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const params = new URLSearchParams()
        if (filterEntity !== 'all') params.set('entity', filterEntity)
        if (filterAction !== 'all') params.set('action', filterAction)

        const res = await fetch(`/api/activity?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setLogs(data.logs || [])
        }
      } catch {
        toast.error('Error al cargar registro de actividad')
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [filterEntity, filterAction])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Registro de Actividad</h1>
          {!loading && (
            <Badge variant="outline" className="bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800">
              {logs.length} registros
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Entidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las entidades</SelectItem>
            <SelectItem value="plan">Planes</SelectItem>
            <SelectItem value="cabin">Cabañas</SelectItem>
            <SelectItem value="testimonial">Testimonios</SelectItem>
            <SelectItem value="category">Categorías</SelectItem>
            <SelectItem value="site_content">Contenido del Sitio</SelectItem>
            <SelectItem value="message">Mensajes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Acción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            <SelectItem value="create">Creación</SelectItem>
            <SelectItem value="update">Actualización</SelectItem>
            <SelectItem value="delete">Eliminación</SelectItem>
            <SelectItem value="publish">Publicación</SelectItem>
            <SelectItem value="unpublish">Despublicación</SelectItem>
            <SelectItem value="duplicate">Duplicación</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0 skeleton-wave" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-64 skeleton-wave" />
                <Skeleton className="h-3 w-24 skeleton-wave" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 mb-4 empty-float">
            <Clock className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">No hay registros de actividad</h3>
          <p className="text-base text-muted-foreground">
            Las acciones que realices en el CMS aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="space-y-1">
            {logs.map((log) => {
              const action = actionConfig[log.action] || actionConfig.update
              const entity = entityConfig[log.entity] || { icon: FileText, label: log.entity, article: 'el', indefinite: 'un' }
              const ActionIcon = action.icon
              const EntityIcon = entity.icon
              const entityName = getEntityName(log.details)
              const userName = log.user.fullName || log.user.email

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative"
                >
                  {/* Action icon on timeline */}
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${action.bg} ${action.color} shrink-0 ring-2 ring-white dark:ring-slate-900`}>
                    <ActionIcon className="h-3.5 w-3.5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{userName}</span>
                      {' '}
                      <span className="text-muted-foreground">{action.verb}</span>
                      {' '}
                      {entityName ? (
                        <>
                          {entity.article} {entity.label}{' '}
                          <span className="font-medium text-slate-900 dark:text-slate-100">&apos;{entityName}&apos;</span>
                        </>
                      ) : (
                        <>{entity.indefinite} {entity.label}</>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        <EntityIcon className="h-2.5 w-2.5 mr-1" />
                        {entity.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(log.createdAt)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
