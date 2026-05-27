'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, MoreHorizontal, Pencil, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { useCMSStore } from '@/lib/cms-store'
import { toast } from 'sonner'
import StarRating from '../shared/StarRating'
import ConfirmDialog from '../shared/ConfirmDialog'

interface TourPlan {
  id: string
  name: string
}

interface Testimonial {
  id: string
  name: string
  avatar: string | null
  location: string | null
  text: string
  rating: number
  tripName: string | null
  planId: string | null
  plan: TourPlan | null
  published: boolean
  sortOrder: number
  updatedAt?: string
}

const emptyTestimonial = {
  name: '',
  avatar: '',
  location: '',
  text: '',
  rating: 5,
  tripName: '',
  planId: '',
  published: false,
  sortOrder: 0,
}

export default function TestimonialsView() {
  const { user } = useCMSStore()
  const isAdmin = user?.role === 'administrador'

  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [plans, setPlans] = useState<TourPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  // Form state
  const [form, setForm] = useState(emptyTestimonial)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testRes, plansRes] = await Promise.all([
          fetch('/api/testimonials'),
          fetch('/api/plans'),
        ])
        if (testRes.ok) {
          const data = await testRes.json()
          setTestimonials(data.testimonials || [])
        }
        if (plansRes.ok) {
          const data = await plansRes.json()
          setPlans((data.plans || []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
        }
      } catch {
        toast.error('Error al cargar testimonios')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const publishedTestimonials = testimonials.filter((t) => t.published)

  const openCreate = () => {
    setEditingTestimonial(null)
    setForm(emptyTestimonial)
    setDialogOpen(true)
  }

  const openEdit = (t: Testimonial) => {
    setEditingTestimonial(t)
    setForm({
      name: t.name,
      avatar: t.avatar || '',
      location: t.location || '',
      text: t.text,
      rating: t.rating,
      tripName: t.tripName || '',
      planId: t.planId || '',
      published: t.published,
      sortOrder: t.sortOrder,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.text.trim()) {
      toast.error('Nombre y texto son requeridos')
      return
    }

    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        avatar: form.avatar || null,
        location: form.location || null,
        text: form.text.trim(),
        rating: form.rating,
        tripName: form.tripName || null,
        planId: form.planId || null,
        published: form.published,
        sortOrder: form.sortOrder,
      }

      const isEditing = !!editingTestimonial
      const url = isEditing ? `/api/testimonials/${editingTestimonial.id}` : '/api/testimonials'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }

      toast.success(isEditing ? 'Testimonio actualizado' : 'Testimonio creado', {
        action: isEditing ? undefined : {
          label: 'Ver testimonios',
          onClick: () => { /* already on this view */ },
        },
      })
      setDialogOpen(false)

      // Refresh
      const refreshRes = await fetch('/api/testimonials')
      if (refreshRes.ok) {
        const data = await refreshRes.json()
        setTestimonials(data.testimonials || [])
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublished = async (t: Testimonial) => {
    try {
      const res = await fetch(`/api/testimonials/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !t.published }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      setTestimonials(testimonials.map((item) => (item.id === t.id ? { ...item, published: !item.published } : item)))
      toast.success(t.published ? 'Testimonio despublicado' : 'Testimonio publicado')
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/testimonials/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      setTestimonials(testimonials.filter((t) => t.id !== deleteId))
      toast.success('Testimonio eliminado')
    } catch {
      toast.error('Error al eliminar testimonio')
    } finally {
      setDeleteId(null)
    }
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Testimonios</h1>
          {!loading && (
            <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
              {testimonials.length} {testimonials.length === 1 ? 'testimonio' : 'testimonios'}
            </Badge>
          )}
        </div>
        <Button onClick={openCreate} className="bg-cyan-700 hover:bg-cyan-800">
          <Plus className="h-4 w-4 mr-1" />
          Nuevo Testimonio
        </Button>
      </div>

      {/* Carousel Preview */}
      {publishedTestimonials.length > 0 && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium uppercase tracking-wider text-cyan-300">Vista previa del carrusel</p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700 dark:hover:bg-slate-800"
                onClick={() => setPreviewIndex((prev) => (prev > 0 ? prev - 1 : publishedTestimonials.length - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-slate-400">
                {previewIndex + 1}/{publishedTestimonials.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700 dark:hover:bg-slate-800"
                onClick={() => setPreviewIndex((prev) => (prev < publishedTestimonials.length - 1 ? prev + 1 : 0))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-lg font-bold">
                {publishedTestimonials[previewIndex]?.avatar || getInitials(publishedTestimonials[previewIndex]?.name || '?')}
              </div>
              <StarRating rating={publishedTestimonials[previewIndex]?.rating || 5} readonly size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <Quote className="h-5 w-5 text-cyan-400/40 mb-1" />
              <p className="text-white text-sm leading-relaxed line-clamp-3">
                {publishedTestimonials[previewIndex]?.text}
              </p>
              <div className="mt-2">
                <p className="text-cyan-300 text-sm font-medium">{publishedTestimonials[previewIndex]?.name}</p>
                <p className="text-slate-400 text-xs">
                  {publishedTestimonials[previewIndex]?.location}
                  {publishedTestimonials[previewIndex]?.tripName && ` · ${publishedTestimonials[previewIndex].tripName}`}
                </p>
              </div>
            </div>
          </div>
          {/* Dots indicator */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {publishedTestimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setPreviewIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === previewIndex ? 'bg-cyan-400 w-4' : 'bg-slate-600 hover:bg-slate-500 dark:bg-slate-700 dark:hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full skeleton-wave" />
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 mb-4 empty-float">
            <Quote className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">No hay testimonios</h3>
          <p className="text-base text-muted-foreground mb-4">Agrega el primer testimonio de un cliente</p>
          <Button variant="outline" className="mt-3 dark:border-slate-600 dark:text-slate-300" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Crear primer testimonio
          </Button>
        </div>
      ) : (
        <div className="rounded-lg bg-white dark:bg-slate-900 shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 dark:bg-slate-800/80">
                <TableHead className="dark:text-slate-300">Nombre</TableHead>
                <TableHead className="dark:text-slate-300">Viaje</TableHead>
                <TableHead className="dark:text-slate-300">Valoración</TableHead>
                <TableHead className="dark:text-slate-300">Estado</TableHead>
                <TableHead className="dark:text-slate-300">Última Actualización</TableHead>
                <TableHead className="w-[80px] dark:text-slate-300">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonials.map((t, idx) => (
                <TableRow key={t.id} className={`group shadow-sm hover:shadow-md transition-all duration-200 hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20 ${idx % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold">
                        {t.avatar || getInitials(t.name)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{t.name}</p>
                        {t.location && <p className="text-xs text-muted-foreground dark:text-slate-400">{t.location}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-700 dark:text-slate-300">{t.tripName || t.plan?.name || '—'}</TableCell>
                  <TableCell>
                    <StarRating rating={t.rating} readonly size="sm" />
                  </TableCell>
                  <TableCell>
                      <Badge
                      variant="outline"
                      className={
                        t.published
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 px-2.5 py-0.5 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 status-dot-pulse status-dot-green'
                          : 'bg-amber-50 text-amber-700 border-amber-200 px-2.5 py-0.5 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 status-dot-pulse status-dot-amber badge-stripes'
                      }
                    >
                      {t.published ? 'Publicado' : 'Borrador'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground dark:text-slate-400">
                    {formatDate(t.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 dark:text-slate-400 dark:hover:text-slate-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-700">
                        <DropdownMenuItem onClick={() => openEdit(t)} className="dark:text-slate-300 dark:focus:bg-slate-800">
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTogglePublished(t)} className="dark:text-slate-300 dark:focus:bg-slate-800">
                          {t.published ? (
                            <><EyeOff className="h-4 w-4 mr-2" />Despublicar</>
                          ) : (
                            <><Eye className="h-4 w-4 mr-2" />Publicar</>
                          )}
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive dark:text-red-400 dark:focus:text-red-300"
                            onClick={() => setDeleteId(t.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto dark:bg-slate-900 dark:border-slate-700 dialog-enter rounded-xl shadow-2xl scroll-smooth-thin">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">
              {editingTestimonial ? 'Editar Testimonio' : 'Nuevo Testimonio'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre del cliente"
                className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Iniciales (Avatar)</Label>
                <Input
                  value={form.avatar}
                  onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                  placeholder="Auto"
                  maxLength={2}
                  className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Ubicación</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Ciudad, País"
                  className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Texto del Testimonio *</Label>
              <Textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                rows={4}
                placeholder="Lo que dijo el cliente..."
                className="focus-visible:ring-cyan-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Valoración</Label>
              <StarRating
                rating={form.rating}
                onChange={(rating) => setForm({ ...form, rating })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Nombre del Viaje</Label>
                <Input
                  value={form.tripName}
                  onChange={(e) => setForm({ ...form, tripName: e.target.value })}
                  placeholder="Ej: Tayrona Express"
                  className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Plan Asociado</Label>
                <Select value={form.planId} onValueChange={(val) => setForm({ ...form, planId: val === '__none__' ? '' : val })}>
                  <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                    <SelectValue placeholder="Sin plan" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-slate-700">
                    <SelectItem value="__none__" className="dark:text-slate-300 dark:focus:bg-slate-800">Sin plan</SelectItem>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="dark:text-slate-300 dark:focus:bg-slate-800">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Orden</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="focus-visible:ring-cyan-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.published}
                onCheckedChange={(checked) => setForm({ ...form, published: checked })}
              />
              <Label className="dark:text-slate-300">{form.published ? 'Publicado' : 'Borrador'}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="dark:border-slate-600 dark:text-slate-300">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-cyan-700 hover:bg-cyan-800">
              {saving ? 'Guardando...' : editingTestimonial ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar este testimonio?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  )
}
