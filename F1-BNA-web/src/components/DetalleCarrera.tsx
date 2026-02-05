import { useMemo, useState } from 'react'
import type { Carrera } from '../types'
import styles from './DetalleCarrera.module.css'

interface DetalleCarreraProps {
  carrera: Carrera | null
}

type OrdenPor = 'posicion' | 'mejorVuelta'
type DireccionOrden = 'asc' | 'desc'

interface CorredorConIndice {
  id: string
  nombre: string
  mejorTiempo?: number
  indiceOriginal: number
}

export function DetalleCarrera({ carrera }: DetalleCarreraProps) {
  const [ordenPor, setOrdenPor] = useState<OrdenPor | null>(null)
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>('asc')

  const corredoresConIndice: CorredorConIndice[] = useMemo(() => {
    if (!carrera) return []
    return carrera.corredores.map((corredor, index) => ({
      id: corredor.id,
      nombre: corredor.nombre,
      mejorTiempo: corredor.datos?.mejorTiempo,
      indiceOriginal: index,
    }))
  }, [carrera])

  const corredoresOrdenados = useMemo(() => {
    if (!ordenPor) return corredoresConIndice

    const copia = [...corredoresConIndice]

    if (ordenPor === 'posicion') {
      if (direccionOrden === 'asc') {
        return copia
      } else {
        return copia.reverse()
      }
    } else if (ordenPor === 'mejorVuelta') {
      return copia.sort((a, b) => {
        const tiempoA = a.mejorTiempo ?? Infinity
        const tiempoB = b.mejorTiempo ?? Infinity
        return tiempoA - tiempoB
      })
    }

    return copia
  }, [corredoresConIndice, ordenPor, direccionOrden])

  const manejarOrden = (campo: OrdenPor) => {
    if (campo === 'mejorVuelta') {
      // Solo ordenar ascendente para mejor vuelta
      setOrdenPor('mejorVuelta')
      setDireccionOrden('asc')
    } else {
      // Para posición, alternar entre asc y desc
      if (ordenPor === campo) {
        setDireccionOrden(direccionOrden === 'asc' ? 'desc' : 'asc')
      } else {
        setOrdenPor(campo)
        setDireccionOrden('asc')
      }
    }
  }

  if (!carrera) return null

  const esFinal = carrera.nombre === 'Final'

  return (
    <section className={styles.section}>
      <h2 className={styles.titulo}>{carrera.nombre}</h2>
      <p className={styles.fecha}>{carrera.fecha}</p>
      <p className={styles.lugar}>{carrera.lugar}</p>

      {esFinal && (
        <div className={styles.descripcion}>
          <h3 className={styles.subtitulo}>Corredores</h3>
          <p>
            Serán los 10 pilotos más veloces de las instancias anteriores y los 5 pilotos del equipo con más puntos.
          </p>
        </div>
      )}

      {!esFinal && carrera.corredores.length > 0 && (
        <div className={styles.tablaWrapper}>
          <table className={styles.tabla}>
            <thead>
              <tr>
                <th
                  className={`${styles.th} ${styles.thOrdenable}`}
                  onClick={() => manejarOrden('posicion')}
                >
                  Posición
                  {ordenPor === 'posicion' && (
                    <span className={styles.indicadorOrden}>
                      {direccionOrden === 'asc' ? ' ▲' : ' ▼'}
                    </span>
                  )}
                </th>
                <th className={styles.th}>Nombre</th>
                <th
                  className={`${styles.th} ${styles.thOrdenable}`}
                  onClick={() => manejarOrden('mejorVuelta')}
                >
                  Mejor vuelta
                  {ordenPor === 'mejorVuelta' && (
                    <span className={styles.indicadorOrden}> ▲</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {corredoresOrdenados.map((corredor, index) => {
                let diferencia: number | null = null
                if (
                  ordenPor === 'mejorVuelta' &&
                  direccionOrden === 'asc' &&
                  corredor.mejorTiempo !== undefined &&
                  index > 0
                ) {
                  const primerTiempo = corredoresOrdenados[0]?.mejorTiempo
                  if (primerTiempo !== undefined) {
                    diferencia = corredor.mejorTiempo - primerTiempo
                  }
                }
                return (
                  <tr key={corredor.id} className={styles.fila}>
                    <td className={styles.td}>
                      <span className={styles.posicion}>{corredor.indiceOriginal + 1}</span>
                    </td>
                    <td className={styles.tdNombre}>{corredor.nombre}</td>
                    <td className={styles.tdTiempo}>
                      {corredor.mejorTiempo !== undefined ? (
                        <div className={styles.tiempoContainer}>
                          {diferencia !== null && diferencia > 0 && (
                            <span className={styles.diferencia}>+{diferencia.toFixed(3)}</span>
                          )}
                          <span className={styles.tiempo}>{corredor.mejorTiempo.toFixed(3)}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
