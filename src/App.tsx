import { useState } from 'react'
import type { Carrera, Torneo } from './types'
import { torneos } from './data/torneos'
import { ListaTorneos } from './components/ListaTorneos'
import { ListaCarreras } from './components/ListaCarreras'
import { DetalleTorneo } from './components/DetalleTorneo'
import { ListaPilotosTorneo } from './components/ListaPilotosTorneo'
import { DetalleCarrera } from './components/DetalleCarrera'

function App() {
  const [torneoSeleccionado, setTorneoSeleccionado] = useState<Torneo | null>(
    null
  )
  const [carreraSeleccionada, setCarreraSeleccionada] = useState<Carrera | null>(
    null
  )

  const carrerasDelTorneo = torneoSeleccionado?.carreras ?? []
  const mostrandoCorredores = carreraSeleccionada !== null

  return (
    <>
      <h1>Karting BNA</h1>
      {mostrandoCorredores ? (
        <>
          <nav className="volverNav">
            <button
              type="button"
              className="volverBoton"
              onClick={() => setCarreraSeleccionada(null)}
            >
              ← Volver a carreras
            </button>
            {torneoSeleccionado && (
              <span className="volverContexto">
                {torneoSeleccionado.nombre} · {carreraSeleccionada?.nombre}
              </span>
            )}
          </nav>
          <DetalleCarrera carrera={carreraSeleccionada} />
        </>
      ) : (
        <>
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
              <ListaCarreras
                carreras={carrerasDelTorneo}
                carreraSeleccionadaId={carreraSeleccionada?.id ?? null}
                onSeleccionar={setCarreraSeleccionada}
              />
              <ListaPilotosTorneo torneo={torneoSeleccionado} />
              <DetalleTorneo torneo={torneoSeleccionado} />
            </>
          )}
          <DetalleCarrera carrera={null} />
        </>
      )}
    </>
  )
}

export default App
