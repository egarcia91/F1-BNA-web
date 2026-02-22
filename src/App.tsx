import { useState } from 'react'
import type { Carrera, Torneo } from './types'
import { useAuth } from './context/AuthContext'
import { useData } from './context/DataContext'
import { ListaTorneos } from './components/ListaTorneos'
import { ListaCarreras } from './components/ListaCarreras'
import { DetalleTorneo } from './components/DetalleTorneo'
import { ListaResultadosTorneo } from './components/ListaResultadosTorneo'
import { SeccionPilotos } from './components/SeccionPilotos'
import { BannerRegistroPiloto } from './components/BannerRegistroPiloto'
import { LoginScreen } from './components/LoginScreen'

function App() {
  const { user, isLoading, logout } = useAuth()
  const { torneos, loading: dataLoading, error: dataError } = useData()
  const [torneoSeleccionado, setTorneoSeleccionado] = useState<Torneo | null>(
    null
  )
  const [carreraSeleccionada, setCarreraSeleccionada] = useState<Carrera | null>(
    null
  )

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
        <span className="cartelProximaCarrera">
          Faltan {diasHastaCarrera} días
        </span>
      </header>
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
