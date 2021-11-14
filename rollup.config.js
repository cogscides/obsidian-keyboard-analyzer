import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import svelte from 'rollup-plugin-svelte'
import autoPreprocess from 'svelte-preprocess'
import json from '@rollup/plugin-json'
import ignore from 'rollup-plugin-ignore'

const isProd = process.env.BUILD === 'production'

const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ROLLUP
if you want to view the source visit the plugins github repository
*/
`

export default {
  input: 'src/main.ts',
  output: {
    dir: '.',
    sourcemap: 'inline',
    sourcemapExcludeSources: isProd,
    format: 'cjs',
    exports: 'default',
    banner,
  },
  external: ['obsidian'],
  plugins: [
    ignore(['path', 'url'], { commonjsBugFix: true }),
    commonjs({
      include: ['node_modules/**'],
    }),
    json(),
    svelte({
      emitCss: false,
      preprocess: autoPreprocess(),
    }),
    typescript(),
    nodeResolve({ browser: true }),
  ],
}
