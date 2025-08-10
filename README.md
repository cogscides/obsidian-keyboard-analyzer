# Keyboard Analyzer

## ![](https://img.shields.io/badge/Windows-Ok-brightgreen) ![](https://img.shields.io/badge/Android-Ok-brightgreen) ![](https://img.shields.io/badge/MacOS-Bugs-red)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/S6S5E6K74)

---

![image](https://user-images.githubusercontent.com/50235526/208871771-f1feb390-1d4e-4ea4-b2c9-7696b18a2f8f.png)

<details><summary>📽️ Features walktrough video</summary>
<br>
<video src="https://user-images.githubusercontent.com/50235526/185812119-392b895c-ebd5-48df-accf-98933ef8a234.mp4" controls></video>
</details>

## About

With this plugin you will be able to:

- see and analyze all your assigned hotkeys in Obsidian on visual keyboard
  layout
- search by key combination
- see custom hotkeys
- see duplicate hotkeys
- highlight featured hotkeys

## How to use

1. To open plugin you can click on keyboard icon in status bar (to open in a new
   pane use `Ctrl + Click`)
2. To open plugin run command `Keyboard Analyzer: Open Shortcuts View`

The plugin is poorly tested on operating systems other than Windows, I would be
grateful for any help with testing support.

## Custom Keyboard Layouts

This plugin uses a unified keyboard layout defined in the code. While it's not possible to provide a custom layout file yet, you can modify the existing layout if you are comfortable with editing the plugin's code.

The layout is defined in `src/Constants.ts` in the `UNIFIED_KEYBOARD_LAYOUT` object.

### OS-Specific Key Configuration

To handle differences between operating systems, you can provide OS-specific configurations for each key using the `os` property. This is useful for keys like `Ctrl`, `Alt`, `Win`, and `Cmd`.

Here is an example for the "Win" key (or "Command" key on macOS):

```typescript
{
  label: 'Meta',
  code: 'MetaLeft',
  os: {
    macos: { modifier: 'Meta', unicode: '⌘', label: 'Meta' },
    windows: { modifier: undefined, unicode: 'Win', label: 'Win' },
    linux: { modifier: undefined, unicode: 'Win', label: 'Win' },
  },
}
```

- `label`: The text displayed on the key.
- `code`: The `KeyboardEvent.code` value for the key. This is important for matching hotkeys.
- `unicode`: A character to display on the key, often a symbol.
- `modifier`: The modifier role of the key (`'Control'`, `'Alt'`, `'Shift'`, `'Meta'`). If `undefined`, the key is not treated as a modifier for hotkey searches.

For a comprehensive list of key codes, you can refer to this [Key Code Reference Table](https://www.toptal.com/developers/keycode).

## Installation

As plugin is not yet published in community plugins library, you will need to install it manually or with
help of [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin for beta
testing.

#### Manual Installation

Download release files `main.js`, `styles.css` and `manifest.json` from the
[releases](https://github.com/cogscides/obsidian-keyboard-analyzer/releases) and
place this files inside
`[YOUR_OBSIDIAN_FOLDER]/.obsidian/.plugins/obsidian-keyboard-analyzer/`.

#### Beta Testing - BRAT

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin
2. Run command in obsidian:
   `Obsidian42 - BRATPlugins: add a beta plugin for testing`
3. Paste this repository URL:
   `https://github.com/cogscides/obsidian-keyboard-analyzer`
4. Enable `Keyboard Analyzer` plugin in plugins list

---

P.S. This is my first public code in my life - would be happy to get feedback or
a donation which will help me to continue creating this and other plugins for
obsidian.

---

## Great thanks to the obsidian community:

- [@SkepticMystic](https://github.com/SkepticMystic) and
  [@HEmile](https://github.com/HEmile) for their awesome contribution to Svelte
  codebase of [Graph Analysis](https://github.com/SkepticMystic/graph-analysis)
  plugin which help me a lot in implementing typescript and code structure in my
  plugin
- [@pjeby](https://github.com/pjeby) for code inspiration dealing with obsidian
  hotkeys
- [@Fevol](https://github.com/Fevol) for help with implementing hotkey scoping
  and friendly support
- davfive#5786 guy from discord for directing me on the way how to deal with
  obsidian hotkeys
