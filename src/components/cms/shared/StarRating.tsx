'use client'

import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({ rating, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const sizes = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-6 w-6' }
  const iconSize = sizes[size]

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`${iconSize} ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-muted-foreground/40'
            }`}
          />
        </button>
      ))}
    </div>
  )
}
