import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function hasValidConfig(): boolean {
  const id = import.meta.env.VITE_FIREBASE_PROJECT_ID
  return typeof id === 'string' && id.trim() !== ''
}

let app: ReturnType<typeof initializeApp> | null = null
let db: ReturnType<typeof getFirestore> | null = null
let auth: ReturnType<typeof getAuth> | null = null

if (hasValidConfig()) {
  try {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    // Auth no se inicializa al cargar para evitar 400 CONFIGURATION_NOT_FOUND
    // si Authentication no está habilitado en la consola. Se obtiene con getAuthLazy().
  } catch {
    app = null
    db = null
  }
}

/** Inicializa Auth bajo demanda (p. ej. al hacer "Sí, soy yo"). Puede fallar si Authentication no está configurado. */
export function getAuthLazy(): ReturnType<typeof getAuth> | null {
  if (!app) return null
  if (!auth) auth = getAuth(app)
  return auth
}

export { db, auth }
export const isFirebaseEnabled = (): boolean => db != null
