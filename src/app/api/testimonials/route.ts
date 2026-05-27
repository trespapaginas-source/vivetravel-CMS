import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity-logger'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  try {
    const testimonials = await db.testimonial.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        plan: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    return NextResponse.json({ testimonials })
  } catch (error) {
    console.error('Testimonials list error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser(request)
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

    if (!name || !text) {
      return NextResponse.json(
        { error: 'Nombre y texto son requeridos' },
        { status: 400 }
      )
    }

    const testimonial = await db.testimonial.create({
      data: {
        name,
        avatar: avatar || null,
        location: location || null,
        text,
        rating: rating ?? 5,
        tripName: tripName || null,
        planId: planId || null,
        published: published ?? false,
        sortOrder: sortOrder ?? 0,
      },
      include: {
        plan: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    // Log activity
    if (sessionUser) {
      await logActivity({
        userId: sessionUser.id,
        action: 'create',
        entity: 'testimonial',
        entityId: testimonial.id,
        details: JSON.stringify({ name: testimonial.name }),
      })
    }

    return NextResponse.json({ testimonial }, { status: 201 })
  } catch (error) {
    console.error('Testimonial create error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
