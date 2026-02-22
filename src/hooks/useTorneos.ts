import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import type { Carrera, Corredor, SerieHorario, Torneo } from '../types'
import { db } from '../lib/firebase'
import { torneos as torneosLocal } from '../data/torneos'

function mapCorredorFromFirestore(id: string, d: Record<string, unknown>): Corredor {
  return {
    id,
    nombre: typeof d.nombre === 'string' ? d.nombre : '',
    apellido: typeof d.apellido === 'string' ? d.apellido : undefined,
    equipo: typeof d.equipo === 'string' ? d.equipo : undefined,
    puntos: typeof d.puntos === 'number' ? d.puntos : undefined,
    datos: d.datos && typeof d.datos === 'object' ? (d.datos as Record<string, unknown>) : undefined,
  }
}

function mapCarreraDoc(id: string, d: Record<string, unknown>): Carrera {
  const corredores: Corredor[] = []
  const rawCorredores = d.corredores
  if (Array.isArray(rawCorredores)) {
    rawCorredores.forEach((item) => {
      if (item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string') {
        const c = item as { id: string; nombre?: string; datos?: Record<string, unknown> }
        corredores.push({
          id: c.id,
          nombre: typeof c.nombre === 'string' ? c.nombre : '',
          datos: c.datos && typeof c.datos === 'object' ? c.datos : undefined,
        })
      }
    })
  }

  let series: SerieHorario[] | undefined
  if (Array.isArray(d.series)) {
    series = d.series
      .filter((s) => s && typeof s === 'object' && typeof (s as { nombre?: unknown }).nombre === 'string')
      .map((s) => ({
        nombre: (s as { nombre: string }).nombre,
        horario: typeof (s as { horario?: string }).horario === 'string' ? (s as { horario: string }).horario : '',
      }))
    if (series.length === 0) series = undefined
  }

  return {
    id,
    nombre: typeof d.nombre === 'string' ? d.nombre : '',
    fecha: typeof d.fecha === 'string' ? d.fecha : '',
    lugar: typeof d.lugar === 'string' ? d.lugar : undefined,
    mostrarEstrella: d.mostrarEstrella === true,
    series,
    detalle: typeof d.detalle === 'string' ? d.detalle : undefined,
    corredores,
  }
}

export function useTorneos(): {
  torneos: Torneo[]
  loading: boolean
  error: string | null
} {
  const [torneos, setTorneos] = useState<Torneo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!db) {
      setTorneos(torneosLocal)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getDocs(collection(db, 'torneos'))
      .then(async (torneosSnap) => {
        if (cancelled) return
        const list: Torneo[] = []
        for (const doc of torneosSnap.docs) {
          const d = doc.data() as Record<string, unknown>
          const carrerasSnap = await getDocs(collection(db!, 'torneos', doc.id, 'carreras'))
          const carreras: Carrera[] = []
          carrerasSnap.forEach((cDoc) => {
            carreras.push(mapCarreraDoc(cDoc.id, cDoc.data() as Record<string, unknown>))
          })
          carreras.sort((a, b) => a.fecha.localeCompare(b.fecha))

          let resultados: Corredor[] | undefined
          if (Array.isArray(d.resultados)) {
            resultados = d.resultados
              .filter((r) => r && typeof r === 'object')
              .map((r) => mapCorredorFromFirestore((r as { id?: string }).id ?? '', r as Record<string, unknown>))
          }

          let puntajesTabla: { posicion: string; puntos: number }[] | undefined
          if (Array.isArray(d.puntajesTabla)) {
            puntajesTabla = d.puntajesTabla
              .filter((p) => p && typeof p === 'object' && typeof (p as { posicion?: unknown }).posicion === 'string')
              .map((p) => ({
                posicion: (p as { posicion: string }).posicion,
                puntos: typeof (p as { puntos?: number }).puntos === 'number' ? (p as { puntos: number }).puntos : 0,
              }))
            if (puntajesTabla.length === 0) puntajesTabla = undefined
          }

          list.push({
            id: doc.id,
            nombre: typeof d.nombre === 'string' ? d.nombre : '',
            estado: d.estado === 'concluido' || d.estado === 'en_progreso' ? d.estado : undefined,
            lugar: typeof d.lugar === 'string' ? d.lugar : undefined,
            reglas: Array.isArray(d.reglas) ? d.reglas.filter((r) => typeof r === 'string') as string[] : undefined,
            puntajesTabla,
            puntajesAdicionales: typeof d.puntajesAdicionales === 'string' ? d.puntajesAdicionales : undefined,
            resultados,
            carreras,
          })
        }
        setTorneos(list)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar torneos')
          setTorneos(torneosLocal)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { torneos, loading, error }
}
