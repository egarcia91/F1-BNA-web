import type { Torneo } from '../types'
import styles from './ListaPilotosTorneo.module.css'

interface ListaPilotosTorneoProps {
  torneo: Torneo | null
}

export function ListaPilotosTorneo({ torneo }: ListaPilotosTorneoProps) {
  if (!torneo || !torneo.pilotos || torneo.pilotos.length === 0) return null

  return (
    <section className={styles.section}>
      <h2 className={styles.titulo}>Pilotos</h2>
      <div className={styles.tablaWrapper}>
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
            {torneo.pilotos.map((piloto, i) => (
              <tr
                key={piloto.id}
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
                <td className={styles.td}>{piloto.nombre}</td>
                <td className={styles.td}>{piloto.apellido ?? '—'}</td>
                <td className={styles.td}>{piloto.equipo ?? '—'}</td>
                <td className={styles.tdPuntos}>{piloto.puntos ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
