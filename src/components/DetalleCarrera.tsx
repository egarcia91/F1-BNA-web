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
type OrdenPor = 'posicion' | 'mejorTiempo'

function getMejorTiempo(c: { datos?: Record<string, unknown> }): number | null {
  if (!c.datos || typeof c.datos !== 'object' || !('mejorTiempo' in c.datos))
    return null
  const v = (c.datos as { mejorTiempo?: number }).mejorTiempo
  return typeof v === 'number' ? v : null
}

export function DetalleCarrera({ carrera }: DetalleCarreraProps) {
  const [ordenPosicion, setOrdenPosicion] = useState<OrdenPosicion>('asc')
  const [ordenPor, setOrdenPor] = useState<OrdenPor>('posicion')

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
    return ordenPosicion === 'desc' ? list.reverse() : list
  }, [carrera.corredores, ordenPosicion, ordenPor])

  const toggleOrdenPosicion = () => {
    setOrdenPor('posicion')
    setOrdenPosicion((o) => (o === 'asc' ? 'desc' : 'asc'))
  }

  const ordenarPorMejorTiempo = () => {
    setOrdenPor('mejorTiempo')
  }

  const n = corredoresOrdenados.length
  const posicionEnFila =
    ordenPor === 'posicion'
      ? ordenPosicion === 'asc'
        ? (i: number) => i + 1
        : (i: number) => n - i
      : (i: number) => i + 1
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
      <div className={styles.tablaWrapper}>
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
              <th className={styles.th}>
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
              const posicion = posicionEnFila(index)
              const mejorTiempo =
                corredor.datos &&
                typeof corredor.datos === 'object' &&
                'mejorTiempo' in corredor.datos
                  ? (corredor.datos as { mejorTiempo?: number }).mejorTiempo
                  : undefined
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
                  <td className={styles.tdTiempo}>
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
