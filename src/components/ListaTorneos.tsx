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
    <section className={styles.section}>
      <h2>Torneos</h2>
      <ul className={styles.lista}>
        {torneos.map((torneo) => (
          <li key={torneo.id}>
            <button
              type="button"
              className={
                torneoSeleccionadoId === torneo.id
                  ? styles.botonActivo
                  : styles.boton
              }
              onClick={() => onSeleccionar(torneo)}
            >
              <span className={styles.nombre}>{torneo.nombre}</span>
              <span className={styles.cantidad}>
                {torneo.carreras.length}{' '}
                {torneo.carreras.length === 1 ? 'carrera' : 'carreras'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
