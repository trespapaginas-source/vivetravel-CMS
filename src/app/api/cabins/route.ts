import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slugify } from '@/lib/sluggify'
import { logActivity } from '@/lib/activity-logger'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  try {
    const cabins = await db.cabin.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        amenities: { orderBy: { sortOrder: 'asc' } },
        highlights: { orderBy: { sortOrder: 'asc' } },
        rules: { orderBy: { sortOrder: 'asc' } },
      },
    })

    return NextResponse.json({ cabins })
  } catch (error) {
    console.error('Cabins list error:', error)
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
      rating,
      reviewCount,
      published,
      sortOrder,
      bedroomDetails,
      images = [],
      amenities = [],
      highlights = [],
      rules = [],
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const cabinSlug = slug || slugify(name)

    // Check for duplicate slug
    const existing = await db.cabin.findUnique({ where: { slug: cabinSlug } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una cabaña con ese slug' },
        { status: 409 }
      )
    }

    const finalCity = city?.trim() || null
    const finalSubLocation = subLocation?.trim() || null
    const finalLocation = location || (finalCity ? (finalSubLocation ? `${finalCity}, ${finalSubLocation}` : finalCity) : null)

    const cabin = await db.cabin.create({
      data: {
        name,
        slug: cabinSlug,
        shortDescription: shortDescription || null,
        fullDescription: fullDescription || null,
        pricePerNight: pricePerNight ?? 0,
        priceRange: priceRange || null,
        location: finalLocation,
        city: finalCity,
        subLocation: finalSubLocation,
        address: address || null,
        capacity: capacity || null,
        bedrooms: bedrooms || null,
        bathrooms: bathrooms || null,
        lat: lat || null,
        lng: lng || null,
        checkIn: checkIn || '3:00 PM',
        checkOut: checkOut || '11:00 AM',
        cancellationPolicy: cancellationPolicy || null,
        bedroomDetails: bedroomDetails || null,
        rating: rating ?? 0,
        reviewCount: reviewCount ?? 0,
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
        amenities: {
          create: amenities.map((am: { text: string; sortOrder?: number }) => ({
            text: am.text,
            sortOrder: am.sortOrder ?? 0,
          })),
        },
        highlights: {
          create: highlights.map((hl: { text: string; sortOrder?: number }) => ({
            text: hl.text,
            sortOrder: hl.sortOrder ?? 0,
          })),
        },
        rules: {
          create: rules.map((rl: { text: string; sortOrder?: number }) => ({
            text: rl.text,
            sortOrder: rl.sortOrder ?? 0,
          })),
        },
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        amenities: { orderBy: { sortOrder: 'asc' } },
        highlights: { orderBy: { sortOrder: 'asc' } },
        rules: { orderBy: { sortOrder: 'asc' } },
      },
    })

    // Log activity
    if (sessionUser) {
      const action = published ? 'publish' as const : 'create' as const
      await logActivity({
        userId: sessionUser.id,
        action,
        entity: 'cabin',
        entityId: cabin.id,
        details: JSON.stringify({ name: cabin.name }),
      })
    }

    return NextResponse.json({ cabin }, { status: 201 })
  } catch (error) {
    console.error('Cabin create error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
