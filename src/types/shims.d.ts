declare namespace svelteHTML {
	interface HTMLAttributes<T> {
		onclick_outside?: (event: CustomEvent<any>) => void;
	}
}
