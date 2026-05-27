import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { slugify } from '@/lib/sluggify'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const category = await db.planCategory.findUnique({
      where: { id },
      include: {
        plans: true,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Category get error:', error)
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
    const { id } = await params
    const body = await request.json()
    const { name, slug, color, icon, sortOrder } = body

    const existing = await db.planCategory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    const categorySlug = slug || (name ? slugify(name) : existing.slug)

    // Check for duplicate slug (excluding current)
    if (categorySlug !== existing.slug) {
      const duplicate = await db.planCategory.findUnique({ where: { slug: categorySlug } })
      if (duplicate) {
        return NextResponse.json(
          { error: 'Ya existe una categoría con ese slug' },
          { status: 409 }
        )
      }
    }

    const category = await db.planCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        slug: categorySlug,
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Category update error:', error)
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
    const { id } = await params

    const existing = await db.planCategory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }

    await db.planCategory.delete({ where: { id } })

    return NextResponse.json({ message: 'Categoría eliminada' })
  } catch (error) {
    console.error('Category delete error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
