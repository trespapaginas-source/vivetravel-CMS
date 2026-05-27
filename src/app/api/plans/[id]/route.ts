import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slugify } from '@/lib/sluggify'
import { logActivity } from '@/lib/activity-logger'
import { getSessionUser, isAdmin } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const plan = await db.tourPlan.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        includes: { orderBy: { sortOrder: 'asc' } },
        excludes: { orderBy: { sortOrder: 'asc' } },
        highlights: { orderBy: { sortOrder: 'asc' } },
        testimonials: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Plan get error:', error)
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
      images,
      includes,
      excludes,
      highlights,
    } = body

    const existing = await db.tourPlan.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    const planSlug = slug || (name ? slugify(name) : existing.slug)

    // Check for duplicate slug (excluding current)
    if (planSlug !== existing.slug) {
      const duplicate = await db.tourPlan.findUnique({ where: { slug: planSlug } })
      if (duplicate) {
        return NextResponse.json(
          { error: 'Ya existe un plan con ese slug' },
          { status: 409 }
        )
      }
    }

    // Build update data - only include fields that are provided
    const updateData: Record<string, unknown> = {
      slug: planSlug,
    }

    const finalCity = city !== undefined ? (city?.trim() || null) : undefined
    const finalSubLocation = subLocation !== undefined ? (subLocation?.trim() || null) : undefined

    if (name !== undefined) updateData.name = name
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription
    if (fullDescription !== undefined) updateData.fullDescription = fullDescription
    if (price !== undefined) updateData.price = price
    if (priceRange !== undefined) updateData.priceRange = priceRange
    if (duration !== undefined) updateData.duration = duration
    
    if (city !== undefined || subLocation !== undefined) {
      const activeCity = city !== undefined ? finalCity : existing.city
      const activeSubLocation = subLocation !== undefined ? finalSubLocation : existing.subLocation
      updateData.city = finalCity
      updateData.subLocation = finalSubLocation
      updateData.location = activeCity ? (activeSubLocation ? `${activeCity}, ${activeSubLocation}` : activeCity) : null
    } else if (location !== undefined) {
      updateData.location = location
    }

    if (categoryId !== undefined) updateData.categoryId = categoryId || null
    if (difficulty !== undefined) updateData.difficulty = difficulty
    if (schedule !== undefined) updateData.schedule = schedule
    if (meetingPoint !== undefined) updateData.meetingPoint = meetingPoint
    if (rating !== undefined) updateData.rating = rating
    if (reviewCount !== undefined) updateData.reviewCount = reviewCount
    if (maxGuests !== undefined) updateData.maxGuests = maxGuests
    if (published !== undefined) updateData.published = published
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    // Handle nested items: delete old, insert new (full replacement) inside a transaction
    const plan = await db.$transaction(async (tx) => {
      if (images !== undefined) {
        await tx.planImage.deleteMany({ where: { planId: id } })
        updateData.images = {
          create: images.map((img: { url: string; caption?: string; source?: string; sortOrder?: number }) => ({
            url: img.url,
            caption: img.caption || null,
            source: img.source || 'upload',
            sortOrder: img.sortOrder ?? 0,
          })),
        }
      }

      if (includes !== undefined) {
        await tx.planInclude.deleteMany({ where: { planId: id } })
        updateData.includes = {
          create: includes.map((inc: { text: string; sortOrder?: number }) => ({
            text: inc.text,
            sortOrder: inc.sortOrder ?? 0,
          })),
        }
      }

      if (excludes !== undefined) {
        await tx.planExclude.deleteMany({ where: { planId: id } })
        updateData.excludes = {
          create: excludes.map((exc: { text: string; sortOrder?: number }) => ({
            text: exc.text,
            sortOrder: exc.sortOrder ?? 0,
          })),
        }
      }

      if (highlights !== undefined) {
        await tx.planHighlight.deleteMany({ where: { planId: id } })
        updateData.highlights = {
          create: highlights.map((hl: { text: string; sortOrder?: number }) => ({
            text: hl.text,
            sortOrder: hl.sortOrder ?? 0,
          })),
        }
      }

      return tx.tourPlan.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' } },
          includes: { orderBy: { sortOrder: 'asc' } },
          excludes: { orderBy: { sortOrder: 'asc' } },
          highlights: { orderBy: { sortOrder: 'asc' } },
        },
      })
    })

    // Log activity
    if (sessionUser) {
      let action: 'update' | 'publish' | 'unpublish' = 'update'
      if (published === true && !existing.published) action = 'publish'
      else if (published === false && existing.published) action = 'unpublish'
      await logActivity({
        userId: sessionUser.id,
        action,
        entity: 'plan',
        entityId: id,
        details: JSON.stringify({ name: plan.name }),
      })
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Plan update error:', error)
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

    const existing = await db.tourPlan.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    // Cascade deletes will handle related records
    await db.tourPlan.delete({ where: { id } })

    // Log activity
    if (sessionUser) {
      await logActivity({
        userId: sessionUser.id,
        action: 'delete',
        entity: 'plan',
        entityId: id,
        details: JSON.stringify({ name: existing.name }),
      })
    }

    return NextResponse.json({ message: 'Plan eliminado exitosamente' })
  } catch (error) {
    console.error('Plan delete error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
