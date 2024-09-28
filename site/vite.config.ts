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
  base: '/slate-canvas/',
});
