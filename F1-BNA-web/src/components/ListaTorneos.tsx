import type { Torneo } from '../types'
import styles from './ListaTorneos.module.css'

interface ListaTorneosProps {
  torneos: Torneo[]
  torneoSeleccionadoId: string | null
  onSeleccionar: (torneo: Torneo) => void
}

export function ListaTorneos({
  torneos,
  torneoSeleccionadoId,
  onSeleccionar,
}: ListaTorneosProps) {
  return (
    <ul className={styles.lista}>
      {torneos.map((torneo) => (
        <li key={torneo.id}>
          <button
            type="button"
            className={`${styles.boton} ${
              torneoSeleccionadoId === torneo.id ? styles.activo : ''
            }`}
            onClick={() => onSeleccionar(torneo)}
          >
            <span className={styles.nombre}>
              {torneo.nombre}
              {torneo.id === 't1' && <span className={styles.estado}>Concluido</span>}
              {torneo.id === 't2' && <span className={styles.estado}>En Progreso</span>}
            </span>
            <span className={styles.cantidad}>
              {torneo.carreras.length} {torneo.carreras.length === 1 ? 'carrera' : 'carreras'}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
