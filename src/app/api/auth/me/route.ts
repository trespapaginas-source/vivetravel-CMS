import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request)

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
