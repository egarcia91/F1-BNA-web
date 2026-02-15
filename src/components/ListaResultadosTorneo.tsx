import { useState } from 'react'
import type { Torneo } from '../types'
import styles from './ListaResultadosTorneo.module.css'

interface ListaResultadosTorneoProps {
  torneo: Torneo | null
}

export function ListaResultadosTorneo({ torneo }: ListaResultadosTorneoProps) {
  const [expandido, setExpandido] = useState(false)

  if (!torneo || !torneo.resultados || torneo.resultados.length === 0) return null

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
              <span className={styles.itemTitulo}>Resultados finales</span>
              <span className={expandido ? styles.chevronAbierto : styles.chevron}>
                ▼
              </span>
            </button>
            {expandido && (
            <div id="resultados-finales-tabla" className={styles.tablaWrapper}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th className={styles.th}>Nombre</th>
                    <th className={styles.th}>Apellido</th>
                    <th className={styles.th}>Equipo</th>
                    <th className={styles.th}>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {torneo.resultados.map((corredor, i) => (
                    <tr
                      key={corredor.id}
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
                      <td className={styles.td}>{corredor.nombre}</td>
                      <td className={styles.td}>{corredor.apellido ?? '—'}</td>
                      <td className={styles.td}>{corredor.equipo ?? '—'}</td>
                      <td className={styles.tdPuntos}>{corredor.puntos ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </li>
      </ul>
    </section>
  )
}
