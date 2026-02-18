import type { Carrera, Torneo } from '../types'
import { DetalleCarrera } from './DetalleCarrera'
import styles from './ListaCarreras.module.css'

interface ListaCarrerasProps {
  torneo: Torneo | null
  carreras: Carrera[]
  carreraSeleccionadaId: string | null
  onSeleccionar: (carrera: Carrera) => void
}

export function ListaCarreras({
  torneo,
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
              <span className={styles.nombre}>
                {carrera.mostrarEstrella && (
                  <span className={styles.estrellaDorada} aria-hidden>★</span>
                )}
                {carrera.nombre}
              </span>
              <span className={styles.fecha}>{carrera.fecha}</span>
            </button>
            {carreraSeleccionadaId === carrera.id && (
              <div className={styles.detalleWrapper}>
                <DetalleCarrera torneo={torneo} carrera={carrera} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
