'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ImageUpload from './ImageUpload'
import { ArrowUp, ArrowDown, Trash2, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react'

export interface ImageItem {
  id?: string
  url: string
  caption: string | null
  source: string
  sortOrder: number
}

interface ImageManagerProps {
  images: ImageItem[]
  onChange: (images: ImageItem[]) => void
}

export default function ImageManager({ images, onChange }: ImageManagerProps) {
  const [addingIndex, setAddingIndex] = useState<number | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  const handleAddImage = (url: string, source: 'upload' | 'external') => {
    const newImage: ImageItem = {
      url,
      caption: null,
      source,
      sortOrder: images.length,
    }
    onChange([...images, newImage])
    setAddingIndex(null)
  }

  const handleCaptionChange = (index: number, caption: string) => {
    const updated = [...images]
    updated[index] = { ...updated[index], caption }
    onChange(updated)
  }

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index)
    updated.forEach((item, i) => { item.sortOrder = i })
    onChange(updated)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...images]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp
    updated.forEach((item, i) => { item.sortOrder = i })
    onChange(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return
    const updated = [...images]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp
    updated.forEach((item, i) => { item.sortOrder = i })
    onChange(updated)
  }

  const openPreview = (index: number) => {
    setPreviewIndex(index)
    setPreviewOpen(true)
  }

  const handlePrevImage = () => {
    setPreviewIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }

  const handleNextImage = () => {
    setPreviewIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }

  return (
    <div className="space-y-4">
      {images.map((img, index) => (
        <div key={img.id || index} className="border rounded-md p-3 space-y-2 bg-card hover:shadow-sm transition-shadow">
          <div className="flex gap-3">
            <div
              className="w-24 h-20 shrink-0 rounded-md overflow-hidden bg-muted cursor-pointer hover:opacity-80 transition-opacity relative group"
              onClick={() => openPreview(index)}
            >
              {img.url ? (
                <>
                  <img
                    src={img.url}
                    alt={img.caption || 'Imagen'}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo.svg' }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Input
                value={img.caption || ''}
                onChange={(e) => handleCaptionChange(index, e.target.value)}
                placeholder="Descripción de la imagen..."
                className="text-sm focus-visible:ring-cyan-500"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-2">
                  {img.source === 'upload' ? 'Subida' : 'URL externa'}
                </span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveUp(index)} disabled={index === 0}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveDown(index)} disabled={index === images.length - 1}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleRemove(index)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {addingIndex !== null ? (
        <div className="border rounded-md p-3 space-y-2">
          <ImageUpload
            onUploadComplete={handleAddImage}
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => setAddingIndex(null)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => setAddingIndex(images.length)} className="w-full border-dashed">
          <ImageIcon className="h-4 w-4 mr-2" />
          Agregar imagen
        </Button>
      )}

      {/* Image Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-sm">
              {images[previewIndex]?.caption || 'Imagen'} — {previewIndex + 1} de {images.length}
            </DialogTitle>
          </DialogHeader>
          <div className="relative bg-black/5 flex items-center justify-center min-h-[300px] max-h-[70vh]">
            {images[previewIndex]?.url && (
              <img
                src={images[previewIndex].url}
                alt={images[previewIndex]?.caption || 'Preview'}
                className="max-w-full max-h-[60vh] object-contain"
              />
            )}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white shadow-md"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/80 hover:bg-white shadow-md"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
          <div className="p-4 border-t bg-muted/30 space-y-1">
            {images[previewIndex]?.caption && (
              <p className="text-sm font-medium text-slate-900">{images[previewIndex].caption}</p>
            )}
            <p className="text-xs text-muted-foreground break-all">{images[previewIndex]?.url}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
