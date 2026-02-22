import { initializeApp } from 'firebase/app'
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

let db: ReturnType<typeof getFirestore> | null = null

if (hasValidConfig()) {
  try {
    initializeApp(firebaseConfig)
    db = getFirestore()
  } catch {
    db = null
  }
}

export { db }
export const isFirebaseEnabled = (): boolean => db != null
