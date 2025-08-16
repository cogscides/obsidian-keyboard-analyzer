declare namespace svelteHTML {
	interface HTMLAttributes<_T> {
		ononclick_outside?: (event: CustomEvent<unknown>) => void;
	}
}
