import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    // Users can only view their own profile (unless admin)
    if (id !== user.id && user.role !== 'administrador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const profile = await db.profile.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Profile get error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    // Users can only update their own profile (unless admin)
    if (id !== user.id && user.role !== 'administrador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { fullName, currentPassword, newPassword, role } = body

    const existing = await db.profile.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    // Update fullName if provided
    if (fullName !== undefined) {
      updateData.fullName = fullName
    }

    // Update role if provided (admin only)
    if (role !== undefined && user.role === 'administrador') {
      if (!['administrador', 'editor'].includes(role)) {
        return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
      }
      updateData.role = role
    }

    // Handle password change
    if (currentPassword && newPassword) {
      // Verify current password (simple comparison since we store plain text in this demo)
      if (currentPassword !== existing.password) {
        return NextResponse.json(
          { error: 'La contraseña actual es incorrecta' },
          { status: 400 }
        )
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        )
      }
      updateData.password = newPassword
    }

    // Only update if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    const updated = await db.profile.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ profile: updated })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
