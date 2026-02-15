import type { Torneo } from '../types'
import styles from './DetalleTorneo.module.css'

interface DetalleTorneoProps {
  torneo: Torneo
}

export function DetalleTorneo({ torneo }: DetalleTorneoProps) {
  if (!torneo) return null

  return (
    <section className={styles.section}>
      <h2 className={styles.titulo}>{torneo.nombre}</h2>
      <p className={styles.descripcion}>
        {torneo.carreras.length} {torneo.carreras.length === 1 ? 'carrera programada' : 'carreras programadas'}
      </p>
    </section>
  )
}
