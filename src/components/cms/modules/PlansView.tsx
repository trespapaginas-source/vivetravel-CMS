'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  MapPin,
  X,
  Loader2,
  Clock,
  Users as UsersIcon,
  Star,
  Check,
  X as XIcon,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Printer,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCMSStore } from '@/lib/cms-store'
import { getPlanExperienceSection, type ExperienceSectionId } from '@/lib/experience-sections'
import { toast } from 'sonner'
import ConfirmDialog from '../shared/ConfirmDialog'

interface PlanCategory {
  id: string
  name: string
  slug: string
  color: string
}

interface PlanImage {
  id: string
  url: string
  caption: string | null
  sortOrder: number
}

interface PlanInclude {
  id: string
  text: string
  sortOrder: number
}

interface PlanExclude {
  id: string
  text: string
  sortOrder: number
}

interface PlanHighlight {
  id: string
  text: string
  sortOrder: number
}

interface TourPlan {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  fullDescription: string | null
  price: number
  duration: string | null
  difficulty: string | null
  location: string | null
  published: boolean
  categoryId: string | null
  category: PlanCategory | null
  maxGuests: number | null
  sortOrder: number
  images?: PlanImage[]
  includes?: PlanInclude[]
  excludes?: PlanExclude[]
  highlights?: PlanHighlight[]
  _count?: { testimonials: number }
  updatedAt?: string
}

interface SortConfig {
  key: string
  direction: 'asc' | 'desc' | null
}

export default function PlansView({ experienceFilter }: { experienceFilter?: ExperienceSectionId }) {
  const { setView, setEditingId, user } = useCMSStore()
  const isAdmin = user?.role === 'administrador'

  const [plans, setPlans] = useState<TourPlan[]>([])
  const [categories, setCategories] = useState<PlanCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [filterPublished, setFilterPublished] = useState<string>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
  const [detailPlan, setDetailPlan] = useState<TourPlan | null>(null)
  const [printPlan, setPrintPlan] = useState<TourPlan | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null })

  const sectionLabels: Record<string, string> = {
    pasadias: 'Pasadías',
    nacionales: 'Destinos Nacionales',
    internacionales: 'Destinos Internacionales',
    grupales: 'Viajes Grupales',
    tours: 'Tours',
  }
  const viewTitle = experienceFilter ? sectionLabels[experienceFilter] : 'Planes Turísticos'

  const experiencePlansCount = useMemo(() => {
    return plans.filter((plan) => !experienceFilter || getPlanExperienceSection(plan) === experienceFilter).length
  }, [plans, experienceFilter])

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ planId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingCell, setSavingCell] = useState(false)

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Filtered plans (search + category + difficulty + published + experience)
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const q = debouncedSearch.toLowerCase()
      const matchSearch = !q ||
        plan.name.toLowerCase().includes(q) ||
        (plan.location?.toLowerCase().includes(q) ?? false) ||
        (plan.shortDescription?.toLowerCase().includes(q) ?? false)
      const matchCategory = filterCategory === 'all' || plan.categoryId === filterCategory
      const matchDifficulty = filterDifficulty === 'all' || plan.difficulty === filterDifficulty
      const matchPublished =
        filterPublished === 'all' ||
        (filterPublished === 'published' && plan.published) ||
        (filterPublished === 'draft' && !plan.published)
      const matchExperience = !experienceFilter || getPlanExperienceSection(plan) === experienceFilter
      return matchSearch && matchCategory && matchDifficulty && matchPublished && matchExperience
    })
  }, [plans, debouncedSearch, filterCategory, filterDifficulty, filterPublished, experienceFilter])

  // Sorted + filtered plans
  const sortedAndFilteredPlans = useMemo(() => {
    const result = [...filteredPlans]
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let aVal: string | number = ''
        let bVal: string | number = ''
        switch (sortConfig.key) {
          case 'name':
            aVal = a.name.toLowerCase()
            bVal = b.name.toLowerCase()
            break
          case 'price':
            aVal = a.price
            bVal = b.price
            break
          case 'duration':
            aVal = (a.duration || '').toLowerCase()
            bVal = (b.duration || '').toLowerCase()
            break
          case 'location':
            aVal = (a.location || '').toLowerCase()
            bVal = (b.location || '').toLowerCase()
            break
          case 'category':
            aVal = (a.category?.name || '').toLowerCase()
            bVal = (b.category?.name || '').toLowerCase()
            break
          default:
            return 0
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return result
  }, [filteredPlans, sortConfig])

  // Sort handler
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' as const }
        if (prev.direction === 'desc') return { key: '', direction: null }
      }
      return { key, direction: 'asc' as const }
    })
  }

  // Sort indicator component
  const SortIndicator = ({ sortKey }: { sortKey: string }) => {
    if (sortConfig.key === sortKey && sortConfig.direction === 'asc') {
      return <ArrowUp className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
    }
    if (sortConfig.key === sortKey && sortConfig.direction === 'desc') {
      return <ArrowDown className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
    }
    return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
  }

  // Selection helpers
  const allFilteredSelected = filteredPlans.length > 0 && filteredPlans.every((p) => selectedIds.has(p.id))
  const someFilteredSelected = filteredPlans.some((p) => selectedIds.has(p.id)) && !allFilteredSelected

  const handleSelectAll = useCallback(() => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredPlans.map((p) => p.id)))
    }
  }, [allFilteredSelected, filteredPlans])

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
  const handleBatchPublish = async () => {
    setBatchLoading(true)
    let success = 0
    let failed = 0
    const promises = Array.from(selectedIds).map(async (id) => {
      try {
        const res = await fetch(`/api/plans/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ published: true }),
        })
        if (!res.ok) throw new Error()
        success++
      } catch {
        failed++
      }
    })
    await Promise.all(promises)
    setPlans(plans.map((p) => (selectedIds.has(p.id) ? { ...p, published: true } : p)))
    setSelectedIds(new Set())
    setBatchLoading(false)
    if (failed === 0) {
      toast.success(`${success} plan${success !== 1 ? 'es' : ''} publicado${success !== 1 ? 's' : ''}`)
    } else {
      toast.error(`${success} publicado${success !== 1 ? 's' : ''}, ${failed} fallido${failed !== 1 ? 's' : ''}`)
    }
  }

  const handleBatchUnpublish = async () => {
    setBatchLoading(true)
    let success = 0
    let failed = 0
    const promises = Array.from(selectedIds).map(async (id) => {
      try {
        const res = await fetch(`/api/plans/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ published: false }),
        })
        if (!res.ok) throw new Error()
        success++
      } catch {
        failed++
      }
    })
    await Promise.all(promises)
    setPlans(plans.map((p) => (selectedIds.has(p.id) ? { ...p, published: false } : p)))
    setSelectedIds(new Set())
    setBatchLoading(false)
    if (failed === 0) {
      toast.success(`${success} plan${success !== 1 ? 'es' : ''} despublicado${success !== 1 ? 's' : ''}`)
    } else {
      toast.error(`${success} despublicado${success !== 1 ? 's' : ''}, ${failed} fallido${failed !== 1 ? 's' : ''}`)
    }
  }

  const handleBatchDelete = async () => {
    setBatchLoading(true)
    let success = 0
    let failed = 0
    const promises = Array.from(selectedIds).map(async (id) => {
      try {
        const res = await fetch(`/api/plans/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error()
        success++
      } catch {
        failed++
      }
    })
    await Promise.all(promises)
    setPlans(plans.filter((p) => !selectedIds.has(p.id)))
    setSelectedIds(new Set())
    setBatchLoading(false)
    if (failed === 0) {
      toast.success(`${success} plan${success !== 1 ? 'es' : ''} eliminado${success !== 1 ? 's' : ''}`)
    } else {
      toast.error(`${success} eliminado${success !== 1 ? 's' : ''}, ${failed} fallido${failed !== 1 ? 's' : ''}`)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, catRes] = await Promise.all([
          fetch('/api/plans'),
          fetch('/api/categories'),
        ])
        if (plansRes.ok) {
          const data = await plansRes.json()
          setPlans(data.plans || [])
        }
        if (catRes.ok) {
          const data = await catRes.json()
          setCategories(data.categories || [])
        }
      } catch {
        toast.error('Error al cargar planes')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/plans/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      setPlans(plans.filter((p) => p.id !== deleteId))
      toast.success('Plan eliminado correctamente')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar plan')
    } finally {
      setDeleteId(null)
    }
  }

  const handleTogglePublished = async (plan: TourPlan) => {
    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !plan.published }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      setPlans(plans.map((p) => (p.id === plan.id ? { ...p, published: !p.published } : p)))
      toast.success(plan.published ? 'Plan despublicado' : 'Plan publicado')
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  // Sort order helpers
  const sortedPlans = [...plans].sort((a, b) => a.sortOrder - b.sortOrder)

  const handleMoveUp = async (plan: TourPlan) => {
    const sortedIdx = sortedPlans.findIndex((p) => p.id === plan.id)
    if (sortedIdx <= 0) return
    const otherPlan = sortedPlans[sortedIdx - 1]
    try {
      await Promise.all([
        fetch(`/api/plans/${plan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: otherPlan.sortOrder }),
        }),
        fetch(`/api/plans/${otherPlan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: plan.sortOrder }),
        }),
      ])
      // Swap locally
      setPlans(plans.map((p) => {
        if (p.id === plan.id) return { ...p, sortOrder: otherPlan.sortOrder }
        if (p.id === otherPlan.id) return { ...p, sortOrder: plan.sortOrder }
        return p
      }))
      toast.success('Orden actualizado')
    } catch {
      toast.error('Error al reordenar')
    }
  }

  const handleMoveDown = async (plan: TourPlan) => {
    const sortedIdx = sortedPlans.findIndex((p) => p.id === plan.id)
    if (sortedIdx === -1 || sortedIdx >= sortedPlans.length - 1) return
    const otherPlan = sortedPlans[sortedIdx + 1]
    try {
      await Promise.all([
        fetch(`/api/plans/${plan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: otherPlan.sortOrder }),
        }),
        fetch(`/api/plans/${otherPlan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: plan.sortOrder }),
        }),
      ])
      setPlans(plans.map((p) => {
        if (p.id === plan.id) return { ...p, sortOrder: otherPlan.sortOrder }
        if (p.id === otherPlan.id) return { ...p, sortOrder: plan.sortOrder }
        return p
      }))
      toast.success('Orden actualizado')
    } catch {
      toast.error('Error al reordenar')
    }
  }

  const handleDuplicate = async (plan: TourPlan) => {
    try {
      const newSlug = plan.slug + '-copia'
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: plan.name + ' (Copia)',
          slug: newSlug,
          price: plan.price,
          duration: plan.duration,
          difficulty: plan.difficulty,
          location: plan.location,
          categoryId: plan.categoryId,
          published: false,
          description: '',
          shortDescription: '',
          includes: [],
          excludes: [],
          highlights: [],
          sortOrder: plans.length,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al duplicar')
      }
      const newPlan = await res.json()
      setPlans([...plans, newPlan.plan || { ...plan, id: newPlan.id || Date.now().toString(), name: plan.name + ' (Copia)', slug: newSlug, published: false }])
      toast.success('Plan duplicado correctamente')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al duplicar plan')
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price)

  // Inline editing handlers
  const handleStartEdit = (planId: string, field: string, currentValue: string) => {
    setEditingCell({ planId, field })
    setEditValue(field === 'price' ? String(currentValue) : currentValue)
  }

  const handleSaveEdit = async () => {
    if (!editingCell) return
    const { planId, field } = editingCell
    const originalPlan = plans.find((p) => p.id === planId)
    if (!originalPlan) return

    // Check if value actually changed
    const originalValue = field === 'price' ? String(originalPlan.price) : (originalPlan[field as keyof TourPlan] as string || '')
    if (editValue === originalValue) {
      setEditingCell(null)
      return
    }

    setSavingCell(true)
    try {
      const body: Record<string, unknown> = {}
      if (field === 'price') {
        body.price = Number(editValue) || 0
      } else if (field === 'name') {
        body.name = editValue
        body.slug = slugifySync(editValue)
      } else {
        body[field] = editValue
      }

      const res = await fetch(`/api/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Error al guardar')

      // Update local state
      setPlans(plans.map((p) => {
        if (p.id === planId) {
          if (field === 'price') return { ...p, price: Number(editValue) || 0 }
          if (field === 'name') return { ...p, name: editValue }
          return { ...p, [field]: editValue }
        }
        return p
      }))
      toast.success('Campo actualizado')
    } catch {
      toast.error('Error al actualizar campo')
    } finally {
      setSavingCell(false)
      setEditingCell(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  // Simple slugify for inline edit (client-side only)
  const slugifySync = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const getFirstImage = (plan: TourPlan): string | null => {
    if (plan.images && plan.images.length > 0) {
      const sorted = [...plan.images].sort((a, b) => a.sortOrder - b.sortOrder)
      return sorted[0].url
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{viewTitle}</h1>
          {!loading && (
            <Badge variant="outline" className="bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800">
              {experiencePlansCount} {experiencePlansCount === 1 ? 'plan' : 'planes'}
            </Badge>
          )}
        </div>
        <Button
          onClick={() => { setView('plan-form'); setEditingId(null) }}
          className="bg-cyan-700 hover:bg-cyan-800"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nuevo Plan
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, ubicación o descripción..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-9 rounded-lg border-slate-200 dark:border-slate-700 focus-visible:ring-cyan-500"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setDebouncedSearch('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {debouncedSearch && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredPlans.length} resultado{filteredPlans.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Dificultad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Fácil">Fácil</SelectItem>
            <SelectItem value="Moderado">Moderado</SelectItem>
            <SelectItem value="Avanzado">Avanzado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPublished} onValueChange={setFilterPublished}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3">
              <Skeleton className="h-[30px] w-[40px] rounded skeleton-wave" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48 skeleton-wave" />
                <Skeleton className="h-3 w-24 skeleton-wave" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedAndFilteredPlans.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 mb-4 empty-float">
            <MapPin className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">No se encontraron planes</h3>
          <p className="text-base text-muted-foreground mb-4">
            {debouncedSearch || filterCategory !== 'all' || filterDifficulty !== 'all' || filterPublished !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Crea tu primer plan turístico para comenzar'}
          </p>
          <Button
            onClick={() => { setView('plan-form'); setEditingId(null) }}
            className="bg-cyan-700 hover:bg-cyan-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Crear primer plan
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {/* Mobile Select All */}
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={allFilteredSelected}
                {...(someFilteredSelected && { 'data-state': 'indeterminate' as const })}
                onCheckedChange={handleSelectAll}
                aria-label="Seleccionar todos"
              />
              <span className="text-sm text-muted-foreground">Seleccionar todos</span>
            </div>
            {sortedAndFilteredPlans.map((plan, idx) => {
              const firstImage = getFirstImage(plan)
              const isSelected = selectedIds.has(plan.id)
              return (
                <div
                  key={plan.id}
                  className={`stagger-item rounded-xl shadow-sm border p-4 transition-all duration-200 hover:shadow-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${isSelected ? 'ring-2 ring-cyan-500/40 border-cyan-400 dark:border-cyan-600 bg-cyan-50/30 dark:bg-cyan-950/20' : ''}`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex gap-3">
                    {/* Checkbox */}
                    <div className="pt-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectOne(plan.id)}
                        aria-label={`Seleccionar ${plan.name}`}
                      />
                    </div>
                    {/* Image Thumbnail */}
                    <div className="w-24 h-[120px] rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={plan.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MapPin className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                    </div>
                    {/* Card Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Name + Status Badge */}
                      <div className="flex items-start gap-2">
                        <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate flex-1">{plan.name}</h3>
                        <Badge
                          variant="outline"
                          className={
                            plan.published
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0.5 text-[10px] shrink-0 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 border-amber-200 px-2 py-0.5 text-[10px] shrink-0 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
                          }
                        >
                          {plan.published ? 'Publicado' : 'Borrador'}
                        </Badge>
                      </div>
                      {/* Location */}
                      {plan.location && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{plan.location}</span>
                        </div>
                      )}
                      {/* Price */}
                      <p className="text-sm font-bold text-cyan-700 dark:text-cyan-400">{formatPrice(plan.price)}</p>
                      {/* Badges Row */}
                      <div className="flex flex-wrap gap-1.5">
                        {plan.duration && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                            <Clock className="h-2.5 w-2.5 mr-0.5" />
                            {plan.duration}
                          </Badge>
                        )}
                        {plan.difficulty && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                            {plan.difficulty}
                          </Badge>
                        )}
                        {plan.category && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                            <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: plan.category.color }} />
                            {plan.category.name}
                          </Badge>
                        )}
                      </div>
                      {/* Action Buttons Row */}
                      <div className="flex items-center gap-1 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-slate-600 dark:text-slate-400"
                          onClick={() => setDetailPlan(plan)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Detalle
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-slate-600 dark:text-slate-400"
                          onClick={() => { setView('plan-form'); setEditingId(plan.id) }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-slate-600 dark:text-slate-400"
                          onClick={() => handleDuplicate(plan)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Duplicar
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive"
                            onClick={() => setDeleteId(plan.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Table Summary */}
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-sm text-muted-foreground">
              Mostrando <span className="font-medium text-slate-700 dark:text-slate-300">{sortedAndFilteredPlans.length}</span> de <span className="font-medium text-slate-700 dark:text-slate-300">{plans.length}</span> elementos
            </p>
            {(debouncedSearch || filterCategory !== 'all' || filterDifficulty !== 'all' || filterPublished !== 'all') && (
              <button
                onClick={() => { setSearchInput(''); setDebouncedSearch(''); setFilterCategory('all'); setFilterDifficulty('all'); setFilterPublished('all') }}
                className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg bg-white dark:bg-slate-900 shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
            <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 dark:bg-slate-800/80">
                <TableHead className="w-[40px] dark:text-slate-300">
                  <Checkbox
                    checked={allFilteredSelected}
                    {...(someFilteredSelected && { 'data-state': 'indeterminate' as const })}
                    onCheckedChange={handleSelectAll}
                    aria-label="Seleccionar todos"
                  />
                </TableHead>
                <TableHead className="w-[40px] dark:text-slate-300">#</TableHead>
                <TableHead className="dark:text-slate-300 cursor-pointer select-none hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    Nombre
                    <SortIndicator sortKey="name" />
                  </div>
                </TableHead>
                <TableHead className="dark:text-slate-300 cursor-pointer select-none hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">
                    Categoría
                    <SortIndicator sortKey="category" />
                  </div>
                </TableHead>
                <TableHead className="dark:text-slate-300 cursor-pointer select-none hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors text-right" onClick={() => handleSort('price')}>
                  <div className="flex items-center justify-end gap-1">
                    Precio
                    <SortIndicator sortKey="price" />
                  </div>
                </TableHead>
                <TableHead className="dark:text-slate-300 cursor-pointer select-none hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" onClick={() => handleSort('duration')}>
                  <div className="flex items-center gap-1">
                    Duración
                    <SortIndicator sortKey="duration" />
                  </div>
                </TableHead>
                <TableHead className="dark:text-slate-300">Dificultad</TableHead>
                <TableHead className="dark:text-slate-300">Estado</TableHead>
                <TableHead className="dark:text-slate-300 cursor-pointer select-none hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" onClick={() => handleSort('location')}>
                  <div className="flex items-center gap-1">
                    Ubicación
                    <SortIndicator sortKey="location" />
                  </div>
                </TableHead>
                <TableHead className="dark:text-slate-300">Última Actualización</TableHead>
                <TableHead className="w-[80px] dark:text-slate-300">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredPlans.map((plan, idx) => {
                const firstImage = getFirstImage(plan)
                const isSelected = selectedIds.has(plan.id)
                return (
                  <TableRow
                    key={plan.id}
                    className={`group shadow-sm hover:shadow-md transition-all duration-200 hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20 ${idx % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''} ${isSelected ? 'bg-cyan-50/60 dark:bg-cyan-950/30' : ''}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectOne(plan.id)}
                        aria-label={`Seleccionar ${plan.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 dark:text-slate-500">
                      {plan.sortOrder}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {firstImage ? (
                          <div className="w-10 h-[30px] rounded overflow-hidden shrink-0 bg-muted">
                            <img
                              src={firstImage}
                              alt={plan.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-[30px] rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                        )}
                        <span
                          className={`font-medium text-slate-900 dark:text-slate-100 cursor-pointer ${editingCell?.planId === plan.id && editingCell?.field === 'name' ? 'hidden' : ''}`}
                          onDoubleClick={() => handleStartEdit(plan.id, 'name', plan.name)}
                          title="Doble clic para editar"
                        >{plan.name}</span>
                        {editingCell?.planId === plan.id && editingCell?.field === 'name' && (
                          <input
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={handleEditKeyDown}
                            disabled={savingCell}
                            className="font-medium text-slate-900 dark:text-slate-100 bg-cyan-50 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-700 rounded px-1.5 py-0.5 text-sm w-full outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        )}
                        {editingCell?.planId !== plan.id && (
                          <Pencil className="h-3 w-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {plan.category ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plan.category.color }} />
                          <span className="text-sm">{plan.category.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="font-medium text-slate-900 dark:text-slate-100 text-right tabular-nums cursor-pointer"
                      onDoubleClick={() => handleStartEdit(plan.id, 'price', String(plan.price))}
                      title="Doble clic para editar"
                    >
                      {editingCell?.planId === plan.id && editingCell?.field === 'price' ? (
                        <input
                          autoFocus
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={handleEditKeyDown}
                          disabled={savingCell}
                          className="font-medium text-slate-900 dark:text-slate-100 bg-cyan-50 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-700 rounded px-1.5 py-0.5 text-sm w-24 text-right outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          {formatPrice(plan.price)}
                          <Pencil className="h-3 w-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">{plan.duration || '—'}</TableCell>
                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">{plan.difficulty || '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          plan.published
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 px-2.5 py-0.5 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 status-dot-pulse status-dot-green'
                            : 'bg-amber-50 text-amber-700 border-amber-200 px-2.5 py-0.5 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 status-dot-pulse status-dot-amber badge-stripes'
                        }
                      >
                        {plan.published ? 'Publicado' : 'Borrador'}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                      onDoubleClick={() => handleStartEdit(plan.id, 'location', plan.location || '')}
                      title="Doble clic para editar"
                    >
                      {editingCell?.planId === plan.id && editingCell?.field === 'location' ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={handleEditKeyDown}
                          disabled={savingCell}
                          className="text-sm text-slate-700 dark:text-slate-300 bg-cyan-50 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-700 rounded px-1.5 py-0.5 w-full outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          {plan.location || <span className="text-muted-foreground">—</span>}
                          <Pencil className="h-3 w-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground dark:text-slate-400">
                      {plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-60 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailPlan(plan)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { setView('plan-form'); setEditingId(plan.id) }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublished(plan)}>
                            {plan.published ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Despublicar
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Publicar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(plan)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPrintPlan(plan)}>
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleMoveUp(plan)}
                            disabled={sortedPlans.findIndex((p) => p.id === plan.id) === 0}
                          >
                            <ChevronUp className="h-4 w-4 mr-2" />
                            Subir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleMoveDown(plan)}
                            disabled={sortedPlans.findIndex((p) => p.id === plan.id) === sortedPlans.length - 1}
                          >
                            <ChevronDown className="h-4 w-4 mr-2" />
                            Bajar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {isAdmin && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(plan.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>
        </>
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleBatchPublish}
            disabled={batchLoading}
          >
            {batchLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
            Publicar seleccionados
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950"
            onClick={handleBatchUnpublish}
            disabled={batchLoading}
          >
            {batchLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <EyeOff className="h-3.5 w-3.5 mr-1" />}
            Despublicar seleccionados
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
              onClick={() => setBatchDeleteOpen(true)}
              disabled={batchLoading}
            >
              {batchLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
              Eliminar seleccionados
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

      {/* Batch Delete Confirmation */}
      <ConfirmDialog
        open={batchDeleteOpen}
        onOpenChange={setBatchDeleteOpen}
        title={`¿Eliminar ${selectedIds.size} plan${selectedIds.size !== 1 ? 'es' : ''}?`}
        description="Esta acción eliminará los planes seleccionados y todos sus datos asociados. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleBatchDelete}
        destructive
      />

      {/* Detail Dialog */}
      <Dialog open={!!detailPlan} onOpenChange={(open) => !open && setDetailPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto dialog-enter rounded-xl shadow-2xl scroll-smooth-thin">
          <DialogHeader>
            <DialogTitle className="text-xl">{detailPlan?.name}</DialogTitle>
          </DialogHeader>
          {detailPlan && (
            <div className="space-y-6">
              {/* Image Gallery */}
              {detailPlan.images && detailPlan.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {detailPlan.images
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((img) => (
                      <div key={img.id} className="aspect-[4/3] rounded-lg overflow-hidden bg-muted border dark:border-slate-700">
                        <img
                          src={img.url}
                          alt={img.caption || detailPlan.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                    ))}
                </div>
              ) : (
                <div className="aspect-[16/9] rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <MapPin className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                </div>
              )}

              {/* Key Details */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center card-hover-lift relative">
                  <p className="text-xs text-muted-foreground mb-1">Precio</p>
                  <p className="text-lg font-bold text-cyan-700 dark:text-cyan-400">{formatPrice(detailPlan.price)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center card-hover-lift relative">
                  <p className="text-xs text-muted-foreground mb-1">Duración</p>
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{detailPlan.duration || '—'}</p>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center card-hover-lift relative">
                  <p className="text-xs text-muted-foreground mb-1">Dificultad</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{detailPlan.difficulty || '—'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center card-hover-lift relative">
                  <p className="text-xs text-muted-foreground mb-1">Ubicación</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{detailPlan.location || '—'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center card-hover-lift relative">
                  <p className="text-xs text-muted-foreground mb-1">Categoría</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{detailPlan.category?.name || '—'}</p>
                </div>
              </div>

              {/* Short Description */}
              {detailPlan.shortDescription && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Descripción Corta</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{detailPlan.shortDescription}</p>
                </div>
              )}

              {/* Includes */}
              {detailPlan.includes && detailPlan.includes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Incluye
                  </h4>
                  <ul className="space-y-1">
                    {detailPlan.includes
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((inc) => (
                        <li key={inc.id} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <span className="text-emerald-500 mt-1">✓</span>
                          {inc.text}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Excludes */}
              {detailPlan.excludes && detailPlan.excludes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <XIcon className="h-4 w-4 text-red-500" />
                    No Incluye
                  </h4>
                  <ul className="space-y-1">
                    {detailPlan.excludes
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((exc) => (
                        <li key={exc.id} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <span className="text-red-500 mt-1">✕</span>
                          {exc.text}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Highlights */}
              {detailPlan.highlights && detailPlan.highlights.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    Destacados
                  </h4>
                  <ul className="space-y-1">
                    {detailPlan.highlights
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((hl) => (
                        <li key={hl.id} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <span className="text-cyan-500 mt-1">•</span>
                          {hl.text}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => setDetailPlan(null)}
                >
                  Cerrar
                </Button>
                <Button
                  className="bg-cyan-700 hover:bg-cyan-800"
                  onClick={() => {
                    setDetailPlan(null)
                    setView('plan-form')
                    setEditingId(detailPlan.id)
                  }}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar este plan?"
        description="Esta acción eliminará el plan y todos sus datos asociados (imágenes, incluye/excluye, destacados). Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        destructive
      />

      {/* Print Preview Dialog */}
      <Dialog open={!!printPlan} onOpenChange={(open) => !open && setPrintPlan(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dialog-enter rounded-xl shadow-2xl scroll-smooth-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              Vista Previa de Impresión
            </DialogTitle>
          </DialogHeader>
          {printPlan && (
            <div id="print-content" className="print-content space-y-6">
              {/* Plan Title */}
              <div className="text-center border-b dark:border-slate-700 pb-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{printPlan.name}</h2>
                {printPlan.category && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: printPlan.category.color }} />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{printPlan.category.name}</span>
                  </div>
                )}
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Precio</p>
                  <p className="text-lg font-bold text-cyan-700 dark:text-cyan-400">{formatPrice(printPlan.price)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Duración</p>
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{printPlan.duration || '—'}</p>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Dificultad</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{printPlan.difficulty || '—'}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Ubicación</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{printPlan.location || '—'}</p>
                </div>
              </div>

              {/* Images Grid */}
              {printPlan.images && printPlan.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Imágenes</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {printPlan.images
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((img) => (
                        <div key={img.id} className="aspect-[4/3] rounded-lg overflow-hidden bg-muted border dark:border-slate-700">
                          <img
                            src={img.url}
                            alt={img.caption || printPlan.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Short Description */}
              {printPlan.shortDescription && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Descripción Corta</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{printPlan.shortDescription}</p>
                </div>
              )}

              {/* Full Description */}
              {printPlan.fullDescription && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Descripción Completa</h4>
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line prose prose-sm dark:prose-invert max-w-none">{printPlan.fullDescription}</div>
                </div>
              )}

              {/* Includes */}
              {printPlan.includes && printPlan.includes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Incluye
                  </h4>
                  <ul className="space-y-1">
                    {printPlan.includes
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((inc) => (
                        <li key={inc.id} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">✓</span>
                          {inc.text}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Excludes */}
              {printPlan.excludes && printPlan.excludes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <XIcon className="h-4 w-4 text-red-500" />
                    No Incluye
                  </h4>
                  <ul className="space-y-1">
                    {printPlan.excludes
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((exc) => (
                        <li key={exc.id} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">✕</span>
                          {exc.text}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Highlights */}
              {printPlan.highlights && printPlan.highlights.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    Destacados
                  </h4>
                  <ul className="space-y-1">
                    {printPlan.highlights
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((hl) => (
                        <li key={hl.id} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <span className="text-cyan-500 mt-0.5">•</span>
                          {hl.text}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Footer */}
              <div className="border-t dark:border-slate-700 pt-3 text-xs text-muted-foreground text-center">
                Documento generado el {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · Vive Travel CMS
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 print-hide">
            <Button variant="outline" onClick={() => setPrintPlan(null)}>
              Cerrar
            </Button>
            <Button
              className="bg-cyan-700 hover:bg-cyan-800"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-1" />
              Imprimir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
