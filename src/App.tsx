import { useState } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import type { Carrera, Torneo } from './types'
import { useAuth } from './context/AuthContext'
import { useData } from './context/DataContext'
import { getAuthLazy } from './lib/firebase'
import { actualizarPresenteSiguienteCarrera } from './lib/registrarPiloto'
import { ListaTorneos } from './components/ListaTorneos'
import { ListaCarreras } from './components/ListaCarreras'
import { DetalleTorneo } from './components/DetalleTorneo'
import { ListaResultadosTorneo } from './components/ListaResultadosTorneo'
import { SeccionPilotos } from './components/SeccionPilotos'
import { BannerRegistroPiloto } from './components/BannerRegistroPiloto'
import { PanelDatosPiloto } from './components/PanelDatosPiloto'
import { LoginScreen } from './components/LoginScreen'

const NOMBRE_PROXIMA_CARRERA = '"Night Race" el 5 de marzo'

function App() {
  const { user, isLoading, logout } = useAuth()
  const { pilotos, torneos, loading: dataLoading, error: dataError, refetchPilotos } = useData()
  const [torneoSeleccionado, setTorneoSeleccionado] = useState<Torneo | null>(
    null
  )
  const [carreraSeleccionada, setCarreraSeleccionada] = useState<Carrera | null>(
    null
  )
  const [panelDatosAbierto, setPanelDatosAbierto] = useState(false)
  const [confirmarAsistenciaAbierto, setConfirmarAsistenciaAbierto] = useState(false)
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false)

  const miPiloto = user?.email ? pilotos.find((p) => p.email === user.email) : null
  const debeConfirmarAsistencia = Boolean(miPiloto && !miPiloto.presenteSiguienteCarrera)
  const carrerasDelTorneo = torneoSeleccionado?.carreras ?? []
  const toggleCarrera = (carrera: Carrera) => {
    setCarreraSeleccionada((actual) =>
      actual?.id === carrera.id ? null : carrera
    )
  }

  const proximaCarrera = new Date(2026, 2, 5) // 5 de marzo de 2026
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  proximaCarrera.setHours(0, 0, 0, 0)
  const diffMs = proximaCarrera.getTime() - hoy.getTime()
  const diasHastaCarrera = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

  const handleConfirmarAsistencia = async (presente: boolean) => {
    if (!miPiloto) return
    setGuardandoAsistencia(true)
    try {
      const auth = getAuthLazy()
      if (auth && !auth.currentUser) await signInWithPopup(auth, new GoogleAuthProvider())
      await actualizarPresenteSiguienteCarrera(miPiloto.id, presente)
      await refetchPilotos()
      setConfirmarAsistenciaAbierto(false)
    } finally {
      setGuardandoAsistencia(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--f1-text-muted)' }}>
        Cargando…
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  if (dataLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--f1-text-muted)' }}>
        Cargando datos…
      </div>
    )
  }

  if (dataError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--f1-red)' }}>
        {dataError}
      </div>
    )
  }

  return (
    <>
      <header className="headerTitulo">
        <div>
          <h1>Karting BNA</h1>
          <span className="headerUsuario">
            {miPiloto && (
              <button
                type="button"
                onClick={() => setPanelDatosAbierto(true)}
                className="headerBotonDatos"
                title="Ver y editar mis datos de piloto"
                aria-label="Información personal del piloto"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            )}
            {user.name}
            <button
              type="button"
              onClick={logout}
              className="headerCerrarSesion"
              title={user.email ? 'Cerrar sesión' : 'Iniciar sesión'}
            >
              {user.email ? 'Salir' : 'Login'}
            </button>
          </span>
        </div>
        {debeConfirmarAsistencia ? (
          <button
            type="button"
            className="cartelProximaCarrera cartelProximaCarreraPendiente"
            onClick={() => setConfirmarAsistenciaAbierto(true)}
            title="Confirmar si vas a la próxima carrera"
          >
            Faltan {diasHastaCarrera} días
          </button>
        ) : (
          <span className="cartelProximaCarrera">
            Faltan {diasHastaCarrera} días
          </span>
        )}
      </header>
      {confirmarAsistenciaAbierto && miPiloto && (
        <div className="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="modal-asistencia-titulo">
          <div className="modalConfirmarAsistencia">
            <h2 id="modal-asistencia-titulo">¿Vas a asistir a la {NOMBRE_PROXIMA_CARRERA}?</h2>
            <div className="modalConfirmarAsistenciaBotones">
              <button type="button" className="modalBotonSi" onClick={() => handleConfirmarAsistencia(true)} disabled={guardandoAsistencia}>
                {guardandoAsistencia ? '…' : 'Sí'}
              </button>
              <button type="button" className="modalBotonNo" onClick={() => handleConfirmarAsistencia(false)} disabled={guardandoAsistencia}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
      {miPiloto && panelDatosAbierto && (
        <PanelDatosPiloto piloto={miPiloto} onClose={() => setPanelDatosAbierto(false)} />
      )}
      <BannerRegistroPiloto />
      <SeccionPilotos />
      <ListaTorneos
        torneos={torneos}
        torneoSeleccionadoId={torneoSeleccionado?.id ?? null}
        onSeleccionar={(t) => {
          setTorneoSeleccionado(t)
          setCarreraSeleccionada(null)
        }}
      />
      {torneoSeleccionado && (
        <>
          <div className="torneoStickyBar" aria-live="polite">
            {torneoSeleccionado.nombre}
            {carreraSeleccionada && ` - ${carreraSeleccionada.nombre}`}
          </div>
          <ListaCarreras
            torneo={torneoSeleccionado}
            carreras={carrerasDelTorneo}
            carreraSeleccionadaId={carreraSeleccionada?.id ?? null}
            onSeleccionar={toggleCarrera}
          />
          <ListaResultadosTorneo torneo={torneoSeleccionado} />
          <DetalleTorneo torneo={torneoSeleccionado} />
        </>
      )}
    </>
  )
}

export default App
