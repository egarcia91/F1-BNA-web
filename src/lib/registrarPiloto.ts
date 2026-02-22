import { doc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Vincula el email del usuario con el piloto en Firestore (marca como registrado).
 * Requiere que el usuario esté autenticado en Firebase con ese mismo email
 * (reglas de Firestore: solo se permite si request.resource.data.email == request.auth.token.email).
 */
export async function registrarPiloto(pilotoId: string, email: string): Promise<void> {
  if (!db) throw new Error('Firebase no está configurado')
  await updateDoc(doc(db, 'pilotos', pilotoId), {
    registrado: true,
    email,
  })
}
