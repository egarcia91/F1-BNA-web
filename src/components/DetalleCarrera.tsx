import { useMemo, useState } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import type { Carrera, Torneo } from '../types'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { getAuthLazy } from '../lib/firebase'
import { votarMvp } from '../lib/votarMvp'
import { useVotosMvp } from '../hooks/useVotosMvp'
import { ELO_BASE, eloAntesDeLaCarrera, calcularDeltaParaPosicion, calcularEloGlobal } from '../lib/elo'
import styles from './DetalleCarrera.module.css'

const NOMBRE_CARRERA_ANOTADOS = 'Night Race'

interface DetalleCarreraProps {
  torneo: Torneo | null
  carrera: Carrera | null
}

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

type ColumnaMovil = 'karting' | 'mejorTiempo' | 'vueltas' | 'ordenLargada' | 'elo'


function nombreCompletoCorredor(p: { nombre: string; apellido?: string }) {
  return [p.nombre, p.apellido].filter(Boolean).join(' ')
}

export function DetalleCarrera({ torneo, carrera }: DetalleCarreraProps) {
  const { user } = useAuth()
  const { pilotos, torneos } = useData()
  const [ordenPosicion, setOrdenPosicion] = useState<OrdenPosicion>('asc')
  const [ordenPor, setOrdenPor] = useState<OrdenPor>('posicion')
  const [columnaMovil, setColumnaMovil] = useState<ColumnaMovil>('mejorTiempo')
  const [votandoMvp, setVotandoMvp] = useState(false)
  const [errorVoto, setErrorVoto] = useState<string | null>(null)
  const [votoSeleccionado, setVotoSeleccionado] = useState<string>('')

  const tieneSeries = Boolean(carrera?.corredoresPorSerie && carrera?.series && carrera.series.length > 0)
  const seriesHorarios = useMemo(
    () => (tieneSeries && carrera?.series ? carrera.series.map((s) => s.horario) : []),
    [tieneSeries, carrera?.series]
  )
  const [serieSeleccionada, setSerieSeleccionada] = useState<string>(() =>
    seriesHorarios.length > 0 ? seriesHorarios[0] : ''
  )

  const esAmbas = tieneSeries && serieSeleccionada === 'ambas'

  const corredoresActivos = useMemo(() => {
    if (!carrera) return []
    if (tieneSeries && carrera.corredoresPorSerie) {
      if (serieSeleccionada === 'ambas') {
        return Object.values(carrera.corredoresPorSerie).flat()
      }
      return carrera.corredoresPorSerie[serieSeleccionada] ?? []
    }
    return carrera.corredores
  }, [carrera, tieneSeries, serieSeleccionada])

  const { mvpPilotoId, myVote, loading: loadingVotos, refetch: refetchVotos } = useVotosMvp(
    torneo?.id ?? null,
    carrera?.id ?? null,
    user?.email
  )

  const miPiloto = user?.email ? pilotos.find((p) => p.email === user.email) : null
  const todosCorredoresCarrera = useMemo(() => {
    if (!carrera) return []
    if (tieneSeries && carrera.corredoresPorSerie) {
      return Object.values(carrera.corredoresPorSerie).flat()
    }
    return carrera.corredores
  }, [carrera, tieneSeries])
  const esParticipante = Boolean(
    carrera && miPiloto && todosCorredoresCarrera.some((c) => c.id === miPiloto.id)
  )
  const carreraFinalizada = Boolean(carrera && todosCorredoresCarrera.length > 0)

  const anotados = useMemo(
    () => (carrera?.nombre === NOMBRE_CARRERA_ANOTADOS ? pilotos.filter((p) => p.presenteSiguienteCarrera === true) : []),
    [carrera?.nombre, pilotos]
  )

  const mostrarColumnasCompletas =
    !!carrera &&
    todosCorredoresCarrera.length === 0 &&
    torneo?.nombre === 'Copa BNA 2026'

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
    const list = [...corredoresActivos]
    if (esAmbas || ordenPor === 'mejorTiempo') {
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
  }, [corredoresActivos, ordenPosicion, ordenPor, esAmbas])

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

  const getPosicionCarrera = (corredor: (typeof corredoresActivos)[0]) => {
    const idx = corredoresActivos.findIndex((c) => c.id === corredor.id)
    return idx >= 0 ? idx + 1 : '—'
  }

  const eloPrevioMap = useMemo(
    () => (carrera
      ? eloAntesDeLaCarrera(torneos, carrera.id, tieneSeries && !esAmbas ? serieSeleccionada : null)
      : new Map<string, number>()),
    [torneos, carrera, tieneSeries, serieSeleccionada, esAmbas]
  )

  /** Elo final (tras todas las series) para la vista "Ambas" */
  const eloFinalMap = useMemo(() => {
    if (!esAmbas) return eloPrevioMap
    return calcularEloGlobal(torneos).eloMap
  }, [esAmbas, torneos, eloPrevioMap])

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
      {tieneSeries && carrera.series && carrera.series.length > 0 && (
        <div className={styles.selectorSerie}>
          <label htmlFor="serie-select" className={styles.selectorSerieLabel}>Serie:</label>
          <select
            id="serie-select"
            value={serieSeleccionada}
            onChange={(e) => setSerieSeleccionada(e.target.value)}
            className={styles.selectorSerieSelect}
          >
            {carrera.series.map((s) => (
              <option key={s.horario} value={s.horario}>
                {s.horario}
              </option>
            ))}
            <option value="ambas">Ambas</option>
          </select>
        </div>
      )}
      {carrera.detalle && (
        <p className={styles.detalle}>{carrera.detalle}</p>
      )}
      <h3 className={styles.subtitulo}>Corredores</h3>
      {esAmbas ? (
        /* ── Vista "Ambas": tabla simplificada, ordenada por mejor tiempo ── */
        <>
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
              <option value="karting">Karting</option>
              <option value="mejorTiempo">Mejor tiempo</option>
              <option value="vueltas">Vueltas</option>
              <option value="elo">Elo</option>
            </select>
          </div>
          <div className={styles.tablaWrapper} data-columna-movil={columnaMovil}>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th className={styles.th}>
                    <span className={styles.thDesktop}>Más Veloz</span>
                    <span className={styles.thMobile}>#</span>
                  </th>
                  <th className={styles.th}>Nombre</th>
                  <th className={`${styles.th} ${styles.thKarting}`}>Karting</th>
                  <th className={`${styles.th} ${styles.thVueltas}`}>Vueltas</th>
                  <th className={`${styles.th} ${styles.thTiempo}`}>
                    Mejor Tiempo
                    <span className={styles.thIndicador} aria-hidden> ↓</span>
                  </th>
                  <th className={`${styles.th} ${styles.thElo}`}>Elo</th>
                </tr>
              </thead>
              <tbody>
                {corredoresOrdenados.map((corredor, index) => {
                  const mejorTiempo = getMejorTiempo(corredor)
                  const mejorAbsoluto = corredoresOrdenados[0] ? getMejorTiempo(corredoresOrdenados[0]) : null
                  const diferencia =
                    index >= 1 && mejorAbsoluto != null && mejorTiempo != null
                      ? mejorTiempo - mejorAbsoluto
                      : null
                  const eloFinal = eloFinalMap.get(corredor.id) ?? ELO_BASE
                  return (
                    <tr key={corredor.id} className={styles.fila}>
                      <td className={styles.tdPosicion}>
                        <span className={styles.posicion}>{index + 1}</span>
                      </td>
                      <td className={styles.tdNombre}>
                        <span className={styles.nombreCompleto}>{corredor.nombre}</span>
                        <span className={styles.nombreCorto}>{nombreCorto(corredor.nombre)}</span>
                      </td>
                      <td className={styles.tdKarting}>
                        {corredor.datos && typeof corredor.datos === 'object' && 'karting' in corredor.datos &&
                        typeof (corredor.datos as { karting?: number }).karting === 'number'
                          ? (corredor.datos as { karting: number }).karting
                          : '—'}
                      </td>
                      <td className={styles.tdVueltas}>
                        {corredor.datos && typeof corredor.datos === 'object' && 'vueltas' in corredor.datos &&
                        typeof (corredor.datos as { vueltas?: number }).vueltas === 'number'
                          ? (corredor.datos as { vueltas: number }).vueltas
                          : '—'}
                      </td>
                      <td
                        className={
                          index === 0
                            ? `${styles.tdTiempo} ${styles.tiempoMejor}`
                            : `${styles.tdTiempo} ${styles.tiempoResto}`
                        }
                      >
                        {index >= 1 && diferencia != null && (
                          <span className={styles.diferenciaTiempo}>
                            +{diferencia.toFixed(3)}{' '}
                          </span>
                        )}
                        {mejorTiempo != null ? `${mejorTiempo.toFixed(3)} s` : '—'}
                      </td>
                      <td className={styles.tdElo}>{eloFinal}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* ── Vista por serie o carrera normal ── */
        <>
      {(corredoresActivos.some(
        (c) =>
          c.datos &&
          typeof c.datos === 'object' &&
          'karting' in c.datos
      ) ||
        corredoresActivos.some(
          (c) =>
            c.datos &&
            typeof c.datos === 'object' &&
            'vueltas' in c.datos
        ) ||
        corredoresActivos.some(
          (c) =>
            c.datos &&
            typeof c.datos === 'object' &&
            'ordenLargada' in c.datos
        ) ||
        corredoresActivos.length > 0 ||
        mostrarColumnasCompletas) && (
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
              {(corredoresActivos.some(
                (c) => c.datos && typeof c.datos === 'object' && 'karting' in c.datos
              ) || mostrarColumnasCompletas) && (
                <option value="karting">Karting</option>
              )}
              <option value="mejorTiempo">Mejor tiempo</option>
              {(corredoresActivos.some(
                (c) => c.datos && typeof c.datos === 'object' && 'vueltas' in c.datos
              ) || mostrarColumnasCompletas) && (
                <option value="vueltas">Vueltas</option>
              )}
              {(corredoresActivos.some(
                (c) => c.datos && typeof c.datos === 'object' && 'ordenLargada' in c.datos
              ) || mostrarColumnasCompletas) && (
                <option value="ordenLargada">Orden largada</option>
              )}
              <option value="elo">Elo</option>
            </select>
        </div>
      )}
      <div
        className={styles.tablaWrapper}
        data-columna-movil={
          corredoresActivos.some(
            (c) =>
              c.datos &&
              typeof c.datos === 'object' &&
              'karting' in c.datos
          ) ||
          corredoresActivos.some(
            (c) =>
              c.datos &&
              typeof c.datos === 'object' &&
              'vueltas' in c.datos
          ) ||
          corredoresActivos.some(
            (c) =>
              c.datos &&
              typeof c.datos === 'object' &&
              'ordenLargada' in c.datos
          ) ||
          corredoresActivos.length > 0 ||
          mostrarColumnasCompletas
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
              {(corredoresActivos.some(
                (c) =>
                  c.datos &&
                  typeof c.datos === 'object' &&
                  'karting' in c.datos
              ) || mostrarColumnasCompletas) && (
                <th className={`${styles.th} ${styles.thKarting}`}>Karting</th>
              )}
              {(corredoresActivos.some(
                (c) =>
                  c.datos &&
                  typeof c.datos === 'object' &&
                  'vueltas' in c.datos
              ) || mostrarColumnasCompletas) && (
                <th className={`${styles.th} ${styles.thVueltas}`}>Vueltas</th>
              )}
              {(corredoresActivos.some(
                (c) =>
                  c.datos &&
                  typeof c.datos === 'object' &&
                  'ordenLargada' in c.datos
              ) || mostrarColumnasCompletas) && (
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
              <th className={`${styles.th} ${styles.thElo}`}>Elo</th>
            </tr>
          </thead>
          <tbody>
            {mostrarColumnasCompletas && corredoresOrdenados.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.tdVacio}>
                  Aún no se corrió
                </td>
              </tr>
            ) : (
            corredoresOrdenados.map((corredor, index) => {
              const posicion = getPosicionCarrera(corredor)
              const posicionCarreraNum =
                corredoresActivos.findIndex((c) => c.id === corredor.id) + 1
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
                    {corredor.id === mvpPilotoId && (
                      <span className={styles.estrellaMvp} title="MVP de la carrera" aria-hidden>★</span>
                    )}
                    <span className={styles.nombreCompleto}>
                      {corredor.nombre}
                    </span>
                    <span className={styles.nombreCorto}>
                      {nombreCorto(corredor.nombre)}
                    </span>
                  </td>
                  {(corredoresActivos.some(
                    (c) =>
                      c.datos &&
                      typeof c.datos === 'object' &&
                      'karting' in c.datos
                  ) || mostrarColumnasCompletas) && (
                    <td className={styles.tdKarting}>
                      {corredor.datos &&
                      typeof corredor.datos === 'object' &&
                      'karting' in corredor.datos &&
                      typeof (corredor.datos as { karting?: number }).karting === 'number'
                        ? (corredor.datos as { karting: number }).karting
                        : '—'}
                    </td>
                  )}
                  {(corredoresActivos.some(
                    (c) =>
                      c.datos &&
                      typeof c.datos === 'object' &&
                      'vueltas' in c.datos
                  ) || mostrarColumnasCompletas) && (
                    <td className={styles.tdVueltas}>
                      {corredor.datos &&
                      typeof corredor.datos === 'object' &&
                      'vueltas' in corredor.datos &&
                      typeof (corredor.datos as { vueltas?: number }).vueltas === 'number'
                        ? (corredor.datos as { vueltas: number }).vueltas
                        : '—'}
                    </td>
                  )}
                  {(corredoresActivos.some(
                    (c) =>
                      c.datos &&
                      typeof c.datos === 'object' &&
                      'ordenLargada' in c.datos
                  ) || mostrarColumnasCompletas) && (
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
                  <td className={styles.tdElo}>
                    {posicionCarreraNum >= 1 ? (() => {
                      const delta = calcularDeltaParaPosicion(
                        posicionCarreraNum, corredor.id, corredoresActivos, eloPrevioMap
                      )
                      const eloPrevio = eloPrevioMap.get(corredor.id) ?? ELO_BASE
                      return (
                        <>
                          {delta >= 0 ? (
                            <span className={styles.eloDeltaSuma}>
                              +{delta}{' '}
                            </span>
                          ) : (
                            <span className={styles.eloDeltaResta}>
                              {delta}{' '}
                            </span>
                          )}
                          {eloPrevio + delta}
                        </>
                      )
                    })() : (
                      '—'
                    )}
                  </td>
                </tr>
              )
            })
            )}
          </tbody>
        </table>
      </div>
        </>
      )}
      {carreraFinalizada && (
        <div className={styles.bloqueVotarMvp}>
          <h3 className={styles.subtitulo}>MVP de la carrera</h3>
          {loadingVotos ? (
            <p className={styles.votosCargando}>Cargando votos…</p>
          ) : mvpPilotoId ? (
            <p className={styles.mvpActual}>
              <span className={styles.estrellaMvp} aria-hidden>★</span>{' '}
              {nombreCompletoCorredor(todosCorredoresCarrera.find((c) => c.id === mvpPilotoId) ?? { nombre: '', apellido: '' })}
            </p>
          ) : (
            <p className={styles.mvpNadie}>Aún no hay votos.</p>
          )}
          {esParticipante && (
            <div className={styles.votarMvpForm}>
              <label htmlFor="voto-mvp-select" className={styles.votarMvpLabel}>
                {myVote ? 'Cambiar tu voto:' : 'Votar por el MVP:'}
              </label>
              <select
                id="voto-mvp-select"
                value={votoSeleccionado || myVote || ''}
                onChange={(e) => setVotoSeleccionado(e.target.value)}
                className={styles.votarMvpSelect}
                disabled={votandoMvp}
              >
                <option value="">— Elegir —</option>
                {todosCorredoresCarrera.map((c) => (
                  <option key={c.id} value={c.id}>
                    {nombreCompletoCorredor(c)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles.votarMvpBoton}
                disabled={votandoMvp || !(votoSeleccionado || myVote)}
                onClick={async () => {
                  const pilotId = votoSeleccionado || myVote
                  if (!pilotId || !user?.email || !torneo?.id) return
                  setErrorVoto(null)
                  setVotandoMvp(true)
                  try {
                    const auth = getAuthLazy()
                    if (auth && !auth.currentUser) await signInWithPopup(auth, new GoogleAuthProvider())
                    await votarMvp(torneo.id, carrera.id, pilotId, user.email)
                    await refetchVotos()
                    setVotoSeleccionado('')
                  } catch (e) {
                    setErrorVoto(e instanceof Error ? e.message : 'No se pudo registrar el voto')
                  } finally {
                    setVotandoMvp(false)
                  }
                }}
              >
                {votandoMvp ? '…' : myVote ? 'Actualizar voto' : 'Votar'}
              </button>
              {errorVoto && <p className={styles.errorVoto}>{errorVoto}</p>}
            </div>
          )}
        </div>
      )}
      {carrera.nombre === NOMBRE_CARRERA_ANOTADOS && (
        <div className={styles.bloqueAnotados}>
          <h3 className={styles.subtitulo}>Anotados</h3>
          {anotados.length === 0 ? (
            <p className={styles.anotadosVacio}>Nadie anotado aún.</p>
          ) : (
            <ul className={styles.listaAnotados}>
              {anotados.map((p) => (
                <li key={p.id} className={styles.itemAnotado}>
                  {nombreCompletoCorredor(p)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
