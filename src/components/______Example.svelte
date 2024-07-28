<script lang="ts">
  let svelteUrl = 'https://svelte.dev/'
  let tailwindcssUrl = 'https://tailwindcss.com/'
  let input: string = $state('')
  let calculus: number = $state(0)
  let sum: number = $state(0)
  $effect(() => {
    sum = input.length + calculus
  })
</script>

<div class="break-words">
  <h1 class="">Example View 2000</h1>
  <h2>Introduction</h2>
  <p>
    This is an example of an Obsidian View made with <a href={svelteUrl}
      >Svelte</a
    >
    and <a href={tailwindcssUrl}>Tailwindcss</a>.
  </p>

  <h2>Reactivity is here or no</h2>
  <h3>Input</h3>
  <input
    type="text"
    placeholder="Write here"
    maxlength="115"
    bind:value={input}
  />
  <p>Input: {input}</p>

  <h3>Calculus</h3>
  <input
    type="number"
    placeholder="Write here"
    maxlength="115"
    bind:value={calculus}
  />
  <p>Calculus: {calculus}</p>

  <h3>Sum</h3>
  <p>Sum: {sum}</p>
</div>
