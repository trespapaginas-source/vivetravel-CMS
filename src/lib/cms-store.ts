'use client'

import { create } from 'zustand'

export type CMSView =
  | 'dashboard'
  | 'plans'
  | 'plans-pasadias'
  | 'plans-nacionales'
  | 'plans-internacionales'
  | 'plans-grupales'
  | 'plans-tours'
  | 'plan-form'
  | 'cabins'
  | 'cabin-form'
  | 'testimonials'
  | 'messages'
  | 'site-content'
  | 'media'
  | 'categories'
  | 'profile'
  | 'users'
  | 'activity'

export interface Profile {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: 'administrador' | 'editor'
}

interface CMSStore {
  currentView: CMSView
  setView: (view: CMSView) => void
  lastPlansView: CMSView
  editingId: string | null
  setEditingId: (id: string | null) => void
  user: Profile | null
  setUser: (user: Profile | null) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  needsSeed: boolean
  setNeedsSeed: (v: boolean) => void
}

export const useCMSStore = create<CMSStore>((set) => ({
  currentView: 'dashboard',
  lastPlansView: 'plans-pasadias',
  setView: (view) => set((state) => {
    const isPlansList = view === 'plans' || view.startsWith('plans-')
    return {
      currentView: view,
      // Only reset editingId when navigating AWAY from form views
      editingId: (view !== 'plan-form' && view !== 'cabin-form') ? null : state.editingId,
      ...(isPlansList ? { lastPlansView: view } : {})
    }
  }),
  editingId: null,
  setEditingId: (id) => set({ editingId: id }),
  user: null,
  setUser: (user) => set({ user }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  needsSeed: false,
  setNeedsSeed: (v) => set({ needsSeed: v }),
}))
