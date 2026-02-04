/**
 * Corredor: datos flexibles para extender después (posición, puntos, mejor vuelta, etc.)
 * En contexto de torneo (pilotos) se usan también apellido, equipo y puntos.
 */
export interface Corredor {
  id: string
  nombre: string
  apellido?: string
  equipo?: string
  puntos?: number
  datos?: Record<string, unknown>
}

/**
 * Carrera: lista de corredores, lugar/sede y datos opcionales.
 */
export interface Carrera {
  id: string
  nombre: string
  fecha: string
  /** Lugar o circuito donde se disputó la carrera */
  lugar?: string
  corredores: Corredor[]
  datos?: Record<string, unknown>
}

/**
 * Torneo: agrupa carreras con detalles (lugar, reglas, puntajes).
 * Cada torneo puede tener reglas y puntajes distintos.
 */
export interface Torneo {
  id: string
  nombre: string
  carreras: Carrera[]
  /** Lugar o sede general del torneo (si aplica) */
  lugar?: string
  /** Reglas del torneo */
  reglas?: string[]
  /** Puntos por posición: tabla con posicion y puntos */
  puntajesTabla?: { posicion: string; puntos: number }[]
  /** Puntos adicionales (adelantamientos, pole, vuelta rápida, etc.) */
  puntajesAdicionales?: string
  /** Pilotos del torneo (anotados). Pueden no correr en todas las fechas. */
  pilotos?: Corredor[]
  datos?: Record<string, unknown>
}
