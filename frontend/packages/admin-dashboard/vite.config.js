import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@zolid/shared': path.resolve(__dirname, '../shared/src'),
      // ⬇️ ADD THESE TWO LINES TO FIX THE ERROR
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
    },
  },
  server: {
    port: 3003,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});