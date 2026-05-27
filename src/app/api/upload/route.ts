import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No se ha proporcionado ningún archivo' },
        { status: 400 }
      )
    }

    // Validar tipo de archivo (MIME types permitidos)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato de archivo no permitido. Solo se aceptan JPG, PNG, WebP o GIF.' },
        { status: 400 }
      )
    }

    // Validar límite de tamaño (5MB de acuerdo al bucket 'images' en Supabase)
    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: 'El archivo supera el límite de 5MB permitido por el Storage de Supabase.' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Falta la configuración de Supabase en las variables de entorno.' },
        { status: 500 }
      )
    }

    // Generar un nombre de archivo único para evitar colisiones
    const fileExt = file.name.split('.').pop() || 'jpg'
    const randomId = Math.random().toString(36).substring(2, 9)
    const fileName = `${Date.now()}-${randomId}.${fileExt}`

    // Convertir el archivo a ArrayBuffer y luego a Buffer para el envío binario
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // URL del endpoint de almacenamiento de Supabase
    const uploadUrl = `${supabaseUrl}/storage/v1/object/images/${fileName}`

    // Enviar el archivo de forma binaria al Storage de Supabase
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': file.type,
      },
      body: buffer,
    })

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text()
      console.error('Detalles del error al subir a Supabase:', errorText)
      let errorMessage = 'Error al subir la imagen a Supabase Storage.'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorMessage
      } catch {}
      return NextResponse.json({ error: errorMessage }, { status: uploadRes.status })
    }

    // Generar la URL pública del archivo en el bucket público 'images'
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/images/${fileName}`

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Error en endpoint de subida de imágenes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar la subida' },
      { status: 500 }
    )
  }
}
