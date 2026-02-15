import type { Carrera } from '../types'
import { DetalleCarrera } from './DetalleCarrera'
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
    <section className={styles.section}>
      <h2>Carreras</h2>
      <ul className={styles.lista}>
        {carreras.map((carrera) => (
          <li key={carrera.id} className={styles.itemCarrera}>
            <button
              type="button"
              className={
                carreraSeleccionadaId === carrera.id
                  ? `${styles.botonActivo} ${styles.botonExpandido}`
                  : styles.boton
              }
              onClick={() => onSeleccionar(carrera)}
            >
              <span className={styles.nombre}>{carrera.nombre}</span>
              <span className={styles.fecha}>{carrera.fecha}</span>
            </button>
            {carreraSeleccionadaId === carrera.id && (
              <div className={styles.detalleWrapper}>
                <DetalleCarrera carrera={carrera} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
