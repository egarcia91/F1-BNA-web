import { useMemo, useState } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import type { Corredor } from '../types'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { getAuthLazy } from '../lib/firebase'
import { registrarPiloto } from '../lib/registrarPiloto'
import styles from './BannerRegistroPiloto.module.css'

function nombreCompleto(p: Corredor) {
  return [p.nombre, p.apellido].filter(Boolean).join(' ')
}

function normalizarNombre(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
}

/** Candidatos: pilotos cuyo nombre completo normalizado coincide con el del usuario y que no tienen ya ese email. */
function candidatosPorNombre(pilotos: Corredor[], nombreUsuario: string): Corredor[] {
  const nombreNorm = normalizarNombre(nombreUsuario)
  if (!nombreNorm) return []
  return pilotos.filter((p) => {
    if (p.email) return false
    return normalizarNombre(nombreCompleto(p)) === nombreNorm
  })
}

/** Pilotos que aún no tienen cuenta vinculada. */
function pilotosNoVinculados(pilotos: Corredor[]): Corredor[] {
  return pilotos.filter((p) => !p.email)
}

export function BannerRegistroPiloto() {
  const { user } = useAuth()
  const { pilotos, refetchPilotos } = useData()
  const [registrandoId, setRegistrandoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mostrarListaRestantes, setMostrarListaRestantes] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const candidatos = useMemo(() => {
    if (!user?.email || !user?.name) return []
    const yaRegistrado = pilotos.some((p) => p.email === user.email)
    if (yaRegistrado) return []
    return candidatosPorNombre(pilotos, user.name)
  }, [user?.email, user?.name, pilotos])

  const restantes = useMemo(() => pilotosNoVinculados(pilotos), [pilotos])

  const restantesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return restantes
    const q = normalizarNombre(busqueda)
    return restantes.filter((p) => normalizarNombre(nombreCompleto(p)).includes(q))
  }, [restantes, busqueda])

  const handleRegistrar = async (pilotoId: string) => {
    if (!user?.email) return
    setError(null)
    setRegistrandoId(pilotoId)
    try {
      const firebaseAuth = getAuthLazy()
      if (!firebaseAuth) {
        setError('Firebase no está configurado.')
        return
      }
      await signInWithPopup(firebaseAuth, new GoogleAuthProvider())
      await registrarPiloto(pilotoId, user.email)
      await refetchPilotos()
    } catch (e: unknown) {
      const err = e && typeof e === 'object' ? e as { code?: string; message?: string } : {}
      const isConfigNotFound = err.code === 'auth/configuration-not-found' || (err.message && String(err.message).includes('CONFIGURATION_NOT_FOUND'))
      const msg = isConfigNotFound
        ? 'Para vincular tu perfil hay que habilitar Authentication (Google) en Firebase Console. Ver docs/FIREBASE_CONSOLE_PASOS.md'
        : e instanceof Error ? e.message : 'No se pudo registrar'
      setError(msg)
    } finally {
      setRegistrandoId(null)
    }
  }

  if (candidatos.length === 0 && !mostrarListaRestantes) return null
  if (restantes.length === 0 && !candidatos.length) return null

  if (mostrarListaRestantes) {
    return (
      <div className={styles.banner} role="region" aria-label="Elegir piloto para vincular">
        {error && <p className={styles.error}>{error}</p>}
        <p className={styles.texto}>¿Cuál de estos sos? Buscá tu nombre en la lista.</p>
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre…"
          className={styles.inputBusqueda}
          aria-label="Buscar piloto"
        />
        <ul className={styles.listaRestantes}>
          {restantesFiltrados.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={styles.boton}
                onClick={() => handleRegistrar(p.id)}
                disabled={registrandoId !== null}
              >
                {registrandoId === p.id ? '…' : nombreCompleto(p)}
              </button>
            </li>
          ))}
        </ul>
        {restantesFiltrados.length === 0 && <p className={styles.sinResultados}>No hay pilotos que coincidan con la búsqueda.</p>}
        <button type="button" onClick={() => { setMostrarListaRestantes(false); setBusqueda('') }} className={styles.botonVolver}>
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className={styles.banner} role="region" aria-label="Vincular tu perfil con un piloto">
      {error && <p className={styles.error}>{error}</p>}
      {candidatos.length === 1 ? (
        <p className={styles.texto}>
          ¿Sos <strong>{nombreCompleto(candidatos[0])}</strong>?
          <button
            type="button"
            className={styles.boton}
            onClick={() => handleRegistrar(candidatos[0].id)}
            disabled={registrandoId !== null}
          >
            {registrandoId === candidatos[0].id ? '…' : 'Sí, soy yo'}
          </button>
          <button
            type="button"
            className={styles.botonSecundario}
            onClick={() => setMostrarListaRestantes(true)}
            disabled={registrandoId !== null}
          >
            No soy yo
          </button>
        </p>
      ) : (
        <>
          <p className={styles.texto}>¿Cuál sos?</p>
          <ul className={styles.lista}>
            {candidatos.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={styles.boton}
                  onClick={() => handleRegistrar(p.id)}
                  disabled={registrandoId !== null}
                >
                  {registrandoId === p.id ? '…' : nombreCompleto(p)}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={styles.botonSecundario}
            onClick={() => setMostrarListaRestantes(true)}
            disabled={registrandoId !== null}
          >
            No soy yo
          </button>
        </>
      )}
    </div>
  )
}
