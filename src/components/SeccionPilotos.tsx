import { useMemo, useState, useEffect, useCallback } from 'react'
import type { Corredor, Torneo } from '../types'
import { useData } from '../context/DataContext'
import { calcularEloGlobal, ELO_BASE, listasDeCorrredores } from '../lib/elo'
import { EloChart } from './EloChart'
import styles from './SeccionPilotos.module.css'

const MEDIA_MOBILE = '(max-width: 768px)'

function useEsMovil(): boolean {
  const [esMovil, setEsMovil] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MEDIA_MOBILE).matches
  )
  useEffect(() => {
    const mql = window.matchMedia(MEDIA_MOBILE)
    const handler = () => setEsMovil(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return esMovil
}

function nombreCompleto(p: Corredor) {
  return [p.nombre, p.apellido].filter(Boolean).join(' ')
}

/** URL base para assets en public: en producción apunta a la carpeta public de la rama main */
function publicAsset(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return typeof __PUBLIC_ASSETS_BASE__ !== 'undefined' && __PUBLIC_ASSETS_BASE__
    ? __PUBLIC_ASSETS_BASE__ + p
    : p
}

/** Ruta a la foto del piloto en public. Si tiene `foto` se usa; si no, pilotos/{nombre-apellido}.jpg */
function rutaFotoPiloto(p: Corredor): string {
  if (p.foto) return p.foto.startsWith('/') ? p.foto : `/${p.foto}`
  const full = [p.nombre, p.apellido].filter(Boolean).join(' ')
  const slug = full
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  return `/pilotos/${slug}.jpg`
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

/** Cuenta de carreras/series en las que participó cada piloto */
function contarCarrerasPorPiloto(torneos: Torneo[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const torneo of torneos) {
    for (const carrera of torneo.carreras) {
      for (const lista of listasDeCorrredores(carrera)) {
        for (const c of lista) {
          map.set(c.id, (map.get(c.id) ?? 0) + 1)
        }
      }
    }
  }
  return map
}

/** Mejor puesto (posición más baja = mejor) por piloto en todas las carreras/series */
function mejorPuestoPorPiloto(torneos: Torneo[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const torneo of torneos) {
    for (const carrera of torneo.carreras) {
      for (const lista of listasDeCorrredores(carrera)) {
        lista.forEach((c, index) => {
          const posicion = index + 1
          const actual = map.get(c.id)
          if (actual === undefined || posicion < actual) {
            map.set(c.id, posicion)
          }
        })
      }
    }
  }
  return map
}


export function SeccionPilotos() {
  const { pilotos, torneos } = useData()
  const [visible, setVisible] = useState(false)
  const [fotosFallidas, setFotosFallidas] = useState<Set<string>>(new Set())
  const [expandidoId, setExpandidoId] = useState<string | null>(null)
  const esMovil = useEsMovil()

  const pilotosOrdenados = useMemo(() => {
    return [...pilotos].sort((a, b) => {
      const equipoA = (a.equipo ?? '').toLowerCase()
      const equipoB = (b.equipo ?? '').toLowerCase()
      if (equipoA !== equipoB) return equipoA.localeCompare(equipoB)
      return nombreCompleto(a).localeCompare(nombreCompleto(b), undefined, { sensitivity: 'base' })
    })
  }, [pilotos])

  const carrerasPorPiloto = useMemo(() => contarCarrerasPorPiloto(torneos), [torneos])
  const mejorPuestoPorPilotoMap = useMemo(() => mejorPuestoPorPiloto(torneos), [torneos])
  const eloSnapshot = useMemo(() => calcularEloGlobal(torneos), [torneos])
  const eloPorPilotoMap = eloSnapshot.eloMap
  const eloHistorialMap = eloSnapshot.historial
  const eloFechasMap = eloSnapshot.fechas

  const [chartAbierto, setChartAbierto] = useState<Set<string>>(new Set())

  const toggleExpandir = (id: string) => {
    setExpandidoId((prev) => (prev === id ? null : id))
  }

  const toggleChart = useCallback((id: string) => {
    setChartAbierto((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const ocultarFoto = (id: string) => {
    setFotosFallidas((prev) => new Set(prev).add(id))
  }

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
        {pilotosOrdenados.map((piloto) => {
          const itemClases =
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
          const expandido = expandidoId === piloto.id
          return (
          <li
            key={piloto.id}
            className={`${itemClases} ${expandido ? styles.itemExpandido : ''}`}
            onClick={() => toggleExpandir(piloto.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggleExpandir(piloto.id)
              }
            }}
            aria-expanded={expandido}
          >
            <div className={styles.itemFila}>
            <div className={styles.logoWrap}>
              {piloto.equipo === 'Red Bull' && (
                <img
                  src={publicAsset('/redbull.png')}
                  alt=""
                  className={styles.logoEscuderia}
                />
              )}
              {piloto.equipo === 'Aston Martin' && (
                <img
                  src={publicAsset('/astonmartin.png')}
                  alt=""
                  className={styles.logoEscuderia}
                />
              )}
              {piloto.equipo === 'Alpine' && (
                <img
                  src={publicAsset('/alpine.png')}
                  alt=""
                  className={styles.logoEscuderia}
                />
              )}
              {piloto.equipo === 'Ferrari' && (
                <img
                  src={publicAsset('/ferrari.png')}
                  alt=""
                  className={styles.logoEscuderia}
                />
              )}
              {piloto.equipo === 'McLaren' && (
                <img
                  src={publicAsset('/mclaren.png')}
                  alt=""
                  className={styles.logoEscuderia}
                />
              )}
              {piloto.equipo === 'Mercedes' && (
                <img
                  src={publicAsset('/mercedesbenz.png')}
                  alt=""
                  className={styles.logoEscuderia}
                />
              )}
            </div>
            <div className={styles.itemContenido}>
              <div className={styles.itemContenidoNombreYFoto}>
                <div className={styles.itemContenidoIzq}>
                  <span className={styles.nombre}>{nombreCompleto(piloto)}</span>
                  {piloto.equipo !== 'Red Bull' && piloto.equipo !== 'Aston Martin' && piloto.equipo !== 'Alpine' && piloto.equipo !== 'Ferrari' && piloto.equipo !== 'McLaren' && piloto.equipo !== 'Mercedes' && (
                    <span className={styles.escuderia}>{piloto.equipo ?? '—'}</span>
                  )}
                </div>
                {!fotosFallidas.has(piloto.id) && (
                  <img
                    src={publicAsset(rutaFotoPiloto(piloto))}
                    alt=""
                    className={styles.fotoRostro}
                    onError={() => ocultarFoto(piloto.id)}
                  />
                )}
              </div>
              <span className={styles.itemChevron} aria-hidden>
                {expandido ? '▲' : '▼'}
              </span>
              {!esMovil && (
                <div className={styles.itemContenidoDer}>
                  <span className={styles.dato}>
                    <span className={styles.datoLabel}>Nº</span>{' '}
                    {datoNumero(piloto)}
                  </span>
                  <span className={styles.dato}>
                    {datoPeso(piloto)}
                  </span>
                  <span className={styles.dato}>
                    <span className={styles.datoLabel}>Carreras</span>{' '}
                    {carrerasPorPiloto.get(piloto.id) ?? 0}
                  </span>
                  <span className={styles.dato}>
                    <span className={styles.datoLabel}>Mejor Puesto</span>{' '}
                    {mejorPuestoPorPilotoMap.has(piloto.id)
                      ? mejorPuestoPorPilotoMap.get(piloto.id)
                      : '—'}
                  </span>
                  <span className={styles.dato}>
                    <span className={styles.datoLabel}>Elo</span>{' '}
                    {eloPorPilotoMap.get(piloto.id) ?? ELO_BASE}
                    {(eloHistorialMap.get(piloto.id)?.length ?? 0) > 1 && (
                      <button
                        type="button"
                        className={styles.eloChartToggle}
                        onClick={(e) => { e.stopPropagation(); toggleChart(piloto.id) }}
                        aria-expanded={chartAbierto.has(piloto.id)}
                      >
                        {chartAbierto.has(piloto.id) ? '▲' : '▼'}
                      </button>
                    )}
                  </span>
                  <span className={styles.dato}>
                    <span className={styles.datoLabel}>Registrado</span>{' '}
                    <span aria-hidden>{piloto.registrado ? '✓' : '✗'}</span>
                  </span>
                  {piloto.frase && (
                    <span className={styles.datoFrase}>
                      <span className={styles.datoLabel}>Frase</span>{' '}
                      <span className={styles.datoFraseValor}>{piloto.frase}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
            </div>
            {!esMovil && chartAbierto.has(piloto.id) && (eloHistorialMap.get(piloto.id)?.length ?? 0) > 1 && (
              <div className={styles.eloChartPanel}>
                <EloChart historial={eloHistorialMap.get(piloto.id)!} fechas={eloFechasMap.get(piloto.id)} />
              </div>
            )}
            {esMovil && (
              <div className={styles.itemContenidoExpandido} aria-hidden={!expandido}>
                <span className={styles.dato}>
                  <span className={styles.datoLabel}>Nº</span>{' '}
                  {datoNumero(piloto)}
                </span>
                <span className={styles.dato}>
                  {datoPeso(piloto)}
                </span>
                <span className={styles.dato}>
                  <span className={styles.datoLabel}>Carreras</span>{' '}
                  {carrerasPorPiloto.get(piloto.id) ?? 0}
                </span>
                <span className={styles.dato}>
                  <span className={styles.datoLabel}>Mejor Puesto</span>{' '}
                  {mejorPuestoPorPilotoMap.has(piloto.id)
                    ? mejorPuestoPorPilotoMap.get(piloto.id)
                    : '—'}
                </span>
                <span className={styles.dato}>
                  <span className={styles.datoLabel}>Elo</span>{' '}
                  {eloPorPilotoMap.get(piloto.id) ?? ELO_BASE}
                  {(eloHistorialMap.get(piloto.id)?.length ?? 0) > 1 && (
                    <button
                      type="button"
                      className={styles.eloChartToggle}
                      onClick={(e) => { e.stopPropagation(); toggleChart(piloto.id) }}
                      aria-expanded={chartAbierto.has(piloto.id)}
                    >
                      {chartAbierto.has(piloto.id) ? '▲' : '▼'}
                    </button>
                  )}
                </span>
                <span className={styles.dato}>
                  <span className={styles.datoLabel}>Registrado</span>{' '}
                  <span aria-hidden>{piloto.registrado ? '✓' : '✗'}</span>
                </span>
                {piloto.frase && (
                  <span className={styles.datoFrase}>
                    <span className={styles.datoLabel}>Frase</span>{' '}
                    <span className={styles.datoFraseValor}>{piloto.frase}</span>
                  </span>
                )}
                {chartAbierto.has(piloto.id) && (eloHistorialMap.get(piloto.id)?.length ?? 0) > 1 && (
                  <div className={styles.eloChartPanel}>
                    <EloChart historial={eloHistorialMap.get(piloto.id)!} fechas={eloFechasMap.get(piloto.id)} />
                  </div>
                )}
              </div>
            )}
          </li>
          )
        })}
      </ul>
      )}
    </section>
  )
}
