import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request)

    if (!user || user.role !== 'administrador') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const profiles = await db.profile.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Profiles list error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSessionUser(request)

    if (!user || user.role !== 'administrador') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, role } = body

    if (!id || !role) {
      return NextResponse.json(
        { error: 'ID y rol son requeridos' },
        { status: 400 }
      )
    }

    if (!['administrador', 'editor'].includes(role)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      )
    }

    const updated = await db.profile.update({
      where: { id },
      data: { role },
    })

    return NextResponse.json({ profile: updated })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
