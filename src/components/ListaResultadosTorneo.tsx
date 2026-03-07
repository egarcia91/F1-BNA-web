import { useMemo, useState, useCallback, useEffect } from 'react'
import type { Corredor, Torneo } from '../types'
import { useData } from '../context/DataContext'
import { listasDeCorrredores } from '../lib/elo'
import styles from './ListaResultadosTorneo.module.css'

interface ListaResultadosTorneoProps {
  torneo: Torneo | null
}

interface DesgloseSerie {
  serie: string
  posicion: number
  ptsPosicion: number
  adelantamientos: number
  ptsAdelantamientos: number
  rezagados: number
  ptsRezagados: number
  pole: boolean
  mantuvoPosicion: boolean
  vueltaRapida: boolean
}

interface DetallePiloto {
  id: string
  nombre: string
  apellido?: string
  equipo?: string
  puntos: number
  desglose: DesgloseSerie[]
}

const PTS_POR_ADELANTAMIENTO = 2
const PTS_POR_REZAGADO = 1
const PTS_POLE = 2
const PTS_MANTENER_POS = 1
const PTS_VUELTA_RAPIDA = 2

function calcularDetallePilotos(
  torneo: Torneo,
  pilotosBase: Corredor[]
): DetallePiloto[] {
  const tabla = torneo.puntajesTabla ?? []
  const puntosPorPos = new Map(tabla.map((r) => [Number(r.posicion), r.puntos]))
  const desgloseMap = new Map<string, DesgloseSerie[]>()
  const totalMap = new Map<string, number>()

  for (const carrera of torneo.carreras) {
    const listas = listasDeCorrredores(carrera)
    const series = carrera.series
    listas.forEach((lista, listaIdx) => {
      const nombreSerie = series?.[listaIdx]
        ? `${carrera.nombre} ${series[listaIdx].horario}`
        : carrera.nombre

      let mejorTiempo = Infinity
      let idMejorTiempo: string | null = null
      for (const c of lista) {
        const t = Number(c.datos?.mejorTiempo) || Infinity
        if (t < mejorTiempo) { mejorTiempo = t; idMejorTiempo = c.id }
      }

      lista.forEach((c, idx) => {
        const posFinal = idx + 1
        const ptsPosicion = puntosPorPos.get(posFinal) ?? 0
        const largada = Number(c.datos?.ordenLargada)

        const adelantamientos = (largada && largada > posFinal) ? largada - posFinal : 0
        const ptsAdel = adelantamientos * PTS_POR_ADELANTAMIENTO

        let rezagados = 0
        const vueltasPropias = Number(c.datos?.vueltas) || 0
        if (vueltasPropias > 0) {
          for (const otro of lista) {
            if (otro.id === c.id) continue
            const vo = Number(otro.datos?.vueltas) || 0
            if (vo < vueltasPropias) rezagados += vueltasPropias - vo
          }
        }
        const ptsRez = rezagados * PTS_POR_REZAGADO

        const pole = largada === 1
        const mantuvoPosicion = !!(largada && largada === posFinal)
        const vueltaRapida = c.id === idMejorTiempo

        const totalSerie = ptsPosicion + ptsAdel + ptsRez
          + (pole ? PTS_POLE : 0)
          + (mantuvoPosicion ? PTS_MANTENER_POS : 0)
          + (vueltaRapida ? PTS_VUELTA_RAPIDA : 0)

        const arr = desgloseMap.get(c.id) ?? []
        arr.push({
          serie: nombreSerie,
          posicion: posFinal,
          ptsPosicion,
          adelantamientos,
          ptsAdelantamientos: ptsAdel,
          rezagados,
          ptsRezagados: ptsRez,
          pole,
          mantuvoPosicion,
          vueltaRapida,
        })
        desgloseMap.set(c.id, arr)
        totalMap.set(c.id, (totalMap.get(c.id) ?? 0) + totalSerie)
      })
    })
  }

  const pilotoMap = new Map(pilotosBase.map((p) => [p.id, p]))

  return [...totalMap.entries()]
    .filter(([, pts]) => pts > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id, pts]) => {
      const base = pilotoMap.get(id)
      return {
        id,
        nombre: base?.nombre ?? id,
        apellido: base?.apellido,
        equipo: base?.equipo,
        puntos: pts,
        desglose: desgloseMap.get(id) ?? [],
      }
    })
}

type ModoResultados = 'pilotos' | 'constructores'

interface FilaConstructor {
  equipo: string
  puntos: number
  pilotos: { nombre: string; apellido?: string; puntos: number }[]
}

function agruparPorConstructor(detalle: DetallePiloto[]): FilaConstructor[] {
  const equipoMap = new Map<string, FilaConstructor>()
  for (const d of detalle) {
    const eq = d.equipo ?? 'Sin equipo'
    const entry = equipoMap.get(eq) ?? { equipo: eq, puntos: 0, pilotos: [] }
    entry.puntos += d.puntos
    entry.pilotos.push({ nombre: d.nombre, apellido: d.apellido, puntos: d.puntos })
    equipoMap.set(eq, entry)
  }
  for (const entry of equipoMap.values()) {
    entry.pilotos.sort((a, b) => b.puntos - a.puntos)
  }
  return [...equipoMap.values()].sort((a, b) => b.puntos - a.puntos)
}

function ModalDetallePiloto({ piloto, onClose }: { piloto: DetallePiloto; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const nombreCompleto = `${piloto.nombre}${piloto.apellido ? ` ${piloto.apellido}` : ''}`

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitulo}>{nombreCompleto}</span>
          <span className={styles.modalEquipo}>{piloto.equipo ?? ''}</span>
          <button type="button" className={styles.modalCerrar} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          {piloto.desglose.map((d) => (
            <div key={d.serie} className={styles.desgloseSerie}>
              <h4 className={styles.desgloseSerieNombre}>{d.serie}</h4>
              <table className={styles.desgloseTabla}>
                <tbody>
                  <tr>
                    <td className={styles.desgloseTd}>Posición {d.posicion}º</td>
                    <td className={styles.desgloseTdPts}>{d.ptsPosicion} pts</td>
                  </tr>
                  {d.adelantamientos > 0 && (
                    <tr>
                      <td className={styles.desgloseTd}>{d.adelantamientos} adelantamiento{d.adelantamientos > 1 ? 's' : ''}</td>
                      <td className={styles.desgloseTdPts}>{d.ptsAdelantamientos} pts</td>
                    </tr>
                  )}
                  {d.rezagados > 0 && (
                    <tr>
                      <td className={styles.desgloseTd}>Rezagados ({d.rezagados} vuelta{d.rezagados > 1 ? 's' : ''})</td>
                      <td className={styles.desgloseTdPts}>{d.ptsRezagados} pts</td>
                    </tr>
                  )}
                  {d.pole && (
                    <tr>
                      <td className={styles.desgloseTd}>Pole position</td>
                      <td className={styles.desgloseTdPts}>{PTS_POLE} pts</td>
                    </tr>
                  )}
                  {d.mantuvoPosicion && (
                    <tr>
                      <td className={styles.desgloseTd}>Mantuvo posición</td>
                      <td className={styles.desgloseTdPts}>{PTS_MANTENER_POS} pts</td>
                    </tr>
                  )}
                  {d.vueltaRapida && (
                    <tr>
                      <td className={styles.desgloseTd}>Vuelta más rápida</td>
                      <td className={styles.desgloseTdPts}>{PTS_VUELTA_RAPIDA} pts</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
          <div className={styles.desgloseTotal}>
            Total: <strong>{piloto.puntos} pts</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalDetalleConstructor({ fila, onClose }: { fila: FilaConstructor; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitulo}>{fila.equipo}</span>
          <button type="button" className={styles.modalCerrar} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>
          <table className={styles.desgloseTabla}>
            <thead>
              <tr>
                <th className={styles.desgloseTh}>Piloto</th>
                <th className={styles.desgloseThPts}>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {fila.pilotos.map((p) => (
                <tr key={`${p.nombre}-${p.apellido}`}>
                  <td className={styles.desgloseTd}>{p.nombre}{p.apellido ? ` ${p.apellido}` : ''}</td>
                  <td className={styles.desgloseTdPts}>{p.puntos} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.desgloseTotal}>
            Total: <strong>{fila.puntos} pts</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ListaResultadosTorneo({ torneo }: ListaResultadosTorneoProps) {
  const { pilotos } = useData()
  const [expandido, setExpandido] = useState(false)
  const [modo, setModo] = useState<ModoResultados>('pilotos')
  const [pilotoModal, setPilotoModal] = useState<DetallePiloto | null>(null)
  const [constructorModal, setConstructorModal] = useState<FilaConstructor | null>(null)

  const enProgreso = torneo?.estado === 'en_progreso'
  const hayResultadosEstáticos =
    torneo?.resultados != null && torneo.resultados.length > 0

  const detallePilotos = useMemo(() => {
    if (!torneo || !enProgreso) return []
    return calcularDetallePilotos(torneo, pilotos)
  }, [torneo, enProgreso, pilotos])

  const filasPilotos: Corredor[] = enProgreso
    ? detallePilotos
    : (torneo?.resultados ?? [])

  const filasConstructores = useMemo(
    () => agruparPorConstructor(detallePilotos),
    [detallePilotos]
  )

  const cerrarModal = useCallback(() => {
    setPilotoModal(null)
    setConstructorModal(null)
  }, [])

  if (!torneo || (filasPilotos.length === 0 && !hayResultadosEstáticos)) return null

  const tituloItem = enProgreso ? 'Resultados Parciales' : 'Resultados finales'

  return (
    <section className={styles.section}>
      <h2>Resultados</h2>
      <ul className={styles.lista}>
        <li>
          <div className={styles.itemResultados}>
            <button
              type="button"
              className={styles.botonCabecera}
              onClick={() => setExpandido((e) => !e)}
              aria-expanded={expandido}
              aria-controls="resultados-finales-tabla"
            >
              <span className={styles.itemTitulo}>{tituloItem}</span>
              <span className={expandido ? styles.chevronAbierto : styles.chevron}>
                ▼
              </span>
            </button>
            {expandido && (
            <div id="resultados-finales-tabla" className={styles.tablaWrapper}>
              <div className={styles.selectorWrapper}>
                <select
                  className={styles.selector}
                  value={modo}
                  onChange={(e) => setModo(e.target.value as ModoResultados)}
                >
                  <option value="pilotos">Campeonato de pilotos</option>
                  <option value="constructores">Campeonato de constructores</option>
                </select>
              </div>

              {modo === 'pilotos' ? (
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th className={styles.th}>#</th>
                    <th className={styles.th}>Nombre</th>
                    <th className={styles.th}>Equipo</th>
                    <th className={styles.th}>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {filasPilotos.map((corredor, i) => {
                    const det = detallePilotos.find((d) => d.id === corredor.id)
                    return (
                    <tr
                      key={corredor.id}
                      className={`${styles.filaClickable} ${
                        i === 0
                          ? styles.filaOro
                          : i === 1
                            ? styles.filaPlata
                            : i === 2
                              ? styles.filaBronce
                              : ''
                      }`}
                      onClick={() => det && setPilotoModal(det)}
                    >
                      <td className={styles.td}>{i + 1}</td>
                      <td className={styles.td}>
                        {corredor.nombre}{corredor.apellido ? ` ${corredor.apellido}` : ''}
                      </td>
                      <td className={styles.td}>{corredor.equipo ?? '—'}</td>
                      <td className={styles.tdPuntos}>{corredor.puntos ?? '—'}</td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
              ) : (
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th className={styles.th}>#</th>
                    <th className={styles.th}>Equipo</th>
                    <th className={styles.th}>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {filasConstructores.map((fila, i) => (
                    <tr
                      key={fila.equipo}
                      className={`${styles.filaClickable} ${
                        i === 0
                          ? styles.filaOro
                          : i === 1
                            ? styles.filaPlata
                            : i === 2
                              ? styles.filaBronce
                              : ''
                      }`}
                      onClick={() => setConstructorModal(fila)}
                    >
                      <td className={styles.td}>{i + 1}</td>
                      <td className={styles.td}>{fila.equipo}</td>
                      <td className={styles.tdPuntos}>{fila.puntos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
            )}
          </div>
        </li>
      </ul>

      {pilotoModal && <ModalDetallePiloto piloto={pilotoModal} onClose={cerrarModal} />}
      {constructorModal && <ModalDetalleConstructor fila={constructorModal} onClose={cerrarModal} />}
    </section>
  )
}
