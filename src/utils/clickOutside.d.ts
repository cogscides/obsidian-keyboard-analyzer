export function clickOutside(node: HTMLElement): { destroy(): void }

// Svelte JSX augmentation for custom events
declare namespace svelteHTML {
  interface HTMLAttributes<T> {
    'onclick_outside'?: (e: CustomEvent<{ originalEvent: Event }>) => void
    'on:click_outside'?: (e: CustomEvent<{ originalEvent: Event }>) => void
  }
}
