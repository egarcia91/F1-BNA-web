export interface Corredor {
  id: string
  nombre: string
  apellido?: string
  equipo?: string
  puntos?: number
  datos?: {
    mejorTiempo?: number
    numero?: number
    peso?: number
    [key: string]: unknown
  }
}

export interface Carrera {
  id: string
  nombre: string
  fecha: string
  lugar: string
  corredores: Corredor[]
}

export interface Torneo {
  id: string
  nombre: string
  carreras: Carrera[]
  pilotos: Corredor[]
}
