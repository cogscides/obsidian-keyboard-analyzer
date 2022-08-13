import type {
  PluginSettings,
  FilterSettings,
  KeyboardInterface,
} from 'src/Interfaces'
export const VIEW_TYPE_SHORTCUTS_ANALYZER = 'keyboard-shortcuts-visualization'

export const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  FeaturedFirst: false,
  HighlightCustom: false,
  HighlightDuplicates: false,
  DisplayWOhotkeys: false,
  DisplayIDs: false,
}

export const DEFAULT_PLUGIN_SETTINGS: PluginSettings = {
  showStatusBarItem: true,
  filterSettings: DEFAULT_FILTER_SETTINGS,
  featuredCommandIDs: [],
}

export const keyboard_svelte = [
  {
    row: 0,
    value: 'Esc',
  },
  {
    row: 0,
    value: 'F1',
  },
  {
    row: 0,
    value: 'F2',
  },
  {
    row: 0,
    value: 'F3',
  },
  {
    row: 0,
    value: 'F4',
  },
  {
    row: 0,
    value: 'F5',
  },
  {
    row: 0,
    value: 'F6',
  },
  {
    row: 0,
    value: 'F7',
  },
  {
    row: 0,
    value: 'F8',
  },
  {
    row: 0,
    value: 'F9',
  },
  {
    row: 0,
    value: 'F10',
  },
  {
    row: 0,
    value: 'F11',
  },
  {
    row: 0,
    value: 'F12',
  },
  {
    row: 1,
    value: 'Tab',
  },
  {
    row: 1,
    value: 'Q',
  },
  {
    row: 1,
    value: 'W',
  },
  {
    row: 1,
    value: 'E',
  },
  {
    row: 1,
    value: 'R',
  },
  {
    row: 1,
    value: 'T',
  },
  {
    row: 1,
    value: 'Y',
  },
  {
    row: 1,
    value: 'U',
  },
  {
    row: 1,
    value: 'I',
  },
  {
    row: 1,
    value: 'O',
  },
  {
    row: 1,
    value: 'P',
  },
  {
    row: 1,
    value: '{',
  },
  {
    row: 1,
    value: '}',
  },
  {
    row: 2,
    value: 'Caps Lock',
  },
  {
    row: 2,
    value: 'A',
  },
  {
    row: 2,
    value: 'S',
  },
  {
    row: 2,
    value: 'D',
  },
  {
    row: 2,
    value: 'F',
  },
  {
    row: 2,
    value: 'G',
  },
  {
    row: 2,
    value: 'H',
  },
  {
    row: 2,
    value: 'J',
  },
  {
    row: 2,
    value: 'K',
  },
  {
    row: 2,
    value: 'L',
  },
  {
    row: 2,
    value: ';',
  },
  {
    row: 2,
    value: ':',
  },
  {
    row: 2,
    value: "'",
  },
  {
    row: 2,
    value: 'Enter',
  },
  {
    row: 3,
    value: 'LShift',
    display: 'Shift',
  },
  {
    row: 3,
    value: 'Z',
  },
  {
    row: 3,
    value: 'X',
  },
  {
    row: 3,
    value: 'C',
  },
  {
    row: 3,
    value: 'V',
  },
  {
    row: 3,
    value: 'B',
  },
  {
    row: 3,
    value: 'N',
  },
  {
    row: 3,
    value: 'M',
  },
  {
    row: 3,
    value: ',',
  },
  {
    row: 3,
    value: '.',
  },
  {
    row: 3,
    value: '/',
  },
  {
    row: 3,
    value: 'RShift',
    display: 'Shift',
  },
  {
    row: 4,
    value: 'LControl',
    display: 'Ctrl',
  },
  {
    row: 4,
    value: 'LWin',
    display: 'Win',
  },
  {
    row: 4,
    value: 'LAlt',
    display: 'Alt',
  },
  {
    row: 4,
    value: 'Space',
  },
  {
    row: 4,
    value: 'RAlt',
    display: 'Alt',
  },
  {
    row: 4,
    value: 'RWin',
    display: 'Win',
  },
  {
    row: 4,
    value: 'Menu',
    display: 'Menu',
  },
  {
    row: 4,
    value: 'RControl',
  },
]

// keyboard layout for other keys and cursor keys
export const keyboard_svelte_other = [
  {
    row: 0,
    value: 'Insert',
  },
  {
    row: 0,
    value: 'Home',
  },
  {
    row: 0,
    value: 'Pg Up',
    display: 'Page Up',
  },
  {
    row: 1,
    value: 'Delete',
  },
  {
    row: 1,
    value: 'End',
  },
  {
    row: 1,
    value: 'Pg Down',
    display: 'Pg Down',
  },
  {
    row: 2,
    value: '',
  },
  {
    row: 3,
    value: '',
  },
  {
    row: 3,
    value: 'Up',
  },
  {
    row: 3,
    value: '',
  },
  {
    row: 4,
    value: 'Left',
  },
  {
    row: 4,
    value: 'Down',
  },
  {
    row: 4,
    value: 'Right',
  },
]

// keyboard layout in rows for number pad
export const keyboard_svelte_num = [
  {
    row: 0,
    value: 'Num Lock',
  },
  {
    row: 0,
    value: '/',
  },
  {
    row: 0,
    value: '*',
  },
  {
    row: 0,
    value: '-',
  },
  {
    row: 1,
    value: '7',
  },
  {
    row: 1,
    value: '8',
  },
  {
    row: 1,
    value: '9',
  },
  {
    row: 1,
    value: '+',
  },
  {
    row: 2,
    value: '4',
  },
  {
    row: 2,
    value: '5',
  },
  {
    row: 2,
    value: '6',
  },
  {
    row: 2,
    value: '+',
  },
  {
    row: 3,
    value: '1',
  },
  {
    row: 3,
    value: '2',
  },
  {
    row: 3,
    value: '3',
  },
  {
    row: 3,
    value: 'Enter',
  },
  {
    row: 4,
    value: '0',
  },
  {
    row: 4,
    value: '.',
  },
  {
    row: 4,
    value: '=',
  },
]

export const kb_layout_ansi104eng = [
  [
    'Esc',
    { x: 1 },
    'F1',
    'F2',
    'F3',
    'F4',
    { x: 0.5 },
    'F5',
    'F6',
    'F7',
    'F8',
    { x: 0.5 },
    'F9',
    'F10',
    'F11',
    'F12',
    { x: 0.25 },
    'PrtSc',
    'Scroll Lock',
    'Pause<br>Break',
  ],
  [
    { y: 0.5 },
    '~<br>`',
    '!<br>1',
    '@<br>2',
    '#<br>3',
    '$<br>4',
    '%<br>5',
    '^<br>6',
    '&<br>7',
    '*<br>8',
    '(<br>9',
    ')<br>0',
    '_<br>-',
    '+<br>=',
    { w: 2 },
    'Backspace',
    { x: 0.25 },
    'Insert',
    'Home',
    'PgUp',
    { x: 0.25 },
    'Num Lock',
    '/',
    '*',
    '-',
  ],
  [
    { w: 1.5 },
    'Tab',
    'Q',
    'W',
    'E',
    'R',
    'T',
    'Y',
    'U',
    'I',
    'O',
    'P',
    '{<br>[',
    '}<br>]',
    { w: 1.5 },
    '|<br>\\',
    { x: 0.25 },
    'Delete',
    'End',
    'PgDn',
    { x: 0.25 },
    '7<br>Home',
    '8<br>↑',
    '9<br>PgUp',
    { h: 2 },
    '+',
  ],
  [
    { w: 1.75 },
    'Caps Lock',
    'A',
    'S',
    'D',
    'F',
    'G',
    'H',
    'J',
    'K',
    'L',
    ':<br>;',
    '"<br>\'',
    { w: 2.25 },
    'Enter',
    { x: 3.5 },
    '4<br>←',
    '5',
    '6<br>→',
  ],
  [
    { w: 2.25 },
    'Shift',
    'Z',
    'X',
    'C',
    'V',
    'B',
    'N',
    'M',
    '<<br>,',
    '><br>.',
    '?<br>/',
    { w: 2.75 },
    'Shift',
    { x: 1.25 },
    '↑',
    { x: 1.25 },
    '1<br>End',
    '2<br>↓',
    '3<br>PgDn',
    { h: 2 },
    'Enter',
  ],
  [
    { w: 1.25 },
    'Ctrl',
    { w: 1.25 },
    'Win',
    { w: 1.25 },
    'Alt',
    { a: 7, w: 6.25 },
    'Space',
    { a: 4, w: 1.25 },
    'Alt',
    { w: 1.25 },
    'Win',
    { w: 1.25 },
    'Menu',
    { w: 1.25 },
    'Ctrl',
    { x: 0.25 },
    '←',
    '↓',
    '→',
    { x: 0.25, w: 2 },
    '0<br>Ins',
    '.<br>Del',
  ],
]

export const kbWinNum: KeyboardInterface = [
  [
    {
      label: 'Esc',
    },
    { x: 1 },
    {
      label: 'F1',
    },
    {
      label: 'F2',
    },
    {
      label: 'F3',
    },
    {
      label: 'F4',
    },
    {
      x: 0.5,
    },
    {
      label: 'F5',
    },
    {
      label: 'F6',
    },
    {
      label: 'F7',
    },
    {
      label: 'F8',
    },
    {
      x: 0.5,
    },
    {
      label: 'F9',
    },
    {
      label: 'F10',
    },
    {
      label: 'F11',
    },
    {
      label: 'F12',
    },
    {
      x: 0.5,
    },
    {
      label: 'PrtSc',
    },
    {
      label: 'Scroll<br>Lock',
    },
    {
      label: 'Pause<br>Break',
    },
  ],
  [
    {
      y: 0.5,
    },
  ],
  [
    {
      label: '~<br>`',
    },
    {
      label: '!<br>1',
    },
    {
      label: '@<br>2',
    },
    { label: '#<br>3' },
    { label: '$<br>4' },
    { label: '%<br>5' },
    { label: '^<br>6' },
    { label: '&<br>7' },
    { label: '*<br>8' },
    { label: '(<br>9' },
    { label: ')<br>0' },
    { label: '_<br>-' },
    { label: '+<br>=' },
    { x: 2 },
    { label: '⌫' },
    { x: 0.25 },
    { label: 'Insert' },
    { label: 'Home' },
    { label: 'PgUp' },
    { x: 0.25 },
    { label: 'Num<br>Lock' },
    { label: '/' },
    { label: '*' },
    { label: '-' },
  ],
  [
    { label: 'Tab', width: 1.5 },
    { label: 'Q' },
    { label: 'W' },
    { label: 'E' },
    { label: 'R' },
    { label: 'T' },
    { label: 'Y' },
    { label: 'U' },
    { label: 'I' },
    { label: 'O' },
    { label: 'P' },
    { label: '{<br>[' },
    { label: '}<br>]' },
    { label: '|<br>\\', width: 1.5 },
    { x: 0.25 },
    { label: 'Delete' },
    { label: 'End' },
    { label: 'PgDn' },
    { x: 0.25 },
    { label: '7<br>Home' },
    { label: '8<br>↑' },
    { label: '9<br>PgUp' },
    { label: '+', height: 2 },
  ],
  [
    { label: 'Caps Lock', width: 1.75 },
    { label: 'A' },
    { label: 'S' },
    { label: 'D' },
    { label: 'F' },
    { label: 'G' },
    { label: 'H' },
    { label: 'J' },
    { label: 'K' },
    { label: 'L' },
    { label: ':<br>;' },
    { label: '"<br>\'' },
    { label: 'Enter', width: 2.25 },
    { x: 3.5 },
    { label: '4<br>←' },
    { label: '5' },
    { label: '6<br>→' },
  ],
  [
    [
      { label: 'Shift', width: 2.25 },
      { label: 'Z' },
      { label: 'X' },
      { label: 'C' },
      { label: 'V' },
      { label: 'B' },
      { label: 'N' },
      { label: 'M' },
      { label: '<<br>,' },
      { label: '><br>.' },
      { label: '?<br>/' },
      { label: 'Shift', width: 2.75 },
      { x: 1.25 },
      { label: '↑' },
      { x: 1.25 },
      { label: '1<br>End' },
      { label: '2<br>↓' },
      { label: '3<br>PgDn' },
    ],
    [
      { label: 'Ctrl', width: 1.25 },
      { label: 'Win', width: 1.25 },
      { label: 'Alt', width: 1.25 },
      { label: 'Space', width: 6.25 },
      { label: 'Alt', width: 1.25 },
      { label: 'Win', width: 1.25 },
      { label: 'Menu', width: 1.25 },
      { label: 'Ctrl', width: 1.25 },
      { x: 0.25 },
      { label: '←', width: 1.25 },
      { label: '↓', width: 1.25 },
      { label: '→', width: 1.25 },
      { x: 0.25 },
      { label: '0<br>Ins', width: 2 },
      { label: '.<br>Del' },
    ],
    [{ label: 'Enter', height: 2 }],
  ],
]

export const SpecialSymbols: {
  [key: string]: string
} = {
  Command: '⌘',
  Option: '⌥',
  ArrowLeft: '←',
  ArrowUp: '↑',
  ArrowRight: '→',
  ArrowDown: '↓',
  Space: '⎵',
  ' ': '⎵',
}

// https://www.toptal.com/developers/keycode/table-of-all-keycodes
export const JavaSciptKeyCodes: {
  [KeyCode: number]: { Key?: string; Code?: string; Unicode?: string }
} = {
  3: {
    Key: 'Cancel',
    Code: 'Pause',
  },
  8: {
    Key: 'Backspace',
    Code: 'Backspace',
    Unicode: '⌫',
  },
  9: {
    Key: 'Tab',
    Code: 'Tab',
    Unicode: '⇥',
  },
  12: {
    Key: 'Clear',
    Code: 'NumLock',
    Unicode: '⌧',
  },
  13: {
    Key: 'Enter',
    Code: 'Enter',
    Unicode: '⏎',
  },
  16: {
    Key: 'Shift',
    Code: 'ShiftLeft',
    Unicode: '⇧',
  },
  17: {
    Key: 'Control',
    Code: 'ControlLeft',
  },
  18: {
    Key: 'Alt',
    Code: 'AltLeft',
  },
  19: {
    Key: 'Pause',
    Code: 'Pause',
  },
  20: {
    Key: 'CapsLock',
    Code: 'CapsLock',
    Unicode: '⇪',
  },
  27: {
    Key: 'Escape',
    Code: 'Escape',
    Unicode: '⎋',
  },
  32: {
    Key: ' ',
    Code: 'Space',
    Unicode: '⎵',
  },
  33: {
    Key: 'PageUp',
    Code: 'Numpad9',
    Unicode: '⇞',
  },
  34: {
    Key: 'PageDown',
    Code: 'Numpad3',
    Unicode: '⇟',
  },
  35: {
    Key: 'End',
    Code: 'Numpad1',
    Unicode: '⇢',
  },
  36: {
    Key: 'Home',
    Code: 'Numpad7',
    Unicode: '⌂',
  },
  37: {
    Key: 'ArrowLeft',
    Code: 'ArrowLeft',
    Unicode: '←',
  },
  38: {
    Key: 'ArrowUp',
    Code: 'ArrowUp',
    Unicode: '↑',
  },
  39: {
    Key: 'ArrowRight',
    Code: 'ArrowRight',
    Unicode: '→',
  },
  40: {
    Key: 'ArrowDown',
    Code: 'ArrowDown',
    Unicode: '↓',
  },
  44: {
    Key: 'F13',
    Code: 'F13',
    Unicode: '⎙',
  },
  45: {
    Key: 'Insert',
    Code: 'Numpad0',
    Unicode: 'x',
  },
  46: {
    Key: 'Delete',
    Code: 'NumpadDecimal',
    Unicode: '⌦',
  },
  48: {
    Key: '0',
    Code: 'Digit0',
    Unicode: '0',
  },
  49: {
    Key: '1',
    Code: 'Digit1',
    Unicode: '1',
  },
  50: {
    Key: '2',
    Code: 'Digit2',
    Unicode: '2',
  },
  51: {
    Key: '3',
    Code: 'Digit3',
    Unicode: '3',
  },
  52: {
    Key: '4',
    Code: 'Digit4',
    Unicode: '4',
  },
  53: {
    Key: '5',
    Code: 'Digit5',
    Unicode: '5',
  },

  54: {
    Key: '6',
    Code: 'Digit6',
    Unicode: '6',
  },
  55: {
    Key: '7',
    Code: 'Digit7',
    Unicode: '7',
  },
  56: {
    Key: '8',
    Code: 'Digit8',
    Unicode: '8',
  },
  57: {
    Key: '9',
    Code: 'Digit9',
    Unicode: '9',
  },
  58: {
    Key: ':',
    Code: 'Period',
  },
  59: {
    Key: ';',
    Code: 'Semicolon',
  },
  60: {
    Key: '<',
    Code: 'Backquote',
  },
  61: {
    Key: '=',
    Code: 'Equal',
  },
  63: {
    Key: 'ß',
    Code: 'Minus',
  },
  65: {
    Key: 'a',
    Code: 'KeyA',
  },
  66: {
    Key: 'b',
    Code: 'KeyB',
  },
  67: {
    Key: 'c',
    Code: 'KeyC',
  },
  68: {
    Key: 'd',
    Code: 'KeyD',
  },
  69: {
    Key: 'e',
    Code: 'KeyE',
  },
  70: {
    Key: 'f',
    Code: 'KeyF',
  },
  71: {
    Key: 'g',
    Code: 'KeyG',
  },
  72: {
    Key: 'h',
    Code: 'KeyH',
  },
  73: {
    Key: 'i',
    Code: 'KeyI',
  },
  74: {
    Key: 'j',
    Code: 'KeyJ',
  },
  75: {
    Key: 'k',
    Code: 'KeyK',
  },
  76: {
    Key: 'l',
    Code: 'KeyL',
  },
  77: {
    Key: 'm',
    Code: 'KeyM',
  },
  78: {
    Key: 'n',
    Code: 'KeyN',
  },
  79: {
    Key: 'o',
    Code: 'KeyO',
  },
  80: {
    Key: 'p',
    Code: 'KeyP',
  },
  81: {
    Key: 'q',
    Code: 'KeyQ',
  },
  82: {
    Key: 'r',
    Code: 'KeyR',
  },
  83: {
    Key: 's',
    Code: 'KeyS',
  },
  84: {
    Key: 't',
    Code: 'KeyT',
  },
  85: {
    Key: 'u',
    Code: 'KeyU',
  },
  86: {
    Key: 'v',
    Code: 'KeyV',
  },
  87: {
    Key: 'w',
    Code: 'KeyW',
  },
  88: {
    Key: 'x',
    Code: 'KeyX',
  },
  89: {
    Key: 'y',
    Code: 'KeyY',
  },
  90: {
    Key: 'z',
    Code: 'KeyZ',
  },
  91: {
    Key: 'Meta',
    Code: 'MetaLeft',
  },
  92: {
    Key: 'Meta',
    Code: 'MetaRight',
  },
  93: {
    Key: 'ContextMenu',
    Code: 'ContextMenu',
  },
  96: {
    Key: '0',
    Code: 'Numpad0',
    Unicode: '⓪',
  },
  97: {
    Key: '1',
    Code: 'Numpad1',
    Unicode: '①',
  },
  98: {
    Key: '2',
    Code: 'Numpad2',
    Unicode: '②',
  },
  99: {
    Key: '3',
    Code: 'Numpad3',
    Unicode: '③',
  },
  100: {
    Key: '4',
    Code: 'Numpad4',
    Unicode: '④',
  },
  101: {
    Key: '5',
    Code: 'Numpad5',
    Unicode: '⑤',
  },
  102: {
    Key: '6',
    Code: 'Numpad6',
    Unicode: '⑥',
  },
  103: {
    Key: '7',
    Code: 'Numpad7',
    Unicode: '⑦',
  },
  104: {
    Key: '8',
    Code: 'Numpad8',
    Unicode: '⑧',
  },
  105: {
    Key: '9',
    Code: 'Numpad9',
    Unicode: '⑨',
  },
  106: {
    Key: '*',
    Code: 'NumpadMultiply',
    Unicode: '×',
  },
  107: {
    Key: '+',
    Code: 'NumpadAdd',
  },
  108: {
    Key: ',',
    Code: 'NumpadDecimal',
  },
  109: {
    Key: '-',
    Code: 'NumpadSubtract',
  },
  110: {
    Key: '.',
    Code: 'NumpadDecimal',
  },
  111: {
    Key: '/',
    Code: 'NumpadDivide',
  },
  112: {
    Key: 'F1',
    Code: 'F1',
  },
  113: {
    Key: 'F2',
    Code: 'F2',
  },
  114: {
    Key: 'F3',
    Code: 'F3',
  },
  115: {
    Key: 'F4',
    Code: 'F4',
  },
  116: {
    Key: 'F5',
    Code: 'F5',
  },
  117: {
    Key: 'F6',
    Code: 'F6',
  },
  118: {
    Key: 'F7',
    Code: 'F7',
  },
  119: {
    Key: 'F8',
    Code: 'F8',
  },
  120: {
    Key: 'F9',
    Code: 'F9',
  },
  121: {
    Key: 'F10',
    Code: 'F10',
  },
  122: {
    Key: 'F11',
    Code: 'F11',
  },
  123: {
    Key: 'F12',
    Code: 'F12',
  },
  124: {
    Key: 'F13',
    Code: 'F13',
  },
  125: {
    Key: 'F14',
    Code: 'F14',
  },
  126: {
    Key: 'F15',
    Code: 'F15',
  },
  127: {
    Key: 'F16',
    Code: 'F16',
  },
  128: {
    Key: 'F17',
    Code: 'F17',
  },
  129: {
    Key: 'F18',
    Code: 'F18',
  },
  130: {
    Key: 'F19',
    Code: 'F19',
  },
  131: {
    Key: 'F20',
    Code: 'F20',
  },
  132: {
    Key: 'F21',
    Code: 'F21',
  },
  133: {
    Key: 'F22',
    Code: 'F22',
  },
  134: {
    Key: 'F23',
    Code: 'F23',
  },
  135: {
    Key: 'F24',
    Code: 'F24',
  },
  136: {
    Key: 'F25',
    Code: 'F25',
  },
  137: {
    Key: 'F26',
    Code: 'F26',
  },
  138: {
    Key: 'F27',
    Code: 'F27',
  },
  139: {
    Key: 'F28',
    Code: 'F28',
  },
  140: {
    Key: 'F29',
    Code: 'F29',
  },
  141: {
    Key: 'F30',
    Code: 'F30',
  },
  142: {
    Key: 'F31',
    Code: 'F31',
  },
  143: {
    Key: 'F32',
    Code: 'F32',
  },
  144: {
    Key: 'NumLock',
    Code: 'NumLock',
    Unicode: '⇭',
  },
  145: {
    Key: 'ScrollLock',
    Code: 'ScrollLock',
    Unicode: '⤓',
  },
  160: {
    Key: '[',
    Code: 'BracketLeft',
  },
  161: {
    Key: 'Dead',
    Code: 'BracketRight',
  },
  163: {
    Key: `\\`,
    Code: 'Backquote',
  },
  164: {
    Key: '$',
    Code: 'Backslash',
  },
  165: {
    Key: '^ù',
    Code: 'Quote',
  },
  169: {
    Key: ')',
    Code: 'Minus',
  },
  170: {
    Key: '*',
    Code: 'BackSlash',
  },
  171: {
    Key: '+',
    Code: 'BracketRight',
  },
  173: {
    Key: '-',
    Code: 'Minus',
  },
  174: {
    Key: 'AudioVolumeDown',
  },
  176: {
    Key: 'MediaTractNext',
    Code: 'MediaTrackNext',
  },
  177: {
    Key: 'MediaTractPrevious',
    Code: 'MediaTrackPrevious',
  },
  179: {
    Key: 'MediaPlayPause',
  },
  180: {
    Key: 'LaunchMail',
    Unicode: '✉',
  },
  181: {
    Key: 'AudioVolumeMute',
    Code: 'VolumeMute',
  },
  182: {
    Key: 'AudioVolumeDown',
    Code: 'VolumeDown',
  },
  183: {
    Key: 'AudioVolumeUp',
    Code: 'VolumeUp',
  },
  186: {
    Key: ';',
    Code: 'Semicolon',
  },
  187: {
    Key: '+',
    Code: 'Equal',
  },
  188: {
    Key: ',',
    Code: 'Comma',
  },
  189: {
    Key: '-',
    Code: 'Minus',
  },
  190: {
    Key: '.',
    Code: 'Period',
  },
  191: {
    Key: '/',
    Code: 'Slash',
  },
  192: {
    Key: '`',
    Code: 'Backquote',
  },
  193: {
    Key: '/',
    Code: 'IntlRo',
  },
  194: {
    Key: '.',
    Code: 'NumpadComma',
  },
  219: {
    Key: '[',
    Code: 'BracketLeft',
  },
  220: {
    Key: '\\',
    Code: 'Backslash',
  },
  221: {
    Key: ']',
    Code: 'BracketRight',
  },
  222: {
    Key: "'",
    Code: 'Quote',
  },
  223: {
    Key: '`',
    Code: 'Backquote',
  },
  224: {
    Key: 'Meta',
    Code: 'Meta',
    Unicode: '⌘',
  },
  225: {
    Key: 'AltGraph',
    Code: 'AltRight',
    Unicode: '⌥',
  },
  226: {
    Key: '\\',
    Code: 'IntlBackslash',
  },
}
