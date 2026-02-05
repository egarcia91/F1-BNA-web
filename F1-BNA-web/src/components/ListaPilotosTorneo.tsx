import { useState } from 'react'
import type { Torneo } from '../types'
import styles from './ListaPilotosTorneo.module.css'

interface ListaPilotosTorneoProps {
  torneo: Torneo
}

export function ListaPilotosTorneo({ torneo }: ListaPilotosTorneoProps) {
  const [estaAbierto, setEstaAbierto] = useState(false)
  const [mostrarEquipo, setMostrarEquipo] = useState(false)

  const esTorneoEnProgreso = torneo.id === 't2'
  const tituloSeccion = torneo.id === 't1' ? 'Resultados' : 'Pilotos'

  const pilotosOrdenados = [...torneo.pilotos].sort((a, b) => {
    if (!esTorneoEnProgreso && a.puntos !== undefined && b.puntos !== undefined) {
      return b.puntos - a.puntos
    }
    return 0
  })

  const obtenerClaseEquipo = (equipo?: string): string => {
    if (!equipo) return ''
    const equipoNormalizado = equipo.toLowerCase().replace(/\s+/g, '')
    const mapeo: Record<string, string> = {
      'redbull': 'equipoRedBull',
      'astonmartin': 'equipoAstonMartin',
      'alpine': 'equipoAlpine',
      'ferrari': 'equipoFerrari',
      'mclaren': 'equipoMcLaren',
      'maclaren': 'equipoMcLaren',
      'mercedes': 'equipoMercedes',
    }
    return mapeo[equipoNormalizado] || ''
  }

  const obtenerRutaCara = (apellido?: string, equipo?: string): string | null => {
    if (!apellido || !equipo) return null
    const equipoNormalizado = equipo.replace(/\s+/g, ' ')
    const apellidoNormalizado = apellido.charAt(0).toUpperCase() + apellido.slice(1).toLowerCase()
    return `/Alpine Team ${apellidoNormalizado} Face.png`
  }

  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.botonTitulo}
        onClick={() => setEstaAbierto(!estaAbierto)}
      >
        <h2 className={styles.titulo}>{tituloSeccion}</h2>
        <span className={`${styles.chevron} ${estaAbierto ? styles.chevronAbierto : ''}`}>
          ▼
        </span>
      </button>

      {estaAbierto && (
        <>
          {!esTorneoEnProgreso && (
            <div className={styles.toggleWrapper}>
              <button
                type="button"
                className={`${styles.toggleBoton} ${mostrarEquipo ? styles.activo : ''}`}
                onClick={() => setMostrarEquipo(!mostrarEquipo)}
              >
                {mostrarEquipo ? 'Ver Puntos' : 'Ver Equipo'}
              </button>
            </div>
          )}

          {esTorneoEnProgreso ? (
            <ul className={styles.lista}>
              {pilotosOrdenados.map((piloto) => {
                const nombreCompleto = `${piloto.nombre} ${piloto.apellido || ''}`.trim()
                const numero = piloto.datos?.numero
                const peso = piloto.datos?.peso
                const claseEquipo = obtenerClaseEquipo(piloto.equipo)
                const rutaCara = obtenerRutaCara(piloto.apellido, piloto.equipo)

                return (
                  <li key={piloto.id} className={styles.item}>
                    <div className={`${styles.pilotoCard} ${claseEquipo}`}>
                      {rutaCara && (
                        <img
                          src={rutaCara}
                          alt={nombreCompleto}
                          className={styles.caraPiloto}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      )}
                      <div className={styles.info}>
                        <span className={styles.nombre}>{nombreCompleto}</span>
                        <div className={styles.detalles}>
                          {piloto.equipo && <span className={styles.detalle}>{piloto.equipo}</span>}
                          {peso && <span className={styles.detalle}>{peso} kg</span>}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className={styles.tablaWrapper}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th className={styles.th}>
                      <span className={styles.posDesktop}>Posición</span>
                      <span className={styles.posMovil}>Pos</span>
                    </th>
                    <th className={styles.th}>Nombre</th>
                    <th className={`${styles.th} ${styles.ocultoMovil}`}>Apellido</th>
                    <th className={`${styles.th} ${mostrarEquipo ? '' : styles.oculto}`}>
                      Equipo
                    </th>
                    <th className={`${styles.th} ${mostrarEquipo ? styles.oculto : ''}`}>
                      Puntos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pilotosOrdenados.map((piloto, i) => {
                    const nombreCompleto = `${piloto.nombre} ${piloto.apellido || ''}`.trim()
                    const apellidoInicial =
                      piloto.apellido && piloto.apellido.length > 0
                        ? `${piloto.apellido.charAt(0).toUpperCase()}.`
                        : ''

                    return (
                      <tr key={piloto.id} className={styles.fila}>
                        <td className={styles.td}>
                          <span className={styles.posicion}>
                            {i === 0 ? (
                              <span className={styles.trofeo}>🏆</span>
                            ) : (
                              i + 1
                            )}
                          </span>
                        </td>
                        <td className={styles.tdNombre}>
                          <span className={styles.nombreDesktop}>{piloto.nombre}</span>
                          <span className={styles.nombreMovil}>
                            {piloto.nombre} {apellidoInicial}
                          </span>
                        </td>
                        <td className={`${styles.td} ${styles.ocultoMovil}`}>
                          {piloto.apellido || '—'}
                        </td>
                        <td className={`${styles.td} ${mostrarEquipo ? '' : styles.oculto}`}>
                          {piloto.equipo ?? '—'}
                        </td>
                        <td className={`${styles.td} ${mostrarEquipo ? styles.oculto : ''}`}>
                          {piloto.puntos ?? 0} pts
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}
