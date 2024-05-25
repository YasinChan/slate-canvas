import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import terser from '@rollup/plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json' assert { type: 'json' };
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      // COMPAT: Without this flag sometimes the declarations are not updated.
      // clean: isProd ? true : false,
      clean: true,
    }),
    alias({
      entries: { find: '@', replacement: `${__dirname}/src` },
    }),
    isProd && terser(),
  ],
};
