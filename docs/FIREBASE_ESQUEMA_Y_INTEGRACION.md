# Firebase: esquema Firestore e integración con el repo

## 1. Esquema Firestore

### Colección `pilotos`

Lista maestra de pilotos/corredores. Mismo `id` se usa en torneos y carreras.

| Campo      | Tipo   | Descripción                          |
|-----------|--------|--------------------------------------|
| nombre    | string | Nombre                               |
| apellido  | string | (opcional)                           |
| equipo    | string | (opcional) Red Bull, Ferrari, etc.   |
| foto      | string | (opcional) Ruta ej. `pilotos/xx.jpg` |
| frase     | string | (opcional)                           |
| datos     | map    | (opcional) numero, peso, etc.        |

- **Document ID**: mismo `id` que usás hoy (ej. `c1`, `c2`, `c4`). Así no cambian las referencias en torneos/carreras.

---

### Colección `torneos`

Cada documento = un torneo (metadata + tabla de resultados).

| Campo               | Tipo   | Descripción                                      |
|---------------------|--------|--------------------------------------------------|
| nombre              | string | ej. "Copa BNA 2025"                             |
| estado              | string | `"concluido"` \| `"en_progreso"`                |
| lugar               | string | (opcional)                                       |
| reglas              | array  | strings                                          |
| puntajesTabla       | array  | `[{ posicion: "1", puntos: 40 }, ...]`          |
| puntajesAdicionales | string | (opcional) texto                                 |
| resultados         | array  | `[{ id, nombre, apellido?, equipo?, puntos }, ...]` ordenado por posición |

- **Document ID**: mismo id del torneo (ej. `t1`, `t2`).

---

### Subcolección `torneos/{torneoId}/carreras`

Cada documento = una carrera del torneo.

| Campo           | Tipo   | Descripción |
|-----------------|--------|-------------|
| nombre          | string | ej. "Única", "Night Race" |
| fecha           | string | "2025-12-18" o "a definir" |
| lugar           | string | (opcional) |
| mostrarEstrella | bool   | (opcional) |
| series          | array  | (opcional) `[{ nombre, horario }, ...]` |
| detalle         | string | (opcional) |
| corredores      | array  | Ver abajo |

**Cada ítem de `corredores`** (resultado de un piloto en esa carrera):

| Campo  | Tipo | Descripción |
|--------|------|-------------|
| id     | string | Id del piloto (referencia a `pilotos`) |
| nombre | string | Nombre completo (ej. "Martin Pena") para mostrar en tabla |
| datos  | map  | (opcional) `mejorTiempo`, `karting`, `vueltas`, `ordenLargada`, etc. |

- **Document ID**: mismo id de la carrera (ej. `1`, `2`, `3`). Podés usar `orden` numérico o guardar orden en un campo y ordenar por `fecha`/`orden` al leer.

---

## 2. Diagrama de relaciones

```
pilotos (colección)
  c1, c2, c3, ...

torneos (colección)
  t1, t2, ...
  └── carreras (subcolección)
        1, 2, 3, ...
        cada doc tiene corredores[] con { id -> pilotos }
```

- **Sección Pilotos**: lee de `pilotos`.
- **Lista torneos + resultados**: lee de `torneos` (cada doc ya trae `resultados`).
- **Carreras de un torneo**: lee `torneos/{id}/carreras` y opcionalmente ordenás por `fecha` o campo `orden`.

---

## 3. Integración en el repo

### 3.1 Variables de entorno

En `.env` (y en `.env.example` sin valores reales):

```env
# Google OAuth (ya lo tenés)
VITE_GOOGLE_CLIENT_ID=...

# Firebase (config del proyecto en Firebase Console)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...firebaseapp.com
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=....appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Prefijo `VITE_` para que Vite los exponga al cliente.

### 3.2 Estructura de carpetas sugerida

```
src/
  lib/
    firebase.ts          # init Firebase App + Firestore
  data/
    pilotos.ts           # (opcional) mantener como fallback local
    torneos.ts           # (opcional) mantener como fallback local
  hooks/
    usePilotos.ts        # lee colección pilotos
    useTorneos.ts        # lee torneos + por cada uno sus carreras
  ...
```

- **`firebase.ts`**: inicializa la app con `initializeApp(config)` y exporta `getFirestore()` (y si más adelante usás Auth, `getAuth()`).
- **`usePilotos`**: `getDocs(collection(db, 'pilotos'))`, mapea a `Corredor[]`, devuelve `{ pilotos, loading, error }`.
- **`useTorneos`**: `getDocs(collection(db, 'torneos'))`, para cada torneo `getDocs(collection(db, 'torneos', torneo.id, 'carreras'))`, arma el array `carreras` ordenado y el objeto `Torneo` igual que tus tipos actuales. Devuelve `{ torneos, loading, error }`.

Así los tipos `Torneo`, `Carrera`, `Corredor` de `src/types/index.ts` siguen igual; solo cambia el origen de los datos (Firestore en lugar de imports estáticos).

### 3.3 Dónde cambiar imports

| Archivo            | Hoy                          | Con Firebase                         |
|--------------------|------------------------------|--------------------------------------|
| `App.tsx`          | `import { torneos } from './data/torneos'` | `const { torneos, loading } = useTorneos()` y mostrar loading/error |
| `SeccionPilotos.tsx` | `import { pilotos, torneos } from '../data/...'` | `usePilotos()` y `useTorneos()` (o un solo provider que inyecte ambos) |

Si querés una sola fuente de verdad, podés tener un **DataProvider** que use `usePilotos` y `useTorneos` y exponga `pilotos`, `torneos`, `loading`, `error` por contexto, y en `App` y `SeccionPilotos` solo consumir ese contexto. Así no pasás props en cadena.

### 3.4 Fallback a datos locales (opcional)

Mientras migrás o si Firebase no está configurado:

- En `usePilotos`: si `import.meta.env.VITE_FIREBASE_PROJECT_ID` está vacío, devolver `{ pilotos: pilotosDesdeTs, loading: false }` importando desde `../data/pilotos`.
- En `useTorneos`: igual con `torneos` desde `../data/torneos`.

Así podés desarrollar sin Firebase y en producción usar Firestore.

---

## 4. Reglas de seguridad Firestore (ejemplo)

Para solo lectura pública (cualquiera puede leer; escribir solo desde consola o Admin SDK hasta que agregues auth):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pilotos/{id} {
      allow read: if true;
      allow write: if false;
    }
    match /torneos/{torneoId} {
      allow read: if true;
      allow write: if false;
      match /carreras/{carreraId} {
        allow read: if true;
        allow write: if false;
      }
    }
  }
}
```

Cuando quieras que solo usuarios autenticados (o admins) escriban, podés cambiar `allow write` usando `request.auth != null` o custom claims.

---

## 5. Carga inicial de datos (seed)

Opciones:

1. **Desde la consola de Firebase**: crear a mano unos pocos documentos de prueba.
2. **Script Node con Admin SDK**: carpeta `scripts/` con un script que lea `src/data/torneos.ts` y `pilotos.ts` (o JSON exportado), y con `initializeApp` + credenciales de servicio (archivo JSON de “cuenta de servicio”) haga `setDoc`/`addDoc` para crear `pilotos`, luego cada torneo y sus subcolección `carreras`. Ejecutás una vez: `node scripts/seed-firestore.js`.
3. **Página “admin” en la app**: solo si ya tenés auth; con un botón “Importar datos actuales” que lea los arrays estáticos y haga `setDoc` desde el cliente. Requiere reglas que permitan write con auth (y mejor solo para un rol admin).

Recomendación: para la primera carga, script Node con Admin SDK y los JSON/TS actuales; después mantenés desde consola o desde una futura pantalla admin.

---

## 6. Resumen de pasos

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com), activar Firestore y obtener la config web (apiKey, projectId, etc.).
2. Añadir variables `VITE_FIREBASE_*` al `.env` y a `.env.example`.
3. Instalar `firebase`, crear `src/lib/firebase.ts` y los hooks `usePilotos` y `useTorneos` (o DataProvider) que devuelvan los mismos tipos que hoy.
4. En `App.tsx` y `SeccionPilotos.tsx` reemplazar imports por el hook/provider y manejar `loading`/`error`.
5. Subir reglas de Firestore (solo lectura pública al inicio).
6. Cargar datos: script de seed con los datos actuales de `torneos.ts` y `pilotos.ts`.
7. (Opcional) Fallback a datos locales cuando no haya config de Firebase.

Si querés, el siguiente paso puede ser bajar esto a código concreto: `firebase.ts`, `usePilotos`, `useTorneos` y los cambios mínimos en `App` y `SeccionPilotos` usando este esquema.
