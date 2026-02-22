import { doc, updateDoc, deleteField } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Vincula el email del usuario con el piloto en Firestore (marca como registrado).
 * Requiere que el usuario esté autenticado en Firebase con ese mismo email.
 */
export async function registrarPiloto(pilotoId: string, email: string): Promise<void> {
  if (!db) throw new Error('Firebase no está configurado')
  await updateDoc(doc(db, 'pilotos', pilotoId), {
    registrado: true,
    email,
  })
}

/**
 * Actualiza frase y/o datos (numero, peso) del piloto. datos se fusiona con los existentes.
 * Requiere que el usuario esté autenticado en Firebase y que el piloto tenga su email (vinculado).
 */
export async function actualizarPiloto(
  pilotoId: string,
  payload: { frase?: string; datos?: Record<string, unknown> }
): Promise<void> {
  if (!db) throw new Error('Firebase no está configurado')
  const ref = doc(db, 'pilotos', pilotoId)
  const update: Record<string, unknown> = {}
  if (payload.frase !== undefined) update.frase = payload.frase
  if (payload.datos !== undefined) update.datos = payload.datos
  await updateDoc(ref, update)
}

/**
 * Desvincula al usuario del piloto: registrado = false y se quita el email.
 * No borra el documento del piloto ni el resto de la información.
 */
export async function desvincularPiloto(pilotoId: string): Promise<void> {
  if (!db) throw new Error('Firebase no está configurado')
  await updateDoc(doc(db, 'pilotos', pilotoId), {
    registrado: false,
    email: deleteField(),
  })
}
