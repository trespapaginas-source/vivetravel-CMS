import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.heroImage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Imagen no encontrada' },
        { status: 404 }
      )
    }

    await db.heroImage.delete({ where: { id } })

    return NextResponse.json({ message: 'Imagen eliminada exitosamente' })
  } catch (error) {
    console.error('Hero image delete error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
