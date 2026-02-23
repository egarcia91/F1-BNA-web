import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import type { Corredor } from '../types'
import { db } from '../lib/firebase'
import { pilotos as pilotosLocal } from '../data/pilotos'

export function usePilotos(): {
  pilotos: Corredor[]
  loading: boolean
  error: string | null
  refetch: () => void
} {
  const [pilotos, setPilotos] = useState<Corredor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  useEffect(() => {
    if (!db) {
      setPilotos(pilotosLocal)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getDocs(collection(db, 'pilotos'))
      .then((snapshot) => {
        if (cancelled) return
        const list: Corredor[] = []
        snapshot.forEach((doc) => {
          const d = doc.data()
          list.push({
            id: doc.id,
            nombre: typeof d.nombre === 'string' ? d.nombre : '',
            apellido: typeof d.apellido === 'string' ? d.apellido : undefined,
            equipo: typeof d.equipo === 'string' ? d.equipo : undefined,
            foto: typeof d.foto === 'string' ? d.foto : undefined,
            frase: typeof d.frase === 'string' ? d.frase : undefined,
            puntos: typeof d.puntos === 'number' ? d.puntos : undefined,
            registrado: d.registrado === true,
            email: typeof d.email === 'string' ? d.email : undefined,
            presenteSiguienteCarrera: d.presenteSiguienteCarrera === true,
            datos: d.datos && typeof d.datos === 'object' ? (d.datos as Record<string, unknown>) : undefined,
          })
        })
        setPilotos(list)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar pilotos')
          setPilotos(pilotosLocal)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [refetchTrigger])

  const refetch = () => setRefetchTrigger((t) => t + 1)

  return { pilotos, loading, error, refetch }
}
