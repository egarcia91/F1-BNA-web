import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Imágenes (equipos, pilotos): en dev y en gh-pages se cargan desde la rama main para evitar 404 con base path */
const publicAssetsBaseUrl =
  'https://raw.githubusercontent.com/egarcia91/F1-BNA-web/main/public'

export default defineConfig({
  plugins: [react()],
  base: '/F1-BNA-web/',
  define: {
    __PUBLIC_ASSETS_BASE__: JSON.stringify(publicAssetsBaseUrl),
  },
})
