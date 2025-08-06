import { pathToFileURL } from 'node:url'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import UnoCSS from 'unocss/vite'
import { type PluginOption, defineConfig } from 'vite'

const setOutDir = (mode: string) => {
  switch (mode) {
    case 'development':
      return '../obsidian-keyboard-analyzer-dev'
    case 'production':
      return '../obsidian-keyboard-analyzer-dev'
  }
}

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      UnoCSS(),
      svelte({
        preprocess: vitePreprocess(),
      }) as PluginOption,
    ],
    build: {
      lib: {
        entry: 'src/main',
        formats: ['cjs'],
      },
      rollupOptions: {
        output: {
          entryFileNames: 'main.js',
          assetFileNames: 'styles.css',
          sourcemapBaseUrl: pathToFileURL(
            `${__dirname}/../obsidian-keyboard-analyzer-dev/`
          ).toString(),
        },
        external: [
          'obsidian',
          'electron',
          '@codemirror/autocomplete',
          '@codemirror/collab',
          '@codemirror/commands',
          '@codemirror/language',
          '@codemirror/lint',
          '@codemirror/search',
          '@codemirror/state',
          '@codemirror/view',
          '@lezer/common',
          '@lezer/highlight',
          '@lezer/lr',
        ],
      },
      outDir: setOutDir(mode),
      emptyOutDir: false,
      sourcemap: 'inline',
    },
  }
})
