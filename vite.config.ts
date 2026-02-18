import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** En producción (gh-pages) las imágenes se sirven desde la carpeta public de la rama main */
const publicAssetsBaseUrl =
  'https://raw.githubusercontent.com/egarcia91/F1-BNA-web/main/public'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/F1-BNA-web/',
  define: {
    __PUBLIC_ASSETS_BASE__: JSON.stringify(
      mode === 'production' ? publicAssetsBaseUrl : ''
    ),
  },
}))
