import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      'slate-canvas': path.resolve(__dirname, '../packages/slate-canvas/src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'slate-canvas/[name]-[hash][extname]', // 适用于所有资产
        chunkFileNames: 'slate-canvas/[name]-[hash].js', // 适用于代码块
        entryFileNames: 'slate-canvas/[name]-[hash].js', // 适用于入口文件
      },
    },
  },
});
