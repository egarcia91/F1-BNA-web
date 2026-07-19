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

interface CarreraDelete {
  torneoId: string
  carreraId: string
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

// Final (17-07-2026) — Serie 1 (14 pilotos, orden = posición final)
const FINAL_SERIE_1 = [
  c('c15', 'Ignacio Rueda', 12, 20, 40.915, 1),
  c('c36', 'Julian Lods', 11, 20, 41.831, 4),
  c('c9', 'Fabian Manquez', 7, 20, 42.512, 6),
  c('inv-andres-t', 'Andres T. (invitado)', 18, 20, 42.533, 2),
  c('c37', 'Franco Ramponi', 16, 20, 42.107, 5),
  c('c19', 'Martin Lombardo', 8, 19, 42.012, 9),
  c('c31', 'Matias Duclos', 3, 19, 42.742, 7),
  c('c3', 'Diego Fernandez', 2, 19, 43.266, 8),
  c('c27', 'Andres Soto', 22, 19, 41.689, 3),
  c('c23', 'Federico Mammana', 19, 19, 43.250, 14),
  c('c17', 'Fernando Longo', 20, 18, 44.416, 11),
  c('c22', 'German Panunzio', 10, 18, 45.794, 10),
  c('c25', 'Roberto Piombi', 5, 18, 45.522, 13),
  c('inv-nicolas-barreiro', 'Nicolas Barreiro (invitado)', 6, 17, 46.395, 12),
]

// Final (17-07-2026) — Serie 2 (14 pilotos, algunas largadas pendientes)
const FINAL_SERIE_2 = [
  c('c26', 'Manuel Cavallero', 22, 20, 39.918, 3),
  c('c30', 'Mauro Martini', 19, 20, 40.261, 1),
  c('c35', 'Marcelo Montalto', 12, 20, 40.466, 2),
  c('c32', 'Ian Cinti', 5, 20, 40.190),
  c('c2', 'Ezequiel Garcia', 16, 20, 40.644, 5),
  c('c5', 'Matias Amado', 17, 20, 41.700, 6),
  c('c16', 'Sebastian Egozcue', 20, 20, 41.610),
  c('c28', 'Lucas Lo Faro', 9, 19, 41.281),
  c('c4', 'Ezequiel Salvemini', 8, 19, 41.713, 4),
  c('c7', 'Alejandro Lafuente', 11, 19, 42.053),
  c('c41', 'Facundo Fulco', 6, 19, 42.929),
  c('c1', 'Martin Pena', 10, 19, 42.054),
  c('c29', 'Marcelo Souto', 7, 19, 42.057),
  c('c20', 'Javier Boero', 18, 18, 44.193),
]

// ──────────────────────────────────────────────────────────────────────────────
// EDITAR AQUÍ los cambios que se quieran aplicar.
// ──────────────────────────────────────────────────────────────────────────────
const PATCHES: CarreraPatch[] = [
  {
    torneoId: 't2', // Copa BNA 2026
    carreraId: '5', // Final
    // Borro series/corredoresPorSerie viejas por si había placeholders
    replaceFields: ['series', 'corredoresPorSerie'],
    data: {
      fecha: '2026-07-17',
      series: [
        { nombre: 'Serie 1', horario: '18:30' },
        { nombre: 'Serie 2', horario: '19:00' },
      ],
      corredoresPorSerie: {
        '18:30': FINAL_SERIE_1,
        '19:00': FINAL_SERIE_2,
      },
      corredores: [],
    },
  },
]

// Carreras a eliminar por completo del torneo (se borran de Firestore).
const CARRERAS_A_ELIMINAR: CarreraDelete[] = [
  // Sentido Antihorario ya eliminada. Vacío hasta próxima necesidad.
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

  if (PATCHES.length === 0 && CARRERAS_A_ELIMINAR.length === 0) {
    console.log('No hay patches ni eliminaciones definidas. Editá el script.')
    return
  }

  for (const del of CARRERAS_A_ELIMINAR) {
    const ref = db
      .collection('torneos')
      .doc(del.torneoId)
      .collection('carreras')
      .doc(del.carreraId)
    const snap = await ref.get()
    if (!snap.exists) {
      console.warn(
        `  [WARN] Carrera ${del.torneoId}/${del.carreraId} no existe. Omitida.`
      )
      continue
    }
    await ref.delete()
    console.log(`  Eliminada carrera ${del.torneoId}/${del.carreraId}`)
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
