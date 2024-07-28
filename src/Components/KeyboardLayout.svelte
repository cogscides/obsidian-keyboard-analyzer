<script lang="ts">
  import type { Modifier } from 'obsidian'
  import { Platform } from 'obsidian'
  import { Coffee as CoffeeIcon } from 'lucide-svelte'
  import { JavaSciptKeyCodes } from '../Constants'
  import { getConvertedModifiers } from '../utils/modifierUtils'
  import KeyboardKey from './KeyboardKey.svelte'

  import type { Keyboard, commandsArray, Key } from '../interfaces/Interfaces'
  import PressedKeysStore from '../stores/activeKeysStore.svelte'

  interface Props {
    visibleCommands: commandsArray
    KeyboardStateDict: Record<string, KeyStateData>
    KeyboardObject: Keyboard
  }

  interface KeyStateData {
    output: string
    keyCode: number
    smallText?: boolean
    unicode: string
    state: 'active' | 'inactive' | 'possible' | 'disabled' | 'empty'
    weight: number
  }

  interface JSKeyEntry {
    Key: string
    Code: string
    Unicode?: string
  }

  let { visibleCommands, KeyboardStateDict, KeyboardObject }: Props = $props()

  let kbGridColumns = $state('3.75fr 0.75fr 1fr')

  function calculateKbColumCoef(keyboardObject: Keyboard) {
    let amountKeys = 0
    for (let section of keyboardObject) {
      let longestRow = Math.max(...section.rows.map((row) => row.length))
      amountKeys += longestRow
    }
    return amountKeys
  }

  function getJSKeyEntry(
    keyLabel: string,
    mode: 'name' | 'code' = 'name'
  ): [string, JSKeyEntry] | undefined {
    if (keyLabel === 'empty') return ['empty', { Key: 'empty', Code: 'empty' }]

    return Object.entries(JavaSciptKeyCodes).find(([_, entry]) =>
      mode === 'name'
        ? keyLabel.toLowerCase() === entry.Key.toLowerCase()
        : keyLabel.toLowerCase() === entry.Code.toLowerCase() &&
          keyLabel.toLowerCase().replace('numpad', '') ===
            entry.Key.toLowerCase()
    ) as [string, JSKeyEntry] | undefined
  }

  function unpackLayout(
    KeyboardLayout: Keyboard,
    activeSearchKey: string | null,
    activeSearchModifiers: string[]
  ) {
    let KeyboardDict: Record<string, KeyStateData> = {}

    for (let section of KeyboardLayout) {
      for (let row of section.rows) {
        for (let key of row) {
          let JSkeyEntry = key.strictCode
            ? getJSKeyEntry(key.label, 'code')
            : getJSKeyEntry(key.label)

          let outputKeyObj: KeyStateData = {
            output: key.label,
            keyCode: -1,
            smallText: key.smallText,
            unicode: '',
            state: 'inactive',
            weight: 0,
          }

          if (key.label === 'empty') {
            outputKeyObj.state = 'empty'
            outputKeyObj.keyCode = -2
          } else if (JSkeyEntry) {
            const [keyCodeStr, keyData] = JSkeyEntry
            const keyCode = Number(keyCodeStr)
            const keyLabel = keyData.Key
            const keyCodeValue = keyData.Code
            let keyOutput = key.strictCode ? keyCodeValue : keyLabel

            switch (keyOutput) {
              case 'Control':
                outputKeyObj = {
                  ...outputKeyObj,
                  output: 'Ctrl',
                  unicode: 'Ctrl',
                  keyCode: keyCode,
                }
                break
              case 'Meta':
                outputKeyObj = Platform.isMacOS
                  ? {
                      ...outputKeyObj,
                      output: 'Alt',
                      keyCode: 18,
                      unicode: '⌥',
                    }
                  : {
                      ...outputKeyObj,
                      output: 'Win',
                      keyCode: keyCode,
                      unicode: '⊞',
                      state: 'disabled',
                    }
                break
              case 'Alt':
                outputKeyObj = Platform.isMacOS
                  ? {
                      ...outputKeyObj,
                      output: 'Cmd',
                      keyCode: 91,
                      unicode: '⌘',
                    }
                  : { ...outputKeyObj, output: 'Alt', keyCode: keyCode }
                break
              default:
                outputKeyObj = {
                  ...outputKeyObj,
                  output: keyOutput,
                  keyCode: keyCode,
                  unicode:
                    key.tryUnicode && 'Unicode' in keyData
                      ? keyData.Unicode || ''
                      : '',
                }
            }
          }

          if (
            activeSearchKey?.toLowerCase() === outputKeyObj.output.toLowerCase()
          ) {
            outputKeyObj.state = 'active'
          }

          if (activeSearchModifiers.includes(outputKeyObj.output)) {
            outputKeyObj.state = 'active'
          }

          KeyboardDict[key.label] = outputKeyObj
        }
      }
    }

    return KeyboardDict
  }

  function calculateWeights(
    visibleCommands: commandsArray,
    KeyboardDict: Record<string, KeyStateData>
  ) {
    for (let [keyLabel, keyData] of Object.entries(KeyboardDict)) {
      let keyWeight = 0

      for (let command of visibleCommands) {
        for (let hotkey of command.hotkeys) {
          if (hotkey.key.toLowerCase() === keyData.output.toLowerCase()) {
            keyWeight++
          }
          for (let modifier of hotkey.modifiers || []) {
            if (
              getConvertedModifiers([modifier])[0].toLowerCase() ===
              keyData.output.toLowerCase()
            ) {
              keyWeight++
            }
          }
        }
      }

      KeyboardDict[keyLabel].weight = keyWeight
    }
  }

  function handleKeyClick(keyOutput: string, keyCode: number) {
    let keyJSName = JavaSciptKeyCodes[keyCode].Key
    let keyJSCode = JavaSciptKeyCodes[keyCode].Code

    if ([16, 17, 18, 91].includes(keyCode)) {
      PressedKeysStore.activeModifiers =
        PressedKeysStore.activeModifiers.includes(keyOutput)
          ? PressedKeysStore.activeModifiers.filter(
              (modifier) => modifier !== keyOutput
            )
          : [...PressedKeysStore.activeModifiers, keyOutput]
    } else {
      PressedKeysStore.activeKey =
        PressedKeysStore.activeKey === keyOutput ? '' : keyOutput
    }
  }
  function onClick() {}

  $effect(() => {
    if (KeyboardObject && visibleCommands) {
      if (!KeyboardStateDict || Object.keys(KeyboardStateDict).length === 0) {
        KeyboardStateDict = unpackLayout(
          KeyboardObject,
          PressedKeysStore.activeKey,
          PressedKeysStore.activeModifiers
        )
      }
      if (KeyboardStateDict) {
        calculateWeights(visibleCommands, KeyboardStateDict)
      }
    }
  })
</script>

<div id="keyboard-layout">
  {#each KeyboardObject || [] as Section}
    <div class={Section.name}>
      {#each Section.rows as Row}
        {#each Row as Key}
          {#if KeyboardStateDict[Key.label]}
            <KeyboardKey
              keyLabel={Key.label}
              keyOutput={KeyboardStateDict[Key.label].output}
              keyCode={KeyboardStateDict[Key.label].keyCode}
              smallText={KeyboardStateDict[Key.label].smallText ?? false}
              unicode={KeyboardStateDict[Key.label].unicode}
              width={Key.width}
              height={Key.height}
              keyWeight={KeyboardStateDict[Key.label].weight}
              state={KeyboardStateDict[Key.label].state}
              onKeyClick={() =>
                console.log(
                  'Key: ',
                  Key,
                  'KeyCode: ',
                  KeyboardStateDict[Key.label].keyCode
                )}
            />
          {/if}
        {/each}
      {/each}
    </div>
  {/each}
  <button
    class="donation-badge"
    onclick={() => window.open('https://ko-fi.com/S6S5E6K74', '_blank')}
  >
    <div style="padding-right: 6px;">
      <CoffeeIcon size={16} />
    </div>
    Donate
  </button>
</div>

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
