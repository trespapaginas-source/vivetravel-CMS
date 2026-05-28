'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Save, Loader2, Plus, Trash2, ArrowUp, ArrowDown,
  Sparkles, Map, Image as ImageIconLucide, Users, Phone,
  Shield, Settings, Megaphone, Search, RotateCcw, Code, Clock,
  ExternalLink, Compass, Globe, MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'

// Define section keys and labels with icons
const SECTIONS = [
  { key: 'hero', label: 'Hero', icon: <Sparkles className="h-4 w-4" />, color: 'emerald', preview: '🏠' },
  { key: 'influencer', label: 'Influencer', icon: <Users className="h-4 w-4" />, color: 'violet', preview: '👤' },
  { key: 'featuredPlans', label: 'Planes Destacados', icon: <Map className="h-4 w-4" />, color: 'teal', preview: '⭐' },
  { key: 'gallery', label: 'Destinos Nacionales', icon: <Compass className="h-4 w-4" />, color: 'teal', preview: '🗺️' },
  { key: 'international', label: 'Destinos Internacionales', icon: <Globe className="h-4 w-4" />, color: 'indigo', preview: '🌎' },
  { key: 'carousel', label: 'Carrusel', icon: <ImageIconLucide className="h-4 w-4" />, color: 'amber', preview: '🎠' },
  { key: 'groupTrips', label: 'Viajes en Grupo', icon: <Users className="h-4 w-4" />, color: 'violet', preview: '👥' },
  { key: 'customTrips', label: 'Viajes a Medida', icon: <Map className="h-4 w-4" />, color: 'rose', preview: '✈️' },
  { key: 'testimonials', label: 'Testimonios', icon: <MessageSquare className="h-4 w-4" />, color: 'amber', preview: '💬' },
  { key: 'team', label: 'Nuestro Equipo', icon: <Users className="h-4 w-4" />, color: 'violet', preview: '👥' },
  { key: 'contact', label: 'Contacto', icon: <Phone className="h-4 w-4" />, color: 'cyan', preview: '📞' },
  { key: 'policies', label: 'Políticas', icon: <Shield className="h-4 w-4" />, color: 'slate', preview: '📋' },
  { key: 'homeConfig', label: 'Config Inicio', icon: <Settings className="h-4 w-4" />, color: 'sky', preview: '⚙️' },
  { key: 'campaign', label: 'Campaña', icon: <Megaphone className="h-4 w-4" />, color: 'orange', preview: '📣' },
  { key: 'seo', label: 'SEO', icon: <Search className="h-4 w-4" />, color: 'indigo', preview: '🔍' },
] as const

// Color map for section badges
const SECTION_COLORS: Record<string, { bg: string; text: string; border: string; activeBg: string; dot: string }> = {
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800', activeBg: 'bg-emerald-700', dot: 'bg-emerald-400' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-950/50', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800', activeBg: 'bg-teal-700', dot: 'bg-teal-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', activeBg: 'bg-amber-700', dot: 'bg-amber-400' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-950/50', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800', activeBg: 'bg-violet-700', dot: 'bg-violet-400' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800', activeBg: 'bg-rose-700', dot: 'bg-rose-400' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/50', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800', activeBg: 'bg-cyan-700', dot: 'bg-cyan-400' },
  slate: { bg: 'bg-slate-50 dark:bg-slate-900/50', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-800', activeBg: 'bg-slate-700', dot: 'bg-slate-400' },
  sky: { bg: 'bg-sky-50 dark:bg-sky-950/50', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800', activeBg: 'bg-sky-700', dot: 'bg-sky-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/50', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', activeBg: 'bg-orange-700', dot: 'bg-orange-400' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800', activeBg: 'bg-indigo-700', dot: 'bg-indigo-400' },
}

type SectionKey = typeof SECTIONS[number]['key']

interface SiteSection {
  id: string
  sectionKey: string
  content: Record<string, unknown>
  updatedAt: string
}

// Reusable dynamic array editor for objects like stats, benefits, policies
function DynamicObjectArray({
  items,
  onChange,
  fields,
  addLabel = 'Agregar',
}: {
  items: Record<string, string>[]
  onChange: (items: Record<string, string>[]) => void
  fields: { key: string; label: string; type?: 'text' | 'textarea' }[]
  addLabel?: string
}) {
  const handleAdd = () => {
    const newItem: Record<string, string> = {}
    fields.forEach((f) => { newItem[f.key] = '' })
    onChange([...items, newItem])
  }

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleChange = (index: number, key: string, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [key]: value }
    onChange(updated)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...items]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp
    onChange(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return
    const updated = [...items]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="border rounded-md p-3 space-y-2 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveUp(index)} disabled={index === 0}>
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveDown(index)} disabled={index === items.length - 1}>
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleRemove(index)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs">{field.label}</Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    value={(item[field.key] as string) || ''}
                    onChange={(e) => handleChange(index, field.key, e.target.value)}
                    rows={3}
                    className="text-sm"
                  />
                ) : (
                  <Input
                    value={(item[field.key] as string) || ''}
                    onChange={(e) => handleChange(index, field.key, e.target.value)}
                    className="text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        {addLabel}
      </Button>
    </div>
  )
}

// Section-specific editors
function HeroEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <TextInput label="brandLabel" field="brandLabel" content={content} onChange={onChange} />
      <TextInput label="Título" field="title" content={content} onChange={onChange} />
      <TextInput label="Resaltado del Título" field="titleHighlight" content={content} onChange={onChange} />
      <TextInput label="Subtítulo" field="subtitle" content={content} onChange={onChange} />
      <TextInput label="CTA Planes" field="ctaPlans" content={content} onChange={onChange} />
      <TextInput label="CTA Cabañas" field="ctaCabins" content={content} onChange={onChange} />
    </div>
  )
}

function GalleryEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const destinations = (content.destinations as Record<string, string>[]) || []
  return (
    <div className="space-y-4">
      <TextInput label="Título" field="title" content={content} onChange={onChange} />
      <TextInput label="Resaltado del Título" field="titleHighlight" content={content} onChange={onChange} />
      <TextInput label="Subtítulo" field="subtitle" content={content} onChange={onChange} />
      <div className="space-y-2">
        <Label className="text-sm font-medium">Destinos Nacionales</Label>
        <DynamicObjectArray
          items={destinations}
          onChange={(items) => onChange({ ...content, destinations: items })}
          fields={[
            { key: 'id', label: 'ID (ej. dest-baru)' },
            { key: 'title', label: 'Nombre' },
            { key: 'subtitle', label: 'Descripción corta' },
            { key: 'image', label: 'URL de la Imagen' },
          ]}
          addLabel="Agregar destino"
        />
      </div>
    </div>
  )
}

const INTERNATIONAL_FALLBACKS: Record<string, { eyebrow: string; description: string }> = {
  'cancún': {
    eyebrow: 'Escapadas al Caribe mexicano',
    description: 'Escapadas espectaculares al Caribe mexicano. Disfruta de playas de arena blanca, una vibrante vida nocturna y fascinantes tours arqueológicos.'
  },
  'punta cana': {
    eyebrow: 'Playas, descanso y resorts',
    description: 'El escape perfecto con todo incluido en República Dominicana. Relájate frente a aguas cristalinas con servicios premium y descanso total.'
  },
  'san andrés': {
    eyebrow: 'Mar de siete colores',
    description: 'Descubre el mar de los siete colores en Colombia. Un destino caribeño lleno de vida, arrecifes de coral y hermosas playas tropicales.'
  }
}

function InternationalEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const rawDestinations = (content.destinations as Record<string, string>[]) || []
  
  const destinations = rawDestinations.map(dest => {
    const nameLower = (dest.name || '').toLowerCase()
    const fallback = INTERNATIONAL_FALLBACKS[nameLower]
    return {
      ...dest,
      eyebrow: dest.eyebrow || (fallback ? fallback.eyebrow : ''),
      description: dest.description || (fallback ? fallback.description : '')
    }
  })

  return (
    <div className="space-y-4">
      <TextInput label="Título" field="title" content={content} onChange={onChange} />
      <TextInput label="Resaltado del Título" field="titleHighlight" content={content} onChange={onChange} />
      <TextInput label="Subtítulo" field="subtitle" content={content} onChange={onChange} />
      <div className="space-y-2">
        <Label className="text-sm font-medium">Destinos Internacionales</Label>
        <DynamicObjectArray
          items={destinations}
          onChange={(items) => onChange({ ...content, destinations: items })}
          fields={[
            { key: 'name', label: 'Nombre' },
            { key: 'eyebrow', label: 'Línea superior / Eyebrow' },
            { key: 'image', label: 'URL de la Imagen' },
            { key: 'description', label: 'Descripción', type: 'textarea' },
          ]}
          addLabel="Agregar destino"
        />
      </div>
    </div>
  )
}


function TeamEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <TextInput label="Título" field="title" content={content} onChange={onChange} />
      <TextInput label="Subtítulo" field="subtitle" content={content} onChange={onChange} />
      <TextareaInput label="Descripción" field="description" content={content} onChange={onChange} />
    </div>
  )
}

function TestimonialsEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <TextInput label="Título" field="title" content={content} onChange={onChange} />
      <TextInput label="Subtítulo" field="subtitle" content={content} onChange={onChange} />
    </div>
  )
}

function InfluencerEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <TextInput label="Nombre del Influencer" field="name" content={content} onChange={onChange} />
      <TextInput label="Rol / Cargo" field="role" content={content} onChange={onChange} />
      <TextareaInput label="Frase / Testimonio" field="quote" content={content} onChange={onChange} />
      <TextInput label="URL de la Imagen" field="imageUrl" content={content} onChange={onChange} />
      <TextInput label="Instagram URL" field="instagramUrl" content={content} onChange={onChange} />
      <TextInput label="Etiqueta del Botón Instagram" field="instagramLabel" content={content} onChange={onChange} />
      <TextInput label="Etiqueta de Estadísticas" field="statsLabel" content={content} onChange={onChange} />
    </div>
  )
}

function FeaturedPlansEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <TextInput label="Título" field="title" content={content} onChange={onChange} />
      <TextInput label="Subtítulo" field="subtitle" content={content} onChange={onChange} />
      <TextInput label="Etiqueta Precio" field="priceLabel" content={content} onChange={onChange} />
      <TextInput label="Ver Más" field="viewMore" content={content} onChange={onChange} />
      <TextInput label="Ver Todos" field="viewAll" content={content} onChange={onChange} />
    </div>
  )
}

function CarouselEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const stats = (content.stats as Record<string, string>[]) || []
  return (
    <div className="space-y-4">
      <TextInput label="Título" field="title" content={content} onChange={onChange} />
      <TextInput label="Subtítulo" field="subtitle" content={content} onChange={onChange} />
      <TextInput label="Marca Hover" field="brandHover" content={content} onChange={onChange} />
      <div className="space-y-2">
        <Label className="text-sm font-medium">Estadísticas</Label>
        <DynamicObjectArray
          items={stats}
          onChange={(items) => onChange({ ...content, stats: items })}
          fields={[
            { key: 'value', label: 'Valor' },
            { key: 'label', label: 'Etiqueta' },
          ]}
          addLabel="Agregar estadística"
        />
      </div>
    </div>
  )
}

function GroupTripsEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const benefits = (content.benefits as Record<string, string>[]) || []
  const stats = (content.stats as Record<string, string>[]) || []
  return (
    <div className="space-y-4">
      <TextInput label="Etiqueta" field="label" content={content} onChange={onChange} />
      <TextInput label="Título" field="title" content={content} onChange={onChange} />
      <TextInput label="Resaltado del Título" field="titleHighlight" content={content} onChange={onChange} />
      <TextareaInput label="Descripción" field="description" content={content} onChange={onChange} />
      <TextInput label="CTA Cotizar" field="ctaQuote" content={content} onChange={onChange} />
      <TextInput label="CTA Planes" field="ctaPlans" content={content} onChange={onChange} />
      <div className="space-y-2">
        <Label className="text-sm font-medium">Beneficios</Label>
        <DynamicObjectArray
          items={benefits}
          onChange={(items) => onChange({ ...content, benefits: items })}
          fields={[
            { key: 'title', label: 'Título' },
            { key: 'description', label: 'Descripción', type: 'textarea' },
          ]}
          addLabel="Agregar beneficio"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Estadísticas</Label>
        <DynamicObjectArray
          items={stats}
          onChange={(items) => onChange({ ...content, stats: items })}
          fields={[
            { key: 'value', label: 'Valor' },
            { key: 'label', label: 'Etiqueta' },
          ]}
          addLabel="Agregar estadística"
        />
      </div>
    </div>
  )
}

function CustomTripsEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const benefits = (content.benefits as Record<string, string>[]) || []
  return (
    <div className="space-y-4">
      <TextInput label="Etiqueta" field="label" content={content} onChange={onChange} />
      <TextInput label="Título" field="title" content={content} onChange={onChange} />
      <TextInput label="Resaltado del Título" field="titleHighlight" content={content} onChange={onChange} />
      <TextareaInput label="Descripción" field="description" content={content} onChange={onChange} />
      <div className="space-y-2">
        <Label className="text-sm font-medium">Beneficios</Label>
        <DynamicObjectArray
          items={benefits}
          onChange={(items) => onChange({ ...content, benefits: items })}
          fields={[
            { key: 'title', label: 'Título' },
            { key: 'description', label: 'Descripción', type: 'textarea' },
          ]}
          addLabel="Agregar beneficio"
        />
      </div>
      <TextInput label="CTA Título" field="ctaTitle" content={content} onChange={onChange} />
      <TextareaInput label="CTA Descripción" field="ctaDescription" content={content} onChange={onChange} />
      <TextInput label="CTA Contacto" field="ctaContact" content={content} onChange={onChange} />
      <TextInput label="CTA Planes" field="ctaPlans" content={content} onChange={onChange} />
    </div>
  )
}

function ContactEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <TextInput label="Badge" field="badge" content={content} onChange={onChange} />
      <TextInput label="Título" field="title" content={content} onChange={onChange} />
      <TextInput label="Resaltado del Título" field="titleHighlight" content={content} onChange={onChange} />
      <TextInput label="Subtítulo" field="subtitle" content={content} onChange={onChange} />
      <TextInput label="Título del Formulario" field="formTitle" content={content} onChange={onChange} />
      <TextInput label="WhatsApp" field="whatsapp" content={content} onChange={onChange} />
      <TextInput label="Email" field="email" content={content} onChange={onChange} />
      <TextInput label="Ubicación" field="location" content={content} onChange={onChange} />
      <TextInput label="Horario" field="hours" content={content} onChange={onChange} />
      <TextInput label="Instagram URL" field="instagramUrl" content={content} onChange={onChange} />
      <TextInput label="Facebook URL" field="facebookUrl" content={content} onChange={onChange} />
      <TextInput label="WhatsApp URL" field="whatsappUrl" content={content} onChange={onChange} />
      <TextInput label="Etiqueta Social" field="socialLabel" content={content} onChange={onChange} />
      <TextInput label="Título Chat" field="chatTitle" content={content} onChange={onChange} />
      <TextareaInput label="Descripción Chat" field="chatDescription" content={content} onChange={onChange} />
      <TextInput label="Botón Chat" field="chatButton" content={content} onChange={onChange} />
    </div>
  )
}

function PoliciesEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const bookingPolicies = (content.bookingPolicies as Record<string, string>[]) || []
  const cancellationPolicies = (content.cancellationPolicies as Record<string, string>[]) || []
  return (
    <div className="space-y-4">
      <TextInput label="Badge" field="badge" content={content} onChange={onChange} />
      <TextInput label="Título" field="title" content={content} onChange={onChange} />
      <TextInput label="Resaltado del Título" field="titleHighlight" content={content} onChange={onChange} />
      <TextInput label="Subtítulo" field="subtitle" content={content} onChange={onChange} />
      <TextInput label="Título Reservas" field="bookingTitle" content={content} onChange={onChange} />
      <TextareaInput label="Subtítulo Reservas" field="bookingSubtitle" content={content} onChange={onChange} />
      <TextInput label="Título Cancelaciones" field="cancellationTitle" content={content} onChange={onChange} />
      <TextareaInput label="Subtítulo Cancelaciones" field="cancellationSubtitle" content={content} onChange={onChange} />
      <div className="space-y-2">
        <Label className="text-sm font-medium">Políticas de Reserva</Label>
        <DynamicObjectArray
          items={bookingPolicies}
          onChange={(items) => onChange({ ...content, bookingPolicies: items })}
          fields={[
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Título' },
            { key: 'content', label: 'Contenido', type: 'textarea' },
          ]}
          addLabel="Agregar política de reserva"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Políticas de Cancelación</Label>
        <DynamicObjectArray
          items={cancellationPolicies}
          onChange={(items) => onChange({ ...content, cancellationPolicies: items })}
          fields={[
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Título' },
            { key: 'content', label: 'Contenido', type: 'textarea' },
          ]}
          addLabel="Agregar política de cancelación"
        />
      </div>
      <TextareaInput label="Texto del Footer" field="footerText" content={content} onChange={onChange} />
      <TextInput label="Última Actualización" field="lastUpdate" content={content} onChange={onChange} />
    </div>
  )
}

function HomeConfigEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const order = (content.order as string[]) || []
  const active = (content.active as Record<string, boolean>) || {}
  const sectionNames = ['hero', 'influencer', 'plans', 'gallery', 'international', 'stats', 'groups', 'custom', 'testimonials', 'team']

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Secciones Activas</Label>
        <div className="space-y-2">
          {sectionNames.map((section) => (
            <div key={section} className="flex items-center gap-3">
              <Switch
                checked={!!active[section]}
                onCheckedChange={(checked) => {
                  onChange({ ...content, active: { ...active, [section]: checked } })
                }}
              />
              <Label className="text-sm">{section}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Orden de Secciones</Label>
        <div className="space-y-1">
          {order.map((section, index) => (
            <div key={index} className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
              <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
              <span className="text-sm flex-1">{section}</span>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                if (index === 0) return
                const updated = [...order]
                const temp = updated[index]
                updated[index] = updated[index - 1]
                updated[index - 1] = temp
                onChange({ ...content, order: updated })
              }} disabled={index === 0}>
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                if (index === order.length - 1) return
                const updated = [...order]
                const temp = updated[index]
                updated[index] = updated[index + 1]
                updated[index + 1] = temp
                onChange({ ...content, order: updated })
              }} disabled={index === order.length - 1}>
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CampaignEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const isActive = !!content.active
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch checked={isActive} onCheckedChange={(checked) => onChange({ ...content, active: checked })} />
        <Label>Campaña {isActive ? 'Activa' : 'Inactiva'}</Label>
      </div>
      <TextInput label="Texto del Banner" field="bannerText" content={content} onChange={onChange} />
      <TextInput label="Texto del CTA" field="ctaText" content={content} onChange={onChange} />
      <TextInput label="URL del CTA" field="ctaUrl" content={content} onChange={onChange} />
    </div>
  )
}

function SeoEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <TextInput label="Meta Título" field="metaTitle" content={content} onChange={onChange} />
      <TextareaInput label="Meta Descripción" field="metaDescription" content={content} onChange={onChange} />
      <TextInput label="Open Graph Image URL" field="openGraphImage" content={content} onChange={onChange} />
    </div>
  )
}

// Helper components
function TextInput({ label, field, content, onChange }: { label: string; field: string; content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Input
        value={(content[field] as string) || ''}
        onChange={(e) => onChange({ ...content, [field]: e.target.value })}
        className="focus-visible:ring-cyan-500"
      />
    </div>
  )
}

function TextareaInput({ label, field, content, onChange }: { label: string; field: string; content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Textarea
        value={(content[field] as string) || ''}
        onChange={(e) => onChange({ ...content, [field]: e.target.value })}
        rows={3}
        className="focus-visible:ring-cyan-500"
      />
    </div>
  )
}

// Main component
export default function SiteContentView() {
  const [sections, setSections] = useState<SiteSection[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SectionKey>('hero')
  const [saving, setSaving] = useState(false)
  const [editedContent, setEditedContent] = useState<Record<string, Record<string, unknown>>>({})
  const [originalContent, setOriginalContent] = useState<Record<string, Record<string, unknown>>>({})
  const [jsonPreviewOpen, setJsonPreviewOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/site-content')
        if (res.ok) {
          const data = await res.json()
          const sectionsData: SiteSection[] = data.sections || []
          setSections(sectionsData)

          // Initialize edited content
          const contentMap: Record<string, Record<string, unknown>> = {}
          sectionsData.forEach((s) => {
            contentMap[s.sectionKey] = { ...(s.content as Record<string, unknown>) }
          })
          setEditedContent(contentMap)
          setOriginalContent(JSON.parse(JSON.stringify(contentMap)))
        }
      } catch {
        toast.error('Error al cargar contenido del sitio')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const currentContent = editedContent[activeSection] || {}
  const isDirty = JSON.stringify(editedContent[activeSection]) !== JSON.stringify(originalContent[activeSection])

  const handleContentChange = useCallback((newContent: Record<string, unknown>) => {
    setEditedContent((prev) => ({ ...prev, [activeSection]: newContent }))
  }, [activeSection])

  const handleSave = async () => {
    setSaving(true)
    try {
      const contentToSave = editedContent[activeSection]
      if (!contentToSave) {
        toast.error('No hay contenido para guardar')
        setSaving(false)
        return
      }

      // Validate JSON structure
      try {
        JSON.parse(JSON.stringify(contentToSave))
      } catch {
        toast.error('El contenido tiene una estructura JSON inválida')
        setSaving(false)
        return
      }

      const res = await fetch('/api/site-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: activeSection,
          content: contentToSave,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }

      // Update original content to match saved state
      setOriginalContent((prev) => ({ ...prev, [activeSection]: JSON.parse(JSON.stringify(contentToSave)) }))
      toast.success('Sección guardada correctamente')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    const original = originalContent[activeSection]
    if (original) {
      setEditedContent((prev) => ({ ...prev, [activeSection]: JSON.parse(JSON.stringify(original)) }))
      toast.info('Cambios revertidos')
    }
  }

  const renderEditor = () => {
    const content = currentContent
    switch (activeSection) {
      case 'hero': return <HeroEditor content={content} onChange={handleContentChange} />
      case 'influencer': return <InfluencerEditor content={content} onChange={handleContentChange} />
      case 'featuredPlans': return <FeaturedPlansEditor content={content} onChange={handleContentChange} />
      case 'gallery': return <GalleryEditor content={content} onChange={handleContentChange} />
      case 'international': return <InternationalEditor content={content} onChange={handleContentChange} />
      case 'carousel': return <CarouselEditor content={content} onChange={handleContentChange} />
      case 'groupTrips': return <GroupTripsEditor content={content} onChange={handleContentChange} />
      case 'customTrips': return <CustomTripsEditor content={content} onChange={handleContentChange} />
      case 'testimonials': return <TestimonialsEditor content={content} onChange={handleContentChange} />
      case 'team': return <TeamEditor content={content} onChange={handleContentChange} />
      case 'contact': return <ContactEditor content={content} onChange={handleContentChange} />
      case 'policies': return <PoliciesEditor content={content} onChange={handleContentChange} />
      case 'homeConfig': return <HomeConfigEditor content={content} onChange={handleContentChange} />
      case 'campaign': return <CampaignEditor content={content} onChange={handleContentChange} />
      case 'seo': return <SeoEditor content={content} onChange={handleContentChange} />
      default: return <p className="text-muted-foreground">Editor no disponible para esta sección</p>
    }
  }

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
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
        <div className="flex gap-6">
          <div className="w-56 space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
          <Skeleton className="flex-1 h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Contenido del Sitio</h1>
      </div>

      <div className="flex gap-6">
        {/* Section Tabs (Left) */}
        <div className="w-60 shrink-0">
          <nav className="space-y-1.5 sticky top-0">
            {SECTIONS.map((section) => {
              const sectionData = sections.find((s) => s.sectionKey === section.key)
              const isSectionDirty = JSON.stringify(editedContent[section.key]) !== JSON.stringify(originalContent[section.key])
              const colors = SECTION_COLORS[section.color] || SECTION_COLORS.cyan
              const isActive = activeSection === section.key
              return (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-300 flex items-center gap-2.5 group relative overflow-hidden ${
                    isActive
                      ? `${colors.activeBg} text-white shadow-lg shadow-${section.color}-700/25`
                      : `text-slate-600 dark:text-slate-400 hover:${colors.bg} border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50`
                  }`}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.dot} rounded-r`} />
                  )}
                  {/* Preview emoji */}
                  <span className="text-base shrink-0" role="img" aria-hidden="true">{section.preview}</span>
                  <span className="flex-1 whitespace-nowrap truncate font-medium">{section.label}</span>
                  {isSectionDirty && (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 animate-pulse" title="Cambios sin guardar" />
                  )}
                  {!isSectionDirty && !isActive && (
                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0 opacity-50`} />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Editor (Right) */}
        <div className="flex-1 min-w-0">
          <Card className="shadow-sm border-t-2" style={{ borderTopColor: `var(--section-accent, oklch(0.5 0.15 190))` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg" role="img" aria-hidden="true">{SECTIONS.find((s) => s.key === activeSection)?.preview}</span>
                  <CardTitle className="text-base">
                    {SECTIONS.find((s) => s.key === activeSection)?.label}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`${(() => { const c = SECTION_COLORS[SECTIONS.find(s => s.key === activeSection)?.color || 'cyan']; return c ? `${c.bg} ${c.text} ${c.border}` : 'bg-cyan-50 text-cyan-700 border-cyan-200' })()} px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider`}
                  >
                    {activeSection}
                  </Badge>
                  {isDirty && (
                    <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[10px] px-1.5 py-0 animate-pulse">
                      Sin guardar
                    </Badge>
                  )}
                </div>
                {sections.find((s) => s.sectionKey === activeSection)?.updatedAt && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Última actualización: {formatTimestamp(sections.find((s) => s.sectionKey === activeSection)?.updatedAt || '')}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/api/preview', '_blank')}
                  title="Vista previa del sitio"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Vista Previa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setJsonPreviewOpen(true)}
                  title="Vista previa JSON"
                >
                  <Code className="h-3.5 w-3.5 mr-1" />
                  JSON
                </Button>
                {isDirty && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    title="Revertir cambios"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Revertir
                  </Button>
                )}
                <Button onClick={handleSave} disabled={saving} className="bg-cyan-700 hover:bg-cyan-800" size="sm">
                  {saving ? (
                    <><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />Guardando...</>
                  ) : (
                    <><Save className="mr-1 h-3.5 w-3.5" />Guardar</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {renderEditor()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* JSON Preview Dialog */}
      <Dialog open={jsonPreviewOpen} onOpenChange={setJsonPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Vista JSON — {SECTIONS.find((s) => s.key === activeSection)?.label}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <pre className="bg-slate-950 text-green-400 p-4 rounded-lg text-xs overflow-x-auto font-mono">
              {JSON.stringify(currentContent, null, 2)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
