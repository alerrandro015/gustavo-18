import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `base: './'` gera caminhos relativos, então o build roda igual na raiz de um
// domínio e num subdiretório do GitHub Pages sem trocar nada.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // three e gsap saem em arquivos próprios. O three é o pedaço pesado do
        // site e ele só é baixado depois que o React monta, porque a cena 3D
        // entra por `lazy` e não trava a primeira pintura da tela.
        manualChunks(id: string) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules/gsap')) return 'gsap'
          return undefined
        },
      },
    },
  },
})
