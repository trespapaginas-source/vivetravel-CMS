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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Home as HomeIcon,
  MapPin,
  Bed,
  Bath,
  Users as UsersIcon,
  Clock,
  Star,
  CheckCircle,
  X,
  Loader2,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Printer,
} from 'lucide-react'
import { useCMSStore } from '@/lib/cms-store'
import { toast } from 'sonner'
import ConfirmDialog from '../shared/ConfirmDialog'

interface CabinImage {
  id: string
  url: string
  caption: string | null
  source: string
  sortOrder: number
}

interface CabinAmenity {
  id: string
  text: string
  sortOrder: number
}

interface CabinHighlight {
  id: string
  text: string
  sortOrder: number
}

interface CabinRule {
  id: string
  text: string
  sortOrder: number
}

interface Cabin {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  location: string | null
  pricePerNight: number
  capacity: number | null
  bedrooms: number | null
  bathrooms: number | null
  checkIn: string | null
  checkOut: string | null
  published: boolean
  sortOrder: number
  images?: CabinImage[]
  amenities?: CabinAmenity[]
  highlights?: CabinHighlight[]
  rules?: CabinRule[]
  updatedAt?: string
}

interface SortConfig {
  key: string
  direction: 'asc' | 'desc' | null
}

export default function CabinsView() {
  const { setView, setEditingId, user } = useCMSStore()
  const isAdmin = user?.role === 'administrador'

  const [cabins, setCabins] = useState<Cabin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterPublished, setFilterPublished] = useState<string>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
  const [detailCabin, setDetailCabin] = useState<Cabin | null>(null)
  const [printCabin, setPrintCabin] = useState<Cabin | null>(null)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null })

  // Batch selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Filtered cabins (search + published)
  const filteredCabins = useMemo(() => {
    return cabins.filter((cabin) => {
      const q = debouncedSearch.toLowerCase()
      const matchSearch = !q ||
        cabin.name.toLowerCase().includes(q) ||
        (cabin.location?.toLowerCase().includes(q) ?? false) ||
        (cabin.shortDescription?.toLowerCase().includes(q) ?? false)
      const matchPublished =
        filterPublished === 'all' ||
        (filterPublished === 'published' && cabin.published) ||
        (filterPublished === 'draft' && !cabin.published)
      return matchSearch && matchPublished
    })
  }, [cabins, debouncedSearch, filterPublished])

  // Sorted + filtered cabins
  const sortedAndFilteredCabins = useMemo(() => {
    const result = [...filteredCabins]
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let aVal: string | number = ''
        let bVal: string | number = ''
        switch (sortConfig.key) {
          case 'name':
            aVal = a.name.toLowerCase()
            bVal = b.name.toLowerCase()
            break
          case 'pricePerNight':
            aVal = a.pricePerNight
            bVal = b.pricePerNight
            break
          case 'capacity':
            aVal = a.capacity ?? 0
            bVal = b.capacity ?? 0
            break
          case 'location':
            aVal = (a.location || '').toLowerCase()
            bVal = (b.location || '').toLowerCase()
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
  }, [filteredCabins, sortConfig])

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/cabins')
        if (res.ok) {
          const data = await res.json()
          setCabins(data.cabins || [])
        }
      } catch {
        toast.error('Error al cargar cabañas')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Selection helpers
  const allFilteredSelected = filteredCabins.length > 0 && filteredCabins.every((c) => selectedIds.has(c.id))
  const someFilteredSelected = filteredCabins.some((c) => selectedIds.has(c.id)) && !allFilteredSelected

  const handleSelectAll = useCallback(() => {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredCabins.map((c) => c.id)))
    }
  }, [allFilteredSelected, filteredCabins])

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
        const res = await fetch(`/api/cabins/${id}`, {
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
    setCabins(cabins.map((c) => (selectedIds.has(c.id) ? { ...c, published: true } : c)))
    setSelectedIds(new Set())
    setBatchLoading(false)
    if (failed === 0) {
      toast.success(`${success} cabaña${success !== 1 ? 's' : ''} publicada${success !== 1 ? 's' : ''}`)
    } else {
      toast.error(`${success} publicada${success !== 1 ? 's' : ''}, ${failed} fallida${failed !== 1 ? 's' : ''}`)
    }
  }

  const handleBatchUnpublish = async () => {
    setBatchLoading(true)
    let success = 0
    let failed = 0
    const promises = Array.from(selectedIds).map(async (id) => {
      try {
        const res = await fetch(`/api/cabins/${id}`, {
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
    setCabins(cabins.map((c) => (selectedIds.has(c.id) ? { ...c, published: false } : c)))
    setSelectedIds(new Set())
    setBatchLoading(false)
    if (failed === 0) {
      toast.success(`${success} cabaña${success !== 1 ? 's' : ''} despublicada${success !== 1 ? 's' : ''}`)
    } else {
      toast.error(`${success} despublicada${success !== 1 ? 's' : ''}, ${failed} fallida${failed !== 1 ? 's' : ''}`)
    }
  }

  const handleBatchDelete = async () => {
    setBatchLoading(true)
    let success = 0
    let failed = 0
    const promises = Array.from(selectedIds).map(async (id) => {
      try {
        const res = await fetch(`/api/cabins/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error()
        success++
      } catch {
        failed++
      }
    })
    await Promise.all(promises)
    setCabins(cabins.filter((c) => !selectedIds.has(c.id)))
    setSelectedIds(new Set())
    setBatchLoading(false)
    if (failed === 0) {
      toast.success(`${success} cabaña${success !== 1 ? 's' : ''} eliminada${success !== 1 ? 's' : ''}`)
    } else {
      toast.error(`${success} eliminada${success !== 1 ? 's' : ''}, ${failed} fallida${failed !== 1 ? 's' : ''}`)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/cabins/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      setCabins(cabins.filter((c) => c.id !== deleteId))
      toast.success('Cabaña eliminada correctamente')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar cabaña')
    } finally {
      setDeleteId(null)
    }
  }

  const handleTogglePublished = async (cabin: Cabin) => {
    try {
      const res = await fetch(`/api/cabins/${cabin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !cabin.published }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      setCabins(cabins.map((c) => (c.id === cabin.id ? { ...c, published: !c.published } : c)))
      toast.success(cabin.published ? 'Cabaña despublicada' : 'Cabaña publicada')
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  // Sort order helpers
  const sortedCabins = [...cabins].sort((a, b) => a.sortOrder - b.sortOrder)

  const handleMoveUp = async (cabin: Cabin) => {
    const sortedIdx = sortedCabins.findIndex((c) => c.id === cabin.id)
    if (sortedIdx <= 0) return
    const otherCabin = sortedCabins[sortedIdx - 1]
    try {
      await Promise.all([
        fetch(`/api/cabins/${cabin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: otherCabin.sortOrder }),
        }),
        fetch(`/api/cabins/${otherCabin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: cabin.sortOrder }),
        }),
      ])
      setCabins(cabins.map((c) => {
        if (c.id === cabin.id) return { ...c, sortOrder: otherCabin.sortOrder }
        if (c.id === otherCabin.id) return { ...c, sortOrder: cabin.sortOrder }
        return c
      }))
      toast.success('Orden actualizado')
    } catch {
      toast.error('Error al reordenar')
    }
  }

  const handleMoveDown = async (cabin: Cabin) => {
    const sortedIdx = sortedCabins.findIndex((c) => c.id === cabin.id)
    if (sortedIdx === -1 || sortedIdx >= sortedCabins.length - 1) return
    const otherCabin = sortedCabins[sortedIdx + 1]
    try {
      await Promise.all([
        fetch(`/api/cabins/${cabin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: otherCabin.sortOrder }),
        }),
        fetch(`/api/cabins/${otherCabin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: cabin.sortOrder }),
        }),
      ])
      setCabins(cabins.map((c) => {
        if (c.id === cabin.id) return { ...c, sortOrder: otherCabin.sortOrder }
        if (c.id === otherCabin.id) return { ...c, sortOrder: cabin.sortOrder }
        return c
      }))
      toast.success('Orden actualizado')
    } catch {
      toast.error('Error al reordenar')
    }
  }

  const handleDuplicate = async (cabin: Cabin) => {
    try {
      const newSlug = cabin.slug + '-copia'
      const res = await fetch('/api/cabins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cabin.name + ' (Copia)',
          slug: newSlug,
          pricePerNight: cabin.pricePerNight,
          location: cabin.location,
          capacity: cabin.capacity,
          bedrooms: cabin.bedrooms,
          bathrooms: cabin.bathrooms,
          checkIn: cabin.checkIn,
          checkOut: cabin.checkOut,
          published: false,
          sortOrder: cabins.length,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al duplicar')
      }
      const newCabin = await res.json()
      setCabins([...cabins, newCabin.cabin || { ...cabin, id: newCabin.id || Date.now().toString(), name: cabin.name + ' (Copia)', slug: newSlug, published: false }])
      toast.success('Cabaña duplicada correctamente')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al duplicar cabaña')
    }
  }

  const getFirstImage = (cabin: Cabin): string | null => {
    if (cabin.images && cabin.images.length > 0) {
      const sorted = [...cabin.images].sort((a, b) => a.sortOrder - b.sortOrder)
      return sorted[0].url
    }
    return null
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Cabañas y Alojamientos</h1>
          {!loading && (
            <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
              {cabins.length} {cabins.length === 1 ? 'cabaña' : 'cabañas'}
            </Badge>
          )}
        </div>
        <Button
          onClick={() => { setView('cabin-form'); setEditingId(null) }}
          className="bg-cyan-700 hover:bg-cyan-800"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nueva Cabaña
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
            {filteredCabins.length} resultado{filteredCabins.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
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
      ) : sortedAndFilteredCabins.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 mb-4 empty-float">
            <HomeIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">No se encontraron cabañas</h3>
          <p className="text-base text-muted-foreground mb-4">
            {debouncedSearch || filterPublished !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Crea tu primera cabaña para comenzar'}
          </p>
          <Button
            onClick={() => { setView('cabin-form'); setEditingId(null) }}
            className="bg-cyan-700 hover:bg-cyan-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Crear primera cabaña
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
            {sortedAndFilteredCabins.map((cabin, idx) => {
              const firstImage = getFirstImage(cabin)
              const isSelected = selectedIds.has(cabin.id)
              return (
                <div
                  key={cabin.id}
                  className={`stagger-item rounded-xl shadow-sm border p-4 transition-all duration-200 hover:shadow-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${isSelected ? 'ring-2 ring-cyan-500/40 border-cyan-400 dark:border-cyan-600 bg-cyan-50/30 dark:bg-cyan-950/20' : ''}`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex gap-3">
                    {/* Checkbox */}
                    <div className="pt-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectOne(cabin.id)}
                        aria-label={`Seleccionar ${cabin.name}`}
                      />
                    </div>
                    {/* Image Thumbnail */}
                    <div className="w-24 h-[120px] rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={cabin.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HomeIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                    </div>
                    {/* Card Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Name + Status Badge */}
                      <div className="flex items-start gap-2">
                        <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate flex-1">{cabin.name}</h3>
                        <Badge
                          variant="outline"
                          className={
                            cabin.published
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0.5 text-[10px] shrink-0 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 border-amber-200 px-2 py-0.5 text-[10px] shrink-0 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
                          }
                        >
                          {cabin.published ? 'Publicado' : 'Borrador'}
                        </Badge>
                      </div>
                      {/* Location */}
                      {cabin.location && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{cabin.location}</span>
                        </div>
                      )}
                      {/* Price */}
                      <p className="text-sm font-bold text-cyan-700 dark:text-cyan-400">{formatPrice(cabin.pricePerNight)}<span className="text-[10px] font-normal text-slate-500 dark:text-slate-400"> /noche</span></p>
                      {/* Capacity / Bedrooms / Bathrooms Grid */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {cabin.capacity && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded px-1.5 py-0.5">
                            <UsersIcon className="h-2.5 w-2.5" />
                            {cabin.capacity}
                          </div>
                        )}
                        {cabin.bedrooms && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded px-1.5 py-0.5">
                            <Bed className="h-2.5 w-2.5" />
                            {cabin.bedrooms}
                          </div>
                        )}
                        {cabin.bathrooms && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded px-1.5 py-0.5">
                            <Bath className="h-2.5 w-2.5" />
                            {cabin.bathrooms}
                          </div>
                        )}
                      </div>
                      {/* Action Buttons Row */}
                      <div className="flex items-center gap-1 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-slate-600 dark:text-slate-400"
                          onClick={() => setDetailCabin(cabin)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Detalle
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-slate-600 dark:text-slate-400"
                          onClick={() => { setView('cabin-form'); setEditingId(cabin.id) }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-slate-600 dark:text-slate-400"
                          onClick={() => handleDuplicate(cabin)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Duplicar
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive"
                            onClick={() => setDeleteId(cabin.id)}
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
              Mostrando <span className="font-medium text-slate-700 dark:text-slate-300">{sortedAndFilteredCabins.length}</span> de <span className="font-medium text-slate-700 dark:text-slate-300">{cabins.length}</span> elementos
            </p>
            {(debouncedSearch || filterPublished !== 'all') && (
              <button
                onClick={() => { setSearchInput(''); setDebouncedSearch(''); setFilterPublished('all') }}
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
                <TableHead className="dark:text-slate-300 cursor-pointer select-none hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" onClick={() => handleSort('location')}>
                  <div className="flex items-center gap-1">
                    Ubicación
                    <SortIndicator sortKey="location" />
                  </div>
                </TableHead>
                <TableHead className="dark:text-slate-300 cursor-pointer select-none hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors text-right" onClick={() => handleSort('pricePerNight')}>
                  <div className="flex items-center justify-end gap-1">
                    Precio/Noche
                    <SortIndicator sortKey="pricePerNight" />
                  </div>
                </TableHead>
                <TableHead className="dark:text-slate-300 cursor-pointer select-none hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" onClick={() => handleSort('capacity')}>
                  <div className="flex items-center gap-1">
                    Capacidad
                    <SortIndicator sortKey="capacity" />
                  </div>
                </TableHead>
                <TableHead className="dark:text-slate-300">Estado</TableHead>
                <TableHead className="dark:text-slate-300">Última Actualización</TableHead>
                <TableHead className="w-[80px] dark:text-slate-300">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredCabins.map((cabin, idx) => {
                const firstImage = getFirstImage(cabin)
                const isSelected = selectedIds.has(cabin.id)
                return (
                  <TableRow key={cabin.id} className={`group shadow-sm hover:shadow-md transition-all duration-200 hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20 ${idx % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''} ${isSelected ? 'bg-cyan-50/60 dark:bg-cyan-950/30' : ''}`}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleSelectOne(cabin.id)}
                        aria-label={`Seleccionar ${cabin.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 dark:text-slate-500">
                      {cabin.sortOrder}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {firstImage ? (
                          <div className="w-10 h-[30px] rounded overflow-hidden shrink-0 bg-muted">
                            <img
                              src={firstImage}
                              alt={cabin.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-[30px] rounded bg-cyan-50 dark:bg-cyan-950 flex items-center justify-center shrink-0">
                            <HomeIcon className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                          </div>
                        )}
                        <span className="font-medium text-slate-900 dark:text-slate-100">{cabin.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">{cabin.location || '—'}</TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100 text-right tabular-nums">{formatPrice(cabin.pricePerNight)}</TableCell>
                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">{cabin.capacity ? `${cabin.capacity} personas` : '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          cabin.published
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 px-2.5 py-0.5 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 status-dot-pulse status-dot-green'
                            : 'bg-amber-50 text-amber-700 border-amber-200 px-2.5 py-0.5 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 status-dot-pulse status-dot-amber badge-stripes'
                        }
                      >
                        {cabin.published ? 'Publicado' : 'Borrador'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground dark:text-slate-400">
                      {cabin.updatedAt ? new Date(cabin.updatedAt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-60 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setDetailCabin(cabin)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { setView('cabin-form'); setEditingId(cabin.id) }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublished(cabin)}>
                            {cabin.published ? (
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
                          <DropdownMenuItem onClick={() => handleDuplicate(cabin)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPrintCabin(cabin)}>
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleMoveUp(cabin)}
                            disabled={sortedCabins.findIndex((c) => c.id === cabin.id) === 0}
                          >
                            <ChevronUp className="h-4 w-4 mr-2" />
                            Subir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleMoveDown(cabin)}
                            disabled={sortedCabins.findIndex((c) => c.id === cabin.id) === sortedCabins.length - 1}
                          >
                            <ChevronDown className="h-4 w-4 mr-2" />
                            Bajar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {isAdmin && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(cabin.id)}
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
            {selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleBatchPublish}
            disabled={batchLoading}
          >
            {batchLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
            Publicar seleccionadas
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950"
            onClick={handleBatchUnpublish}
            disabled={batchLoading}
          >
            {batchLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <EyeOff className="h-3.5 w-3.5 mr-1" />}
            Despublicar seleccionadas
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
              Eliminar seleccionadas
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
        title={`¿Eliminar ${selectedIds.size} cabaña${selectedIds.size !== 1 ? 's' : ''}?`}
        description="Esta acción eliminará las cabañas seleccionadas y todos sus datos asociados. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleBatchDelete}
        destructive
      />

      {/* Detail Dialog */}
      <Dialog open={!!detailCabin} onOpenChange={(open) => !open && setDetailCabin(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto dialog-enter rounded-xl shadow-2xl scroll-smooth-thin">
          <DialogHeader>
            <DialogTitle className="text-xl">{detailCabin?.name}</DialogTitle>
          </DialogHeader>
          {detailCabin && (
            <div className="space-y-6">
              {/* Image Gallery */}
              {detailCabin.images && detailCabin.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {detailCabin.images
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((img) => (
                      <div key={img.id} className="aspect-[4/3] rounded-lg overflow-hidden bg-muted border dark:border-slate-700">
                        <img
                          src={img.url}
                          alt={img.caption || detailCabin.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                    ))}
                </div>
              ) : (
                <div className="aspect-[16/9] rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <HomeIcon className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                </div>
              )}

              {/* Location */}
              {detailCabin.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-slate-700 dark:text-slate-300">{detailCabin.location}</span>
                </div>
              )}

              {/* Short Description */}
              {detailCabin.shortDescription && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Descripción Corta</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{detailCabin.shortDescription}</p>
                </div>
              )}

              {/* Key Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center card-hover-lift relative">
                  <p className="text-xs text-muted-foreground mb-1">Precio/Noche</p>
                  <p className="text-lg font-bold text-cyan-700 dark:text-cyan-400">{formatPrice(detailCabin.pricePerNight)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center card-hover-lift relative">
                  <p className="text-xs text-muted-foreground mb-1">Capacidad</p>
                  <div className="flex items-center justify-center gap-1">
                    <UsersIcon className="h-4 w-4 text-slate-500" />
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{detailCabin.capacity || '—'}</p>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center card-hover-lift relative">
                  <p className="text-xs text-muted-foreground mb-1">Habitaciones</p>
                  <div className="flex items-center justify-center gap-1">
                    <Bed className="h-4 w-4 text-slate-500" />
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{detailCabin.bedrooms || '—'}</p>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center card-hover-lift relative">
                  <p className="text-xs text-muted-foreground mb-1">Baños</p>
                  <div className="flex items-center justify-center gap-1">
                    <Bath className="h-4 w-4 text-slate-500" />
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{detailCabin.bathrooms || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Check-in/Check-out */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-2">
                  <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Check-in</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{detailCabin.checkIn || '3:00 PM'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-2">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Check-out</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{detailCabin.checkOut || '11:00 AM'}</p>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              {detailCabin.amenities && detailCabin.amenities.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    Servicios y Amenidades
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {detailCabin.amenities
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((am) => (
                        <Badge key={am.id} variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">
                          {am.text}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Highlights */}
              {detailCabin.highlights && detailCabin.highlights.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    Destacados
                  </h4>
                  <ul className="space-y-1">
                    {detailCabin.highlights
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

              {/* Rules */}
              {detailCabin.rules && detailCabin.rules.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Reglas</h4>
                  <ul className="space-y-1">
                    {detailCabin.rules
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((rule) => (
                        <li key={rule.id} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span>
                          {rule.text}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t dark:border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => setDetailCabin(null)}
                >
                  Cerrar
                </Button>
                <Button
                  className="bg-cyan-700 hover:bg-cyan-800"
                  onClick={() => {
                    setDetailCabin(null)
                    setView('cabin-form')
                    setEditingId(detailCabin.id)
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
        title="¿Eliminar esta cabaña?"
        description="Esta acción eliminará la cabaña y todos sus datos asociados. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        destructive
      />

      {/* Print Preview Dialog */}
      <Dialog open={!!printCabin} onOpenChange={(open) => !open && setPrintCabin(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dialog-enter rounded-xl shadow-2xl scroll-smooth-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              Vista Previa de Impresión
            </DialogTitle>
          </DialogHeader>
          {printCabin && (
            <div id="print-content" className="print-content space-y-6">
              {/* Cabin Title */}
              <div className="text-center border-b dark:border-slate-700 pb-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{printCabin.name}</h2>
                {printCabin.location && (
                  <div className="flex items-center justify-center gap-2 mt-2 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin className="h-4 w-4" />
                    {printCabin.location}
                  </div>
                )}
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Precio/Noche</p>
                  <p className="text-lg font-bold text-cyan-700 dark:text-cyan-400">{formatPrice(printCabin.pricePerNight)}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Capacidad</p>
                  <div className="flex items-center justify-center gap-1">
                    <UsersIcon className="h-4 w-4 text-slate-500" />
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{printCabin.capacity || '—'}</p>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Habitaciones</p>
                  <div className="flex items-center justify-center gap-1">
                    <Bed className="h-4 w-4 text-slate-500" />
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{printCabin.bedrooms || '—'}</p>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Baños</p>
                  <div className="flex items-center justify-center gap-1">
                    <Bath className="h-4 w-4 text-slate-500" />
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{printCabin.bathrooms || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Check-in/Check-out */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-2">
                  <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Check-in</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{printCabin.checkIn || '3:00 PM'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-2">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Check-out</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{printCabin.checkOut || '11:00 AM'}</p>
                  </div>
                </div>
              </div>

              {/* Images Grid */}
              {printCabin.images && printCabin.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Imágenes</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {printCabin.images
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((img) => (
                        <div key={img.id} className="aspect-[4/3] rounded-lg overflow-hidden bg-muted border dark:border-slate-700">
                          <img
                            src={img.url}
                            alt={img.caption || printCabin.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Short Description */}
              {printCabin.shortDescription && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Descripción</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{printCabin.shortDescription}</p>
                </div>
              )}

              {/* Amenities */}
              {printCabin.amenities && printCabin.amenities.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    Servicios y Amenidades
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {printCabin.amenities
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((am) => (
                        <Badge key={am.id} variant="outline" className="text-xs bg-slate-50 dark:bg-slate-800">
                          {am.text}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Highlights */}
              {printCabin.highlights && printCabin.highlights.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    Destacados
                  </h4>
                  <ul className="space-y-1">
                    {printCabin.highlights
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

              {/* Rules */}
              {printCabin.rules && printCabin.rules.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Reglas</h4>
                  <ul className="space-y-1">
                    {printCabin.rules
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((rule) => (
                        <li key={rule.id} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">•</span>
                          {rule.text}
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
            <Button variant="outline" onClick={() => setPrintCabin(null)}>
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
