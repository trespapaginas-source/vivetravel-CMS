import { db } from '@/lib/db'

interface LogActivityParams {
  userId: string
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'duplicate'
  entity: 'plan' | 'cabin' | 'testimonial' | 'category' | 'site_content' | 'message'
  entityId?: string
  details?: string
}

export async function logActivity({ userId, action, entity, entityId, details }: LogActivityParams) {
  try {
    await db.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId || null,
        details: details || null,
      },
    })
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error('Activity log error:', error)
  }
}
