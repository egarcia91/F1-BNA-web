import { useState, useMemo } from 'react'
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

  const diasHastaProximaCarrera = useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    let proximaFecha: Date | null = null

    // Buscar la próxima carrera con fecha definida
    for (const torneo of torneos) {
      for (const carrera of torneo.carreras) {
        // Ignorar fechas que no sean válidas (como "a definir")
        if (carrera.fecha && carrera.fecha !== 'a definir') {
          try {
            const fechaCarrera = new Date(carrera.fecha)
            fechaCarrera.setHours(0, 0, 0, 0)

            // Solo considerar fechas futuras
            if (fechaCarrera >= hoy) {
              if (!proximaFecha || fechaCarrera < proximaFecha) {
                proximaFecha = fechaCarrera
              }
            }
          } catch (e) {
            // Ignorar fechas inválidas
          }
        }
      }
    }

    if (!proximaFecha) return null

    const diferencia = proximaFecha.getTime() - hoy.getTime()
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24))

    return dias
  }, [])

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Karting BNA</h1>
        {diasHastaProximaCarrera !== null && (
          <span style={{
            fontSize: '1rem',
            color: 'var(--f1-text-muted)',
            fontWeight: 500
          }}>
            {diasHastaProximaCarrera === 0 
              ? 'Hoy es la carrera' 
              : diasHastaProximaCarrera === 1 
                ? 'Falta 1 día' 
                : `Faltan ${diasHastaProximaCarrera} días`}
          </span>
        )}
      </div>
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
                carreraSeleccionadaId={(carreraSeleccionada as Carrera | null)?.id ?? null}
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
