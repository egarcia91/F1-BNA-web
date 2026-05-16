/**
 * Actualiza carreras puntuales en Firestore (merge parcial).
 *
 * Editá el array PATCHES de abajo con los cambios que quieras aplicar y ejecutá:
 *   npx tsx scripts/actualizar-carreras.ts
 *   GOOGLE_APPLICATION_CREDENTIALS=./ruta/al/key.json npx tsx scripts/actualizar-carreras.ts
 *   npx tsx scripts/actualizar-carreras.ts ./ruta/al/key.json
 *
 * Usa { merge: true }: solo modifica los campos indicados, sin pisar el resto.
 * IMPORTANTE: si querés vaciar un array (ej. corredores: []), tenelo en cuenta:
 * Firestore reemplaza el array completo (no se hace merge dentro de arrays).
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import admin from 'firebase-admin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

interface CarreraPatch {
  torneoId: string
  carreraId: string
  /**
   * Campos del documento de la carrera que se borran ANTES de aplicar `data`.
   * Útil para arrays/objetos que se reemplazan completos (ej. 'series',
   * 'corredoresPorSerie') y evitar que queden claves viejas mezcladas con el
   * merge profundo de Firestore.
   */
  replaceFields?: string[]
  /** Campos a actualizar (merge) dentro del documento de la carrera. */
  data: Record<string, unknown>
}

// Helpers para corredores
type DatosCorredor = {
  karting: number
  vueltas: number
  mejorTiempo: number
  ordenLargada?: number
}
const c = (
  id: string,
  nombre: string,
  karting: number,
  vueltas: number,
  mejorTiempo: number,
  ordenLargada?: number
) => {
  const datos: DatosCorredor = { karting, vueltas, mejorTiempo }
  if (ordenLargada != null) datos.ordenLargada = ordenLargada
  return { id, nombre, datos }
}

// Serie 1 - 18:30 (14 pilotos)
const SERIE_1830 = [
  c('c28', 'Lucas Lo Faro', 10, 20, 39.412, 1),
  c('c16', 'Sebastian Egozcue', 12, 20, 40.492, 4),
  c('c1', 'Martin Pena', 5, 20, 40.716, 3),
  c('c2', 'Ezequiel Garcia', 19, 20, 40.552, 5),
  c('c33', 'Bruno Lo Faro', 18, 19, 39.147, 6),
  c('c15', 'Ignacio Rueda', 22, 19, 41.123, 7),
  c('c20', 'Javier Boero', 16, 19, 42.091, 9),
  c('c9', 'Fabian Manquez', 9, 19, 42.091, 10),
  c('c3', 'Diego Fernandez', 8, 19, 42.386, 8),
  c('c35', 'Marcelo Montalto', 17, 19, 39.807, 2),
  c('c8', 'Pablo Carbonell', 4, 18, 42.851, 12),
  c('c7', 'Alejandro Lafuente', 11, 18, 43.112, 14),
  c('c6', 'Federico Di Paola', 15, 18, 43.250, 11),
  c('inv-agustina-boero', 'Agustina Boero (invitada)', 20, 16, 49.502, 13),
]

// Serie 2 - 19:00 (15 pilotos)
const SERIE_1900 = [
  c('c10', 'Ezequiel Barany', 5, 20, 40.670),
  c('c5', 'Matias Amado', 17, 20, 40.713),
  c('c41', 'Facundo Fulco', 3, 20, 40.349),
  c('c32', 'Ian Cinti', 10, 20, 41.108),
  c('c37', 'Franco Ramponi', 11, 20, 41.280),
  c('c26', 'Manuel Cavallero', 19, 20, 40.849),
  c('c19', 'Martin Lombardo', 22, 19, 41.774),
  c('c29', 'Marcelo Souto', 4, 19, 44.305),
  c('c4', 'Ezequiel Salvemini', 2, 19, 43.103),
  c('c36', 'Julian Lods', 20, 19, 44.079),
  c('c22', 'German Panunzio', 16, 18, 45.686),
  c('c34', 'Mariano Chara', 15, 18, 44.921),
  c('c45', 'Ariel Matias Bonomi', 8, 18, 45.630),
  c('c25', 'Roberto Piombi', 12, 17, 50.609),
  c('c43', 'Ruslan Sanmartin Sobol', 14, 10, 50.008),
]

// ──────────────────────────────────────────────────────────────────────────────
// EDITAR AQUÍ los cambios que se quieran aplicar.
// ──────────────────────────────────────────────────────────────────────────────
const PATCHES: CarreraPatch[] = [
  {
    torneoId: 't2', // Copa BNA 2026
    carreraId: '3', // Grilla Invertida
    // Borro series/corredoresPorSerie viejas para que no queden claves obsoletas
    replaceFields: ['series', 'corredoresPorSerie'],
    data: {
      fecha: '2026-06-15',
      series: [
        { nombre: 'Serie 1', horario: '18:30' },
        { nombre: 'Serie 2', horario: '19:00' },
      ],
      corredoresPorSerie: {
        '18:30': SERIE_1830,
        '19:00': SERIE_1900,
      },
      corredores: [],
    },
  },
]
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    process.argv[2] ??
    path.join(rootDir, 'firebase-service-account.json')

  if (!fs.existsSync(keyPath)) {
    console.error(
      'No se encontró firebase-service-account.json. Pasá la ruta como argumento o GOOGLE_APPLICATION_CREDENTIALS.'
    )
    process.exit(1)
  }

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'))
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  }
  const db = admin.firestore()

  if (PATCHES.length === 0) {
    console.log('No hay patches definidos. Editá PATCHES en el script.')
    return
  }

  for (const patch of PATCHES) {
    const ref = db
      .collection('torneos')
      .doc(patch.torneoId)
      .collection('carreras')
      .doc(patch.carreraId)

    const snap = await ref.get()
    if (!snap.exists) {
      console.warn(
        `  [WARN] No existe la carrera ${patch.torneoId}/${patch.carreraId}. Se omite.`
      )
      continue
    }

    if (patch.replaceFields && patch.replaceFields.length > 0) {
      const deletes: Record<string, FirebaseFirestore.FieldValue> = {}
      for (const field of patch.replaceFields) {
        deletes[field] = admin.firestore.FieldValue.delete()
      }
      await ref.update(deletes)
      console.log(
        `  Limpiados campos ${patch.replaceFields.join(', ')} en ${patch.torneoId}/${patch.carreraId}`
      )
    }

    await ref.set(patch.data, { merge: true })
    const campos = Object.keys(patch.data).join(', ')
    console.log(
      `  Actualizada ${patch.torneoId}/${patch.carreraId} → ${campos}`
    )
  }

  console.log('Listo.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
