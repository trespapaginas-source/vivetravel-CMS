import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slugify } from '@/lib/sluggify'

export async function GET() {
  try {
    const categories = await db.planCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { plans: true } },
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Categories list error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, slug, color, icon, sortOrder } = body

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const categorySlug = slug || slugify(name)

    // Check for duplicate slug
    const existing = await db.planCategory.findUnique({ where: { slug: categorySlug } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una categoría con ese slug' },
        { status: 409 }
      )
    }

    const category = await db.planCategory.create({
      data: {
        name,
        slug: categorySlug,
        color: color || '#0E7490',
        icon: icon || null,
        sortOrder: sortOrder ?? 0,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Category create error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
