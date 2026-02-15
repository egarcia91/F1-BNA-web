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

  return (
    <>
      <h1>Karting BNA</h1>
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
