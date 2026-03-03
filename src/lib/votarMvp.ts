import { doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Registra o actualiza el voto MVP del usuario para una carrera.
 * El documento se guarda en torneos/{torneoId}/carreras/{carreraId}/votos/{userEmail}.
 * Reglas: solo permiten escribir si request.auth.token.email == document.id.
 */
export async function votarMvp(
  torneoId: string,
  carreraId: string,
  pilotIdVotedFor: string,
  userEmail: string
): Promise<void> {
  if (!db) throw new Error('Firebase no está configurado')
  const ref = doc(db, 'torneos', torneoId, 'carreras', carreraId, 'votos', userEmail)
  await setDoc(ref, { votedFor: pilotIdVotedFor })
}
