import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    const section = await db.siteContent.findUnique({
      where: { sectionKey: key },
    })

    if (!section) {
      return NextResponse.json(
        { error: 'Sección no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ section })
  } catch (error) {
    console.error('Site content get error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params
    const body = await request.json()
    const { content } = body

    if (content === undefined) {
      return NextResponse.json(
        { error: 'content es requerido' },
        { status: 400 }
      )
    }

    const existing = await db.siteContent.findUnique({
      where: { sectionKey: key },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Sección no encontrada' },
        { status: 404 }
      )
    }

    const section = await db.siteContent.update({
      where: { sectionKey: key },
      data: { content },
    })

    return NextResponse.json({ section })
  } catch (error) {
    console.error('Site content update error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
