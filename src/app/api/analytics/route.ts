import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Fetch all data in parallel
    const [
      sections,
      plans,
      categories,
      testimonials,
      cabins,
      messages,
    ] = await Promise.all([
      db.siteContent.findMany(),
      db.tourPlan.findMany({
        include: { category: true },
      }),
      db.planCategory.findMany({
        include: { _count: { select: { plans: true } } },
      }),
      db.testimonial.findMany(),
      db.cabin.findMany(),
      db.contactMessage.findMany(),
    ])

    // 1. Content completion percentage
    const requiredSections = ['hero', 'featuredPlans', 'carousel', 'groupTrips', 'customTrips', 'contact', 'policies', 'homeConfig', 'campaign', 'seo']
    const existingKeys = new Set(sections.map((s) => s.sectionKey))
    const sectionsWithData = sections.filter((s) => {
      const content = s.content as Record<string, unknown>
      if (!content) return false
      return Object.values(content).some((v) => v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0))
    })
    const contentCompletion = Math.round((sectionsWithData.length / requiredSections.length) * 100)

    // 2. Plans by difficulty distribution
    const difficultyMap: Record<string, number> = {}
    plans.forEach((p) => {
      const d = p.difficulty || 'Sin asignar'
      difficultyMap[d] = (difficultyMap[d] || 0) + 1
    })

    // 3. Average price range
    const publishedPlans = plans.filter((p) => p.published)
    const avgPrice = publishedPlans.length > 0
      ? Math.round(publishedPlans.reduce((sum, p) => sum + p.price, 0) / publishedPlans.length)
      : 0
    const minPrice = publishedPlans.length > 0 ? Math.min(...publishedPlans.map((p) => p.price)) : 0
    const maxPrice = publishedPlans.length > 0 ? Math.max(...publishedPlans.map((p) => p.price)) : 0

    // 4. Most popular plan (by rating * reviewCount)
    const planPopularity = plans.map((p) => ({
      id: p.id,
      name: p.name,
      rating: p.rating,
      reviewCount: p.reviewCount,
      popularityScore: p.rating * p.reviewCount,
      price: p.price,
      published: p.published,
      category: p.category?.name || null,
      categoryColor: p.category?.color || null,
    }))
    planPopularity.sort((a, b) => b.popularityScore - a.popularityScore)

    // 5. Additional stats
    const totalTestimonials = testimonials.length
    const avgRating = testimonials.length > 0
      ? Math.round((testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length) * 10) / 10
      : 0
    const totalMessages = messages.length
    const unreadMessages = messages.filter((m) => !m.isRead).length
    const repliedMessages = messages.filter((m) => m.repliedAt).length
    const totalCabins = cabins.length
    const publishedCabins = cabins.filter((c) => c.published).length

    // 6. Plans by category distribution
    const categoryDistribution = categories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      planCount: c._count.plans,
    }))

    // 7. Missing content sections
    const missingSections = requiredSections.filter((key) => !existingKeys.has(key))

    return NextResponse.json({
      contentCompletion,
      difficultyDistribution: difficultyMap,
      priceStats: { avgPrice, minPrice, maxPrice },
      mostPopularPlan: planPopularity[0] || null,
      topPlans: planPopularity.slice(0, 5),
      additionalStats: {
        totalTestimonials,
        avgRating,
        totalMessages,
        unreadMessages,
        repliedMessages,
        totalCabins,
        publishedCabins,
      },
      categoryDistribution,
      missingSections,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
