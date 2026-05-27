'use client'

import { useRef, useState, useCallback, useMemo } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Bold, Italic, Heading2, List, Quote, Link, Eye, EyeOff } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

const TOOLBAR_DEFS = [
  { id: 'bold', icon: <Bold className="h-3.5 w-3.5" />, label: 'Negrita', prefix: '**', suffix: '**' },
  { id: 'italic', icon: <Italic className="h-3.5 w-3.5" />, label: 'Cursiva', prefix: '*', suffix: '*' },
  { id: 'heading', icon: <Heading2 className="h-3.5 w-3.5" />, label: 'Título', prefix: '## ', suffix: '' },
  { id: 'list', icon: <List className="h-3.5 w-3.5" />, label: 'Lista', prefix: '- ', suffix: '' },
  { id: 'quote', icon: <Quote className="h-3.5 w-3.5" />, label: 'Cita', prefix: '> ', suffix: '' },
  { id: 'link', icon: <Link className="h-3.5 w-3.5" />, label: 'Enlace', prefix: '[', suffix: '](url)' },
]

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  rows = 8,
}: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertMarkdown = useCallback(
    (prefix: string, suffix: string = '') => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = value.substring(start, end)
      const before = value.substring(0, start)
      const after = value.substring(end)

      const newText = before + prefix + selectedText + suffix + after
      onChange(newText)

      // Restore cursor position after React re-renders
      requestAnimationFrame(() => {
        textarea.focus()
        const newCursorPos = start + prefix.length + selectedText.length + suffix.length
        textarea.setSelectionRange(
          selectedText ? newCursorPos : start + prefix.length,
          selectedText ? newCursorPos : start + prefix.length
        )
      })
    },
    [value, onChange]
  )

  const toolbarButtons = useMemo(() =>
    TOOLBAR_DEFS.map((def) => ({
      ...def,
      action: () => insertMarkdown(def.prefix, def.suffix),
    })),
    [insertMarkdown]
  )

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 border rounded-md bg-slate-50 dark:bg-slate-800 p-1">
        {toolbarButtons.map((btn) => (
          <Button
            key={btn.id}
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            onClick={btn.action}
            title={btn.label}
          >
            {btn.icon}
          </Button>
        ))}
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-7 px-2 ${showPreview ? 'text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950' : 'text-slate-600 dark:text-slate-400'}`}
          onClick={() => setShowPreview(!showPreview)}
          title={showPreview ? 'Ocultar vista previa' : 'Vista previa'}
        >
          {showPreview ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
          <span className="text-xs">Vista previa</span>
        </Button>
      </div>

      {/* Editor */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="font-mono text-sm focus-visible:ring-cyan-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
      />

      {/* Preview */}
      {showPreview && (
        <div className="border rounded-md p-4 bg-white dark:bg-slate-800 dark:border-slate-700 min-h-[100px]">
          {value ? (
            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none
              prose-headings:text-slate-900 dark:prose-headings:text-slate-100
              prose-p:text-slate-700 dark:prose-p:text-slate-300
              prose-strong:text-slate-900 dark:prose-strong:text-slate-100
              prose-em:text-slate-700 dark:prose-em:text-slate-300
              prose-a:text-cyan-700 dark:prose-a:text-cyan-400
              prose-code:text-cyan-700 dark:prose-code:text-cyan-400
              prose-li:text-slate-700 dark:prose-li:text-slate-300
              prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400
              prose-blockquote:border-cyan-500 dark:prose-blockquote:border-cyan-700
              prose-hr:border-slate-200 dark:prose-hr:border-slate-700
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No hay contenido para previsualizar
            </p>
          )}
        </div>
      )}
    </div>
  )
}
