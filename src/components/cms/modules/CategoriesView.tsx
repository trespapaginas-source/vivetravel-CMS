'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { useCMSStore } from '@/lib/cms-store'
import { toast } from 'sonner'
import { slugify } from '@/lib/sluggify'
import ConfirmDialog from '../shared/ConfirmDialog'

interface Category {
  id: string
  name: string
  slug: string
  color: string
  icon: string | null
  sortOrder: number
  _count?: { plans: number }
  updatedAt?: string
}

export default function CategoriesView() {
  const { user } = useCMSStore()
  const isAdmin = user?.role === 'administrador'

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [color, setColor] = useState('#0E7490')
  const [icon, setIcon] = useState('')
  const [sortOrder, setSortOrder] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data.categories || [])
        }
      } catch {
        toast.error('Error al cargar categorías')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const openCreate = () => {
    setEditingCategory(null)
    setName('')
    setSlug('')
    setSlugEdited(false)
    setColor('#0E7490')
    setIcon('')
    setSortOrder(0)
    setDialogOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    setName(cat.name)
    setSlug(cat.slug)
    setSlugEdited(true)
    setColor(cat.color)
    setIcon(cat.icon || '')
    setSortOrder(cat.sortOrder)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setSaving(true)
    try {
      const body = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        color,
        icon: icon || null,
        sortOrder,
      }

      const isEditing = !!editingCategory
      const url = isEditing ? `/api/categories/${editingCategory.id}` : '/api/categories'
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

      toast.success(isEditing ? 'Categoría actualizada' : 'Categoría creada')
      setDialogOpen(false)

      // Refresh
      const refreshRes = await fetch('/api/categories')
      if (refreshRes.ok) {
        const data = await refreshRes.json()
        setCategories(data.categories || [])
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/categories/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      setCategories(categories.filter((c) => c.id !== deleteId))
      toast.success('Categoría eliminada')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeleteId(null)
    }
  }

  const handleNameChange = (val: string) => {
    setName(val)
    if (!slugEdited) {
      setSlug(slugify(val))
    }
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

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full skeleton-wave" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Categorías</h1>
          {!loading && (
            <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
              {categories.length} {categories.length === 1 ? 'categoría' : 'categorías'}
            </Badge>
          )}
        </div>
        <Button onClick={openCreate} className="bg-cyan-700 hover:bg-cyan-800">
          <Plus className="h-4 w-4 mr-1" />
          Nueva Categoría
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 mb-4 empty-float">
            <Tag className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">No hay categorías</h3>
          <p className="text-base text-muted-foreground mb-4">Crea la primera categoría para organizar tus planes</p>
          <Button variant="outline" className="mt-3 dark:border-slate-600 dark:text-slate-300" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Crear primera categoría
          </Button>
        </div>
      ) : (
        <div className="rounded-lg bg-white dark:bg-slate-900 shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 dark:bg-slate-800/80">
                <TableHead className="dark:text-slate-300">Color</TableHead>
                <TableHead className="dark:text-slate-300">Nombre</TableHead>
                <TableHead className="dark:text-slate-300">Slug</TableHead>
                <TableHead className="dark:text-slate-300">Icono</TableHead>
                <TableHead className="dark:text-slate-300">Planes</TableHead>
                <TableHead className="dark:text-slate-300">Orden</TableHead>
                <TableHead className="dark:text-slate-300">Última Actualización</TableHead>
                <TableHead className="w-[80px] dark:text-slate-300">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat, idx) => (
                <TableRow
                  key={cat.id}
                  className={`group shadow-sm hover:shadow-md transition-all duration-200 hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20 ${idx % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''}`}
                >
                  <TableCell>
                    <div className="w-6 h-6 rounded-md border dark:border-slate-600 shadow-sm" style={{ backgroundColor: cat.color }} />
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">{cat.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground dark:text-slate-400">{cat.slug}</TableCell>
                  <TableCell className="text-sm text-slate-700 dark:text-slate-300">{cat.icon || '—'}</TableCell>
                  <TableCell className="text-sm">
                    <Badge variant="outline" className="text-xs px-2 py-0.5 dark:border-slate-600 dark:text-slate-300">
                      {cat._count?.plans ?? 0} {cat._count?.plans === 1 ? 'plan' : 'planes'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-700 dark:text-slate-300">{cat.sortOrder}</TableCell>
                  <TableCell className="text-sm text-muted-foreground dark:text-slate-400">
                    {formatDate(cat.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 dark:text-slate-400 dark:hover:text-slate-100" onClick={() => openEdit(cat)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive dark:text-red-400 dark:hover:text-red-300" onClick={() => setDeleteId(cat.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900 dark:border-slate-700 dialog-enter rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Nombre *</Label>
              <Input value={name} onChange={(e) => handleNameChange(e.target.value)} className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Slug</Label>
              <Input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
                placeholder="auto-generado"
                className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer dark:border-slate-600"
                  />
                  <Input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 focus-visible:ring-cyan-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Icono</Label>
                <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="waves, trees, etc." className="focus-visible:ring-cyan-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Orden</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className="focus-visible:ring-cyan-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="dark:border-slate-600 dark:text-slate-300">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-cyan-700 hover:bg-cyan-800">
              {saving ? 'Guardando...' : editingCategory ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar esta categoría?"
        description="Los planes asociados quedarán sin categoría. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  )
}
