'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import ImageUpload from '../shared/ImageUpload'
import ConfirmDialog from '../shared/ConfirmDialog'

interface MediaImage {
  id: string
  url: string
  caption: string | null
  source: string
  sortOrder: number
}

export default function MediaView() {
  const [heroImages, setHeroImages] = useState<MediaImage[]>([])
  const [tripImages, setTripImages] = useState<MediaImage[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteType, setDeleteType] = useState<'hero' | 'trip'>('hero')
  const [addingHero, setAddingHero] = useState(false)
  const [addingTrip, setAddingTrip] = useState(false)
  const [heroCaption, setHeroCaption] = useState('')
  const [tripCaption, setTripCaption] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [heroRes, tripRes] = await Promise.all([
          fetch('/api/hero-images'),
          fetch('/api/trip-images'),
        ])
        if (heroRes.ok) {
          const data = await heroRes.json()
          setHeroImages(data.images || data.heroImages || [])
        }
        if (tripRes.ok) {
          const data = await tripRes.json()
          setTripImages(data.images || data.tripImages || [])
        }
      } catch {
        toast.error('Error al cargar imágenes')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])
 
  const handleAddHero = async (url: string, source: 'upload' | 'external') => {
    try {
      const res = await fetch('/api/hero-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          caption: heroCaption || null,
          source,
          sortOrder: heroImages.length,
        }),
      })
      if (!res.ok) throw new Error('Error al agregar')
      const data = await res.json()
      const newImage = data.image || data.heroImage
      if (!newImage) throw new Error('Formato de respuesta incorrecto')
      setHeroImages([...heroImages, newImage])
      setAddingHero(false)
      setHeroCaption('')
      toast.success('Imagen agregada')
    } catch {
      toast.error('Error al agregar imagen')
    }
  }
 
  const handleAddTrip = async (url: string, source: 'upload' | 'external') => {
    try {
      const res = await fetch('/api/trip-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          caption: tripCaption || null,
          source,
          sortOrder: tripImages.length,
        }),
      })
      if (!res.ok) throw new Error('Error al agregar')
      const data = await res.json()
      const newImage = data.image || data.tripImage
      if (!newImage) throw new Error('Formato de respuesta incorrecto')
      setTripImages([...tripImages, newImage])
      setAddingTrip(false)
      setTripCaption('')
      toast.success('Imagen agregada')
    } catch {
      toast.error('Error al agregar imagen')
    }
  }
 
  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const endpoint = deleteType === 'hero' ? `/api/hero-images/${deleteId}` : `/api/trip-images/${deleteId}`
      const res = await fetch(endpoint, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      if (deleteType === 'hero') {
        setHeroImages(heroImages.filter((img) => img.id !== deleteId))
      } else {
        setTripImages(tripImages.filter((img) => img.id !== deleteId))
      }
      toast.success('Imagen eliminada')
    } catch {
      toast.error('Error al eliminar imagen')
    } finally {
      setDeleteId(null)
    }
  }
 
  const renderImageGrid = (images: MediaImage[], type: 'hero' | 'trip') => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {images.filter(Boolean).map((img) => (
        <Card key={img.id} className="group relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="aspect-square overflow-hidden">
            <img
              src={img.url}
              alt={img.caption || 'Imagen'}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.svg' }}
            />
          </div>
          <CardContent className="p-2">
            <p className="text-xs text-muted-foreground truncate">
              {img.caption || 'Sin descripción'}
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">Orden: {img.sortOrder}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => { setDeleteId(img.id); setDeleteType(type) }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Multimedia</h1>

      <Tabs defaultValue="hero">
        <TabsList className="bg-white border">
          <TabsTrigger value="hero">Imágenes Hero</TabsTrigger>
          <TabsTrigger value="trips">Fotos de Viajes</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-4 mt-4">
          {addingHero ? (
            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <ImageUpload onUploadComplete={handleAddHero} />
                <Input
                  value={heroCaption}
                  onChange={(e) => setHeroCaption(e.target.value)}
                  placeholder="Descripción (opcional)"
                  className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                />
                <Button variant="ghost" size="sm" onClick={() => setAddingHero(false)}>
                  Cancelar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Button variant="outline" onClick={() => setAddingHero(true)} className="border-dashed">
              <Plus className="h-4 w-4 mr-1" />
              Agregar imagen Hero
            </Button>
          )}

          {loading ? (
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square skeleton-wave" />
              ))}
            </div>
          ) : heroImages.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 mb-4 empty-float">
                <ImageIcon className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-1">No hay imágenes Hero</h3>
              <p className="text-base text-muted-foreground">Agrega imágenes para la sección hero del sitio</p>
            </div>
          ) : (
            renderImageGrid(heroImages, 'hero')
          )}
        </TabsContent>

        <TabsContent value="trips" className="space-y-4 mt-4">
          {addingTrip ? (
            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <ImageUpload onUploadComplete={handleAddTrip} />
                <Input
                  value={tripCaption}
                  onChange={(e) => setTripCaption(e.target.value)}
                  placeholder="Descripción (opcional)"
                  className="focus-visible:ring-cyan-500 focus-visible:ring-2 focus-visible:shadow-sm focus-visible:shadow-cyan-500/10 transition-all duration-200"
                />
                <Button variant="ghost" size="sm" onClick={() => setAddingTrip(false)}>
                  Cancelar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Button variant="outline" onClick={() => setAddingTrip(true)} className="border-dashed">
              <Plus className="h-4 w-4 mr-1" />
              Agregar foto de viaje
            </Button>
          )}

          {loading ? (
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square skeleton-wave" />
              ))}
            </div>
          ) : tripImages.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 mb-4 empty-float">
                <ImageIcon className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-1">No hay fotos de viajes</h3>
              <p className="text-base text-muted-foreground">Agrega fotos de los viajes del sitio</p>
            </div>
          ) : (
            renderImageGrid(tripImages, 'trip')
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar esta imagen?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
      />
    </div>
  )
}
