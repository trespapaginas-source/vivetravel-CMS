import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity')
    const action = searchParams.get('action')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const where: Record<string, unknown> = {}
    if (entity) where.entity = entity
    if (action) where.action = action

    const logs = await db.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Activity log error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, action, entity, entityId, details } = body

    if (!userId || !action || !entity) {
      return NextResponse.json(
        { error: 'userId, action y entity son requeridos' },
        { status: 400 }
      )
    }

    const log = await db.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId || null,
        details: details || null,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    })

    return NextResponse.json({ log }, { status: 201 })
  } catch (error) {
    console.error('Activity log create error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
