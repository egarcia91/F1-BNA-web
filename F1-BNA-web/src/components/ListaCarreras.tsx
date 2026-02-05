import type { Carrera } from '../types'
import styles from './ListaCarreras.module.css'

interface ListaCarrerasProps {
  carreras: Carrera[]
  carreraSeleccionadaId: string | null
  onSeleccionar: (carrera: Carrera) => void
}

export function ListaCarreras({
  carreras,
  carreraSeleccionadaId,
  onSeleccionar,
}: ListaCarrerasProps) {
  return (
    <ul className={styles.lista}>
      {carreras.map((carrera) => (
        <li key={carrera.id}>
          <button
            type="button"
            className={`${styles.boton} ${
              carreraSeleccionadaId === carrera.id ? styles.activo : ''
            }`}
            onClick={() => onSeleccionar(carrera)}
          >
            <span className={styles.nombre}>
              {carrera.nombre === 'Final' && (
                <span className={styles.estrella}>⭐</span>
              )}
              {carrera.nombre}
            </span>
            <span className={styles.fecha}>{carrera.fecha}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
