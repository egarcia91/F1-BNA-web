/**
 * Elimina de Firestore el piloto de prueba "Ivan Garcia".
 * Usa la misma cuenta de servicio que el seed (firebase-service-account.json).
 *
 * Ejecutar desde la raíz del proyecto:
 *   npx tsx scripts/delete-piloto-prueba.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import admin from 'firebase-admin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

async function main() {
  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    process.argv[2] ??
    path.join(rootDir, 'firebase-service-account.json')

  if (!fs.existsSync(keyPath)) {
    console.error('No se encontró firebase-service-account.json. Pasá la ruta como argumento o GOOGLE_APPLICATION_CREDENTIALS.')
    process.exit(1)
  }

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'))

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  }

  const db = admin.firestore()
  const snapshot = await db.collection('pilotos').where('nombre', '==', 'Ivan').where('apellido', '==', 'Garcia').get()

  if (snapshot.empty) {
    console.log('No se encontró ningún piloto "Ivan Garcia" en la base de datos.')
    process.exit(0)
  }

  for (const doc of snapshot.docs) {
    await doc.ref.delete()
    console.log('Eliminado piloto:', doc.id, doc.data().nombre, doc.data().apellido)
  }

  console.log('Listo.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
