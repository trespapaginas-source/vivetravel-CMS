import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const sections = await db.siteContent.findMany({
      orderBy: { sectionKey: 'asc' },
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Site content list error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sectionKey, content } = body

    if (!sectionKey || content === undefined) {
      return NextResponse.json(
        { error: 'sectionKey y content son requeridos' },
        { status: 400 }
      )
    }

    // Upsert: create or update the section
    const section = await db.siteContent.upsert({
      where: { sectionKey },
      update: { content },
      create: { sectionKey, content },
    })

    return NextResponse.json({ section }, { status: 201 })
  } catch (error) {
    console.error('Site content create/update error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
