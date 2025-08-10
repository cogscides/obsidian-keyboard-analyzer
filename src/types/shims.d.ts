declare namespace svelteHTML {
  interface HTMLAttributes<T> {
    ononclick_outside?: (event: CustomEvent<any>) => void
  }
}
