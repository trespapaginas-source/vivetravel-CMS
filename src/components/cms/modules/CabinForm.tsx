'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Loader2, Save, Check, CheckCircle2, Trash2, Plus } from 'lucide-react'
import { useCMSStore } from '@/lib/cms-store'
import { toast } from 'sonner'
import { slugify } from '@/lib/sluggify'
import DynamicList, { type DynamicListItem } from '../shared/DynamicList'
import ImageManager, { type ImageItem } from '../shared/ImageManager'
import RichTextEditor from '../shared/RichTextEditor'
import ImageUpload from '../shared/ImageUpload'

interface CabinData {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  fullDescription: string | null
  pricePerNight: number
  priceRange: string | null
  location: string | null
  city: string | null
  subLocation: string | null
  address: string | null
  capacity: number | null
  bedrooms: number | null
  bathrooms: number | null
  lat: number | null
  lng: number | null
  checkIn: string
  checkOut: string
  cancellationPolicy: string | null
  published: boolean
  sortOrder: number
  images: { id: string; url: string; caption: string | null; source: string; sortOrder: number }[]
  amenities: { id: string; text: string; sortOrder: number }[]
  highlights: { id: string; text: string; sortOrder: number }[]
  rules: { id: string; text: string; sortOrder: number }[]
}

export default function CabinForm() {
  const { editingId, setView } = useCMSStore()
  const isEditing = !!editingId

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [activeTab, setActiveTab] = useState('general')

  const FORM_TABS = [
    { value: 'general', label: 'General', step: 1 },
    { value: 'description', label: 'Descripción', step: 2 },
    { value: 'images', label: 'Imágenes', step: 3 },
    { value: 'bedrooms', label: 'Habitaciones', step: 4 },
    { value: 'amenities', label: 'Comodidades', step: 5 },
    { value: 'highlights-rules', label: 'Destacados y Normas', step: 6 },
  ]

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [shortDescription, setShortDescription] = useState('')
  const [fullDescription, setFullDescription] = useState('')
  const [pricePerNight, setPricePerNight] = useState(0)
  const [priceRange, setPriceRange] = useState('')
  const [city, setCity] = useState('')
  const [subLocation, setSubLocation] = useState('')
  const [address, setAddress] = useState('')
  const [capacity, setCapacity] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [checkIn, setCheckIn] = useState('3:00 PM')
  const [checkOut, setCheckOut] = useState('11:00 AM')
  const [cancellationPolicy, setCancellationPolicy] = useState('')
  const [published, setPublished] = useState(false)
  const [sortOrder, setSortOrder] = useState(0)
  const [images, setImages] = useState<ImageItem[]>([])
  const [bedroomDetails, setBedroomDetails] = useState<{ id: string; title: string; beds: string; image: string; order: number; active: boolean }[]>([])
  const [amenities, setAmenities] = useState<DynamicListItem[]>([])
  const [highlights, setHighlights] = useState<DynamicListItem[]>([])
  const [rules, setRules] = useState<DynamicListItem[]>([])

  useEffect(() => {
    if (!editingId) return
    const fetchCabin = async () => {
      try {
        const res = await fetch(`/api/cabins/${editingId}`)
        if (!res.ok) throw new Error('Error al cargar cabaña')
        const data = await res.json()
        const cabin: CabinData = data.cabin

        setName(cabin.name)
        setSlug(cabin.slug)
        setShortDescription(cabin.shortDescription || '')
        setFullDescription(cabin.fullDescription || '')
        setPricePerNight(cabin.pricePerNight)
        setPriceRange(cabin.priceRange || '')
        let parsedCity = (cabin as any).city || ''
        let parsedSubLocation = (cabin as any).subLocation || ''
        if (!parsedCity && cabin.location) {
          const parts = cabin.location.split(',')
          parsedCity = parts[0].trim()
          if (parts.length > 1) {
            parsedSubLocation = parts.slice(1).join(',').trim()
          }
        }
        setCity(parsedCity)
        setSubLocation(parsedSubLocation)
        setAddress(cabin.address || '')
        setCapacity(cabin.capacity?.toString() || '')
        setBedrooms(cabin.bedrooms?.toString() || '')
        setBathrooms(cabin.bathrooms?.toString() || '')
        setLat(cabin.lat?.toString() || '')
        setLng(cabin.lng?.toString() || '')
        setCheckIn(cabin.checkIn || '3:00 PM')
        setCheckOut(cabin.checkOut || '11:00 AM')
        setCancellationPolicy(cabin.cancellationPolicy || '')
        setPublished(cabin.published)
        setSortOrder(cabin.sortOrder)
        setImages(cabin.images.map((img) => ({
          id: img.id, url: img.url, caption: img.caption, source: img.source, sortOrder: img.sortOrder,
        })))
        const rawRooms = (cabin as any).bedroomDetails
        let roomsList: { id: string; title: string; beds: string; image: string; order: number; active: boolean }[] = []
        if (Array.isArray(rawRooms) && rawRooms.length > 0) {
          roomsList = rawRooms.map((r: any, idx: number) => ({
            id: r.id || `room-${idx}`,
            title: r.title || '',
            beds: r.beds || '',
            image: r.image || '',
            order: r.order ?? idx,
            active: r.active !== false,
          }))
        } else {
          // Generar automáticamente las habitaciones por defecto si no existen en BD
          const numRooms = Math.max(1, cabin.bedrooms || 1)
          const cap = cabin.capacity || 2
          const cabinImages = cabin.images || []
          for (let i = 0; i < numRooms; i++) {
            const roomCapacity = Math.floor(cap / numRooms) + (i < (cap % numRooms) ? 1 : 0)
            let beds = "1 cama doble"
            if (roomCapacity === 1) beds = "1 cama individual"
            else if (roomCapacity === 2) beds = "1 cama doble"
            else if (roomCapacity === 3) beds = "1 cama doble, 1 cama individual"
            else if (roomCapacity === 4) beds = "1 cama doble, 1 litera"
            else if (roomCapacity >= 5) beds = `1 cama doble, ${roomCapacity - 2} camas individuales`

            const imgUrl = cabinImages[i % cabinImages.length]?.url || ""

            roomsList.push({
              id: `room-${i}`,
              title: `Habitación ${i + 1}`,
              beds,
              image: imgUrl,
              order: i,
              active: true,
            })
          }
        }
        setBedroomDetails(roomsList)
        setAmenities(cabin.amenities.map((am) => ({ id: am.id, text: am.text, sortOrder: am.sortOrder })))
        setHighlights(cabin.highlights.map((hl) => ({ id: hl.id, text: hl.text, sortOrder: hl.sortOrder })))
        setRules(cabin.rules.map((rl) => ({ id: rl.id, text: rl.text, sortOrder: rl.sortOrder })))
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Error al cargar cabaña')
        setView('cabins')
      } finally {
        setLoading(false)
      }
    }
    fetchCabin()
  }, [editingId, setView])

  const handleNameChange = (val: string) => {
    setName(val)
    if (!slugEdited) {
      setSlug(slugify(val))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setSaving(true)
    try {
      const body = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        shortDescription: shortDescription || null,
        fullDescription: fullDescription || null,
        pricePerNight,
        priceRange: priceRange || null,
        location: city ? (subLocation ? `${city.trim()}, ${subLocation.trim()}` : city.trim()) : null,
        city: city?.trim() || null,
        subLocation: subLocation?.trim() || null,
        address: address || null,
        capacity: capacity ? parseInt(capacity) : null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        checkIn: checkIn || '3:00 PM',
        checkOut: checkOut || '11:00 AM',
        cancellationPolicy: cancellationPolicy || null,
        published,
        sortOrder,
        images: images.map((img, i) => ({
          url: img.url,
          caption: img.caption || null,
          source: img.source,
          sortOrder: i,
        })),
        amenities: amenities.map((am, i) => ({ text: am.text, sortOrder: i })),
        highlights: highlights.map((hl, i) => ({ text: hl.text, sortOrder: i })),
        rules: rules.map((rl, i) => ({ text: rl.text, sortOrder: i })),
        bedroomDetails: bedroomDetails.map((r, i) => ({
          id: r.id,
          title: r.title,
          beds: r.beds,
          image: r.image,
          order: i,
          active: r.active,
        })),
      }

      const url = isEditing ? `/api/cabins/${editingId}` : '/api/cabins'
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

      toast.success(isEditing ? 'Cabaña actualizada correctamente' : 'Cabaña creada correctamente', {
        action: isEditing ? undefined : {
          label: 'Ver cabañas',
          onClick: () => setView('cabins'),
        },
      })
      setView('cabins')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar cabaña')
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
        <Button variant="ghost" size="sm" onClick={() => setView('cabins')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEditing ? 'Editar Cabaña' : 'Crear Cabaña'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
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
                    <Input id="name" value={name} onChange={(e) => handleNameChange(e.target.value)} required className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
                      className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerNight">Precio por Noche (COP)</Label>
                    <Input id="pricePerNight" type="number" value={pricePerNight} onChange={(e) => setPricePerNight(parseInt(e.target.value) || 0)} className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceRange">Rango de Precio</Label>
                    <Input id="priceRange" value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad Principal *</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
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
                      value={subLocation}
                      onChange={(e) => setSubLocation(e.target.value)}
                      placeholder="Ej: Barú, Taganga, Puerto Colombia"
                      className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacidad</Label>
                    <Input id="capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Personas" className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Habitaciones</Label>
                    <Input id="bedrooms" type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Baños</Label>
                    <Input id="bathrooms" type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lat">Latitud</Label>
                    <Input id="lat" type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lng">Longitud</Label>
                    <Input id="lng" type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkIn">Check-in</Label>
                    <Input id="checkIn" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOut">Check-out</Label>
                    <Input id="checkOut" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cancellationPolicy">Política de Cancelación</Label>
                    <Input id="cancellationPolicy" value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)} className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">Orden</Label>
                    <Input id="sortOrder" type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Switch checked={published} onCheckedChange={setPublished} />
                  <Label>{published ? 'Publicado' : 'Borrador'}</Label>
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
                  <Textarea id="shortDescription" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} rows={3} className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullDescription">Descripción Completa</Label>
                  <RichTextEditor
                    value={fullDescription}
                    onChange={setFullDescription}
                    placeholder="Descripción detallada de la cabaña (soporta Markdown)..."
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
                <CardTitle className="text-base">Imágenes de la Cabaña</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageManager images={images} onChange={setImages} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bedrooms Tab */}
          <TabsContent value="bedrooms">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Distribución de Habitaciones ("¿Dónde vas a dormir?")</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Configura las habitaciones que tiene la cabaña, detallando sus camas y asignando una foto a cada una.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newId = `room-${Date.now()}`
                    setBedroomDetails([
                      ...bedroomDetails,
                      { id: newId, title: `Habitación ${bedroomDetails.length + 1}`, beds: '1 cama doble', image: '', order: bedroomDetails.length, active: true }
                    ])
                  }}
                  className="border-dashed hover:border-cyan-600 hover:text-cyan-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar habitación
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {bedroomDetails.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-lg bg-slate-50/50">
                    <p className="text-sm text-muted-foreground">No hay habitaciones configuradas.</p>
                    <p className="text-xs text-muted-foreground mt-1">Se mostrará la estimación automática en la web pública.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bedroomDetails.map((room, idx) => (
                      <Card key={room.id} className="relative overflow-hidden border border-slate-200 shadow-sm hover:shadow transition-shadow">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400">Habitación #{idx + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setBedroomDetails(bedroomDetails.filter(r => r.id !== room.id))}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Nombre de Habitación</Label>
                            <Input
                              value={room.title}
                              onChange={(e) => {
                                const list = [...bedroomDetails]
                                list[idx].title = e.target.value
                                setBedroomDetails(list)
                              }}
                              placeholder="Ej. Habitación Principal"
                              className="h-8 text-xs focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Detalle de Camas</Label>
                            <Input
                              value={room.beds}
                              onChange={(e) => {
                                const list = [...bedroomDetails]
                                list[idx].beds = e.target.value
                                setBedroomDetails(list)
                              }}
                              placeholder="Ej. 1 cama doble, 1 individual"
                              className="h-8 text-xs focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Foto de la Habitación</Label>
                            <ImageUpload
                              currentUrl={room.image}
                              onUploadComplete={(url) => {
                                const list = [...bedroomDetails]
                                list[idx].image = url
                                setBedroomDetails(list)
                              }}
                              onClear={() => {
                                const list = [...bedroomDetails]
                                list[idx].image = ''
                                setBedroomDetails(list)
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Amenities Tab */}
          <TabsContent value="amenities">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comodidades</CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicList
                  items={amenities}
                  onChange={setAmenities}
                  placeholder="Agregar comodidad..."
                  addLabel="Agregar"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Highlights & Rules Tab */}
          <TabsContent value="highlights-rules">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Normas</CardTitle>
                </CardHeader>
                <CardContent>
                  <DynamicList
                    items={rules}
                    onChange={setRules}
                    placeholder="Agregar norma..."
                    addLabel="Agregar"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => setView('cabins')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving} className="bg-cyan-700 hover:bg-cyan-800">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Actualizar Cabaña' : 'Crear Cabaña'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
