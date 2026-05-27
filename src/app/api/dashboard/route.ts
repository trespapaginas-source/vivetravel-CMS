import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [
      totalPlansPublished,
      totalPlansDraft,
      totalCabins,
      unreadMessages,
      testimonials,
    ] = await Promise.all([
      db.tourPlan.count({ where: { published: true } }),
      db.tourPlan.count({ where: { published: false } }),
      db.cabin.count(),
      db.contactMessage.count({ where: { isRead: false } }),
      db.testimonial.findMany({
        where: { published: true },
        select: { rating: true },
      }),
    ])

    const avgTestimonialRating =
      testimonials.length > 0
        ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
        : 0

    return NextResponse.json({
      totalPlansPublished,
      totalPlansDraft,
      totalCabins,
      unreadMessages,
      avgTestimonialRating: Math.round(avgTestimonialRating * 10) / 10,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
