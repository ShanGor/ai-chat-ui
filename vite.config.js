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
          react: ['react', 'react-dom'],
          antd: ['antd'],
          'antd-icon': ['@ant-design/icons'],
          markdown: ['react-markdown'],
          'syntax-highlighter': ['react-syntax-highlighter'],
          'remark-gfm': ['remark-gfm'],
          'react-pdf': ['react-pdf'],
          mermaid: ['mermaid'],
        }
      }
    }
  }
})
