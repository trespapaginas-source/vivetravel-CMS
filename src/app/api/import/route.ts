import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slugify } from '@/lib/sluggify'

interface ImportData {
  plans?: Array<Record<string, unknown>>
  cabins?: Array<Record<string, unknown>>
  testimonials?: Array<Record<string, unknown>>
  categories?: Array<Record<string, unknown>>
  siteContent?: Array<Record<string, unknown>>
}

interface ImportResult {
  plans: { created: number; updated: number; errors: number }
  cabins: { created: number; updated: number; errors: number }
  testimonials: { created: number; updated: number; errors: number }
  categories: { created: number; updated: number; errors: number }
  siteContent: { created: number; updated: number; errors: number }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, entities } = body as {
      data: ImportData
      entities: string[]
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Datos de importación inválidos' },
        { status: 400 }
      )
    }

    if (!entities || !Array.isArray(entities) || entities.length === 0) {
      return NextResponse.json(
        { error: 'Selecciona al menos una entidad para importar' },
        { status: 400 }
      )
    }

    const result: ImportResult = {
      plans: { created: 0, updated: 0, errors: 0 },
      cabins: { created: 0, updated: 0, errors: 0 },
      testimonials: { created: 0, updated: 0, errors: 0 },
      categories: { created: 0, updated: 0, errors: 0 },
      siteContent: { created: 0, updated: 0, errors: 0 },
    }

    // Import Categories first (plans reference them)
    if (entities.includes('categories') && Array.isArray(data.categories)) {
      for (const cat of data.categories) {
        try {
          const name = cat.name as string
          if (!name) { result.categories.errors++; continue }

          const catSlug = (cat.slug as string) || slugify(name)
          const existing = await db.planCategory.findUnique({ where: { slug: catSlug } })

          if (existing) {
            await db.planCategory.update({
              where: { slug: catSlug },
              data: {
                name,
                color: (cat.color as string) || existing.color,
                icon: (cat.icon as string | null) ?? existing.icon,
                sortOrder: (cat.sortOrder as number) ?? existing.sortOrder,
              },
            })
            result.categories.updated++
          } else {
            await db.planCategory.create({
              data: {
                name,
                slug: catSlug,
                color: (cat.color as string) || '#0E7490',
                icon: (cat.icon as string) || null,
                sortOrder: (cat.sortOrder as number) ?? 0,
              },
            })
            result.categories.created++
          }
        } catch {
          result.categories.errors++
        }
      }
    }

    // Import Plans (with nested: images, includes, excludes, highlights)
    if (entities.includes('plans') && Array.isArray(data.plans)) {
      for (const plan of data.plans) {
        try {
          const name = plan.name as string
          if (!name) { result.plans.errors++; continue }

          const planSlug = (plan.slug as string) || slugify(name)
          const existing = await db.tourPlan.findUnique({ where: { slug: planSlug } })

          if (existing) {
            // Update existing plan
            await db.tourPlan.update({
              where: { slug: planSlug },
              data: {
                name,
                shortDescription: (plan.shortDescription as string | null) ?? existing.shortDescription,
                fullDescription: (plan.fullDescription as string | null) ?? existing.fullDescription,
                price: (plan.price as number) ?? existing.price,
                priceRange: (plan.priceRange as string | null) ?? existing.priceRange,
                duration: (plan.duration as string | null) ?? existing.duration,
                location: (plan.location as string | null) ?? existing.location,
                categoryId: (plan.categoryId as string | null) ?? existing.categoryId,
                difficulty: (plan.difficulty as string | null) ?? existing.difficulty,
                schedule: (plan.schedule as string | null) ?? existing.schedule,
                meetingPoint: (plan.meetingPoint as string | null) ?? existing.meetingPoint,
                rating: (plan.rating as number) ?? existing.rating,
                reviewCount: (plan.reviewCount as number) ?? existing.reviewCount,
                maxGuests: (plan.maxGuests as number | null) ?? existing.maxGuests,
                published: (plan.published as boolean) ?? existing.published,
                sortOrder: (plan.sortOrder as number) ?? existing.sortOrder,
              },
            })
            result.plans.updated++
          } else {
            // Create new plan with nested data
            const images = Array.isArray(plan.images) ? plan.images : []
            const includes = Array.isArray(plan.includes) ? plan.includes : []
            const excludes = Array.isArray(plan.excludes) ? plan.excludes : []
            const highlights = Array.isArray(plan.highlights) ? plan.highlights : []

            await db.tourPlan.create({
              data: {
                name,
                slug: planSlug,
                shortDescription: (plan.shortDescription as string) || null,
                fullDescription: (plan.fullDescription as string) || null,
                price: (plan.price as number) ?? 0,
                priceRange: (plan.priceRange as string) || null,
                duration: (plan.duration as string) || null,
                location: (plan.location as string) || null,
                categoryId: (plan.categoryId as string) || null,
                difficulty: (plan.difficulty as string) || null,
                schedule: (plan.schedule as string) || null,
                meetingPoint: (plan.meetingPoint as string) || null,
                rating: (plan.rating as number) ?? 0,
                reviewCount: (plan.reviewCount as number) ?? 0,
                maxGuests: (plan.maxGuests as number) || null,
                published: (plan.published as boolean) ?? false,
                sortOrder: (plan.sortOrder as number) ?? 0,
                images: {
                  create: images.map((img: Record<string, unknown>) => ({
                    url: (img.url as string) || '',
                    caption: (img.caption as string) || null,
                    source: (img.source as string) || 'upload',
                    sortOrder: (img.sortOrder as number) ?? 0,
                  })),
                },
                includes: {
                  create: includes.map((inc: Record<string, unknown>) => ({
                    text: (inc.text as string) || '',
                    sortOrder: (inc.sortOrder as number) ?? 0,
                  })),
                },
                excludes: {
                  create: excludes.map((exc: Record<string, unknown>) => ({
                    text: (exc.text as string) || '',
                    sortOrder: (exc.sortOrder as number) ?? 0,
                  })),
                },
                highlights: {
                  create: highlights.map((hl: Record<string, unknown>) => ({
                    text: (hl.text as string) || '',
                    sortOrder: (hl.sortOrder as number) ?? 0,
                  })),
                },
              },
            })
            result.plans.created++
          }
        } catch {
          result.plans.errors++
        }
      }
    }

    // Import Cabins (with nested: images, amenities, highlights, rules)
    if (entities.includes('cabins') && Array.isArray(data.cabins)) {
      for (const cabin of data.cabins) {
        try {
          const name = cabin.name as string
          if (!name) { result.cabins.errors++; continue }

          const cabinSlug = (cabin.slug as string) || slugify(name)
          const existing = await db.cabin.findUnique({ where: { slug: cabinSlug } })

          if (existing) {
            // Update existing cabin
            await db.cabin.update({
              where: { slug: cabinSlug },
              data: {
                name,
                shortDescription: (cabin.shortDescription as string | null) ?? existing.shortDescription,
                fullDescription: (cabin.fullDescription as string | null) ?? existing.fullDescription,
                pricePerNight: (cabin.pricePerNight as number) ?? existing.pricePerNight,
                priceRange: (cabin.priceRange as string | null) ?? existing.priceRange,
                location: (cabin.location as string | null) ?? existing.location,
                address: (cabin.address as string | null) ?? existing.address,
                capacity: (cabin.capacity as number | null) ?? existing.capacity,
                bedrooms: (cabin.bedrooms as number | null) ?? existing.bedrooms,
                bathrooms: (cabin.bathrooms as number | null) ?? existing.bathrooms,
                lat: (cabin.lat as number | null) ?? existing.lat,
                lng: (cabin.lng as number | null) ?? existing.lng,
                checkIn: (cabin.checkIn as string) || existing.checkIn,
                checkOut: (cabin.checkOut as string) || existing.checkOut,
                cancellationPolicy: (cabin.cancellationPolicy as string | null) ?? existing.cancellationPolicy,
                rating: (cabin.rating as number) ?? existing.rating,
                reviewCount: (cabin.reviewCount as number) ?? existing.reviewCount,
                published: (cabin.published as boolean) ?? existing.published,
                sortOrder: (cabin.sortOrder as number) ?? existing.sortOrder,
              },
            })
            result.cabins.updated++
          } else {
            // Create new cabin with nested data
            const images = Array.isArray(cabin.images) ? cabin.images : []
            const amenities = Array.isArray(cabin.amenities) ? cabin.amenities : []
            const cabinHighlights = Array.isArray(cabin.highlights) ? cabin.highlights : []
            const rules = Array.isArray(cabin.rules) ? cabin.rules : []

            await db.cabin.create({
              data: {
                name,
                slug: cabinSlug,
                shortDescription: (cabin.shortDescription as string) || null,
                fullDescription: (cabin.fullDescription as string) || null,
                pricePerNight: (cabin.pricePerNight as number) ?? 0,
                priceRange: (cabin.priceRange as string) || null,
                location: (cabin.location as string) || null,
                address: (cabin.address as string) || null,
                capacity: (cabin.capacity as number) || null,
                bedrooms: (cabin.bedrooms as number) || null,
                bathrooms: (cabin.bathrooms as number) || null,
                lat: (cabin.lat as number) || null,
                lng: (cabin.lng as number) || null,
                checkIn: (cabin.checkIn as string) || '3:00 PM',
                checkOut: (cabin.checkOut as string) || '11:00 AM',
                cancellationPolicy: (cabin.cancellationPolicy as string) || null,
                rating: (cabin.rating as number) ?? 0,
                reviewCount: (cabin.reviewCount as number) ?? 0,
                published: (cabin.published as boolean) ?? false,
                sortOrder: (cabin.sortOrder as number) ?? 0,
                images: {
                  create: images.map((img: Record<string, unknown>) => ({
                    url: (img.url as string) || '',
                    caption: (img.caption as string) || null,
                    source: (img.source as string) || 'upload',
                    sortOrder: (img.sortOrder as number) ?? 0,
                  })),
                },
                amenities: {
                  create: amenities.map((am: Record<string, unknown>) => ({
                    text: (am.text as string) || '',
                    sortOrder: (am.sortOrder as number) ?? 0,
                  })),
                },
                highlights: {
                  create: cabinHighlights.map((hl: Record<string, unknown>) => ({
                    text: (hl.text as string) || '',
                    sortOrder: (hl.sortOrder as number) ?? 0,
                  })),
                },
                rules: {
                  create: rules.map((rl: Record<string, unknown>) => ({
                    text: (rl.text as string) || '',
                    sortOrder: (rl.sortOrder as number) ?? 0,
                  })),
                },
              },
            })
            result.cabins.created++
          }
        } catch {
          result.cabins.errors++
        }
      }
    }

    // Import Testimonials
    if (entities.includes('testimonials') && Array.isArray(data.testimonials)) {
      for (const testimonial of data.testimonials) {
        try {
          const name = testimonial.name as string
          const text = testimonial.text as string
          if (!name || !text) { result.testimonials.errors++; continue }

          // Testimonials don't have a unique slug, so always create new ones
          // But check if there's an existing one with same name and text
          const existing = await db.testimonial.findFirst({
            where: { name, text },
          })

          if (existing) {
            await db.testimonial.update({
              where: { id: existing.id },
              data: {
                avatar: (testimonial.avatar as string | null) ?? existing.avatar,
                location: (testimonial.location as string | null) ?? existing.location,
                rating: (testimonial.rating as number) ?? existing.rating,
                tripName: (testimonial.tripName as string | null) ?? existing.tripName,
                planId: (testimonial.planId as string | null) ?? existing.planId,
                published: (testimonial.published as boolean) ?? existing.published,
                sortOrder: (testimonial.sortOrder as number) ?? existing.sortOrder,
              },
            })
            result.testimonials.updated++
          } else {
            await db.testimonial.create({
              data: {
                name,
                text,
                avatar: (testimonial.avatar as string) || null,
                location: (testimonial.location as string) || null,
                rating: (testimonial.rating as number) ?? 5,
                tripName: (testimonial.tripName as string) || null,
                planId: (testimonial.planId as string) || null,
                published: (testimonial.published as boolean) ?? false,
                sortOrder: (testimonial.sortOrder as number) ?? 0,
              },
            })
            result.testimonials.created++
          }
        } catch {
          result.testimonials.errors++
        }
      }
    }

    // Import Site Content (upsert by sectionKey)
    if (entities.includes('siteContent') && Array.isArray(data.siteContent)) {
      for (const section of data.siteContent) {
        try {
          const sectionKey = section.sectionKey as string
          const content = section.content
          if (!sectionKey || content === undefined) { result.siteContent.errors++; continue }

          const existingSection = await db.siteContent.findUnique({ where: { sectionKey } })

          await db.siteContent.upsert({
            where: { sectionKey },
            update: { content: content as object },
            create: {
              sectionKey,
              content: content as object,
            },
          })

          if (existingSection) {
            result.siteContent.updated++
          } else {
            result.siteContent.created++
          }
        } catch {
          result.siteContent.errors++
        }
      }
    }

    // Compute totals
    const totals = {
      created: result.plans.created + result.cabins.created + result.testimonials.created + result.categories.created + result.siteContent.created,
      updated: result.plans.updated + result.cabins.updated + result.testimonials.updated + result.categories.updated + result.siteContent.updated,
      errors: result.plans.errors + result.cabins.errors + result.testimonials.errors + result.categories.errors + result.siteContent.errors,
    }

    return NextResponse.json({ result, totals })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor durante la importación' },
      { status: 500 }
    )
  }
}
