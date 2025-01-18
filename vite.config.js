import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ui',
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react',
            'react-dom','react-markdown', 'react-syntax-highlighter'],
          antd: ['antd', 'antd/dist/reset.css'],
          'remark-gfm': ['remark-gfm'],
          'react-pdf': ['react-pdf'],
          'mermaid': ['mermaid'],
        }
      }
    }
  }
})
