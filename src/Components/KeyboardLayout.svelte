<script lang="ts">
  import { Coffee as CofeeIcon } from 'lucide-svelte'
  import { JavaSciptKeyCodes } from 'src/Constants'
  import type { Keyboard } from 'src/Interfaces'
  import KeyboardKey from './KeyboardKey.svelte'
  // import { Key } from 'lucide-svelte'

  export let activeSearchKey: string | null
  export let activeSearchModifiers: string[]

  // @ts-ignore
  export let KeyboardObject: Keyboard
  export let KeyboardStateDict: any = {}

  function getJSKeyEntry(key: string) {
    let JSKeyOutput
    for (let Entry of Object.entries(JavaSciptKeyCodes)) {
      if (key.toLocaleLowerCase() === Entry[1].Key.toLocaleLowerCase()) {
        JSKeyOutput = Entry
      }
    }
    return JSKeyOutput
  }

  function unpackLayout(
    KeyboardLayout: Keyboard,
    activeSearchKey: string | null,
    activeSearchModifiers: string[]
  ) {
    let KeyboardDict: {
      [key: string]: {
        output: string
        state: 'active' | 'inactive' | 'posible' | 'empty'
        keyCode?: number
        unicode?: string
        weight?: number
      }
    } = {}

    let missingKeys: any[] = []
    for (let section of KeyboardLayout) {
      for (let row of section.rows) {
        for (let key of row) {
          let JSKeyEntry = getJSKeyEntry(key.label)
          let keyObj: any

          if (JSKeyEntry === undefined) {
            keyObj = {
              keyCode: -1,
              state: 'inactive',
            }
            missingKeys.push({ [key.label]: { output: key.output } })
          } else if (key.label === 'empty') {
            keyObj = {
              keyCode: -2,
              state: 'empty',
            }
          } else {
            keyObj = {
              output: JSKeyEntry[1].Key,
              keyCode: JSKeyEntry[0],
              unicode: JSKeyEntry[1].Unicode,
              tryUnicode: key.tryUnicode ? key.tryUnicode : false,
            }
            if (activeSearchKey !== null) {
              if (
                key.label.toLocaleLowerCase() ===
                activeSearchKey.toLocaleLowerCase()
              ) {
                keyObj.state = 'active'
              }
            }
          }

          KeyboardDict[key.label] = keyObj
        }
      }
    }
    // console.log(missingKeys)

    return KeyboardDict
  }

  $: KeyboardStateDict = unpackLayout(
    KeyboardObject,
    activeSearchKey,
    activeSearchModifiers
  )

  function handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement
    const label = target.id
    console.log(label)
  }

  const onKeydown = (event: any) => {
    console.log(event.detail)
  }
</script>

<div id="keyboard-layout">
  {#each KeyboardObject as Section}
    <div class={Section.name}>
      {#each Section.rows as Row}
        {#each Row as Key}
          <KeyboardKey
            keyLabel={Key.label}
            keyCode={KeyboardStateDict[Key.label].keyCode}
            unicode={KeyboardStateDict[Key.label].unicode}
            width={Key.width}
            height={Key.height}
            tryUnicode={KeyboardStateDict[Key.label].tryUnicode}
            bind:state={KeyboardStateDict[Key.label].state}
          />
        {/each}
      {/each}
    </div>
  {/each}
  <div class="donation-badge">
    <div style="padding-right: 6px;">
      <CofeeIcon size={16} />
    </div>
    Donate
  </div>
</div>

{@debug KeyboardStateDict}

<style>
  .donation-badge {
    position: absolute;
    top: 24px;
    right: 24px;
    border: 1px dashed var(--text-accent);
    color: var(--text-accent);
    font-size: var(--font-scale-0);
    line-height: initial;
    display: flex;
    justify-content: center;
    align-items: center;
    white-space: nowrap;
    border-radius: 20px;
    padding: 2px 8px;
  }
</style>
