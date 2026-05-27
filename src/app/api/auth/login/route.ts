import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSessionCookie } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const profile = await db.profile.findUnique({ where: { email } })

    if (!profile || profile.password !== password) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const user = {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      role: profile.role,
    }

    const response = NextResponse.json({
      user,
      message: 'Inicio de sesión exitoso',
    })

    response.headers.set('Set-Cookie', createSessionCookie(profile.id))

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
