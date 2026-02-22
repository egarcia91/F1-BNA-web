# Qué hacer en la consola de Firebase

Seguí estos pasos una sola vez. Después solo vas a usar la app con los datos en Firestore.

## 1. Crear el proyecto

1. Entrá a **[Firebase Console](https://console.firebase.google.com)** e iniciá sesión con Google.
2. **"Agregar proyecto"** (o "Crear proyecto").
3. Nombre sugerido: `karting-bna` (o el que prefieras).
4. Podés desactivar Google Analytics si no lo vas a usar.
5. Crear proyecto y esperar a que termine.

## 2. Registrar la app web

1. En el proyecto, en la pantalla principal, click en el ícono **Web** (`</>`).
2. **Alias de la app**: por ejemplo `karting-bna-web`.
3. No marques Firebase Hosting por ahora (la app está en GitHub Pages).
4. **"Registrar app"**.
5. Te va a mostrar un objeto de configuración tipo:

   ```javascript
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```

6. Copiá cada valor; los vas a usar en el `.env` (ver abajo).
7. Click en **"Siguiente"** y luego **"Continuar en la consola"**.

## 3. Activar Firestore

1. En el menú lateral: **"Compilación"** → **"Firestore Database"**.
2. **"Crear base de datos"**.
3. Elegí **"Iniciar en modo de prueba"** (después podés ajustar las reglas).
4. Ubicación: elegí la más cercana (ej. `southamerica-east1`).
5. **"Habilitar"**.

## 4. Reglas de seguridad (recomendado después de cargar datos)

1. En Firestore, pestaña **"Reglas"**.
2. Dejá en modo prueba o pegá reglas de solo lectura:

   ```
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

3. **"Publicar"**.

## 5. Configurar el `.env` en tu repo

En la raíz del proyecto, en el archivo `.env`, agregá (reemplazando con los valores que te dio Firebase):

```env
# Google OAuth (ya lo tenés)
VITE_GOOGLE_CLIENT_ID=...

# Firebase – reemplazá con los valores de tu proyecto
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

- **apiKey**, **authDomain**, **projectId**, **storageBucket**, **messagingSenderId**, **appId** son los del paso 2.
- No subas el `.env` a Git (ya está en `.gitignore`).

## 6. Cargar los datos iniciales (script de seed)

Para subir los datos actuales del repo (`src/data/pilotos.ts` y `src/data/torneos.ts`) a Firestore:

1. **Descargar la clave de cuenta de servicio**
   - En Firebase Console: **Configuración del proyecto** (ícono engranaje) → **Cuentas de servicio**.
   - En "Firebase Admin SDK", **"Generar nueva clave privada"**.
   - Se descarga un JSON. Guardalo en la raíz del proyecto como **`firebase-service-account.json`** (ese archivo está en `.gitignore`, no se sube a Git).

2. **Ejecutar el script**
   - Desde la raíz del proyecto, en la terminal:
     ```bash
     npm run seed:firestore
     ```
   - Si guardaste el JSON en otra ruta:
     ```bash
     npx tsx scripts/seed-firestore.ts ./ruta/al/archivo.json
     ```
     o:
     ```bash
     set GOOGLE_APPLICATION_CREDENTIALS=./ruta/al/archivo.json
     npm run seed:firestore
     ```

3. El script sube:
   - La colección **pilotos** (todos los de `pilotos.ts`).
   - La colección **torneos** (metadata + resultados) y la subcolección **carreras** de cada torneo.

Después de ejecutarlo, recargá la app (con el `.env` de Firebase ya configurado) y deberías ver los datos desde Firestore.

---

**Resumen**: Crear proyecto → Registrar app web → Copiar config al `.env` → Activar Firestore → (Opcional) Reglas → Cuenta de servicio → `npm run seed:firestore`.
