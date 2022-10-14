<script lang="ts">
  import type { Modifier } from 'obsidian'
  import { Platform } from 'obsidian'
  import { Coffee as CofeeIcon } from 'lucide-svelte'
  import { JavaSciptKeyCodes } from 'src/Constants'
  import { getConvertedModifiers } from 'src/AppShortcuts'
  import KeyboardKey from './KeyboardKey.svelte'

  // TYPES
  import type { Keyboard, commandsArray } from 'src/Interfaces'

  // STORE
  import { activeKey, activeModifiers } from './activeKeysStore'

  export let visibleCommands: commandsArray

  // @ts-ignore
  export let KeyboardObject: Keyboard
  export let KeyboardStateDict: any = {}
  let kbGridColumns: string = '3.75fr 0.75fr 1fr'

  // Calculate the coefficient to calculate how much space a keyboard section takes up for grid-column-column
  function calculateKbColumCoef(keyboardObject: Keyboard) {
    // for example we have three sections in sum they are 100% of the keyboard
    // but we need to longest row of keys are in each section and the longest row is the one with the most keys
    // so the coefficient is the percent of how much space each section should take up on the keyboard
    let amountKeys = 0
    for (let section of keyboardObject) {
      let longestRow = 0
      for (let row of section.rows) {
        if (row.keys.length > longestRow) {
          longestRow = row.keys.length
        }
      }
      amountKeys += longestRow
    }
  }

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
        smallText?: boolean
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
                smallText: key.smallText ? true : false,
                keyCode: JSkeyEntry[0], // same for both OSs
                unicode: 'Ctrl',
              }
            } else if (keyOutput === 'Meta') {
              if (Platform.isMacOS === true) {
                outputKeyObj = {
                  output: 'Alt',
                  keyCode: 18,
                  smallText: key.smallText ? true : false,
                  unicode: '⌥',
                }
              } else {
                outputKeyObj = {
                  output: 'Win',
                  state: 'disabled',
                  smallText: key.smallText ? true : false,
                  keyCode: JSkeyEntry[0], // expect 91
                  unicode: '⊞',
                }
              }
            } else if (keyOutput === 'Alt') {
              if (Platform.isMacOS === true) {
                outputKeyObj = {
                  output: 'Cmd',
                  smallText: key.smallText ? true : false,
                  keyCode: 91,
                  unicode: '⌘',
                }
              } else {
                keyOutput = 'Alt'
                outputKeyObj = {
                  output: 'Alt',
                  smallText: key.smallText ? true : false,
                  keyCode: JSkeyEntry[0],
                }
              }
            } else {
              outputKeyObj = {
                output: keyOutput,
                keyCode: JSkeyEntry[0],
                smallText: key.smallText ? true : false,
                unicode: key.tryUnicode ? JSkeyEntry[1].Unicode : '',
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
        smallText?: boolean
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
  }

  function handleKeyClick(e: CustomEvent) {
    let keyCode: number = parseInt(e.detail[0])
    let keyOutput: string = e.detail[1]

    let keyJSName = JavaSciptKeyCodes[keyCode].Key
    let keyJSCode = JavaSciptKeyCodes[keyCode].Code

    // check if key is modifier or key
    if (keyCode === 16 || keyCode === 17 || keyCode === 18 || keyCode === 91) {
      // try to put modifier in the active modifiers list

      if ($activeModifiers.includes(keyOutput)) {
        $activeModifiers = $activeModifiers.filter(
          (modifier) => modifier !== keyOutput
        )
      } else {
        // if not in the list, add it
        $activeModifiers = [...$activeModifiers, keyOutput]
      }
    } else {
      // try to set key in the active key
      if ($activeKey === keyOutput) {
        $activeKey = ''
      } else {
        $activeKey = keyOutput
      }
    }
  }

  $: calculateWeights(visibleCommands, KeyboardStateDict)

  $: KeyboardStateDict = unpackLayout(
    KeyboardObject,
    $activeKey,
    $activeModifiers
  )
</script>

<div id="keyboard-layout" style="grid-template-columns: {kbGridColumns}">
  {#each KeyboardObject as Section}
    <div class={Section.name}>
      {#each Section.rows as Row}
        {#each Row as Key}
          <KeyboardKey
            keyLabel={Key.label}
            keyOutput={KeyboardStateDict[Key.label].output}
            keyCode={KeyboardStateDict[Key.label].keyCode}
            smallText={KeyboardStateDict[Key.label].smallText}
            unicode={KeyboardStateDict[Key.label].unicode}
            width={Key.width}
            height={Key.height}
            bind:keyWeight={KeyboardStateDict[Key.label].weight}
            bind:state={KeyboardStateDict[Key.label].state}
            on:kb-key-click={handleKeyClick}
          />
          <!-- tryUnicode={KeyboardStateDict[Key.label].tryUnicode} -->
        {/each}
      {/each}
    </div>
  {/each}
  <div
    class="donation-badge"
    on:click={() => window.open('https://ko-fi.com/S6S5E6K74', '_blank')}
  >
    <div style="padding-right: 6px;">
      <CofeeIcon size={16} />
    </div>
    Donate
  </div>
</div>

{@debug KeyboardStateDict}

<style>
  .keyboard-layout {
    grid-template-columns: var(--kb-grid-columns);
  }
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
    cursor: pointer;
  }

  .donation-badge:hover {
    border: 1px solid var(--text-accent);
    background-color: var(--text-accent);
    color: var(--text-on-accent);
  }
</style>
