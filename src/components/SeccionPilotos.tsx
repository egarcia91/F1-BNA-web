import { useState } from 'react'
import type { Corredor } from '../types'
import { pilotos } from '../data/pilotos'
import styles from './SeccionPilotos.module.css'

function nombreCompleto(p: Corredor) {
  return [p.nombre, p.apellido].filter(Boolean).join(' ')
}

function datoNumero(p: Corredor) {
  const n = p.datos && typeof p.datos === 'object' && 'numero' in p.datos
    ? (p.datos as { numero?: number }).numero
    : undefined
  return n != null ? String(n) : '—'
}

function datoPeso(p: Corredor) {
  const w = p.datos && typeof p.datos === 'object' && 'peso' in p.datos
    ? (p.datos as { peso?: number }).peso
    : undefined
  return w != null ? `${w} kg` : '—'
}

export function SeccionPilotos() {
  const [visible, setVisible] = useState(false)

  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.botonTitulo}
        onClick={() => setVisible((v) => !v)}
        aria-expanded={visible}
        aria-controls="seccion-pilotos-lista"
      >
        <span className={styles.titulo}>Pilotos</span>
        <span className={visible ? styles.chevronAbierto : styles.chevron}>
          ▼
        </span>
      </button>
      {visible && (
      <ul id="seccion-pilotos-lista" className={styles.lista}>
        {pilotos.map((piloto) => (
          <li
            key={piloto.id}
            className={
              piloto.equipo === 'Red Bull'
                ? `${styles.item} ${styles.itemRedBull}`
                : piloto.equipo === 'Aston Martin'
                  ? `${styles.item} ${styles.itemAstonMartin}`
                  : piloto.equipo === 'Alpine'
                    ? `${styles.item} ${styles.itemAlpine}`
                    : piloto.equipo === 'Ferrari'
                      ? `${styles.item} ${styles.itemFerrari}`
                      : piloto.equipo === 'McLaren'
                        ? `${styles.item} ${styles.itemMcLaren}`
                        : piloto.equipo === 'Mercedes'
                          ? `${styles.item} ${styles.itemMercedes}`
                          : styles.item
            }
          >
            <div className={styles.logoWrap}>
              {piloto.equipo === 'Red Bull' && (
                <img
                  src="/redbull.png"
                  alt=""
                  className={styles.logoEscuderia}
                />
              )}
              {piloto.equipo === 'Aston Martin' && (
                <img
                  src="/astonmartin.png"
                  alt=""
                  className={styles.logoEscuderia}
                />
              )}
              {piloto.equipo === 'Alpine' && (
                <img
                  src="/alpine.png"
                  alt=""
                  className={styles.logoEscuderia}
                />
              )}
              {piloto.equipo === 'Ferrari' && (
                <img
                  src="/ferrari.png"
                  alt=""
                  className={styles.logoEscuderia}
                />
              )}
              {piloto.equipo === 'McLaren' && (
                <img
                  src="/mclaren.png"
                  alt=""
                  className={styles.logoEscuderia}
                />
              )}
              {piloto.equipo === 'Mercedes' && (
                <img
                  src="/mercedesbenz.png"
                  alt=""
                  className={styles.logoEscuderia}
                />
              )}
            </div>
            <div className={styles.itemContenido}>
            <span className={styles.nombre}>{nombreCompleto(piloto)}</span>
            <span className={styles.meta}>
              <span className={styles.dato}>
                <span className={styles.datoLabel}>Nº</span>{' '}
                {datoNumero(piloto)}
              </span>
              <span className={styles.dato}>
                {datoPeso(piloto)}
              </span>
              {piloto.equipo !== 'Red Bull' && piloto.equipo !== 'Aston Martin' && piloto.equipo !== 'Alpine' && piloto.equipo !== 'Ferrari' && piloto.equipo !== 'McLaren' && piloto.equipo !== 'Mercedes' && (
                <span className={styles.escuderia}>{piloto.equipo ?? '—'}</span>
              )}
            </span>
            </div>
          </li>
        ))}
      </ul>
      )}
    </section>
  )
}
