'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react'

export interface DynamicListItem {
  id?: string
  text: string
  sortOrder: number
}

interface DynamicListProps {
  items: DynamicListItem[]
  onChange: (items: DynamicListItem[]) => void
  placeholder?: string
  addLabel?: string
}

export default function DynamicList({ items, onChange, placeholder = 'Agregar elemento...', addLabel = 'Agregar' }: DynamicListProps) {
  const [newText, setNewText] = useState('')

  const handleAdd = () => {
    const trimmed = newText.trim()
    if (!trimmed) return
    const newItem: DynamicListItem = {
      text: trimmed,
      sortOrder: items.length,
    }
    onChange([...items, newItem])
    setNewText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleRemove = (index: number) => {
    const updated = items.filter((_, i) => i !== index)
    updated.forEach((item, i) => { item.sortOrder = i })
    onChange(updated)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const updated = [...items]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp
    updated.forEach((item, i) => { item.sortOrder = i })
    onChange(updated)
  }

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return
    const updated = [...items]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp
    updated.forEach((item, i) => { item.sortOrder = i })
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleAdd} className="shrink-0">
          <Plus className="h-4 w-4 mr-1" />
          {addLabel}
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={item.id || index} className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
              <span className="flex-1 text-sm">{item.text}</span>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveUp(index)} disabled={index === 0}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMoveDown(index)} disabled={index === items.length - 1}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleRemove(index)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
