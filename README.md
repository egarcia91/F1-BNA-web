# F1-BNA-web

Web para concentrar las carreras de Karting de BNA. Listado de torneos, carreras por torneo y corredores (estático, React + Vite + TypeScript).

## Cómo ejecutar

```bash
npm install
npm run dev
```

Abrí [http://localhost:5173](http://localhost:5173) en el navegador.

## Cómo editar los datos

Los datos están en **`src/data/torneos.ts`**. Cada torneo tiene un nombre y un array de carreras; cada carrera tiene sus corredores. La estructura de tipos está en `src/types/index.ts` y se puede extender (por ejemplo agregando `posición`, `puntos`, `circuito`, etc.) usando el campo opcional `datos` o ampliando las interfaces.

## Build para producción

```bash
npm run build
```

Los archivos quedan en la carpeta `dist/`. Podés publicar ese contenido en cualquier hosting estático.
