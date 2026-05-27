import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdmin, getSessionUser } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { isRead } = body

    const existing = await db.contactMessage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      )
    }

    const message = await db.contactMessage.update({
      where: { id },
      data: { isRead: isRead !== undefined ? isRead : !existing.isRead },
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Message update error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Admin only check
    const adminCheck = await isAdmin(request)
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'No autorizado - se requiere rol de administrador' },
        { status: 403 }
      )
    }

    const existing = await db.contactMessage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      )
    }

    await db.contactMessage.delete({ where: { id } })

    return NextResponse.json({ message: 'Mensaje eliminado exitosamente' })
  } catch (error) {
    console.error('Message delete error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
