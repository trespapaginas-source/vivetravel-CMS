import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity-logger'
import { getSessionUser, isAdmin } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const testimonial = await db.testimonial.findUnique({
      where: { id },
      include: {
        plan: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    if (!testimonial) {
      return NextResponse.json(
        { error: 'Testimonio no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ testimonial })
  } catch (error) {
    console.error('Testimonial get error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser(request)
    const { id } = await params
    const body = await request.json()
    const {
      name,
      avatar,
      location,
      text,
      rating,
      tripName,
      planId,
      published,
      sortOrder,
    } = body

    const existing = await db.testimonial.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Testimonio no encontrado' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (avatar !== undefined) updateData.avatar = avatar
    if (location !== undefined) updateData.location = location
    if (text !== undefined) updateData.text = text
    if (rating !== undefined) updateData.rating = rating
    if (tripName !== undefined) updateData.tripName = tripName
    if (planId !== undefined) updateData.planId = planId || null
    if (published !== undefined) updateData.published = published
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    const testimonial = await db.testimonial.update({
      where: { id },
      data: updateData,
      include: {
        plan: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    // Log activity
    if (sessionUser) {
      let action: 'update' | 'publish' | 'unpublish' = 'update'
      if (published === true && !existing.published) action = 'publish'
      else if (published === false && existing.published) action = 'unpublish'
      await logActivity({
        userId: sessionUser.id,
        action,
        entity: 'testimonial',
        entityId: id,
        details: JSON.stringify({ name: testimonial.name }),
      })
    }

    return NextResponse.json({ testimonial })
  } catch (error) {
    console.error('Testimonial update error:', error)
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
    const sessionUser = await getSessionUser(request)
    const { id } = await params

    // Admin only check
    const adminCheck = await isAdmin(request)
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'No autorizado - se requiere rol de administrador' },
        { status: 403 }
      )
    }

    const existing = await db.testimonial.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Testimonio no encontrado' },
        { status: 404 }
      )
    }

    await db.testimonial.delete({ where: { id } })

    // Log activity
    if (sessionUser) {
      await logActivity({
        userId: sessionUser.id,
        action: 'delete',
        entity: 'testimonial',
        entityId: id,
        details: JSON.stringify({ name: existing.name }),
      })
    }

    return NextResponse.json({ message: 'Testimonio eliminado exitosamente' })
  } catch (error) {
    console.error('Testimonial delete error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
