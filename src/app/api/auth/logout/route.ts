import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth'

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Sesión cerrada exitosamente' })
    response.headers.set('Set-Cookie', clearSessionCookie())
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
