declare namespace svelteHTML {
	interface HTMLAttributes<_T> {
		onclick_outside?: (event: CustomEvent<unknown>) => void;
	}
}
