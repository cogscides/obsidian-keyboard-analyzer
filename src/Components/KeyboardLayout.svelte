<script lang="ts">
  import { Coffee as CofeeIcon } from 'lucide-svelte'
  import { JavaSciptKeyCodes } from 'src/Constants'
  import type { Keyboard, commandsArray } from 'src/Interfaces'
  import KeyboardKey from './KeyboardKey.svelte'
  import { getConvertedModifiers } from 'src/AppShortcuts'
  // import { Key } from 'lucide-svelte'

  export let activeSearchKey: string | null
  export let activeSearchModifiers: string[]
  export let visibleCommands: commandsArray

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
        keyCode?: number
        unicode?: string
        state?: 'active' | 'inactive' | 'posible' | 'disabled' | 'empty'
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
            keyOutput = key.strictCode ? JSkeyEntry[1].Code : JSkeyEntry[1].Key
            // fix modifiers names according to OS - hardcoded for now
            if (keyOutput === 'Control') {
              keyOutput = 'Ctrl'
              outputKeyObj = {
                output: 'Ctrl',
                keyCode: JSkeyEntry[0], // same for both OSs
                unicode: 'Ctrl',
              }
            } else if (keyOutput === 'Meta') {
              if (process.platform === 'darwin') {
                outputKeyObj = {
                  output: '⌥',
                  keyCode: 18,
                  unicode: '⌥',
                }
              } else {
                outputKeyObj = {
                  output: '⊞',
                  state: 'disabled',
                  keyCode: JSkeyEntry[0], // expect 91
                  unicode: '⊞',
                }
              }
            } else if (keyOutput === 'Alt') {
              if (process.platform === 'darwin') {
                outputKeyObj = {
                  output: '⌘',
                  keyCode: 91,
                  unicode: '⌘',
                }
              } else {
                keyOutput = 'Alt'
                outputKeyObj = {
                  output: 'Alt',
                  keyCode: JSkeyEntry[0],
                }
              }
            } else {
              outputKeyObj = {
                output: keyOutput,
                keyCode: JSkeyEntry[0],
                unicode: key.tryUnicode ? JSkeyEntry[1].Unicode : '',
                // tryUnicode: key.tryUnicode ? key.tryUnicode : false,
              }
            }
          }

          // check if key is active
          if (activeSearchKey !== null) {
            if (
              outputKeyObj.output.toLocaleLowerCase() ===
              activeSearchKey.toLocaleLowerCase()
            ) {
              outputKeyObj.state = 'active'
            }
          }

          // check if modifiers are active
          if (activeSearchModifiers.length > 0) {
            if (activeSearchModifiers.includes(outputKeyObj.output)) {
              outputKeyObj.state = 'active'
            }
          }

          KeyboardDict[key.label] = outputKeyObj
        }
      }
    }

    return KeyboardDict
  }

  function calculateWeights(
    visibleCommands: commandsArray,
    KeyboardDict: {
      [key: string]: {
        output: string
        keyCode?: number
        unicode?: string
        state?: 'active' | 'inactive' | 'posible' | 'disabled' | 'empty'
        weight?: number
      }
    }
  ) {
    let keyWeigts: any = []
    for (let key of Object.entries(KeyboardDict)) {
      KeyboardStateDict[key[0]].weight = 0

      // calculate how many times a key or modifier is used in the hotkeys list
      let keyWeight = 0

      for (let command of visibleCommands) {
        for (let hotkey of command.hotkeys) {
          if (
            hotkey.key.toLocaleLowerCase() === key[1].output.toLocaleLowerCase()
          ) {
            keyWeight++
          }
          for (let modifier of hotkey.modifiers) {
            if (
              getConvertedModifiers([modifier])[0].toLocaleLowerCase() ===
              key[1].output.toLocaleLowerCase()
            ) {
              keyWeight++
            }
          }
        }
      }
      KeyboardStateDict[key[0]].weight = keyWeight
    }
    console.log(KeyboardStateDict)
  }

  $: calculateWeights(visibleCommands, KeyboardStateDict)

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
            bind:keyWeight={KeyboardStateDict[Key.label].weight}
            width={Key.width}
            height={Key.height}
            bind:state={KeyboardStateDict[Key.label].state}
          />
          <!-- tryUnicode={KeyboardStateDict[Key.label].tryUnicode} -->
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
