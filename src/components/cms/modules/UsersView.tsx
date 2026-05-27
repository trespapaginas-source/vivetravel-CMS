'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users as UsersIcon, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface Profile {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: string
  createdAt: string
  updatedAt?: string
}

export default function UsersView() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/profiles')
        if (res.ok) {
          const data = await res.json()
          setProfiles(data.profiles || [])
        }
      } catch {
        toast.error('Error al cargar usuarios')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleRoleChange = async (profileId: string, newRole: string) => {
    try {
      const res = await fetch('/api/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: profileId, role: newRole }),
      })
      if (!res.ok) throw new Error('Error al actualizar rol')
      setProfiles(profiles.map((p) => (p.id === profileId ? { ...p, role: newRole } : p)))
      toast.success('Rol actualizado correctamente')
    } catch {
      toast.error('Error al actualizar rol')
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.trim().split(' ')
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
      return name.slice(0, 2).toUpperCase()
    }
    return email.slice(0, 2).toUpperCase()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full skeleton-wave" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Usuarios</h1>
        <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 mb-4 empty-float">
            <UsersIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">No hay usuarios</h3>
          <p className="text-base text-muted-foreground">Los usuarios registrados aparecerán aquí</p>
        </div>
      ) : (
        <div className="rounded-lg bg-white dark:bg-slate-900 shadow-sm overflow-x-auto border border-slate-200 dark:border-slate-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 dark:bg-slate-800/80">
                <TableHead className="dark:text-slate-300">Usuario</TableHead>
                <TableHead className="dark:text-slate-300">Email</TableHead>
                <TableHead className="dark:text-slate-300">Rol</TableHead>
                <TableHead className="dark:text-slate-300">Fecha de Creación</TableHead>
                <TableHead className="dark:text-slate-300">Última Actualización</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile, idx) => (
                <TableRow key={profile.id} className={`group shadow-sm hover:shadow-md transition-all duration-200 hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20 ${idx % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 text-xs">
                          {getInitials(profile.fullName, profile.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                        {profile.fullName || 'Sin nombre'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-700 dark:text-slate-300">{profile.email}</TableCell>
                  <TableCell>
                    <Select
                      value={profile.role}
                      onValueChange={(val) => handleRoleChange(profile.id, val)}
                    >
                      <SelectTrigger className="w-[160px] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 dark:border-slate-700">
                        <SelectItem value="administrador" className="dark:text-slate-300 dark:focus:bg-slate-800">
                          Administrador
                        </SelectItem>
                        <SelectItem value="editor" className="dark:text-slate-300 dark:focus:bg-slate-800">
                          Editor
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground dark:text-slate-400">
                    {formatDate(profile.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground dark:text-slate-400">
                    {profile.updatedAt ? formatDate(profile.updatedAt) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
