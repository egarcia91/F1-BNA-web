import { useState } from 'react'
import type { Carrera, Torneo } from './types'
import { torneos } from './data/torneos'
import { ListaTorneos } from './components/ListaTorneos'
import { ListaCarreras } from './components/ListaCarreras'
import { DetalleTorneo } from './components/DetalleTorneo'
import { ListaResultadosTorneo } from './components/ListaResultadosTorneo'
import { SeccionPilotos } from './components/SeccionPilotos'

function App() {
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

  return (
    <>
      <header className="headerTitulo">
        <h1>Karting BNA</h1>
        <span className="cartelProximaCarrera">
          Faltan {diasHastaCarrera} días
        </span>
      </header>
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
