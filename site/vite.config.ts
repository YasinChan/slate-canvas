import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // resolve: {
  //   alias: {
  //     'slate-canvas': path.resolve(__dirname, '../packages/slate-canvas/src'),
  //   },
  // },
});
