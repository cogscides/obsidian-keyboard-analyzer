TL;DR: Better Command Palette doesn’t manually “save & restore” your caret. It preserves focus by (1) running as a SuggestModal, (2) executing the chosen item while passing through the original keyboard/mouse event, and (3) closing the modal with that same event. This lets Obsidian’s modal system hand focus back to whatever had it (usually the editor at the same caret/scroll). For files, it opens in the intended leaf/tab without poking the editor selection directly.

⸻

What actually preserves focus (concrete, code-level view) 1. It’s a SuggestModal, which already remembers the previously focused element
The palette class (BetterCommandPaletteModal in src/palette.ts) extends SuggestModal<Match>. Obsidian’s SuggestModal tracks the element that had focus before the modal opened. If you don’t fight it, closing the modal gives focus back to the previous element (your editor), caret and scroll intact. 2. Event passthrough on selection
The modal exposes an unsafe helper in the type defs:
• UnsafeSuggestModalInterface.chooser.useSelectedItem(ev: Partial<KeyboardEvent>) (see src/types/types.d.ts).
In the modal’s flow (onChooseSuggestion(...) in src/palette.ts), the chosen action is triggered with the same MouseEvent/KeyboardEvent that selected it. That means Obsidian understands the user’s actual intent (e.g., modifiers) and can route focus correctly afterward. 3. Closing the modal with the original keyboard event
There’s a custom close(evt?: KeyboardEvent) in src/palette.ts. The important detail is that the modal is closed passing the same evt it received on selection. In Obsidian, closing a modal with the triggering event lets the framework restore focus to the element that had it before the modal showed—your editor textarea—without resetting caret or scroll.
If you closed the modal without the event (or re-focused something else manually), you’d risk losing the precise focus position. 4. File opens don’t trample editor focus state
File selection funnels through utilities like openFileWithEventKeys(...) (see src/utils/utils.ts). That helper interprets modifiers (e.g., “open in new tab” vs same tab), chooses the right leaf, and calls the Obsidian file-open APIs.
• Same leaf: your editor is still the focused widget; caret/scroll remain where they were unless you actually navigated to another note.
• New tab / different leaf: focus correctly moves to that target (as the user intended via modifiers). No manual caret fiddling is done by the plugin. 5. No manual cursor juggling (by design)
You won’t find code that grabs editor.getCursor() and restores it later. The plugin deliberately does not micro-manage caret/selection. It relies on Obsidian’s modal/focus contract: don’t steal focus, pass the event through, and close properly.

⸻

Where to look in the repo
• src/palette.ts
• close(evt?: KeyboardEvent) — note the evt parameter usage.
• onChooseSuggestion(item, event) — executes the action and then closes with the event.
• Suggest/adapters wiring that keeps the modal lightweight re: focus.
• src/types/types.d.ts
• UnsafeSuggestModalInterface.chooser.useSelectedItem(ev) — the event passthrough hook.
• The “unsafe” interfaces exist exactly because this behavior isn’t public on SuggestModal, but it mirrors Obsidian’s internal command palette.
• src/utils/utils.ts
• openFileWithEventKeys(...) — respects modifiers to open in the correct leaf/tab without touching the editor’s caret.

⸻

```
This file is a merged representation of the entire codebase, combined into a single document by Repomix.
The content has been processed where content has been compressed (code blocks are separated by ⋮---- delimiter), security check has been disabled.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Content has been compressed - code blocks are separated by ⋮---- delimiter
- Security check has been disabled - content may contain sensitive information
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```

.github/
workflows/
release.yml
src/
palette-modal-adapters/
command-adapter.ts
file-adapter.ts
index.ts
tag-adapter.ts
types/
types.d.ts
worker.d.ts
utils/
constants.ts
index.ts
macro.ts
ordered-set.ts
palette-match.ts
settings-command-suggest-modal.ts
suggest-modal-adapter.ts
utils.ts
web-workers/
suggestions-worker.ts
main.ts
palette.ts
settings.ts
styles.scss
test/
e2e/
tests/
index.ts
initialize-test-env.ts
tear-down-test-env.ts
test-command-palette.ts
test-file-palette.ts
test-tag-palette.ts
test-utils.ts
test.ts
tools/
generate-test-files.js
.editorconfig
.eslintignore
.eslintrc.cjs
.gitignore
.npmrc
LICENSE
manifest.json
package.json
README.md
rollup.config.js
tsconfig.json
version-bump.mjs
versions.json

````

# Files

## File: .github/workflows/release.yml
```yaml
name: Release Obsidian plugin

on:
  push:
    tags:
      - "*"

env:
  PLUGIN_NAME: obsidian-better-command-palette

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v1
        with:
          node-version: "14.x"

      - name: Build
        id: build
        run: |
          npm install
          npm run build
          mkdir ${{ env.PLUGIN_NAME }}
          cp dist/main.js dist/manifest.json dist/styles.css ${{ env.PLUGIN_NAME }}
          zip -r ${{ env.PLUGIN_NAME }}.zip ${{ env.PLUGIN_NAME }}
          ls
          echo "::set-output name=tag_name::$(git tag --sort version:refname | tail -n 1)"

      - name: Create Release
        id: create_release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          VERSION: ${{ github.ref }}
        with:
          tag_name: ${{ github.ref }}
          release_name: ${{ github.ref }}
          draft: false
          prerelease: false

      - name: Upload zip file
        id: upload-zip
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./${{ env.PLUGIN_NAME }}.zip
          asset_name: ${{ env.PLUGIN_NAME }}-${{ steps.build.outputs.tag_name }}.zip
          asset_content_type: application/zip

      - name: Upload main.js
        id: upload-main
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./dist/main.js
          asset_name: main.js
          asset_content_type: text/javascript

      - name: Upload manifest.json
        id: upload-manifest
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./dist/manifest.json
          asset_name: manifest.json
          asset_content_type: application/json

      - name: Upload styles.css
        id: upload-css
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./dist/styles.css
          asset_name: styles.css
          asset_content_type: text/css
````

## File: src/palette-modal-adapters/command-adapter.ts

```typescript
import { Command, Instruction, setIcon } from 'obsidian';
import {
    generateHotKeyText, PaletteMatch, SuggestModalAdapter,
} from 'src/utils';
import { Match, UnsafeAppInterface } from 'src/types/types';
import { ActionType } from 'src/utils/constants';
⋮----
export default class BetterCommandPaletteCommandAdapter extends SuggestModalAdapter
⋮----
// Unsafe Interfaces
⋮----
initialize()
⋮----
// If a command was pinned and then the plugin removed we won't have a command here
⋮----
mount(): void
⋮----
getInstructions(): Instruction[]
⋮----
renderSuggestion(match: Match, content: HTMLElement, aux: HTMLElement): void
⋮----
// If hotkeys have been customized in some way (add new, deleted default)
// customHotkeys will be an array, otherwise undefined
// If there is a default hotkey defaultHotkeys will be an array
// (does not check any customization), otherwise undefined.
⋮----
// Has a plugin name prefix
⋮----
// Wish there was an easy way to get the plugin name without string manipulation
// Seems like this is how the acutal command palette does it though
⋮----
// Get first element
⋮----
async onChooseSuggestion(match: Match)
```

## File: src/palette-modal-adapters/file-adapter.ts

```typescript
import {
    Instruction, setIcon,
} from 'obsidian';
import {
    generateHotKeyText,
    getOrCreateFile,
    openFileWithEventKeys,
    OrderedSet,
    PaletteMatch, SuggestModalAdapter,
    createPaletteMatchesFromFilePath,
} from 'src/utils';
import { Match, UnsafeAppInterface } from 'src/types/types';
import { ActionType } from 'src/utils/constants';
⋮----
export default class BetterCommandPaletteFileAdapter extends SuggestModalAdapter
⋮----
// Unsafe interface
⋮----
initialize ()
⋮----
// Actually returns all files in the cache even if there are no unresolved links
⋮----
// If we shouldn't show the file type just return right now
⋮----
// Add any unresolved links to the set
⋮----
// Add the deduped links to all items
⋮----
// Use obsidian's last open files as the previous items
⋮----
// For previous items we only want the actual file, not any aliases
⋮----
mount (): void
⋮----
getInstructions (): Instruction[]
⋮----
cleanQuery (query: string): string
⋮----
renderSuggestion (match: Match, content: HTMLElement): void
⋮----
// Build the displayed note name without its full path if required in settings
⋮----
// Build the displayed note name without its Markdown extension if required in settings
⋮----
// Set Icon will destroy the first element in a node. So we need to add one back
⋮----
async onChooseSuggestion (match: Match, event: MouseEvent | KeyboardEvent)
⋮----
// No match means we are trying to create new file
⋮----
// If the path is an aliase, remove the alias prefix
⋮----
// We might not have a file if only a directory was specified
```

## File: src/palette-modal-adapters/index.ts

```typescript

```

## File: src/palette-modal-adapters/tag-adapter.ts

```typescript
import { Instruction } from 'obsidian';
import {
    generateHotKeyText,
    PaletteMatch, SuggestModalAdapter,
}
⋮----
import { ActionType, QUERY_TAG } from 'src/utils/constants';
import { Match, UnsafeAppInterface } from '../types/types';
⋮----
export default class BetterCommandPaletteTagAdapter extends SuggestModalAdapter
⋮----
// Unsafe interface
⋮----
initialize(): void
⋮----
mount(): void
⋮----
getInstructions(): Instruction[]
⋮----
cleanQuery(query: string): string
⋮----
renderSuggestion(match: Match, content: HTMLElement, aux: HTMLElement): void
⋮----
async onChooseSuggestion(match: Match)
```

## File: src/types/types.d.ts

```typescript
import {
    PluginSettingTab, Plugin, Command, Hotkey, MetadataCache, App, SuggestModal,
} from 'obsidian';
import { OrderedSet } from 'src/utils';
⋮----
interface MacroCommandInterface {
    commandIds: string[],
    name: string,
    delay: number,
}
⋮----
export interface BetterCommandPaletteInterface extends Plugin {
    settings: PluginSettingTab;

    prevCommands: OrderedSet<Match>;

    prevFiles: OrderedSet<Match>;

    prevTags: OrderedSet<Match>;

    suggestionsWorker: Worker;
}
⋮----
export interface Comparable {
    value: () => string;
}
⋮----
export interface Match extends Comparable {
    text: string,
    id: string,
    tags: string[],
}
⋮----
// Unsafe Interfaces
// Ideally we would not have to use these, but as far as I can tell
// they are the only way for certain functionality.
// Copied this pattern from Another Quick Switcher: https://github.com/tadashi-aikawa/obsidian-another-quick-switcher/blob/master/src/ui/AnotherQuickSwitcherModal.ts#L109
⋮----
export interface UnsafeSuggestModalInterface extends SuggestModal<Match> {
    chooser: {
        useSelectedItem(ev: Partial<KeyboardEvent>): void;
    }
    updateSuggestions(): void;
}
⋮----
useSelectedItem(ev: Partial<KeyboardEvent>): void;
⋮----
updateSuggestions(): void;
⋮----
interface UnsafeMetadataCacheInterface extends MetadataCache {
    getCachedFiles(): string[],
    getTags(): Record<string, number>;
}
⋮----
getCachedFiles(): string[],
getTags(): Record<string, number>;
⋮----
export interface UnsafeAppInterface extends App {
    commands: {
        listCommands(): Command[],
        findCommand(id: string): Command,
        removeCommand(id: string): void,
        executeCommandById(id: string): void,
        commands: Record<string, Command>,
    },
    hotkeyManager: {
        getHotkeys(id: string): Hotkey[],
        getDefaultHotkeys(id: string): Hotkey[],
    },
    metadataCache: UnsafeMetadataCacheInterface,
    internalPlugins: {
        getPluginById(id: string): { instance: { options: { pinned: [] } } },
    }
}
⋮----
listCommands(): Command[],
findCommand(id: string): Command,
removeCommand(id: string): void,
executeCommandById(id: string): void,
⋮----
getHotkeys(id: string): Hotkey[],
getDefaultHotkeys(id: string): Hotkey[],
⋮----
getPluginById(id: string):
⋮----
type HotkeyStyleType = 'auto' | 'mac' | 'windows';
⋮----
type Message = {
    data: {
        query: string,
        items: Match[],
    }
};
```

## File: src/types/worker.d.ts

```typescript

```

## File: src/utils/constants.ts

```typescript
export enum ActionType {
  Commands,
  Files,
  Tags,
}
```

## File: src/utils/index.ts

```typescript

```

## File: src/utils/macro.ts

```typescript
import {
    App, Command, Notice,
} from 'obsidian';
import { MacroCommandInterface, UnsafeAppInterface } from 'src/types/types';
⋮----
export default class MacroCommand implements Command, MacroCommandInterface
⋮----
constructor(
        app: App,
        id: string,
        name: string,
        commandIds: string[] = [],
        delay: number = 200,
)
⋮----
addCommand(commandId: string)
⋮----
removeCommand(commandId: string)
⋮----
commandIsAvailable(id:string)
⋮----
async callAllCommands()
⋮----
// Give our commands some time to complete
// eslint-disable-next-line no-await-in-loop
⋮----
// eslint-disable-next-line no-new
⋮----
checkCallback(checking: boolean): boolean | void
```

## File: src/utils/ordered-set.ts

```typescript
import { Comparable } from 'src/types/types';
⋮----
/**
 * A utility set that keeps track of the last time an item was added to the
 * set even if it was already in the set.
 */
export default class OrderedSet<T extends Comparable>
⋮----
constructor(values: T[] = [])
⋮----
has(item: T): boolean
⋮----
add(item: T)
⋮----
addAll(items: T[])
⋮----
delete(item: T)
⋮----
values(): T[]
⋮----
valuesByLastAdd(): T[]
```

## File: src/utils/palette-match.ts

```typescript
import { Match } from 'src/types/types';
⋮----
export default class PaletteMatch implements Match
⋮----
constructor(id: string, text: string, tags: string[] = [])
⋮----
value(): string
```

## File: src/utils/settings-command-suggest-modal.ts

```typescript
import { Command, FuzzySuggestModal } from 'obsidian';
import { UnsafeAppInterface } from 'src/types/types';
import { getCommandText } from './utils';
⋮----
export default class CommandSuggestModal extends FuzzySuggestModal<Command>
⋮----
constructor(app: UnsafeAppInterface, callback: (item: Command) => void)
⋮----
getItems(): Command[]
⋮----
onChooseItem(item: Command): void
```

## File: src/utils/suggest-modal-adapter.ts

```typescript
import { App, Instruction, KeymapEventHandler } from 'obsidian';
import BetterCommandPalettePlugin from 'src/main';
import BetterCommandPaletteModal from 'src/palette';
import { Match } from 'src/types/types';
import OrderedSet from 'src/utils/ordered-set';
⋮----
/**
 * A class that can be used by the palette modal to abstact away item specific logic between:
 * Commands, Files, and Tags
 */
export default abstract class SuggestModalAdapter
⋮----
abstract renderSuggestion(match: Match, content: HTMLElement, aux: HTMLElement): void;
abstract onChooseSuggestion(match: Match, event: MouseEvent | KeyboardEvent): void;
⋮----
constructor(
        app: App,
        prevItems: OrderedSet<Match>,
        plugin: BetterCommandPalettePlugin,
        palette: BetterCommandPaletteModal,
)
⋮----
getTitleText(): string
⋮----
getEmptyStateText(): string
⋮----
getInstructions(): Instruction[]
⋮----
checkInitialized()
⋮----
initialize()
⋮----
mount()
⋮----
unmount()
⋮----
cleanQuery(query: string)
⋮----
getPinnedItems(): Match[]
⋮----
getItems(): Match[]
⋮----
getPrevItems(): OrderedSet<Match>
⋮----
getSortedItems(): Match[]
⋮----
// TODO: Clean up this logic. If we ever have more than two things this will not work.
⋮----
// Bring it to the top
⋮----
async toggleHideId(id: string)
```

## File: src/utils/utils.ts

```typescript
import {
    App, Command, Hotkey, Modifier, normalizePath, parseFrontMatterAliases,
    parseFrontMatterTags, Platform, TFile,
} from 'obsidian';
import { BetterCommandPalettePluginSettings } from 'src/settings';
import { Match, UnsafeMetadataCacheInterface } from 'src/types/types';
import PaletteMatch from './palette-match';
import OrderedSet from './ordered-set';
import {
    BASIC_MODIFIER_ICONS, HYPER_KEY_MODIFIERS_SET, MAC_MODIFIER_ICONS, SPECIAL_KEYS,
} from './constants';
⋮----
/**
 * Determines if the modifiers of a hotkey could be a hyper key command.
 * @param {Modifier[]} modifiers An array of modifiers
 * @returns {boolean} Do the modifiers make up a hyper key command
 */
function isHyperKey (modifiers: Modifier[]): boolean
⋮----
/**
 * A utility that generates the text of a Hotkey for UIs
 * @param {Hotkey} hotkey The hotkey to generate text for
 * @returns {string} The hotkey text
 */
export function generateHotKeyText (
    hotkey: Hotkey,
    settings: BetterCommandPalettePluginSettings,
): string
⋮----
export function renderPrevItems (settings: BetterCommandPalettePluginSettings, match: Match, el: HTMLElement, prevItems: OrderedSet<Match>)
⋮----
export function getCommandText (item: Command): string
⋮----
export async function getOrCreateFile (app: App, path: string): Promise<TFile>
⋮----
// An error just means the folder path already exists
⋮----
export function openFileWithEventKeys (
    app: App,
    settings: BetterCommandPalettePluginSettings,
    file: TFile,
    event: MouseEvent | KeyboardEvent,
)
⋮----
// Figure if the file should be opened in a new tab
⋮----
// Open the file
⋮----
export function matchTag (tags: string[], tagQueries: string[]): boolean
⋮----
// If they are equal we have matched it
⋮----
// Check if the query could be a prefix for a nested tag
⋮----
export function createPaletteMatchesFromFilePath (
    metadataCache: UnsafeMetadataCacheInterface,
    filePath: string,
): PaletteMatch[]
⋮----
// Get the cache item for the file so that we can extract its tags
⋮----
// Sometimes the cache keeps files that have been deleted
⋮----
// Make the palette match
⋮----
filePath, // Concat our aliases and path to make searching easy
```

## File: src/web-workers/suggestions-worker.ts

```typescript
/* eslint-disable no-restricted-globals */
// We need to accesss self in our web worker
⋮----
import { Message } from 'src/types/types';
import { matchTag } from 'src/utils';
import { QUERY_OR, QUERY_TAG } from 'src/utils/constants';
```

## File: src/main.ts

```typescript
import { Plugin } from 'obsidian';
⋮----
import SuggestionsWorker from 'web-worker:./web-workers/suggestions-worker';
import { OrderedSet, MacroCommand } from 'src/utils';
import BetterCommandPaletteModal from 'src/palette';
import { Match, UnsafeAppInterface } from 'src/types/types';
import { BetterCommandPalettePluginSettings, BetterCommandPaletteSettingTab, DEFAULT_SETTINGS } from 'src/settings';
import { MACRO_COMMAND_ID_PREFIX } from './utils/constants';
⋮----
export default class BetterCommandPalettePlugin extends Plugin
⋮----
async onload()
⋮----
// eslint-disable-next-line no-console
⋮----
// Generally I would not set a hotkey, but since it is a
// command palette I think it makes sense
// Can still be overwritten in the hotkey settings
⋮----
onunload(): void
⋮----
loadMacroCommands()
⋮----
deleteMacroCommands()
⋮----
async loadSettings()
⋮----
async saveSettings()
```

## File: src/palette.ts

```typescript
import { App, setIcon, SuggestModal } from 'obsidian';
import {
    generateHotKeyText,
    OrderedSet, PaletteMatch, renderPrevItems, SuggestModalAdapter,
} from 'src/utils';
import { Match, UnsafeSuggestModalInterface } from 'src/types/types';
import {
    BetterCommandPaletteCommandAdapter,
    BetterCommandPaletteFileAdapter,
    BetterCommandPaletteTagAdapter,
} from 'src/palette-modal-adapters';
import BetterCommandPalettePlugin from 'src/main';
import { ActionType } from './utils/constants';
⋮----
class BetterCommandPaletteModal extends SuggestModal<Match> implements UnsafeSuggestModalInterface
⋮----
// Unsafe interface
⋮----
constructor (
        app: App,
        prevCommands: OrderedSet<Match>,
        prevTags: OrderedSet<Match>,
        plugin: BetterCommandPalettePlugin,
        suggestionsWorker: Worker,
        initialInputValue = '',
)
⋮----
// General instance variables
⋮----
// The only time the input will be empty will be when we are searching commands
⋮----
// Set up all of our different adapters
⋮----
// Lets us do the suggestion fuzzy search in a different thread
⋮----
// Add our custom title element
⋮----
// Update our action type before adding in our title element so the text is correct
⋮----
// Add in the title element
⋮----
// Set our scopes for the modal
⋮----
close (evt?: KeyboardEvent)
⋮----
setScopes (plugin: BetterCommandPalettePlugin)
⋮----
const closeModal = (event: KeyboardEvent) =>
⋮----
// Have to cast this to access `value`
⋮----
onOpen ()
⋮----
// Add the initial value to the input
// TODO: Figure out if there is a way to bypass the first seach
// result flickering before this is set
// As far as I can tell onOpen resets the value of the input so this is the first place
⋮----
changeActionType (actionType: ActionType)
⋮----
setQuery (
        newQuery: string,
        cursorPosition: number = -1,
)
⋮----
updateActionType (): boolean
⋮----
updateTitleText ()
⋮----
updateEmptyStateText ()
⋮----
updateInstructions ()
⋮----
getItems (): Match[]
⋮----
receivedSuggestions (msg: MessageEvent)
⋮----
// Sort the suggestions so that previously searched items are first
⋮----
getSuggestionsAsync (query: string)
⋮----
getSuggestions (query: string): Match[]
⋮----
// The action type might have changed
⋮----
// Load suggestions in another thread
⋮----
// For now return what we currently have. We'll populate results later if we need to
⋮----
updateHiddenItemCountHeader (hiddenItemCount: number)
⋮----
renderSuggestion (match: Match, el: HTMLElement)
⋮----
async onChooseSuggestion (item: Match, event: MouseEvent | KeyboardEvent)
```

## File: src/settings.ts

```typescript
import {
    App, Command, Modifier, PluginSettingTab, setIcon, Setting,
} from 'obsidian';
import BetterCommandPalettePlugin from 'src/main';
import { HotkeyStyleType, MacroCommandInterface, UnsafeAppInterface } from './types/types';
import { SettingsCommandSuggestModal } from './utils';
⋮----
export interface BetterCommandPalettePluginSettings {
    closeWithBackspace: boolean,
    showPluginName: boolean,
    fileSearchPrefix: string,
    tagSearchPrefix: string,
    commandSearchHotkey: string,
    fileSearchHotkey: string,
    tagSearchHotkey: string,
    suggestionLimit: number,
    recentAbovePinned: boolean,
    hyperKeyOverride: boolean,
    displayOnlyNotesNames: boolean,
    hideMdExtension: boolean,
    recentlyUsedText: string,
    macros: MacroCommandInterface[],
    hotkeyStyle: HotkeyStyleType;
    createNewFileMod: Modifier,
    openInNewTabMod: Modifier,
    hiddenCommands: string[],
    hiddenFiles: string[],
    hiddenTags: string[],
    fileTypeExclusion: string[],
}
⋮----
export class BetterCommandPaletteSettingTab extends PluginSettingTab
⋮----
constructor (app: App, plugin: BetterCommandPalettePlugin)
⋮----
display (): void
⋮----
displayBasicSettings (): void
⋮----
displayMacroSettings (): void
```

## File: src/styles.scss

```scss
.better-command-palette {
  .better-command-palette-title {
    color: var(--text-accent);
    margin: 5px;
  }

  .hidden-items-header {
    margin: 0px;
    margin-left: 13px;
    margin-top: 10px;
    font-size: 15px;
    color: var(--text-faint);

    &:hover {
      color: var(--text-muted);
      cursor: pointer;
    }
  }

  .suggestion-item {
    &.hidden {
      color: var(--text-accent);

      .suggestion-flair {
        transform: rotate(45deg);
      }
    }

    .suggestion-flair {
      color: var(--text-faint);
      margin-right: 10px;
    }

    .suggestion-hotkey {
      white-space: nowrap;
      margin-left: 10px;
      padding: 0px 10px;
    }

    .suggestion-content {
      svg {
        margin: 0px 5px;
        color: var(--text-muted);
      }
    }

    .suggestion-aux {
      flex-direction: row-reverse;
    }

    .suggestion-title {
      display: flex;
      align-items: center;
    }

    .suggestion-note {
      flex: 1;
    }

    .unresolved {
      color: var(--text-muted);

      &::after {
        content: '(Unresolved link)';
        color: var(--text-faint);
        margin-left: 10px;
      }
    }
  }
}

/* Settings Styles */
.macro-setting {
  flex-wrap: wrap;
  .setting-item-name {
    font-weight: bold;
  }

  .macro-main-settings {
    width: 100%;
    display: grid;
    grid-template-columns: 80% 20%;
    border-top: solid 1px var(--background-modifier-border);
    margin-top: 10px;

    * {
      margin-top: 10px;
    }
  }

  .macro-command {
    display: flex;
    align-items: center;
    width: 100%;

    button {
      margin-left: 30px;
      margin-right: 20px;
    }
  }
}
```

## File: test/e2e/tests/index.ts

```typescript
import testCommandPalette from './test-command-palette'
import testFilePalette from './test-file-palette'
import testTagPalette from './test-tag-palette'
import init from './initialize-test-env'
import tearDown from './tear-down-test-env'
```

## File: test/e2e/tests/initialize-test-env.ts

```typescript
import { TestCase } from '../test-utils'
```

## File: test/e2e/tests/tear-down-test-env.ts

```typescript
import { TestCase } from '../test-utils'
```

## File: test/e2e/tests/test-command-palette.ts

```typescript
import {
    TestCase,
} from '../test-utils';
⋮----
// Test open, search, and close
⋮----
// Test recent commands
```

## File: test/e2e/tests/test-file-palette.ts

```typescript
import { TestCase } from '../test-utils'
```

## File: test/e2e/tests/test-tag-palette.ts

```typescript
import { TestCase } from '../test-utils'
```

## File: test/e2e/test-utils.ts

```typescript
// Test interfaces
interface PressKeyOptions {
    shiftKey?: boolean,
    metaKey?: boolean,
    selector?: string,
}
⋮----
// Test Utils
⋮----
export function wait(ms: number = 100): Promise<void>
⋮----
// eslint-disable-next-line
⋮----
type TestCommand = (...any: any[]) => any | void;
⋮----
export class TestCase
⋮----
constructor(testCaseName: string)
⋮----
async run(): Promise<void>
⋮----
// eslint-disable-next-line no-console
⋮----
// eslint-disable-next-line no-await-in-loop
⋮----
// eslint-disable-next-line no-console
⋮----
// eslint-disable-next-line no-console
⋮----
// eslint-disable-next-line no-console
⋮----
// eslint-disable-next-line no-await-in-loop
⋮----
addTest(testName: string, testFunc: () => void)
⋮----
async runCommandWithRetries(
        command: TestCommand,
        { retryCount = 10, waitMs = 200 } = {},
): Promise<any>
⋮----
// eslint-disable-next-line no-await-in-loop
⋮----
// eslint-disable-next-line no-await-in-loop
⋮----
// Internal funcs
⋮----
// External functions
async findAllEls(selector: string): Promise<Element[]>
⋮----
async findEl(selector: string, options: Object =
⋮----
async typeInEl(selector: string, text: string): Promise<void>
⋮----
async clickEl(selector: string, options: Object =
⋮----
async pressKey(key: string, options: PressKeyOptions =
⋮----
async assertElCount(selector: string, count: number, options: Object =
⋮----
async assertExists(val: any)
```

## File: test/e2e/test.ts

```typescript
import plugin from 'src/main';
import { UnsafeAppInterface } from 'src/types/types';
import tests from './tests';
⋮----
// eslint-disable-next-line no-console
⋮----
// eslint-disable-next-line no-console
⋮----
// eslint-disable-next-line no-await-in-loop
```

## File: tools/generate-test-files.js

```javascript
import yargs from 'yargs'; // eslint-disable-line import/no-extraneous-dependencies
import { hideBin } from 'yargs/helpers'; // eslint-disable-line import/no-extraneous-dependencies
⋮----
const { argv } = yargs(hideBin(process.argv))
.option('count', {
⋮----
.option('path', {
⋮----
.option('ext', {
⋮----
.option('name', {
⋮----
.option('text', {
⋮----
.demandOption(['count']);
⋮----
mkdirSync(argv.path, { recursive: true });
⋮----
writeFile(fileName, argv.text.replaceAll('{c}', i), () => {});
⋮----
// eslint-disable-next-line no-console
console.log(`Created ${argv.count} at ${argv.path}`);
```

## File: .editorconfig

```
# top-most EditorConfig file
root = true

[*]
charset = utf-8
insert_final_newline = true
indent_style = tab
indent_size = 4
tab_width = 4
```

## File: .eslintignore

```
npm node_modules
dist
```

## File: .eslintrc.cjs

```
files: ['*.ts'], // Your TypeScript files extension
// As mentioned in the comments, you should extend TypeScript plugins here,
// instead of extending them outside the `overrides`.
// If you don't want to extend any rules, you don't need an `extends` attribute.
```

## File: .gitignore

```
# vscode
.vscode

# Intellij
*.iml
.idea

# npm
node_modules

# Don't include the compiled main.js file in the repo.
# They should be uploaded to GitHub releases instead.
main.js
styles.css

# Exclude sourcemaps
*.map

# obsidian
data.json

# build folder
dist

# dev build folder
test-vault

# Mac
.DS_Store
```

## File: .npmrc

```
tag-version-prefix=""
```

## File: LICENSE

```
MIT License

Copyright (c) [year] [fullname]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## File: manifest.json

```json
{
  "id": "obsidian-better-command-palette",
  "name": "Better Command Palette",
  "version": "0.17.1",
  "minAppVersion": "0.12.0",
  "description": "A command palette that does all of the things you want it to do.",
  "author": "Alex Bieg",
  "authorUrl": "www.github.com/AlexBieg",
  "isDesktopOnly": false
}
```

## File: package.json

```json
{
  "name": "obsidian-better-command-palette",
  "version": "0.17.1",
  "description": "A command palette that does all of the things you want it to do.",
  "main": "main.js",
  "type": "module",
  "scripts": {
    "dev": "rollup --config rollup.config.js -w",
    "build": "NODE_ENV=production rollup --config rollup.config.js",
    "build-local": "NODE_ENV=production DEST=local rollup --config rollup.config.js",
    "version": "node version-bump.mjs && git add manifest.json versions.json",
    "test:lint": "eslint .",
    "test:e2e": "TYPE=test rollup --config rollup.config.js -w",
    "tool:gen-files": "node ./tools/generate-test-files.js"
  },
  "keywords": [],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "@rollup/plugin-commonjs": "^21.0.1",
    "@rollup/plugin-eslint": "^8.0.1",
    "@rollup/plugin-node-resolve": "^13.1.3",
    "@types/node": "^16.11.6",
    "@typescript-eslint/eslint-plugin": "^5.2.0",
    "@typescript-eslint/parser": "^5.2.0",
    "builtin-modules": "^3.2.0",
    "eslint": "^8.8.0",
    "eslint-config-airbnb-base": "^15.0.0",
    "eslint-config-airbnb-typescript": "^16.1.0",
    "eslint-plugin-import": "^2.25.4",
    "obsidian": "^0.12.17",
    "rollup": "^2.66.1",
    "rollup-plugin-copy": "^3.4.0",
    "rollup-plugin-root-import": "^1.0.0",
    "rollup-plugin-scss": "^3.0.0",
    "rollup-plugin-terser": "^7.0.2",
    "rollup-plugin-typescript2": "^0.31.2",
    "rollup-plugin-web-worker-loader": "^1.6.1",
    "sass": "^1.49.7",
    "tslib": "2.3.1",
    "typescript": "4.4.4",
    "yargs": "^17.3.1"
  },
  "dependencies": {
    "fuzzysort": "^1.1.4"
  }
}
```

## File: README.md

```markdown
# Obsidian Better Command Palette

A plugin for Obsidian that adds a command palatte that is more user friendly and more feature rich. Use `cmd+shift+p` to to open the palette.

Quick Feature List:

1. Use backspace to close the palette
2. Recent choices bubble to the top
3. Built in quick switcher by typing `/` or using the hotkey
4. Built in tag search by typing `#` or using the hotkey
5. Search files with specific tags
6. Macro commands
7. Hide less useful Commands, Files, and Tag, but quickly see them again with `cmd+i`

Coming Soon:

1. Populate the input with recent queries automatically
2. Search files via unstructured frontmatter content

## Features

### Backspace to close

When the palette has no text entered into the input and you press backspace, then the palette will close. This can be turned off in the settings.

### Recent Choices

Choices that have been recently used will bubble up to the top of the command list.

### Pinned Commands

Commands that have been pinned in the default `Command Palette` will be pinned here as well.

### File Opening

Better Command Palette allows you to open files from the same input without needing to run a command or press `cmd+o first`. Once the palette is open just type `/` (This can be changed in the settings) and you will be searching files to open. Press `enter` to open the file.

### File Creation

If after searching for files to open there are no results you may press `cmd+enter` to create a file with the same name as you have entered. You may specify directories. If the directory path does not exist it will create it.

### File Searching using Tags

Better Command Palette allows you to find and open files that contain the tags you search for.
Type `#` (configurable in the settings) to begin searching all of the tags in your vault. Press enter to use that tag to filter the file search.

### Macro Commands

Macros can be created in the settings tab for Better Command Palette. Each Macro must be give a name, delay, and at least one command. If any of these are not set the macro will not show up in the command palette.

The delay is the number of milliseconds the macro will wait between each command. This can be useful for commands that take some time to complete.

Any command can be added including other macro commands. Each command is run in sequence. At each step the macro will check if the next command can be run. Certain commands require certain conditions to be met. A an error message will be shown if a command could not be run. The macro will only be shown in the command palette if the first command can be run at that time.

Hotkeys can be assigned to the macro in the normal hotkey tab after the macro has been created.

### Hidden Items

All items that are shown in the palette (Commands, Files, and Tags) can be hidden. Click the `X` next to the item to hide it from both current and future search results. If you want to be able to selec that item again briefly you can click the `Show hidden items` message under the search input or use `cmd+I` to reveal hidden items in the palette. These will be highlighted to better distinguish them. If you decide you want to unhide an item simply make sure hidden items are being shown, search for the item, and click the plus button next to it.

## Development

### Project Setup

1. Clone the repo
2. Run `npm install`

### Development Build

Run `npm run dev`

This will create a directory named `test-vault` in your repo (automatically ignored by git). You can point obsidian to this directory and use it as a testing environment. Files are automatically watched and the dev server will restart when they are changed.

### Local Build

Run `npm run build-local`

This builds the plugin in production mode and copies the needed files to the root of the repo (automatically ignored by git). This is to allow people who wish to manually install the plugin on their machines to easily do so by copying the plugin to their plugin directory and running the command.

### Production Build

Run `npm run build`

Builds the plugin for production and puts all neccessary files into the `dist` directory. Pretty much only used by github actions for releases.
```

## File: rollup.config.js

```javascript
nodeResolve({
⋮----
commonjs(),
scss({
⋮----
// eslint(),
copy({
⋮----
webWorkerLoader({
⋮----
typescript(),
isProduction && terser(),
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": ".",
    "sourceMap": true,
    "inlineSources": true,
    "module": "ESNext",
    "target": "ES6",
    "allowJs": true,
    "noImplicitAny": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "isolatedModules": true,
    "lib": ["DOM", "ES5", "ES6", "ES7"]
  },
  "include": ["**/*.ts"]
}
```

## File: version-bump.mjs

```
// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
⋮----
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));
⋮----
// update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync("versions.json", "utf8"));
⋮----
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
```

## File: versions.json

```json
{
  "0.1.0": "0.12.0",
  "0.2.0": "0.12.0",
  "0.2.1": "0.12.0",
  "0.3.0": "0.12.0",
  "0.4.0": "0.12.0",
  "0.5.0": "0.12.0",
  "0.5.1": "0.12.0",
  "0.5.2": "0.12.0",
  "0.6.0": "0.12.0",
  "0.6.1": "0.12.0",
  "0.6.2": "0.12.0",
  "0.7.0": "0.12.0",
  "0.7.1": "0.12.0",
  "0.8.0": "0.12.0",
  "0.9.0": "0.12.0",
  "0.9.1": "0.12.0",
  "0.10.0": "0.12.0",
  "0.11.0": "0.12.0",
  "0.11.1": "0.12.0",
  "0.11.2": "0.12.0",
  "0.11.3": "0.12.0",
  "0.11.4": "0.12.0",
  "0.11.5": "0.12.0",
  "0.12.0": "0.12.0",
  "0.12.1": "0.12.0",
  "0.12.2": "0.12.0",
  "0.13.0": "0.12.0",
  "0.13.1": "0.12.0",
  "0.14.0": "0.12.0",
  "0.15.0": "0.12.0",
  "0.16.0": "0.12.0",
  "0.17.0": "0.12.0",
  "0.17.1": "0.12.0"
}
```

```

```
