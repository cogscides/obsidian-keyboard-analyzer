import extractorSvelte from "@unocss/extractor-svelte";
import presetUno from "@unocss/preset-uno";

// Avoid importing from the root `unocss` package to prevent
// unnecessary transitive imports (e.g., preset-icons) at build time.
export default {
	presets: [presetUno()],
	extractors: [extractorSvelte()],
} as const;
