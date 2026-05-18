import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

export default defineConfig(({ command }) => ({
  plugins: [
    ...(command === 'build' ? [cloudflare({ config: { main: 'src/server.ts' } })] : []),
    tanstackStart(),
    react(),
    tailwindcss(),
    tsConfigPaths(),
  ],
}))