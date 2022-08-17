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

  function getJSKeyEntry(keyLabel: string, mode: 'name' | 'code' = 'name') {
    for (let JSEntry of Object.entries(JavaSciptKeyCodes)) {
      if (
        mode === 'name' &&
        keyLabel.toLocaleLowerCase() === JSEntry[1].Key.toLocaleLowerCase()
      ) {
        return JSEntry
      } else if (
        mode === 'code' &&
        keyLabel.toLocaleLowerCase() === JSEntry[1].Code.toLocaleLowerCase() &&
        keyLabel.toLocaleLowerCase().replace('numpad', '') ===
          JSEntry[1].Key.toLocaleLowerCase()
      ) {
        return JSEntry
      } else if (keyLabel === 'empty') {
        return ['empty', { Key: 'empty', Code: 'empty' }]
      }
    }
  }

  function unpackLayout(
    KeyboardLayout: Keyboard,
    activeSearchKey: string | null,
    activeSearchModifiers: string[]
  ) {
    let KeyboardDict: {
      [key: string]: {
        output: string
        keyLabel: string
        state: 'active' | 'inactive' | 'posible' | 'empty'
        keyCode?: number
        unicode?: string
        weight?: number
      }
    } = {}

    for (let section of KeyboardLayout) {
      for (let row of section.rows) {
        for (let key of row) {
          let JSkeyEntry: any = key.strictCode
            ? getJSKeyEntry(key.label, 'code')
            : getJSKeyEntry(key.label)
          let keyOutput: string = key.label
          let outputKeyObj: any

          if (key.label === 'empty') {
            outputKeyObj = {
              output: key.label,
              keyCode: -2,
              state: 'empty',
            }
          } else {
            console.log(JSkeyEntry)

            keyOutput = key.strictCode ? JSkeyEntry[1].Code : JSkeyEntry[1].Key

            outputKeyObj = {
              output: keyOutput,
              keyLabel: JSkeyEntry[1].Key,
              keyCode: JSkeyEntry[0],
              unicode: JSkeyEntry[1].Unicode,
              tryUnicode: key.tryUnicode ? key.tryUnicode : false,
            }

            if (activeSearchKey !== null) {
              if (
                keyOutput.toLocaleLowerCase() ===
                activeSearchKey.toLocaleLowerCase()
              ) {
                outputKeyObj.state = 'active'
              }
            }
            if (activeSearchModifiers.length > 0) {
              if (activeSearchModifiers.includes(keyOutput)) {
                outputKeyObj.state = 'active'
              }
            }
          }

          KeyboardDict[key.label] = outputKeyObj
        }
      }
    }

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
