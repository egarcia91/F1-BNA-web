import type { Carrera } from '../types'
import styles from './DetalleCarrera.module.css'

interface DetalleCarreraProps {
  carrera: Carrera | null
}

export function DetalleCarrera({ carrera }: DetalleCarreraProps) {
  if (!carrera) {
    return (
      <section className={styles.section}>
        <p className={styles.placeholder}>
          Seleccioná una carrera para ver los corredores.
        </p>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.tituloCarrera}>
        {carrera.mostrarEstrella && (
          <span className={styles.estrellaDorada} aria-hidden>★</span>
        )}
        {carrera.nombre}
      </h2>
      <p className={styles.fecha}>Fecha: {carrera.fecha}</p>
      {carrera.lugar && (
        <p className={styles.lugar}>Lugar: {carrera.lugar}</p>
      )}
      <h3 className={styles.subtitulo}>Corredores</h3>
      <ul className={styles.lista}>
        {carrera.corredores.map((corredor, index) => (
          <li key={corredor.id} className={styles.fila}>
            <span className={styles.posicion}>{index + 1}</span>
            <span className={styles.nombre}>{corredor.nombre}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
