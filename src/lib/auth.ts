import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export interface SessionUser {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: string
}

const SESSION_COOKIE = 'vive_session'

/**
 * Extract user ID from cookie, look up Profile, return profile or null
 */
export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = parseCookies(cookieHeader)
    const userId = cookies[SESSION_COOKIE]

    if (!userId) return null

    const profile = await db.profile.findUnique({ where: { id: userId } })
    if (!profile) return null

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      role: profile.role,
    }
  } catch {
    return null
  }
}

/**
 * Check if the current session user is an admin
 */
export async function isAdmin(request: Request): Promise<boolean> {
  const user = await getSessionUser(request)
  return user?.role === 'administrador'
}

/**
 * Require authentication - returns user or null
 */
export async function requireAuth(request: Request): Promise<SessionUser | null> {
  return getSessionUser(request)
}

/**
 * Create session cookie header value
 */
export function createSessionCookie(userId: string): string {
  return `${SESSION_COOKIE}=${userId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
}

/**
 * Create logout cookie header value (expires immediately)
 */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

/**
 * Parse cookies from a cookie header string
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.split('=')
    if (name && rest.length > 0) {
      cookies[name.trim()] = rest.join('=').trim()
    }
  })
  return cookies
}
