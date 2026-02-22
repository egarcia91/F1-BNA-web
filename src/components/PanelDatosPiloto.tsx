import { useState, useEffect } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import type { Corredor } from '../types'
import { getAuthLazy } from '../lib/firebase'
import { actualizarPiloto, desvincularPiloto } from '../lib/registrarPiloto'
import { useData } from '../context/DataContext'
import styles from './PanelDatosPiloto.module.css'

function nombreCompleto(p: Corredor) {
  return [p.nombre, p.apellido].filter(Boolean).join(' ')
}

function datoNumero(p: Corredor): number | '' {
  const n = p.datos && typeof p.datos === 'object' && 'numero' in p.datos
    ? (p.datos as { numero?: number }).numero
    : undefined
  return n != null ? n : ''
}

function datoPeso(p: Corredor): number | '' {
  const w = p.datos && typeof p.datos === 'object' && 'peso' in p.datos
    ? (p.datos as { peso?: number }).peso
    : undefined
  return w != null ? w : ''
}

interface PanelDatosPilotoProps {
  piloto: Corredor
  onClose: () => void
}

export function PanelDatosPiloto({ piloto, onClose }: PanelDatosPilotoProps) {
  const { refetchPilotos } = useData()
  const [frase, setFrase] = useState(piloto.frase ?? '')
  const [numero, setNumero] = useState<number | ''>(datoNumero(piloto))
  const [peso, setPeso] = useState<number | ''>(datoPeso(piloto))
  const [guardando, setGuardando] = useState(false)
  const [desvinculando, setDesvinculando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setFrase(piloto.frase ?? '')
    setNumero(datoNumero(piloto))
    setPeso(datoPeso(piloto))
  }, [piloto])

  const asegurarAuthFirebase = async (): Promise<boolean> => {
    const auth = getAuthLazy()
    if (!auth) {
      setError('Firebase no está configurado.')
      return false
    }
    if (auth.currentUser) return true
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      return true
    } catch (e: unknown) {
      const err = e && typeof e === 'object' ? e as { code?: string; message?: string } : {}
      const isConfig = err.code === 'auth/configuration-not-found' || (err.message && String(err.message).includes('CONFIGURATION_NOT_FOUND'))
      setError(isConfig
        ? 'Habilitá Authentication (Google) en Firebase Console.'
        : 'No se pudo iniciar sesión con Firebase.')
      return false
    }
  }

  const handleGuardar = async () => {
    setError(null)
    setGuardando(true)
    try {
      if (!(await asegurarAuthFirebase())) return
      const datosActuales: Record<string, unknown> = piloto.datos && typeof piloto.datos === 'object' ? { ...piloto.datos } : {}
      const nuevoNumero = numero === '' ? undefined : Number(numero)
      const nuevoPeso = peso === '' ? undefined : Number(peso)
      if (nuevoNumero !== undefined) datosActuales.numero = nuevoNumero
      else delete datosActuales.numero
      if (nuevoPeso !== undefined) datosActuales.peso = nuevoPeso
      else delete datosActuales.peso
      await actualizarPiloto(piloto.id, {
        frase: frase.trim(),
        datos: Object.keys(datosActuales).length ? datosActuales : undefined,
      })
      await refetchPilotos()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  const handleDesvincular = async () => {
    if (!window.confirm('¿Desvincular tu cuenta de este piloto? Solo se quita la vinculación; los datos del piloto se mantienen.')) return
    setError(null)
    setDesvinculando(true)
    try {
      if (!(await asegurarAuthFirebase())) return
      await desvincularPiloto(piloto.id)
      await refetchPilotos()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo desvincular')
    } finally {
      setDesvinculando(false)
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="panel-datos-titulo">
      <div className={styles.panel}>
        <div className={styles.cabecera}>
          <h2 id="panel-datos-titulo" className={styles.titulo}>Información Personal de {nombreCompleto(piloto)}</h2>
          <button type="button" onClick={onClose} className={styles.cerrar} aria-label="Cerrar">×</button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formulario}>
          <label className={styles.label}>
            Frase
            <input
              type="text"
              value={frase}
              onChange={(e) => setFrase(e.target.value)}
              className={styles.input}
              placeholder="Tu frase"
            />
          </label>
          <label className={styles.label}>
            Número
            <input
              type="number"
              min={0}
              value={numero === '' ? '' : numero}
              onChange={(e) => setNumero(e.target.value === '' ? '' : Number(e.target.value))}
              className={styles.input}
              placeholder="—"
            />
          </label>
          <label className={styles.label}>
            Peso (kg)
            <input
              type="number"
              min={0}
              step={0.1}
              value={peso === '' ? '' : peso}
              onChange={(e) => setPeso(e.target.value === '' ? '' : Number(e.target.value))}
              className={styles.input}
              placeholder="—"
            />
          </label>
        </div>
        <div className={styles.acciones}>
          <button type="button" onClick={handleGuardar} className={styles.botonGuardar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" onClick={handleDesvincular} className={styles.botonDesvincular} disabled={desvinculando}>
            {desvinculando ? '…' : 'Eliminar vinculación'}
          </button>
        </div>
      </div>
    </div>
  )
}
