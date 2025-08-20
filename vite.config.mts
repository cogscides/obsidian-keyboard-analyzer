import { pathToFileURL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import UnoCSS from 'unocss/vite'
import { type PluginOption, defineConfig } from 'vite'

const setOutDir = (mode: string): string => {
  switch (mode) {
    case 'development':
    case 'production':
      return '../obsidian-keyboard-analyzer-dev'
    default:
      return '../obsidian-keyboard-analyzer-dev'
  }
}

export default defineConfig(({ mode }) => {
  const outDir = setOutDir(mode)

  // Copies required Obsidian metadata files from repo root to build output
  const copyRootFiles = (): PluginOption => ({
    name: 'copy-root-files',
    apply: 'build',
    closeBundle() {
      const files = ['manifest.json', 'versions.json'] as const
      const destDir = path.resolve(__dirname, outDir)
      for (const file of files) {
        const src = path.resolve(__dirname, file)
        const dest = path.join(destDir, file)
        if (fs.existsSync(src)) {
          try {
            fs.copyFileSync(src, dest)
          } catch (e) {
            this.warn(`Failed to copy ${file} -> ${dest}: ${e}`)
          }
        } else {
          this.warn(`Missing ${file} at project root; not copied.`)
        }
      }
    },
  })

  return {
    plugins: [
      UnoCSS(),
      svelte({
        preprocess: vitePreprocess(),
      }) as PluginOption,
      copyRootFiles(),
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
      outDir,
      emptyOutDir: false,
      sourcemap: 'inline',
    },
  }
})
