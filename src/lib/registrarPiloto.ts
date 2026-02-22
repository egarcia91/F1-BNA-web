import { collection, doc, addDoc, updateDoc, deleteField } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Crea un nuevo piloto en Firestore (alta desde "Quiero formar parte").
 * equipo = "a definir", registrado = true, email = del usuario autenticado.
 * Reglas: allow create si request.resource.data.email == request.auth.token.email.
 */
export async function crearPiloto(
  datos: { nombre: string; apellido: string; numero?: number | string; peso?: number | string; frase?: string },
  email: string
): Promise<string> {
  if (!db) throw new Error('Firebase no está configurado')
  const numero = datos.numero != null && datos.numero !== '' ? Number(datos.numero) : undefined
  const peso = datos.peso != null && datos.peso !== '' ? Number(datos.peso) : undefined
  const datosFirestore: Record<string, unknown> = {}
  if (numero !== undefined && !Number.isNaN(numero)) datosFirestore.numero = numero
  if (peso !== undefined && !Number.isNaN(peso)) datosFirestore.peso = peso
  const payload: Record<string, unknown> = {
    nombre: datos.nombre.trim(),
    apellido: datos.apellido.trim(),
    equipo: 'a definir',
    registrado: true,
    email,
  }
  if (Object.keys(datosFirestore).length) payload.datos = datosFirestore
  if (datos.frase != null && String(datos.frase).trim()) payload.frase = String(datos.frase).trim()
  const docRef = await addDoc(collection(db, 'pilotos'), payload)
  return docRef.id
}

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
