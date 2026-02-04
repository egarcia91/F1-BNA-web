import { useState } from 'react'
import type { Torneo } from '../types'
import styles from './DetalleTorneo.module.css'

interface DetalleTorneoProps {
  torneo: Torneo | null
}

export function DetalleTorneo({ torneo }: DetalleTorneoProps) {
  const [abierto, setAbierto] = useState(false)

  if (!torneo) return null

  const tieneDetalles =
    torneo.lugar ||
    (torneo.reglas && torneo.reglas.length > 0) ||
    (torneo.puntajesTabla && torneo.puntajesTabla.length > 0) ||
    (torneo.puntajesAdicionales && torneo.puntajesAdicionales.trim() !== '')

  if (!tieneDetalles) return null

  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.botonTitulo}
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
      >
        <span>Detalles del torneo</span>
        <span className={styles.chevron} aria-hidden>
          {abierto ? '▼' : '▶'}
        </span>
      </button>
      {abierto && (
        <div className={styles.contenido}>
          {torneo.lugar && (
            <div className={styles.bloque}>
              <h3 className={styles.subtitulo}>Lugar</h3>
              <p className={styles.texto}>{torneo.lugar}</p>
            </div>
          )}
          {torneo.reglas && torneo.reglas.length > 0 && (
            <div className={styles.bloque}>
              <h3 className={styles.subtitulo}>Reglas</h3>
              <ul className={styles.lista}>
                {torneo.reglas.map((regla, i) => (
                  <li key={i} className={styles.itemLista}>
                    {regla}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(torneo.puntajesTabla?.length ?? 0) > 0 && (
            <div className={styles.bloque}>
              <h3 className={styles.subtitulo}>Puntos</h3>
              <div className={styles.tablaWrapper}>
                <table className={styles.tabla}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Posición</th>
                      <th className={styles.th}>Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {torneo.puntajesTabla!.map((fila, i) => (
                      <tr
                        key={i}
                        className={
                          i === 0
                            ? styles.filaOro
                            : i === 1
                              ? styles.filaPlata
                              : i === 2
                                ? styles.filaBronce
                                : undefined
                        }
                      >
                        <td className={styles.td}>{fila.posicion}</td>
                        <td className={styles.td}>{fila.puntos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {torneo.puntajesAdicionales &&
            torneo.puntajesAdicionales.trim() !== '' && (
              <div className={styles.bloque}>
                <h3 className={styles.subtitulo}>Puntos adicionales</h3>
                <p className={styles.textoPuntajes}>
                  {torneo.puntajesAdicionales}
                </p>
              </div>
            )}
        </div>
      )}
    </section>
  )
}
