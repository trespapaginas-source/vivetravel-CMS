import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { replyMessage } = body

    if (!replyMessage || typeof replyMessage !== 'string' || replyMessage.trim().length === 0) {
      return NextResponse.json(
        { error: 'El mensaje de respuesta es requerido' },
        { status: 400 }
      )
    }

    // Check auth
    const sessionUser = await getSessionUser(request)
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const existing = await db.contactMessage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado' },
        { status: 404 }
      )
    }

    const message = await db.contactMessage.update({
      where: { id },
      data: {
        replyMessage: replyMessage.trim(),
        repliedAt: new Date(),
        isRead: true,
      },
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Message reply error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
