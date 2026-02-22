/**
 * Script de seed: sube los datos de src/data/pilotos.ts y src/data/torneos.ts a Firestore.
 *
 * Requiere una cuenta de servicio de Firebase (JSON).
 * 1. Firebase Console → Configuración del proyecto → Cuentas de servicio
 * 2. "Generar nueva clave privada"
 * 3. Guardar el JSON como firebase-service-account.json en la raíz del proyecto
 *    (o en otra ruta y pasarla por variable de entorno o argumento)
 *
 * Ejecutar desde la raíz del proyecto:
 *   npx tsx scripts/seed-firestore.ts
 *   GOOGLE_APPLICATION_CREDENTIALS=./ruta/al/key.json npx tsx scripts/seed-firestore.ts
 *   npx tsx scripts/seed-firestore.ts ./ruta/al/key.json
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import admin from 'firebase-admin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

function omitUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Record<string, unknown>
}

async function main() {
  const keyPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    process.argv[2] ??
    path.join(rootDir, 'firebase-service-account.json')

  if (!fs.existsSync(keyPath)) {
    console.error(
      'No se encontró el archivo de cuenta de servicio.',
      'Creá uno en Firebase Console (Configuración → Cuentas de servicio → Generar nueva clave)',
      'y guardalo como firebase-service-account.json en la raíz del proyecto, o pasá la ruta:',
      '  npx tsx scripts/seed-firestore.ts ./ruta/al/key.json'
    )
    process.exit(1)
  }

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'))

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  }
  const db = admin.firestore()

  // Importar datos desde los módulos del proyecto
  const { pilotos } = await import('../src/data/pilotos')
  const { torneos } = await import('../src/data/torneos')

  console.log('Subiendo pilotos...')
  for (const p of pilotos) {
    const data = omitUndefined({
      nombre: p.nombre,
      apellido: p.apellido,
      equipo: p.equipo,
      foto: p.foto,
      frase: p.frase,
      puntos: p.puntos,
      datos: p.datos,
    })
    await db.collection('pilotos').doc(p.id).set(data, { merge: true })
  }
  console.log(`  ${pilotos.length} pilotos subidos.`)

  console.log('Subiendo torneos y carreras...')
  for (const t of torneos) {
    const torneoData = omitUndefined({
      nombre: t.nombre,
      estado: t.estado,
      lugar: t.lugar,
      reglas: t.reglas,
      puntajesTabla: t.puntajesTabla,
      puntajesAdicionales: t.puntajesAdicionales,
      resultados: t.resultados?.map((r) =>
        omitUndefined({
          id: r.id,
          nombre: r.nombre,
          apellido: r.apellido,
          equipo: r.equipo,
          puntos: r.puntos,
        })
      ),
    })
    await db.collection('torneos').doc(t.id).set(torneoData, { merge: true })

    for (const c of t.carreras) {
      const carreraData = omitUndefined({
        nombre: c.nombre,
        fecha: c.fecha,
        lugar: c.lugar,
        mostrarEstrella: c.mostrarEstrella,
        series: c.series,
        detalle: c.detalle,
        corredores: c.corredores.map((corr) => {
          const item: Record<string, unknown> = { id: corr.id, nombre: corr.nombre }
          if (corr.datos != null) item.datos = corr.datos
          return item
        }),
      })
      await db.collection('torneos').doc(t.id).collection('carreras').doc(c.id).set(carreraData, { merge: true })
    }
    console.log(`  Torneo ${t.nombre}: ${t.carreras.length} carreras.`)
  }
  console.log(`  ${torneos.length} torneos subidos.`)
  console.log('Listo.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
