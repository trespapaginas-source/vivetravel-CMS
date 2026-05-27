# VIVE TRAVEL - ESPECIFICACIÓN MAESTRA PARA CONSTRUCCIÓN DE CMS
Este documento sirve como la **única fuente de verdad** para el desarrollo del Sistema de Gestión de Contenidos (CMS) independiente para la agencia **Vive Travel**.
Está diseñado para ser interpretado y ejecutado por un agente de desarrollo de IA (Kimi 5.1).

---

## 1. ARQUITECTURA CONCEPTUAL DEL SISTEMA

El CMS se construirá como una aplicación web **completamente independiente** del frontend público actual. Ambas aplicaciones se integrarán a través de una base de datos única y compartida en **Supabase**.

```
   [ CMS Independiente ]                   [ Frontend Público (Next.js SPA) ]
(Admin Dashboard en Vite/React)               (Sitio Web de Agencia X)
           │                                             │
           └───────────────┐             ┌───────────────┘
                           ▼             ▼
                     [ Supabase Database (PostgreSQL) ]
                     [    Supabase Storage (Images)   ]
                     [     Supabase Auth (Profiles)   ]
```

### Principios de Diseño del CMS
1. **Conexión Directa a Supabase:** El CMS no requiere un backend intermedio personalizado. Utiliza directamente la SDK de Supabase (`@supabase/supabase-js`) para interactuar con las tablas, la autenticación y el almacenamiento de imágenes (Storage), haciendo uso de las políticas de seguridad en base de datos (RLS).
2. **Control de Acceso basado en Roles (RBAC):** La seguridad reside en la tabla `public.profiles` y las políticas RLS de Supabase. El CMS debe restringir vistas y acciones según el rol del usuario actual:
   * **`administrador`**: Acceso completo (lectura, creación, modificación y eliminación) sobre todos los módulos y gestión de usuarios.
   * **`editor`**: Lectura y modificación de datos, pero **bloqueado** para eliminar registros (planes, cabañas, mensajes) y sin acceso a la gestión de usuarios.
3. **Validación Estricta de Esquemas:** Dado que el frontend público consume textos y configuraciones dinámicas desde campos de tipo `JSONB` en Supabase, el CMS debe estructurar los formularios de edición de forma exacta para no corromper la interfaz del sitio web.

---

## 2. ESQUEMA DE BASE DE DATOS Y ENTIDADES (SUPABASE)

La base de datos contiene tablas normalizadas y subtablas relacionadas para imágenes, comodidades e itinerarios. A continuación se detallan las entidades que el CMS debe gestionar.

### 2.1 Tabla: `profiles` (Usuarios del Sistema)
Extiende el sistema de autenticación de Supabase (`auth.users`).
* **Campos:**
  * `id` (UUID, Primary Key, referencias a `auth.users(id)`).
  * `email` (TEXT, no nulo).
  * `full_name` (TEXT).
  * `avatar_url` (TEXT).
  * `role` (ENUM `app_role`: `'administrador'`, `'editor'`).
  * `created_at` / `updated_at` (TIMESTAMPTZ).
* **Reglas de Negocio en CMS:**
  * Al iniciar sesión por primera vez, un trigger en base de datos creará el perfil automáticamente como `'editor'`.
  * La sección de gestión de usuarios (solo visible para `administrador`) permite cambiar el `role` de otros perfiles.

### 2.2 Tabla: `plan_categories` (Categorías de Planes)
* **Campos:**
  * `id` (UUID, Primary Key).
  * `name` (TEXT, único) - Ej: "Playa", "Naturaleza", "Aventura".
  * `slug` (TEXT, único, generado automáticamente a partir del nombre).
  * `color` (TEXT, por defecto `#0E7490`).
  * `icon` (TEXT).
  * `sort_order` (INT, ordenamiento).

### 2.3 Entidad Principal: `tour_plans` (Planes Turísticos)
Representa las experiencias y excursiones comercializadas por la agencia.
* **Tabla Principal: `tour_plans`**
  * `id` (UUID, Primary Key).
  * `name` (TEXT) - Ej: "Plan Manglar Mallorquín".
  * `slug` (TEXT, único, URL amigable).
  * `short_description` (TEXT) - Resumen para tarjetas del catálogo.
  * `full_description` (TEXT) - Contenido detallado del plan.
  * `price` (INT) - Valor base en COP (Ej: `85000`).
  * `price_range` (TEXT) - Texto informativo de rango de precio (Ej: `"$85.000 - $120.000 COP"`).
  * `duration` (TEXT) - Duración estimada (Ej: `"Medio día (4 horas)"` o `"4 días, 3 noches"`).
  * `location` (TEXT) - Ubicación física (Ej: `"Santa Marta, Colombia"`).
  * `category_id` (UUID, Foreign Key a `plan_categories`).
  * `difficulty` (TEXT) - Selector: `"Fácil"`, `"Moderado"`, `"Avanzado"`.
  * `schedule` (TEXT) - Horarios de salida (Ej: `"7:00 AM - 11:00 AM"`).
  * `meeting_point` (TEXT) - Punto de encuentro inicial.
  * `rating` (NUMERIC) - Calificación promedio (0.0 a 5.0).
  * `review_count` (INT) - Cantidad de valoraciones.
  * `max_guests` (INT) - Capacidad máxima por grupo.
  * `published` (BOOLEAN) - Visibilidad en el sitio web público.
  * `sort_order` (INT) - Controla el orden de aparición.
* **Subtablas Relacionadas (Gestión Anidada en Formulario):**
  * **`plan_images`** (Imágenes del Plan):
    * `url` (TEXT) - URL final pública de la imagen (de Storage o externa).
    * `caption` (TEXT) - Texto alternativo o pie de foto.
    * `storage_path` (TEXT, opcional) - Ruta interna del bucket en Supabase Storage (para eliminarla si el usuario la borra).
    * `source` (ENUM: `'external'`, `'upload'`).
    * `sort_order` (INT).
  * **`plan_includes`** (Qué incluye el plan):
    * `text` (TEXT) - Ej: `"Guía profesional bilingüe"`.
    * `sort_order` (INT).
  * **`plan_excludes`** (Qué NO incluye):
    * `text` (TEXT) - Ej: `"Gastos personales"`.
    * `sort_order` (INT).
  * **`plan_highlights`** (Destacados / Puntos fuertes):
    * `text` (TEXT) - Ej: `"Avistamiento de aves y fauna silvestre"`.
    * `sort_order` (INT).

### 2.4 Entidad Principal: `cabins` (Alojamientos / Cabañas)
Representa los hospedajes vacacionales frente al mar o campestres.
* **Tabla Principal: `cabins`**
  * `id` (UUID, Primary Key).
  * `name` (TEXT).
  * `slug` (TEXT, único).
  * `short_description` (TEXT).
  * `full_description` (TEXT).
  * `price_per_night` (INT) - Precio en COP por noche.
  * `price_range` (TEXT).
  * `location` (TEXT) - Ej: `"Santa Verónica, Atlántico"`.
  * `address` (TEXT).
  * `capacity` (INT) - Número máximo de personas permitidas.
  * `bedrooms` (INT) - Cantidad de habitaciones.
  * `bathrooms` (INT) - Cantidad de baños.
  * `lat` (NUMERIC 9,6) / `lng` (NUMERIC 9,6) - Coordenadas geográficas para mapas.
  * `check_in` (TEXT, por defecto `"3:00 PM"`).
  * `check_out` (TEXT, por defecto `"11:00 AM"`).
  * `cancellation_policy` (TEXT) - Políticas específicas de la cabaña.
  * `rating` (NUMERIC) / `review_count` (INT).
  * `published` (BOOLEAN).
  * `sort_order` (INT).
* **Subtablas Relacionadas (Gestión Anidada en Formulario):**
  * **`cabin_images`** (Imágenes de la cabaña):
    * `url`, `caption`, `storage_path`, `source`, `sort_order`.
  * **`cabin_amenities`** (Servicios/Comodidades):
    * `text` (TEXT) - Ej: `"Piscina privada"`, `"WiFi gratuito"`, `"Cocina equipada"`.
    * `sort_order` (INT).
  * **`cabin_highlights`** (Características destacadas):
    * `text` (TEXT) - Ej: `"Frente al mar"`, `"Atardeceres únicos"`.
    * `sort_order` (INT).
  * **`cabin_rules`** (Normas de la casa):
    * `text` (TEXT) - Ej: `"No se permiten fiestas"`.
    * `sort_order` (INT).

### 2.5 Tabla: `testimonials` (Testimonios)
* **Campos:**
  * `id` (UUID, Primary Key).
  * `name` (TEXT) - Nombre del viajero.
  * `avatar` (TEXT) - Iniciales o iniciales con color.
  * `location` (TEXT) - Procedencia (Ej: `"Bogotá, Colombia"`).
  * `text` (TEXT) - Mensaje o testimonio.
  * `rating` (NUMERIC) - Estrellas (1 a 5).
  * `trip_name` (TEXT) - Nombre de la experiencia que realizó.
  * `plan_id` (UUID, Foreign Key opcional a `tour_plans`).
  * `published` (BOOLEAN) - El administrador decide si se publica en el carrusel de opiniones.
  * `sort_order` (INT).

### 2.6 Tablas de Media General: `hero_images` y `trip_images`
Utilizadas para actualizar dinámicamente las imágenes globales de la página de inicio.
* **`hero_images`** (Imágenes del carrusel inicial en Hero).
* **`trip_images`** (Galería de fotos de viajes grupales realizados).
* **Campos comunes:** `id` (UUID), `url` (TEXT), `caption` (TEXT), `storage_path` (TEXT), `source` (ENUM), `sort_order` (INT).

### 2.7 Tabla: `contact_messages` (Buzón de Contacto)
Recibe las consultas enviadas por el formulario web público.
* **Campos:**
  * `id` (UUID, Primary Key).
  * `name`, `email` (TEXT).
  * `phone` (TEXT).
  * `subject` (TEXT).
  * `message` (TEXT).
  * `contact_method` (TEXT) - Ej: `'whatsapp'`, `'email'`.
  * `is_read` (BOOLEAN, por defecto `false`).
  * `created_at` (TIMESTAMPTZ).
* **Reglas de Negocio en CMS:**
  * Los mensajes son de **solo lectura** para los usuarios.
  * Los editores/admins pueden marcar mensajes como leídos/no leídos.
  * Solo los usuarios con rol `administrador` pueden eliminar mensajes físicos.

---

## 3. ESQUEMA DE CONTENIDO EDITABLE EN `site_content` (JSONB)

La tabla `site_content` almacena los textos fijos, banners promocionales y configuraciones generales del sitio web público en formato JSON. El CMS debe proveer un módulo visual para editar estas secciones, asegurando que el JSON guardado coincida con los siguientes esquemas.

### 3.1 Esquema `hero` (Sección Hero Principal)
* **Llave en base de datos:** `section_key = 'hero'`
* **Esquema del JSON:**
  ```json
  {
    "brandLabel": "string",
    "title": "string",
    "titleHighlight": "string",
    "subtitle": "string",
    "ctaPlans": "string",
    "ctaCabins": "string"
  }
  ```

### 3.2 Esquema `featuredPlans` (Textos de la sección "Destacados")
* **Llave en base de datos:** `section_key = 'featuredPlans'`
* **Esquema del JSON:**
  ```json
  {
    "title": "string",
    "subtitle": "string",
    "priceLabel": "string",
    "viewMore": "string",
    "viewAll": "string"
  }
  ```

### 3.3 Esquema `carousel` (Estadísticas y testimonios de la agencia)
* **Llave en base de datos:** `section_key = 'carousel'`
* **Esquema del JSON:**
  ```json
  {
    "title": "string",
    "subtitle": "string",
    "brandHover": "string",
    "stats": [
      { "value": "string", "label": "string" }
    ]
  }
  ```

### 3.4 Esquema `groupTrips` (Sección Viajes en Grupo)
* **Llave en base de datos:** `section_key = 'groupTrips'`
* **Esquema del JSON:**
  ```json
  {
    "label": "string",
    "title": "string",
    "titleHighlight": "string",
    "description": "string",
    "ctaQuote": "string",
    "ctaPlans": "string",
    "benefits": [
      { "title": "string", "description": "string" }
    ],
    "stats": [
      { "value": "string", "label": "string" }
    ]
  }
  ```

### 3.5 Esquema `customTrips` (Sección Viajes a la Medida)
* **Llave en base de datos:** `section_key = 'customTrips'`
* **Esquema del JSON:**
  ```json
  {
    "label": "string",
    "title": "string",
    "titleHighlight": "string",
    "description": "string",
    "benefits": [
      { "title": "string", "description": "string" }
    ],
    "ctaTitle": "string",
    "ctaDescription": "string",
    "ctaContact": "string",
    "ctaPlans": "string"
  }
  ```

### 3.6 Esquema `contact` (Información de Contacto y Redes)
* **Llave en base de datos:** `section_key = 'contact'`
* **Esquema del JSON:**
  ```json
  {
    "badge": "string",
    "title": "string",
    "titleHighlight": "string",
    "subtitle": "string",
    "formTitle": "string",
    "whatsapp": "string",
    "email": "string",
    "location": "string",
    "hours": "string",
    "instagramUrl": "string",
    "facebookUrl": "string",
    "whatsappUrl": "string",
    "socialLabel": "string",
    "chatTitle": "string",
    "chatDescription": "string",
    "chatButton": "string"
  }
  ```

### 3.7 Esquema `policies` (Políticas de Reserva y Cancelación)
* **Llave en base de datos:** `section_key = 'policies'`
* **Esquema del JSON:**
  ```json
  {
    "badge": "string",
    "title": "string",
    "titleHighlight": "string",
    "subtitle": "string",
    "bookingTitle": "string",
    "bookingSubtitle": "string",
    "cancellationTitle": "string",
    "cancellationSubtitle": "string",
    "footerText": "string",
    "lastUpdate": "string",
    "bookingPolicies": [
      { "id": "string", "title": "string", "content": "string (Markdown permitido)" }
    ],
    "cancellationPolicies": [
      { "id": "string", "title": "string", "content": "string (Markdown permitido)" }
    ]
  }
  ```

### 3.8 Esquemas Adicionales (Navbar, Footer, Configuración de Inicio, Campañas y SEO)
El CMS también debe permitir configurar el flujo global mediante:
* **Configuración del Home (`homeConfig`):**
  * Orden y estado de activación de las secciones en la página principal:
  ```json
  {
    "order": ["hero", "influencer", "plans", "gallery", "international", "stats", "groups", "custom", "testimonials", "team"],
    "active": {
      "hero": true,
      "influencer": true,
      "plans": true,
      "gallery": true,
      "international": true,
      "stats": true,
      "groups": true,
      "custom": true,
      "testimonials": true,
      "team": true
    }
  }
  ```
* **Campaña Promocional Activa (`campaign`):**
  * Control del Banner promocional superior:
  ```json
  {
    "active": "boolean",
    "bannerText": "string",
    "ctaText": "string",
    "ctaUrl": "string"
  }
  ```
* **Configuración SEO Global (`seo`):**
  ```json
  {
    "metaTitle": "string",
    "metaDescription": "string",
    "openGraphImage": "string"
  }
  ```

---

## 4. REQUERIMIENTOS FUNCIONALES DEL CMS (MÓDULOS DEL PANEL)

El CMS debe presentar un panel administrativo moderno (sidebar + navbar) con vistas responsive optimizadas para escritorio.

### Módulo 1: Autenticación y Perfil
* Login seguro utilizando Supabase Auth (correo electrónico y contraseña).
* Vista de perfil del usuario logueado con información del rol asignado.
* Botón de cierre de sesión.

### Módulo 2: Panel de Control (Dashboard)
* Panel con estadísticas básicas de rendimiento obtenidas en tiempo real:
  * Total de Planes publicados vs. borradores.
  * Total de Cabañas.
  * Contador de Mensajes de contacto nuevos (no leídos).
  * Valoración media general de testimonios.

### Módulo 3: Catálogo de Planes Turísticos (CRUD)
* Tabla de visualización con filtros por categoría, dificultad, y estado de publicación.
* Formulario de creación/edición con:
  * Inputs para datos básicos (Nombre, precio, duraciones, etc.).
  * Generación de Slug en tiempo real basado en el Nombre (con opción de edición manual).
  * Gestor de listas dinámicas para: Qué Incluye, Qué No Incluye y Destacados (permite añadir, reordenar y eliminar ítems textuales).
  * Cargador de imágenes integrado: Subida directa al bucket de almacenamiento público `images` en Supabase Storage (en la carpeta `/plans`) y almacenamiento de las URLs resultantes en la tabla `plan_images`.

### Módulo 4: Catálogo de Alojamientos y Cabañas (CRUD)
* Tabla interactiva con opción de buscar cabañas y ordenamiento por relevancia.
* Formulario de creación/edición con:
  * Inputs de texto y selectores de números (Capacidad, habitaciones, baños, coordenadas lat/lng).
  * Gestor de listas dinámicas para: Comodidades, Reglas y Puntos Fuertes.
  * Subida de fotos directamente a la carpeta `/cabins` del bucket de Storage.

### Módulo 5: Gestor de Contenidos del Sitio (JSON Editor Visual)
* Formulario visual organizado por pestañas o secciones colapsables (Hero, Banner de Campaña, Viajes en Grupo, etc.).
* El usuario interactúa con inputs de texto normales, formularios dinámicos y checkboxes. El CMS se encarga de guardar y actualizar el objeto JSON estructurado directamente en la tabla `site_content` basándose en el `section_key` correspondiente.
* **CRITICAL:** Nunca se debe guardar un JSON roto o que no contenga los campos requeridos por el frontend público.

### Módulo 6: Buzón de Contacto (Bandeja de Entrada)
* Listado cronológico de consultas enviadas por el formulario web.
* Indicador visual de leídos/no leídos.
* Detalle del mensaje con enlace directo para responder vía WhatsApp o Correo electrónico.
* Botones para marcar como leído y eliminar (deshabilitado para el rol `editor`).

### Módulo 7: Moderación de Testimonios y Media General
* Aprobación/Rechazo de testimonios de usuarios (modificando columna `published`).
* Gestor de imágenes para el Hero dinámico de la web pública (subida a Storage y registro en la tabla `hero_images`).

---

## 5. DIRECTRICES DE IMPLEMENTACIÓN PARA EL AGENTE (KIMI 5.1)

Al construir el CMS, el agente debe seguir las siguientes pautas de ingeniería para garantizar un sistema profesional y compatible:

1. **Stack Tecnológico Recomendado:**
   * **Core:** React con TypeScript + Vite (ligero, rápido de construir y desplegar).
   * **Estilos:** Tailwind CSS para interfaz responsiva.
   * **Componentes:** Shadcn/ui (Radix Primitives) para tablas, diálogos de confirmación, toasts y formularios de configuración premium.
   * **Formularios:** React Hook Form + Zod para validación previa al envío de datos.
   * **Conexión de Datos:** `@supabase/supabase-js` para consultas directas y reactivas.
2. **Estrategia de Subida de Imágenes:**
   * Al subir un archivo, generar un nombre único utilizando UUID o marcas de tiempo para evitar colisiones en Supabase Storage.
   * Formatos permitidos: JPG, PNG, WebP. Límite de tamaño: 5MB.
   * Al eliminar un registro de plan o cabaña (o una imagen asociada), el CMS debe primero llamar a `supabase.storage.from('images').remove([storage_path])` para no dejar archivos basura en el almacenamiento.
3. **Manejo de Errores e Indicadores de Carga:**
   * Todas las peticiones deben tener skeletons o spinners de carga.
   * Usar Toasts informativos ante éxitos ("Plan creado exitosamente") y fallos ("Error al intentar borrar el registro").
4. **Seguridad y Rutas Protegidas:**
   * Validar el estado de autenticación en la carga de la aplicación. Si el usuario no está logueado, redirigir a `/login`.
   * Bloquear visualmente las acciones de eliminación o configuraciones avanzadas si el rol del perfil del usuario es `'editor'`.

---

## 6. ENLACE DE INTEGRACIÓN: BASE DE DATOS Y CONEXIÓN

El CMS utilizará la misma cadena de conexión y credenciales API del proyecto web para apuntar al mismo entorno de base de datos.
* Para conectar el CMS a la base de datos de producción, el agente de desarrollo deberá crear un archivo de configuración local `.env` que contenga:
  * `VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co`
  * `VITE_SUPABASE_ANON_KEY=[TU-CLAVE-ANON-PUBLICA]`
* El agente debe estructurar el cliente de Supabase importando y exportando una única instancia singleton:
  ```typescript
  import { createClient } from '@supabase/supabase-js';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
  ```
