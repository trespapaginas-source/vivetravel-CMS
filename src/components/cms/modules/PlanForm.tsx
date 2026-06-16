'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Loader2, Save, Check, CheckCircle2 } from 'lucide-react'
import { useCMSStore } from '@/lib/cms-store'
import { toast } from 'sonner'
import { slugify } from '@/lib/sluggify'
import DynamicList, { type DynamicListItem } from '../shared/DynamicList'
import ImageManager, { type ImageItem } from '../shared/ImageManager'
import RichTextEditor from '../shared/RichTextEditor'

// Zod validation schema
const planSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug: z.string()
    .min(1, 'El slug es requerido')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  shortDescription: z.string().optional().default(''),
  fullDescription: z.string().optional().default(''),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  priceRange: z.string().optional().default(''),
  duration: z.string().optional().default(''),
  location: z.string().optional().default(''),
  city: z.string().optional().default(''),
  subLocation: z.string().optional().default(''),
  categoryId: z.string().optional().default(''),
  difficulty: z.string().optional().default(''),
  schedule: z.string().optional().default(''),
  meetingPoint: z.string().optional().default(''),
  maxGuests: z.preprocess(
    (val) => (val === '' || val === undefined || val === null) ? undefined : Number(val),
    z.number().positive('El máximo de huéspedes debe ser un número positivo').optional()
  ),
  published: z.boolean().optional().default(false),
  sortOrder: z.number().optional().default(0),
})

type PlanFormValues = z.input<typeof planSchema>

interface PlanCategory {
  id: string
  name: string
}

interface PlanData {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  fullDescription: string | null
  price: number
  priceRange: string | null
  duration: string | null
  location: string | null
  categoryId: string | null
  category: PlanCategory | null
  difficulty: string | null
  schedule: string | null
  meetingPoint: string | null
  maxGuests: number | null
  published: boolean
  sortOrder: number
  images: { id: string; url: string; caption: string | null; source: string; sortOrder: number }[]
  includes: { id: string; text: string; sortOrder: number }[]
  excludes: { id: string; text: string; sortOrder: number }[]
  highlights: { id: string; text: string; sortOrder: number }[]
}

export default function PlanForm() {
  const { editingId, setView, lastPlansView } = useCMSStore()
  const isEditing = !!editingId

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [activeTab, setActiveTab] = useState('general')

  const FORM_TABS = [
    { value: 'general', label: 'General', step: 1 },
    { value: 'description', label: 'Descripción', step: 2 },
    { value: 'images', label: 'Imágenes', step: 3 },
    { value: 'includes', label: 'Incluye/Excluye', step: 4 },
    { value: 'highlights', label: 'Destacados', step: 5 },
  ]
  const [categories, setCategories] = useState<PlanCategory[]>([])
  const [slugEdited, setSlugEdited] = useState(false)

  // Dynamic list state (not part of Zod schema)
  const [images, setImages] = useState<ImageItem[]>([])
  const [includes, setIncludes] = useState<DynamicListItem[]>([])
  const [excludes, setExcludes] = useState<DynamicListItem[]>([])
  const [highlights, setHighlights] = useState<DynamicListItem[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      slug: '',
      shortDescription: '',
      fullDescription: '',
      price: 0,
      priceRange: '',
      duration: '',
      location: '',
      city: '',
      subLocation: '',
      categoryId: '',
      difficulty: '',
      schedule: '',
      meetingPoint: '',
      maxGuests: undefined,
      published: false,
      sortOrder: 0,
    },
  })

  const nameValue = watch('name')
  const slugValue = watch('slug')
  const publishedValue = watch('published')
  const categoryIdValue = watch('categoryId')
  const difficultyValue = watch('difficulty')
  const selectedCategory = categories.find((cat) => cat.id === categoryIdValue)
  const isGrupalCategory = selectedCategory?.name?.toLowerCase().includes('grupal')

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data.categories || [])
        }
      } catch { /* ignore */ }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (!editingId) return
    const fetchPlan = async () => {
      try {
        const res = await fetch(`/api/plans/${editingId}`)
        if (!res.ok) throw new Error('Error al cargar plan')
        const data = await res.json()
        const plan: PlanData = data.plan

        // Reset form with plan data
        setValue('name', plan.name)
        setValue('slug', plan.slug)
        setValue('shortDescription', plan.shortDescription || '')
        setValue('fullDescription', plan.fullDescription || '')
        setValue('price', plan.price)
        setValue('priceRange', plan.priceRange || '')
        setValue('duration', plan.duration || '')
        setValue('location', plan.location || '')
        let parsedCity = (plan as any).city || ''
        let parsedSubLocation = (plan as any).subLocation || ''
        if (!parsedCity && plan.location) {
          const parts = plan.location.split(',')
          parsedCity = parts[0].trim()
          if (parts.length > 1) {
            parsedSubLocation = parts.slice(1).join(',').trim()
          }
        }
        setValue('city', parsedCity)
        setValue('subLocation', parsedSubLocation)
        setValue('categoryId', plan.categoryId || '')
        setValue('difficulty', plan.difficulty || '')
        setValue('schedule', plan.schedule || '')
        setValue('meetingPoint', plan.meetingPoint || '')
        setValue('maxGuests', plan.maxGuests ?? undefined)
        setValue('published', plan.published)
        setValue('sortOrder', plan.sortOrder)

        setImages(plan.images.map((img) => ({
          id: img.id,
          url: img.url,
          caption: img.caption,
          source: img.source,
          sortOrder: img.sortOrder,
        })))
        setIncludes(plan.includes.map((inc) => ({ id: inc.id, text: inc.text, sortOrder: inc.sortOrder })))
        setExcludes(plan.excludes.map((exc) => ({ id: exc.id, text: exc.text, sortOrder: exc.sortOrder })))
        setHighlights(plan.highlights.map((hl) => ({ id: hl.id, text: hl.text, sortOrder: hl.sortOrder })))
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Error al cargar plan')
        setView(lastPlansView || 'plans')
      } finally {
        setLoading(false)
      }
    }
    fetchPlan()
  }, [editingId, setView, setValue])

  const handleNameChange = (val: string) => {
    setValue('name', val, { shouldValidate: true })
    if (!slugEdited) {
      setValue('slug', slugify(val), { shouldValidate: true })
    }
  }

  const handleSlugChange = (val: string) => {
    setSlugEdited(true)
    setValue('slug', val, { shouldValidate: true })
  }

  const onSubmit = async (data: PlanFormValues) => {
    setSaving(true)
    try {
      const body = {
        name: data.name.trim(),
        slug: data.slug.trim() || slugify(data.name),
        shortDescription: data.shortDescription || null,
        fullDescription: data.fullDescription || null,
        price: data.price,
        priceRange: data.priceRange || null,
        duration: data.duration || null,
        location: data.city ? (data.subLocation ? `${data.city.trim()}, ${data.subLocation.trim()}` : data.city.trim()) : null,
        city: data.city?.trim() || null,
        subLocation: data.subLocation?.trim() || null,
        categoryId: data.categoryId || null,
        difficulty: data.difficulty || null,
        schedule: isGrupalCategory ? (data.schedule || null) : null,
        meetingPoint: isGrupalCategory ? (data.meetingPoint || null) : null,
        maxGuests: isGrupalCategory ? (data.maxGuests ?? null) : null,
        published: data.published,
        sortOrder: data.sortOrder,
        images: images.map((img, i) => ({
          url: img.url,
          caption: img.caption || null,
          source: img.source,
          sortOrder: i,
        })),
        includes: includes.map((inc, i) => ({ text: inc.text, sortOrder: i })),
        excludes: excludes.map((exc, i) => ({ text: exc.text, sortOrder: i })),
        highlights: highlights.map((hl, i) => ({ text: hl.text, sortOrder: i })),
      }

      const url = isEditing ? `/api/plans/${editingId}` : '/api/plans'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const resData = await res.json()
        throw new Error(resData.error || 'Error al guardar')
      }

      toast.success(isEditing ? 'Plan actualizado correctamente' : 'Plan creado correctamente', {
        action: isEditing ? undefined : {
          label: 'Ver plan',
          onClick: () => setView(lastPlansView || 'plans'),
        },
      })
      setView(lastPlansView || 'plans')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar plan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setView(lastPlansView || 'plans')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {isEditing ? `Editar Plan: ${nameValue || ''}` : 'Crear Plan'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step Progress Indicator */}
        <div className="flex items-center gap-1 mb-4">
          {FORM_TABS.map((tab, idx) => {
            const isActive = activeTab === tab.value
            const stepNum = idx + 1
            const isCompleted = FORM_TABS.findIndex(t => t.value === activeTab) > idx
            return (
              <div key={tab.value} className="flex items-center gap-1 flex-1">
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 flex-1 ${
                    isActive
                      ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/25 scale-[1.02]'
                      : isCompleted
                        ? 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isCompleted
                        ? 'bg-cyan-200 dark:bg-cyan-800 text-cyan-700 dark:text-cyan-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {isCompleted ? <Check className="h-3 w-3" /> : stepNum}
                  </span>
                  <span className="hidden sm:inline truncate">{tab.label}</span>
                </button>
                {idx < FORM_TABS.length - 1 && (
                  <div className={`w-4 h-0.5 rounded-full shrink-0 transition-colors duration-300 ${
                    isCompleted ? 'bg-cyan-400' : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Auto-save Indicator */}
        <div className="flex items-center justify-end mb-2">
          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all duration-300 ${
            saveStatus === 'saved'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
              : saveStatus === 'saving'
                ? 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
          }`}>
            {saveStatus === 'saved' && <><CheckCircle2 className="h-3 w-3" /> Guardado</>}
            {saveStatus === 'saving' && <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</>}
            {saveStatus === 'unsaved' && <><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Sin guardar</>}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="sr-only">
            {FORM_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={nameValue}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={slugValue}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="auto-generado"
                      className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                    />
                    {errors.slug && (
                      <p className="text-xs text-destructive">{errors.slug.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio (COP)</Label>
                    <Input
                      id="price"
                      type="number"
                      {...register('price', { valueAsNumber: true })}
                      className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                    />
                    {errors.price && (
                      <p className="text-xs text-destructive">{errors.price.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceRange">Rango de Precio</Label>
                    <Input
                      id="priceRange"
                      {...register('priceRange')}
                      placeholder="$100.000 - $300.000"
                      className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración</Label>
                    <Input
                      id="duration"
                      {...register('duration')}
                      placeholder="3 días / 2 noches"
                      className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad Principal *</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      list="cities-list"
                      placeholder="Ej: Cartagena, Santa Marta"
                      className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                    />
                    <datalist id="cities-list">
                      <option value="Cartagena" />
                      <option value="Santa Marta" />
                      <option value="Barranquilla" />
                      <option value="San Andrés" />
                      <option value="San Gil" />
                      <option value="Punta Cana" />
                      <option value="Luruaco" />
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subLocation">Sububicación (Opcional)</Label>
                    <Input
                      id="subLocation"
                      {...register('subLocation')}
                      placeholder="Ej: Barú, Taganga, Puerto Colombia"
                      className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select value={categoryIdValue} onValueChange={(val) => setValue('categoryId', val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Dificultad</Label>
                    <Select value={difficultyValue} onValueChange={(val) => setValue('difficulty', val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin dificultad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fácil">Fácil</SelectItem>
                        <SelectItem value="Moderado">Moderado</SelectItem>
                        <SelectItem value="Avanzado">Avanzado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {isGrupalCategory && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="maxGuests">Capacidad Máxima / Cupos</Label>
                        <Input
                          id="maxGuests"
                          type="number"
                          {...register('maxGuests', { valueAsNumber: true })}
                          className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                          placeholder="Ej: 30"
                        />
                        {errors.maxGuests && (
                          <p className="text-xs text-destructive">{errors.maxGuests.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schedule">Horario de Salida</Label>
                        <Input
                          id="schedule"
                          {...register('schedule')}
                          className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                          placeholder="Ej: Salidas grupales los días 15 de cada mes"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="meetingPoint">Punto de Encuentro</Label>
                        <Input
                          id="meetingPoint"
                          {...register('meetingPoint')}
                          className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                          placeholder="Ej: Aeropuerto Internacional El Dorado, Bogotá"
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">Orden</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      {...register('sortOrder', { valueAsNumber: true })}
                      className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    checked={publishedValue}
                    onCheckedChange={(val) => setValue('published', val)}
                  />
                  <Label>{publishedValue ? 'Publicado' : 'Borrador'}</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Description Tab */}
          <TabsContent value="description">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Descripción</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Descripción Corta</Label>
                  <Textarea
                    id="shortDescription"
                    {...register('shortDescription')}
                    rows={3}
                    placeholder="Resumen breve del plan..."
                    className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullDescription">Descripción Completa</Label>
                  <RichTextEditor
                    value={watch('fullDescription') || ''}
                    onChange={(val) => setValue('fullDescription', val)}
                    placeholder="Descripción detallada del plan (soporta Markdown)..."
                    rows={8}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Imágenes del Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageManager images={images} onChange={setImages} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Includes/Excludes Tab */}
          <TabsContent value="includes">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Qué Incluye</CardTitle>
                </CardHeader>
                <CardContent>
                  <DynamicList
                    items={includes}
                    onChange={setIncludes}
                    placeholder="Agregar lo que incluye..."
                    addLabel="Incluir"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Qué No Incluye</CardTitle>
                </CardHeader>
                <CardContent>
                  <DynamicList
                    items={excludes}
                    onChange={setExcludes}
                    placeholder="Agregar lo que no incluye..."
                    addLabel="Excluir"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Highlights Tab */}
          <TabsContent value="highlights">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Destacados</CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicList
                  items={highlights}
                  onChange={setHighlights}
                  placeholder="Agregar destacado..."
                  addLabel="Destacar"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => setView(lastPlansView || 'plans')}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving || !isValid}
            className="bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Actualizar Plan' : 'Crear Plan'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
