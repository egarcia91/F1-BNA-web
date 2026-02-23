/**
 * Corredor: datos flexibles para extender después (posición, puntos, mejor vuelta, etc.)
 * En contexto de torneo (resultados) se usan también apellido, equipo y puntos.
 */
export interface Corredor {
  id: string
  nombre: string
  apellido?: string
  /** Ruta a la foto del piloto en public (ej. "pilotos/ezequiel-salvemini.jpg"). Si no se define, se usa pilotos/{nombre-apellido}.jpg */
  foto?: string
  /** Frase del piloto; si no existe, no se muestra el campo en la sección Pilotos */
  frase?: string
  equipo?: string
  puntos?: number
  /** true si un usuario vinculó su cuenta de Google con este piloto */
  registrado?: boolean
  /** Email del usuario de Google vinculado (solo si registrado es true) */
  email?: string
  /** true si el piloto confirmó asistencia a la próxima carrera; false por defecto */
  presenteSiguienteCarrera?: boolean
  datos?: Record<string, unknown>
}

/**
 * Carrera: lista de corredores, lugar/sede y datos opcionales.
 */
/** Par de nombre + horario para series/horarios de una carrera */
export interface SerieHorario {
  nombre: string
  horario: string
}

export interface Carrera {
  id: string
  nombre: string
  fecha: string
  /** Lugar o circuito donde se disputó la carrera */
  lugar?: string
  /** Si es true, se muestra una estrella dorada a la izquierda del nombre (ej. carrera final) */
  mostrarEstrella?: boolean
  /** Series con horario (ej. Serie 1 : 21:30) */
  series?: SerieHorario[]
  /** Texto descriptivo de la carrera (ej. criterios de clasificación para la final) */
  detalle?: string
  corredores: Corredor[]
  datos?: Record<string, unknown>
}

/**
 * Torneo: agrupa carreras con detalles (lugar, reglas, puntajes).
 * Cada torneo puede tener reglas y puntajes distintos.
 */
/** Estado del torneo para mostrar en la lista */
export type EstadoTorneo = 'concluido' | 'en_progreso'

export interface Torneo {
  id: string
  nombre: string
  carreras: Carrera[]
  /** Estado del torneo (ej. Concluido, En progreso) */
  estado?: EstadoTorneo
  /** Lugar o sede general del torneo (si aplica) */
  lugar?: string
  /** Reglas del torneo */
  reglas?: string[]
  /** Puntos por posición: tabla con posicion y puntos */
  puntajesTabla?: { posicion: string; puntos: number }[]
  /** Puntos adicionales (adelantamientos, pole, vuelta rápida, etc.) */
  puntajesAdicionales?: string
  /** Resultados del torneo (corredores con puntos). Pueden no correr en todas las fechas. */
  resultados?: Corredor[]
  datos?: Record<string, unknown>
}
