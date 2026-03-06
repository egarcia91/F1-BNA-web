import type { Carrera, Corredor, Torneo } from '../types'

export const ELO_BASE = 900

/** Delta base por posición: 1-8 suman 8..1; 9-16 restan 1..8 */
export function deltaBasePorPosicion(pos: number): number {
  return pos <= 8 ? 9 - pos : 8 - pos
}

/**
 * Calcula el delta de Elo ajustado con multiplicador por Elo de contiguos.
 *
 * - promedioContiguos = promedio del Elo (previo) de los pilotos en pos-1 y pos+1
 * - diff = promedioContiguos - eloPropioAntes
 * - multiplicador = diff / 10
 * - Si deltaBase > 0 (suma) y multiplicador > 1: ceil(deltaBase * multiplicador)
 * - Si deltaBase < 0 (resta) y multiplicador > 1: se resta menos → ceil(deltaBase / multiplicador)
 * - Si multiplicador <= 1: no se aplica, queda deltaBase
 */
function deltaConMultiplicador(
  deltaBase: number,
  eloPropioAntes: number,
  elosContiguos: number[]
): number {
  if (elosContiguos.length === 0) return deltaBase
  const promedio = elosContiguos.reduce((a, b) => a + b, 0) / elosContiguos.length
  const diff = promedio - eloPropioAntes
  const multiplicador = diff / 10

  if (multiplicador <= 1) return deltaBase

  if (deltaBase > 0) {
    return Math.ceil(deltaBase * multiplicador)
  }
  // deltaBase < 0: restar menos (dividir el valor absoluto)
  return -Math.floor(Math.abs(deltaBase) / multiplicador)
}

/** Obtiene todas las listas de corredores de una carrera en orden de series */
export function listasDeCorrredores(carrera: Carrera): Corredor[][] {
  if (carrera.corredores.length > 0) return [carrera.corredores]
  if (carrera.corredoresPorSerie && carrera.series) {
    return carrera.series
      .map((s) => carrera.corredoresPorSerie![s.horario])
      .filter((arr): arr is Corredor[] => !!arr && arr.length > 0)
  }
  return []
}

/**
 * Obtiene los Elo de los 2 pilotos contiguos en la tabla.
 * Para el primero: pos 2 y 3. Para el último: pos n-1 y n-2. Para el medio: pos-1 y pos+1.
 */
function elosContiguos(
  index: number,
  lista: { id: string }[],
  eloMap: Map<string, number>
): number[] {
  const result: number[] = []
  if (index > 0) result.push(eloMap.get(lista[index - 1].id) ?? ELO_BASE)
  if (index < lista.length - 1) result.push(eloMap.get(lista[index + 1].id) ?? ELO_BASE)
  if (result.length < 2) {
    if (index === 0 && lista.length > 2) {
      result.push(eloMap.get(lista[2].id) ?? ELO_BASE)
    } else if (index === lista.length - 1 && lista.length > 2) {
      result.push(eloMap.get(lista[lista.length - 3].id) ?? ELO_BASE)
    }
  }
  return result
}

/**
 * Procesa una lista de corredores (una serie o carrera) y actualiza el mapa de Elo.
 */
function procesarLista(
  lista: { id: string }[],
  eloMap: Map<string, number>
): Map<string, number> {
  const deltas = new Map<string, number>()
  lista.forEach((c, index) => {
    const pos = index + 1
    const base = deltaBasePorPosicion(pos)
    const eloPrevio = eloMap.get(c.id) ?? ELO_BASE
    const contiguos = elosContiguos(index, lista, eloMap)
    const delta = deltaConMultiplicador(base, eloPrevio, contiguos)
    deltas.set(c.id, delta)
    eloMap.set(c.id, eloPrevio + delta)
  })
  return deltas
}

export interface EloSnapshot {
  eloMap: Map<string, number>
  historial: Map<string, number[]>
  /** Fechas asociadas a cada punto del historial (índice 0 = null para el Elo base) */
  fechas: Map<string, (string | null)[]>
}

/**
 * Calcula el Elo de todos los pilotos recorriendo todos los torneos/carreras/series.
 * Devuelve el mapa de Elo actual, el historial completo por piloto y las fechas asociadas.
 */
export function calcularEloGlobal(torneos: Torneo[]): EloSnapshot {
  const eloMap = new Map<string, number>()
  const historial = new Map<string, number[]>()
  const fechas = new Map<string, (string | null)[]>()

  for (const torneo of torneos) {
    for (const carrera of torneo.carreras) {
      for (const lista of listasDeCorrredores(carrera)) {
        procesarLista(lista, eloMap)
        for (const c of lista) {
          const h = historial.get(c.id) ?? [ELO_BASE]
          const f = fechas.get(c.id) ?? [null]
          h.push(eloMap.get(c.id)!)
          f.push(carrera.fecha)
          historial.set(c.id, h)
          fechas.set(c.id, f)
        }
      }
    }
  }
  return { eloMap, historial, fechas }
}

/**
 * Calcula el Elo de cada piloto justo antes de una carrera/serie dada.
 * Si serieHorario se pasa, se detiene antes de esa serie dentro de la carrera target.
 */
export function eloAntesDeLaCarrera(
  torneos: Torneo[],
  carreraId: string,
  serieHorario?: string | null
): Map<string, number> {
  const eloMap = new Map<string, number>()

  for (const torneo of torneos) {
    for (const carrera of torneo.carreras) {
      if (carrera.id === carreraId) {
        if (serieHorario && carrera.corredoresPorSerie && carrera.series) {
          for (const s of carrera.series) {
            if (s.horario === serieHorario) return eloMap
            const lista = carrera.corredoresPorSerie[s.horario]
            if (lista) procesarLista(lista, eloMap)
          }
        }
        return eloMap
      }
      for (const lista of listasDeCorrredores(carrera)) {
        procesarLista(lista, eloMap)
      }
    }
  }
  return eloMap
}

/**
 * Calcula el delta de Elo para un corredor en una posición dada,
 * con el multiplicador por contiguos. Usado en DetalleCarrera para mostrar el +/- delta.
 */
export function calcularDeltaParaPosicion(
  pos: number,
  corredorId: string,
  lista: { id: string }[],
  eloMapPrevio: Map<string, number>
): number {
  const base = deltaBasePorPosicion(pos)
  const eloPrevio = eloMapPrevio.get(corredorId) ?? ELO_BASE
  const index = pos - 1
  const contiguos = elosContiguos(index, lista, eloMapPrevio)
  return deltaConMultiplicador(base, eloPrevio, contiguos)
}
