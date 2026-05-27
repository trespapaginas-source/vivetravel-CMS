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
    const cabin = await db.cabin.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        amenities: { orderBy: { sortOrder: 'asc' } },
        highlights: { orderBy: { sortOrder: 'asc' } },
        rules: { orderBy: { sortOrder: 'asc' } },
      },
    })

    if (!cabin) {
      return NextResponse.json(
        { error: 'Cabaña no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ cabin })
  } catch (error) {
    console.error('Cabin get error:', error)
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
      pricePerNight,
      priceRange,
      location,
      city,
      subLocation,
      address,
      capacity,
      bedrooms,
      bathrooms,
      lat,
      lng,
      checkIn,
      checkOut,
      cancellationPolicy,
      bedroomDetails,
      rating,
      reviewCount,
      published,
      sortOrder,
      images,
      amenities,
      highlights,
      rules,
    } = body

    const existing = await db.cabin.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Cabaña no encontrada' },
        { status: 404 }
      )
    }

    const cabinSlug = slug || (name ? slugify(name) : existing.slug)

    // Check for duplicate slug (excluding current)
    if (cabinSlug !== existing.slug) {
      const duplicate = await db.cabin.findUnique({ where: { slug: cabinSlug } })
      if (duplicate) {
        return NextResponse.json(
          { error: 'Ya existe una cabaña con ese slug' },
          { status: 409 }
        )
      }
    }

    const updateData: Record<string, unknown> = {
      slug: cabinSlug,
    }

    const finalCity = city !== undefined ? (city?.trim() || null) : undefined
    const finalSubLocation = subLocation !== undefined ? (subLocation?.trim() || null) : undefined

    if (name !== undefined) updateData.name = name
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription
    if (fullDescription !== undefined) updateData.fullDescription = fullDescription
    if (pricePerNight !== undefined) updateData.pricePerNight = pricePerNight
    if (priceRange !== undefined) updateData.priceRange = priceRange
    
    if (city !== undefined || subLocation !== undefined) {
      const activeCity = city !== undefined ? finalCity : existing.city
      const activeSubLocation = subLocation !== undefined ? finalSubLocation : existing.subLocation
      updateData.city = finalCity
      updateData.subLocation = finalSubLocation
      updateData.location = activeCity ? (activeSubLocation ? `${activeCity}, ${activeSubLocation}` : activeCity) : null
    } else if (location !== undefined) {
      updateData.location = location
    }

    if (address !== undefined) updateData.address = address
    if (capacity !== undefined) updateData.capacity = capacity
    if (bedrooms !== undefined) updateData.bedrooms = bedrooms
    if (bathrooms !== undefined) updateData.bathrooms = bathrooms
    if (lat !== undefined) updateData.lat = lat
    if (lng !== undefined) updateData.lng = lng
    if (checkIn !== undefined) updateData.checkIn = checkIn
    if (checkOut !== undefined) updateData.checkOut = checkOut
    if (cancellationPolicy !== undefined) updateData.cancellationPolicy = cancellationPolicy
    if (bedroomDetails !== undefined) updateData.bedroomDetails = bedroomDetails
    if (rating !== undefined) updateData.rating = rating
    if (reviewCount !== undefined) updateData.reviewCount = reviewCount
    if (published !== undefined) updateData.published = published
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    // Handle nested items: delete old, insert new (full replacement) inside a transaction
    const cabin = await db.$transaction(async (tx) => {
      if (images !== undefined) {
        await tx.cabinImage.deleteMany({ where: { cabinId: id } })
        updateData.images = {
          create: images.map((img: { url: string; caption?: string; source?: string; sortOrder?: number }) => ({
            url: img.url,
            caption: img.caption || null,
            source: img.source || 'upload',
            sortOrder: img.sortOrder ?? 0,
          })),
        }
      }

      if (amenities !== undefined) {
        await tx.cabinAmenity.deleteMany({ where: { cabinId: id } })
        updateData.amenities = {
          create: amenities.map((am: { text: string; sortOrder?: number }) => ({
            text: am.text,
            sortOrder: am.sortOrder ?? 0,
          })),
        }
      }

      if (highlights !== undefined) {
        await tx.cabinHighlight.deleteMany({ where: { cabinId: id } })
        updateData.highlights = {
          create: highlights.map((hl: { text: string; sortOrder?: number }) => ({
            text: hl.text,
            sortOrder: hl.sortOrder ?? 0,
          })),
        }
      }

      if (rules !== undefined) {
        await tx.cabinRule.deleteMany({ where: { cabinId: id } })
        updateData.rules = {
          create: rules.map((rl: { text: string; sortOrder?: number }) => ({
            text: rl.text,
            sortOrder: rl.sortOrder ?? 0,
          })),
        }
      }

      return tx.cabin.update({
        where: { id },
        data: updateData,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          amenities: { orderBy: { sortOrder: 'asc' } },
          highlights: { orderBy: { sortOrder: 'asc' } },
          rules: { orderBy: { sortOrder: 'asc' } },
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
        entity: 'cabin',
        entityId: id,
        details: JSON.stringify({ name: cabin.name }),
      })
    }

    return NextResponse.json({ cabin })
  } catch (error) {
    console.error('Cabin update error:', error)
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

    const existing = await db.cabin.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Cabaña no encontrada' },
        { status: 404 }
      )
    }

    // Cascade deletes will handle related records
    await db.cabin.delete({ where: { id } })

    // Log activity
    if (sessionUser) {
      await logActivity({
        userId: sessionUser.id,
        action: 'delete',
        entity: 'cabin',
        entityId: id,
        details: JSON.stringify({ name: existing.name }),
      })
    }

    return NextResponse.json({ message: 'Cabaña eliminada exitosamente' })
  } catch (error) {
    console.error('Cabin delete error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
