import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const images = await db.heroImage.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ images })
  } catch (error) {
    console.error('Hero images list error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, caption, storagePath, source, sortOrder } = body

    if (!url) {
      return NextResponse.json(
        { error: 'La URL es requerida' },
        { status: 400 }
      )
    }

    const image = await db.heroImage.create({
      data: {
        url,
        caption: caption || null,
        storagePath: storagePath || null,
        source: source || 'upload',
        sortOrder: sortOrder ?? 0,
      },
    })

    return NextResponse.json({ image }, { status: 201 })
  } catch (error) {
    console.error('Hero image create error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
