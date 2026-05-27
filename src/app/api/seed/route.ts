import { NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed'

export async function POST() {
  try {
    const result = await seedDatabase()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Error al ejecutar la semilla de la base de datos', details: String(error) },
      { status: 500 }
    )
  }
}
