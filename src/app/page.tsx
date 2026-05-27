'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { useCMSStore, type Profile } from '@/lib/cms-store'
import { Toaster } from '@/components/ui/sonner'

// Lazy-load to prevent OOM during compilation
const LoginPage = lazy(() => import('@/components/cms/LoginPage'))
const CMSLayout = lazy(() => import('@/components/cms/CMSLayout'))

export default function Home() {
  const { user, setUser, needsSeed, setNeedsSeed } = useCMSStore()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user as Profile)

          // Check if database needs seeding
          const plansRes = await fetch('/api/plans')
          if (plansRes.ok) {
            const plansData = await plansRes.json()
            if (!plansData.plans || plansData.plans.length === 0) {
              setNeedsSeed(true)
            }
          }
        }
      } catch {
        // Not authenticated
      } finally {
        setInitializing(false)
      }
    }
    checkAuth()
  }, [setUser, setNeedsSeed])

  const handleSeed = async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      if (res.ok) {
        setNeedsSeed(false)
        // Refresh user data after seed
        const meRes = await fetch('/api/auth/me')
        if (meRes.ok) {
          const data = await meRes.json()
          setUser(data.user as Profile)
        }
      }
    } catch {
      // Ignore
    }
  }

  // Show loading during initial auth check
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-2 border-cyan-600 border-t-transparent rounded-full" />
          <span className="text-sm text-muted-foreground">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster richColors position="top-right" />
      {!user ? (
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin h-8 w-8 border-2 border-cyan-600 border-t-transparent rounded-full" />
              <span className="text-sm text-muted-foreground">Cargando...</span>
            </div>
          </div>
        }>
          <LoginPage
            onLogin={(userData) => {
              setUser(userData as Profile)
              // After login, check if seed is needed
              fetch('/api/plans')
                .then((res) => res.json())
                .then((data) => {
                  if (!data.plans || data.plans.length === 0) {
                    setNeedsSeed(true)
                  }
                })
                .catch(() => {})
            }}
          />
        </Suspense>
      ) : needsSeed ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center space-y-4 p-8">
            <h2 className="text-2xl font-bold text-slate-900">Bienvenido a Vive Travel CMS</h2>
            <p className="text-muted-foreground">
              Parece que la base de datos está vacía. ¿Deseas cargar los datos iniciales?
            </p>
            <button
              onClick={handleSeed}
              className="bg-cyan-700 hover:bg-cyan-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Cargar Datos Iniciales
            </button>
          </div>
        </div>
      ) : (
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin h-8 w-8 border-2 border-cyan-600 border-t-transparent rounded-full" />
              <span className="text-sm text-muted-foreground">Cargando...</span>
            </div>
          </div>
        }>
          <CMSLayout />
        </Suspense>
      )}
    </>
  )
}
