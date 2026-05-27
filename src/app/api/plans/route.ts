import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slugify } from '@/lib/sluggify'
import { logActivity } from '@/lib/activity-logger'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  try {
    const plans = await db.tourPlan.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        includes: { orderBy: { sortOrder: 'asc' } },
        excludes: { orderBy: { sortOrder: 'asc' } },
        highlights: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { testimonials: true } },
      },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Plans list error:', error)
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
      slug,
      shortDescription,
      fullDescription,
      price,
      priceRange,
      duration,
      location,
      city,
      subLocation,
      categoryId,
      difficulty,
      schedule,
      meetingPoint,
      rating,
      reviewCount,
      maxGuests,
      published,
      sortOrder,
      images = [],
      includes = [],
      excludes = [],
      highlights = [],
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const planSlug = slug || slugify(name)

    // Check for duplicate slug
    const existing = await db.tourPlan.findUnique({ where: { slug: planSlug } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un plan con ese slug' },
        { status: 409 }
      )
    }

    const finalCity = city?.trim() || null
    const finalSubLocation = subLocation?.trim() || null
    const finalLocation = location || (finalCity ? (finalSubLocation ? `${finalCity}, ${finalSubLocation}` : finalCity) : null)

    const plan = await db.tourPlan.create({
      data: {
        name,
        slug: planSlug,
        shortDescription: shortDescription || null,
        fullDescription: fullDescription || null,
        price: price ?? 0,
        priceRange: priceRange || null,
        duration: duration || null,
        location: finalLocation,
        city: finalCity,
        subLocation: finalSubLocation,
        categoryId: categoryId || null,
        difficulty: difficulty || null,
        schedule: schedule || null,
        meetingPoint: meetingPoint || null,
        rating: rating ?? 0,
        reviewCount: reviewCount ?? 0,
        maxGuests: maxGuests || null,
        published: published ?? false,
        sortOrder: sortOrder ?? 0,
        images: {
          create: images.map((img: { url: string; caption?: string; source?: string; sortOrder?: number }) => ({
            url: img.url,
            caption: img.caption || null,
            source: img.source || 'upload',
            sortOrder: img.sortOrder ?? 0,
          })),
        },
        includes: {
          create: includes.map((inc: { text: string; sortOrder?: number }) => ({
            text: inc.text,
            sortOrder: inc.sortOrder ?? 0,
          })),
        },
        excludes: {
          create: excludes.map((exc: { text: string; sortOrder?: number }) => ({
            text: exc.text,
            sortOrder: exc.sortOrder ?? 0,
          })),
        },
        highlights: {
          create: highlights.map((hl: { text: string; sortOrder?: number }) => ({
            text: hl.text,
            sortOrder: hl.sortOrder ?? 0,
          })),
        },
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        includes: { orderBy: { sortOrder: 'asc' } },
        excludes: { orderBy: { sortOrder: 'asc' } },
        highlights: { orderBy: { sortOrder: 'asc' } },
      },
    })

    // Log activity
    if (sessionUser) {
      const action = published ? 'publish' as const : 'create' as const
      await logActivity({
        userId: sessionUser.id,
        action,
        entity: 'plan',
        entityId: plan.id,
        details: JSON.stringify({ name: plan.name }),
      })
    }

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    console.error('Plan create error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
