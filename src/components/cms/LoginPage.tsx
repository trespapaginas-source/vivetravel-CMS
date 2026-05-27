'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mountain, Loader2, Check, Shield, Map, Home, MessageSquare, Sparkles, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface LoginPageProps {
  onLogin: (user: unknown) => void
}

const features = [
  { icon: Map, text: 'Gestión de planes turísticos' },
  { icon: Home, text: 'Administración de cabañas' },
  { icon: Sparkles, text: 'Contenido dinámico del sitio' },
  { icon: MessageSquare, text: 'Testimonios y mensajería' },
]

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        return
      }

      toast.success('Inicio de sesión exitoso')
      onLogin(data.user)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ===== Left Panel — hidden on mobile, visible lg+ ===== */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden flex-col justify-between bg-gradient-to-br from-teal-900 via-cyan-800 to-emerald-900 dark:from-slate-950 dark:via-cyan-950 dark:to-emerald-950">
        {/* Floating decorative circles */}
        <div className="absolute top-16 left-12 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-8 w-56 h-56 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-40 h-40 bg-teal-300/8 rounded-full blur-2xl" />
        <div className="absolute top-2/3 right-1/3 w-64 h-64 bg-cyan-500/6 rounded-full blur-3xl" />

        {/* Top content — branding */}
        <div className="relative z-10 p-12 pt-16">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm shadow-lg shadow-cyan-900/30 border border-white/10">
              <Mountain className="h-7 w-7 text-cyan-300" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Vive Travel</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4">
            Gestiona<br />tu aventura
          </h2>
          <p className="text-cyan-200/80 text-lg max-w-md leading-relaxed">
            Panel de administración para gestionar todo el contenido de tu sitio web turístico de forma sencilla.
          </p>
        </div>

        {/* Feature bullets */}
        <div className="relative z-10 p-12 pb-40">
          <ul className="space-y-4">
            {features.map((feature, idx) => (
              <li
                key={feature.text}
                className="flex items-center gap-3 group"
                style={{ animationDelay: `${idx * 100 + 300}ms` }}
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 group-hover:bg-white/20 transition-colors duration-300">
                  <Check className="h-4 w-4 text-emerald-300" />
                </span>
                <span className="text-white/90 text-sm font-medium group-hover:text-white transition-colors duration-300">
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative SVG mountains at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-0">
          <svg
            viewBox="0 0 800 260"
            preserveAspectRatio="none"
            className="w-full h-56 xl:h-64"
          >
            {/* Back mountain layer */}
            <path
              className="mountain-float-1"
              d="M0,260 L0,160 Q80,100 160,140 Q220,80 300,120 Q360,60 420,110 Q480,50 540,100 Q600,60 660,90 Q720,40 780,80 L800,70 L800,260 Z"
              fill="rgba(0,0,0,0.15)"
            />
            {/* Middle mountain layer */}
            <path
              className="mountain-float-2"
              d="M0,260 L0,180 Q60,140 120,160 Q180,110 260,150 Q320,100 380,140 Q440,90 520,130 Q580,100 640,120 Q700,80 760,110 L800,100 L800,260 Z"
              fill="rgba(0,0,0,0.2)"
            />
            {/* Front mountain layer */}
            <path
              className="mountain-float-3"
              d="M0,260 L0,210 Q100,170 200,190 Q280,150 360,180 Q420,140 500,170 Q560,145 640,165 Q720,130 800,160 L800,260 Z"
              fill="rgba(0,0,0,0.3)"
            />
          </svg>
        </div>

        {/* Security badge */}
        <div className="absolute bottom-6 left-12 z-10 flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
          <Shield className="h-4 w-4 text-cyan-300/70" />
          <span className="text-white/50 text-xs">Conexión segura</span>
        </div>
      </div>

      {/* ===== Right Panel — full width mobile, half desktop ===== */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center bg-white dark:bg-slate-950 relative overflow-hidden px-6 py-12">
        {/* Subtle background decoration for right panel */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-50 dark:bg-cyan-950/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-50 dark:bg-teal-950/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile-only branding (shown when left panel is hidden) */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 shadow-lg shadow-cyan-600/20">
              <Mountain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Vive Travel</span>
          </div>

          {/* Form card with entrance animation */}
          <div
            className="animate-[fadeInUp_0.6s_ease-out_both]"
          >
            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Bienvenido de vuelta
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-base">
                Inicia sesión para continuar
              </p>
            </div>

            {/* Error alert */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm mb-6 animate-[shake_0.4s_ease-in-out]">
                {error}
              </div>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-medium">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  autoComplete="email"
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-500 transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="h-11 rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-500 transition-all duration-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={rememberMe}
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`h-4 w-4 rounded border transition-all duration-200 flex items-center justify-center shrink-0 ${
                    rememberMe
                      ? 'bg-cyan-600 border-cyan-600 text-white'
                      : 'border-slate-300 dark:border-slate-600 hover:border-cyan-400 dark:hover:border-cyan-500'
                  }`}
                >
                  {rememberMe && <Check className="h-3 w-3" />}
                </button>
                <label className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none" onClick={() => setRememberMe(!rememberMe)}>
                  Recordarme
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 dark:from-cyan-700 dark:to-teal-700 dark:hover:from-cyan-600 dark:hover:to-teal-600 text-white font-medium shadow-lg shadow-cyan-600/25 dark:shadow-cyan-900/30 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-600/30 hover:scale-[1.01] active:scale-[0.99]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center leading-relaxed">
                <span className="font-medium text-slate-500 dark:text-slate-400">Demo:</span>{' '}
                admin@vivetravel.com / admin123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
