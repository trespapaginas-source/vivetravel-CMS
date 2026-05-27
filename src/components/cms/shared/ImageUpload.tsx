'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Link, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
  onUploadComplete: (url: string, source: 'upload' | 'external') => void
  currentUrl?: string
  onClear?: () => void
}

export default function ImageUpload({ onUploadComplete, currentUrl, onClear }: ImageUploadProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload')
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      toast.error('Solo se permiten imágenes JPG, PNG o WebP')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede superar 10MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al subir imagen')
      }

      const data = await res.json()
      onUploadComplete(data.url, 'upload')
      toast.success('Imagen subida correctamente')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    try {
      new URL(trimmed)
      onUploadComplete(trimmed, 'external')
      setUrlInput('')
      toast.success('URL agregada correctamente')
    } catch {
      toast.error('URL inválida')
    }
  }

  if (currentUrl) {
    return (
      <div className="relative group rounded-md overflow-hidden border bg-muted/30">
        <img
          src={currentUrl}
          alt="Preview"
          className="w-full h-32 object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = '/logo.svg' }}
        />
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <Button
          type="button"
          variant={mode === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('upload')}
          className={mode === 'upload' ? 'bg-cyan-700 hover:bg-cyan-800' : ''}
        >
          <Upload className="h-3.5 w-3.5 mr-1" />
          Subir
        </Button>
        <Button
          type="button"
          variant={mode === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('url')}
          className={mode === 'url' ? 'bg-cyan-700 hover:bg-cyan-800' : ''}
        >
          <Link className="h-3.5 w-3.5 mr-1" />
          URL
        </Button>
      </div>

      {mode === 'upload' ? (
        <div
          className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:border-cyan-600 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin h-6 w-6 border-2 border-cyan-600 border-t-transparent rounded-full" />
              <span className="text-sm text-muted-foreground">Subiendo...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Haz clic para subir imagen</span>
              <span className="text-xs text-muted-foreground">JPG, PNG, WebP (máx. 10MB)</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUrlSubmit() } }}
          />
          <Button type="button" size="sm" onClick={handleUrlSubmit} className="shrink-0 bg-cyan-700 hover:bg-cyan-800">
            Agregar
          </Button>
        </div>
      )}
    </div>
  )
}
