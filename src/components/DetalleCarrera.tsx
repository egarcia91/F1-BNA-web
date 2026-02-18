import { useMemo, useState } from 'react'
import type { Carrera } from '../types'
import styles from './DetalleCarrera.module.css'

interface DetalleCarreraProps {
  carrera: Carrera | null
}

const VOCALES = /[aeiouáéíóú]/gi
const CONSONANTE = /[bcdfghjklmnpqrstvwxyzñ]/i

/**
 * Devuelve las primeras dos sílabas (solo móvil).
 * Ezequiel -> Eze, Alejandro -> Ale, Federico -> Fede, Diego -> Diego (sin recortar).
 * Incluye consonante tras la 2.ª vocal solo si va seguida de otra consonante (ej. Sebastian -> Sebas).
 */
function primerasDosSilabas(palabra: string): string {
  if (palabra.length === 0) return palabra
  const p = palabra.normalize('NFD').replace(/\p{Diacritic}/gu, '') // sin tildes para contar
  const indicesVocal: number[] = []
  for (let i = 0; i < p.length; i++) {
    if (p[i].match(/[aeiou]/i)) indicesVocal.push(i)
  }
  if (indicesVocal.length < 3) return palabra // 1 o 2 sílabas: no recortar (ej. Diego, Martin)
  if (palabra.toLowerCase() === 'diego') return palabra
  const idxSegundaVocal = indicesVocal[1]
  const siguiente = palabra[idxSegundaVocal + 1]
  const despues = palabra[idxSegundaVocal + 2]
  const hasta =
    siguiente && CONSONANTE.test(siguiente) && despues && CONSONANTE.test(despues)
      ? idxSegundaVocal + 2
      : idxSegundaVocal + 1
  return palabra.slice(0, hasta)
}

function nombreCorto(nombreCompleto: string): string {
  const parts = nombreCompleto.trim().split(/\s+/)
  if (parts.length < 2) return nombreCompleto
  const nombre = parts[0]
  const apellidoInicial = parts[parts.length - 1][0]
  const nombreParaMostrar = primerasDosSilabas(nombre)
  return `${nombreParaMostrar} ${apellidoInicial}.`
}

type OrdenPosicion = 'asc' | 'desc'
type OrdenPor = 'posicion' | 'mejorTiempo' | 'ordenLargada'

function getMejorTiempo(c: { datos?: Record<string, unknown> }): number | null {
  if (!c.datos || typeof c.datos !== 'object' || !('mejorTiempo' in c.datos))
    return null
  const v = (c.datos as { mejorTiempo?: number }).mejorTiempo
  return typeof v === 'number' ? v : null
}

function getOrdenLargada(c: { datos?: Record<string, unknown> }): number | null {
  if (!c.datos || typeof c.datos !== 'object' || !('ordenLargada' in c.datos))
    return null
  const v = (c.datos as { ordenLargada?: number }).ordenLargada
  return typeof v === 'number' ? v : null
}

type ColumnaMovil = 'karting' | 'mejorTiempo' | 'vueltas' | 'ordenLargada'

export function DetalleCarrera({ carrera }: DetalleCarreraProps) {
  const [ordenPosicion, setOrdenPosicion] = useState<OrdenPosicion>('asc')
  const [ordenPor, setOrdenPor] = useState<OrdenPor>('posicion')
  const [columnaMovil, setColumnaMovil] = useState<ColumnaMovil>('mejorTiempo')

  if (!carrera) {
    return (
      <section className={styles.section}>
        <p className={styles.placeholder}>
          Seleccioná una carrera para ver los corredores.
        </p>
      </section>
    )
  }

  const corredoresOrdenados = useMemo(() => {
    const list = [...carrera.corredores]
    if (ordenPor === 'mejorTiempo') {
      return list.sort((a, b) => {
        const ta = getMejorTiempo(a) ?? Infinity
        const tb = getMejorTiempo(b) ?? Infinity
        return ta - tb
      })
    }
    if (ordenPor === 'ordenLargada') {
      return list.sort((a, b) => {
        const oa = getOrdenLargada(a) ?? Infinity
        const ob = getOrdenLargada(b) ?? Infinity
        return ordenPosicion === 'asc' ? oa - ob : ob - oa
      })
    }
    return ordenPosicion === 'desc' ? list.reverse() : list
  }, [carrera.corredores, ordenPosicion, ordenPor])

  const toggleOrdenPosicion = () => {
    setOrdenPor('posicion')
    setOrdenPosicion((o) => (o === 'asc' ? 'desc' : 'asc'))
  }

  const ordenarPorMejorTiempo = () => {
    setOrdenPor('mejorTiempo')
  }

  const toggleOrdenLargada = () => {
    setOrdenPor('ordenLargada')
    setOrdenPosicion((o) => (o === 'asc' ? 'desc' : 'asc'))
  }

  const mejorTiempoAbsoluto =
    ordenPor === 'mejorTiempo' && corredoresOrdenados[0]
      ? getMejorTiempo(corredoresOrdenados[0])
      : null

  /** Posición de llegada en la carrera (orden original); no cambia al reordenar por otras columnas */
  const getPosicionCarrera = (corredor: (typeof carrera.corredores)[0]) => {
    const idx = carrera.corredores.findIndex((c) => c.id === corredor.id)
    return idx >= 0 ? idx + 1 : '—'
  }

  const ariaSortOrdenLargada =
    ordenPor === 'ordenLargada'
      ? ordenPosicion === 'asc'
        ? 'ascending'
        : 'descending'
      : undefined
  return (
    <section className={styles.section}>
      <h2 className={styles.tituloCarrera}>
        {carrera.mostrarEstrella && (
          <span className={styles.estrellaDorada} aria-hidden>★</span>
        )}
        {carrera.nombre}
      </h2>
      <p className={styles.fecha}>Fecha: {carrera.fecha}</p>
      {carrera.lugar && (
        <p className={styles.lugar}>Lugar: {carrera.lugar}</p>
      )}
      {carrera.series && carrera.series.length > 0 && (
        <div className={styles.series}>
          {carrera.series.map((s) => (
            <p key={s.nombre} className={styles.serieItem}>
              {s.nombre} : {s.horario}
            </p>
          ))}
        </div>
      )}
      {carrera.detalle && (
        <p className={styles.detalle}>{carrera.detalle}</p>
      )}
      <h3 className={styles.subtitulo}>Corredores</h3>
      {(carrera.corredores.some(
        (c) =>
          c.datos &&
          typeof c.datos === 'object' &&
          'karting' in c.datos
      ) ||
        carrera.corredores.some(
          (c) =>
            c.datos &&
            typeof c.datos === 'object' &&
            'vueltas' in c.datos
        ) ||
        carrera.corredores.some(
          (c) =>
            c.datos &&
            typeof c.datos === 'object' &&
            'ordenLargada' in c.datos
        )) && (
        <div className={styles.toggleSelect}>
            <label htmlFor="columna-movil-select" className={styles.toggleSelectLabel}>
              Ver columna:
            </label>
            <select
              id="columna-movil-select"
              value={columnaMovil}
              onChange={(e) => setColumnaMovil(e.target.value as ColumnaMovil)}
              className={styles.toggleSelectNative}
              aria-label="Elegir columna a mostrar"
            >
              {carrera.corredores.some(
                (c) => c.datos && typeof c.datos === 'object' && 'karting' in c.datos
              ) && (
                <option value="karting">Karting</option>
              )}
              <option value="mejorTiempo">Mejor tiempo</option>
              {carrera.corredores.some(
                (c) => c.datos && typeof c.datos === 'object' && 'vueltas' in c.datos
              ) && (
                <option value="vueltas">Vueltas</option>
              )}
              {carrera.corredores.some(
                (c) => c.datos && typeof c.datos === 'object' && 'ordenLargada' in c.datos
              ) && (
                <option value="ordenLargada">Orden largada</option>
              )}
            </select>
        </div>
      )}
      <div
        className={styles.tablaWrapper}
        data-columna-movil={
          carrera.corredores.some(
            (c) =>
              c.datos &&
              typeof c.datos === 'object' &&
              'karting' in c.datos
          ) ||
          carrera.corredores.some(
            (c) =>
              c.datos &&
              typeof c.datos === 'object' &&
              'vueltas' in c.datos
          ) ||
          carrera.corredores.some(
            (c) =>
              c.datos &&
              typeof c.datos === 'object' &&
              'ordenLargada' in c.datos
          )
            ? columnaMovil
            : undefined
        }
      >
        <table className={styles.tabla}>
          <thead>
            <tr>
              <th className={styles.th}>
                <button
                  type="button"
                  className={styles.thOrdenable}
                  onClick={toggleOrdenPosicion}
                  aria-sort={
                    ordenPor === 'posicion'
                      ? ordenPosicion === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <span className={styles.thDesktop}>Posición</span>
                  <span className={styles.thMobile}>Pos</span>
                  <span className={styles.thIndicador} aria-hidden>
                    {ordenPor === 'posicion'
                      ? ordenPosicion === 'asc'
                        ? ' ↑'
                        : ' ↓'
                      : ''}
                  </span>
                </button>
              </th>
              <th className={styles.th}>Nombre</th>
              {carrera.corredores.some(
                (c) =>
                  c.datos &&
                  typeof c.datos === 'object' &&
                  'karting' in c.datos
              ) && (
                <th className={`${styles.th} ${styles.thKarting}`}>Karting</th>
              )}
              {carrera.corredores.some(
                (c) =>
                  c.datos &&
                  typeof c.datos === 'object' &&
                  'vueltas' in c.datos
              ) && (
                <th className={`${styles.th} ${styles.thVueltas}`}>Vueltas</th>
              )}
              {carrera.corredores.some(
                (c) =>
                  c.datos &&
                  typeof c.datos === 'object' &&
                  'ordenLargada' in c.datos
              ) && (
                <th className={`${styles.th} ${styles.thOrdenLargada}`}>
                  <button
                    type="button"
                    className={styles.thOrdenable}
                    onClick={toggleOrdenLargada}
                    aria-sort={ariaSortOrdenLargada}
                    title="Ordenar por orden de largada"
                  >
                    Orden largada
                    {ordenPor === 'ordenLargada' && (
                      <span className={styles.thIndicador} aria-hidden>
                        {ordenPosicion === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </button>
                </th>
              )}
              <th className={`${styles.th} ${styles.thTiempo}`}>
                <button
                  type="button"
                  className={styles.thOrdenable}
                  onClick={ordenarPorMejorTiempo}
                  aria-sort={
                    ordenPor === 'mejorTiempo' ? 'ascending' : undefined
                  }
                  title="Ordenar por mejor tiempo (menor arriba)"
                >
                  Mejor Tiempo
                  {ordenPor === 'mejorTiempo' && (
                    <span className={styles.thIndicador} aria-hidden> ↓</span>
                  )}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {corredoresOrdenados.map((corredor, index) => {
              const posicion = getPosicionCarrera(corredor)
              const posicionCarreraNum =
                carrera.corredores.findIndex((c) => c.id === corredor.id) + 1
              const ordenLargadaVal =
                ordenPor === 'ordenLargada' ? getOrdenLargada(corredor) : null
              const diffPosicion =
                ordenPor === 'ordenLargada' &&
                ordenLargadaVal != null &&
                posicionCarreraNum >= 1
                  ? ordenLargadaVal - posicionCarreraNum
                  : null
              const mejorTiempo =
                corredor.datos &&
                typeof corredor.datos === 'object' &&
                'mejorTiempo' in corredor.datos
                  ? (corredor.datos as { mejorTiempo?: number }).mejorTiempo
                  : undefined
              const diferencia =
                ordenPor === 'mejorTiempo' &&
                mejorTiempoAbsoluto != null &&
                mejorTiempo != null
                  ? mejorTiempo - mejorTiempoAbsoluto
                  : null
              return (
                <tr key={corredor.id} className={styles.fila}>
                  <td className={styles.tdPosicion}>
                    <span className={styles.posicion}>{posicion}</span>
                  </td>
                  <td className={styles.tdNombre}>
                    <span className={styles.nombreCompleto}>
                      {corredor.nombre}
                    </span>
                    <span className={styles.nombreCorto}>
                      {nombreCorto(corredor.nombre)}
                    </span>
                  </td>
                  {carrera.corredores.some(
                    (c) =>
                      c.datos &&
                      typeof c.datos === 'object' &&
                      'karting' in c.datos
                  ) && (
                    <td className={styles.tdKarting}>
                      {corredor.datos &&
                      typeof corredor.datos === 'object' &&
                      'karting' in corredor.datos &&
                      typeof (corredor.datos as { karting?: number }).karting === 'number'
                        ? (corredor.datos as { karting: number }).karting
                        : '—'}
                    </td>
                  )}
                  {carrera.corredores.some(
                    (c) =>
                      c.datos &&
                      typeof c.datos === 'object' &&
                      'vueltas' in c.datos
                  ) && (
                    <td className={styles.tdVueltas}>
                      {corredor.datos &&
                      typeof corredor.datos === 'object' &&
                      'vueltas' in corredor.datos &&
                      typeof (corredor.datos as { vueltas?: number }).vueltas === 'number'
                        ? (corredor.datos as { vueltas: number }).vueltas
                        : '—'}
                    </td>
                  )}
                  {carrera.corredores.some(
                    (c) =>
                      c.datos &&
                      typeof c.datos === 'object' &&
                      'ordenLargada' in c.datos
                  ) && (
                    <td className={styles.tdOrdenLargada}>
                      {ordenPor === 'ordenLargada' &&
                        diffPosicion != null &&
                        diffPosicion !== 0 && (
                          <span
                            className={
                              diffPosicion > 0
                                ? styles.diffPosicionMejora
                                : styles.diffPosicionPerdida
                            }
                          >
                            {diffPosicion > 0 ? `+${diffPosicion}` : diffPosicion}{' '}
                          </span>
                        )}
                      {corredor.datos &&
                      typeof corredor.datos === 'object' &&
                      'ordenLargada' in corredor.datos &&
                      typeof (corredor.datos as { ordenLargada?: number }).ordenLargada === 'number'
                        ? (corredor.datos as { ordenLargada: number }).ordenLargada
                        : '—'}
                    </td>
                  )}
                  <td
                    className={
                      ordenPor === 'mejorTiempo' && index === 0
                        ? `${styles.tdTiempo} ${styles.tiempoMejor}`
                        : ordenPor === 'mejorTiempo'
                          ? `${styles.tdTiempo} ${styles.tiempoResto}`
                          : styles.tdTiempo
                    }
                  >
                    {ordenPor === 'mejorTiempo' &&
                      index >= 1 &&
                      diferencia != null && (
                        <span className={styles.diferenciaTiempo}>
                          +{diferencia.toFixed(3)}{' '}
                        </span>
                      )}
                    {mejorTiempo != null
                      ? `${mejorTiempo.toFixed(3)} s`
                      : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
