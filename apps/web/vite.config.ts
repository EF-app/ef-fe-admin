import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const proxyTarget = env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@ef-fe-admin/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
        '@': path.resolve(__dirname, './src'),
        react: path.resolve(__dirname, '../../node_modules/react'),
        'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client'],
    },
    server: {
      port: 5173,
      fs: {
        allow: [path.resolve(__dirname, '../..')],
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/v1': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
