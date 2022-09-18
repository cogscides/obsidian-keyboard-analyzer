import type {
  PluginSettings,
  FilterSettings,
  KeyboardSection,
} from 'src/Interfaces'
export const VIEW_TYPE_SHORTCUTS_ANALYZER = 'keyboard-shortcuts-visualization'

export const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  FeaturedFirst: false,
  StrictSearch: false,
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

export const mainSectionQwerty: KeyboardSection = {
  name: 'main',
  gridRatio: 3.75,
  rows: [
    [
      {
        label: 'Escape',
        tryUnicode: true,
      },
      {
        label: 'empty',
        width: 1,
      },
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
        label: 'empty',
        width: 0.5,
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
        label: 'empty',
        width: 0.5,
      },
      {
        label: 'F8',
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
    ],
    [
      {
        label: '`',
      },
      {
        label: '1',
      },
      {
        label: '2',
      },
      {
        label: '3',
      },
      {
        label: '4',
      },
      {
        label: '5',
      },
      {
        label: '6',
      },
      {
        label: '7',
      },
      {
        label: '8',
      },
      {
        label: '9',
      },
      {
        label: '0',
      },
      {
        label: '-',
      },
      {
        label: '=',
      },
      {
        label: 'Backspace',
        fontSize: 'small',
        caps: 'all-small-caps',
        width: 2,
      },
    ],
    [
      {
        label: 'Tab',
        fontSize: 'small',
        caps: 'all-small-caps',
        width: 1.5,
      },
      {
        label: 'Q',
      },
      {
        label: 'W',
      },
      {
        label: 'E',
      },
      {
        label: 'R',
      },
      {
        label: 'T',
      },
      {
        label: 'Y',
      },
      {
        label: 'U',
      },
      {
        label: 'I',
      },
      {
        label: 'O',
      },
      {
        label: 'P',
      },
      {
        label: '[',
      },
      {
        label: ']',
      },
      {
        label: '\\',
        width: 1.5,
      },
    ],
    [
      {
        label: 'CapsLock',
        fontSize: 'small',
        caps: 'all-small-caps',
        tryUnicode: true,
        width: 1.75,
      },
      {
        label: 'A',
      },
      {
        label: 'S',
      },
      {
        label: 'D',
      },
      {
        label: 'F',
      },
      {
        label: 'G',
      },
      {
        label: 'H',
      },
      {
        label: 'J',
      },
      {
        label: 'K',
      },
      {
        label: 'L',
      },
      {
        label: ';',
      },
      {
        label: "'",
      },
      {
        label: 'Enter',
        fontSize: 'small',
        caps: 'all-small-caps',
        width: 2.25,
      },
    ],
    [
      {
        label: 'Shift',
        fontSize: 'small',
        caps: 'all-small-caps',
        tryUnicode: true,
        width: 2,
      },
      {
        label: 'Z',
      },
      {
        label: 'X',
      },
      {
        label: 'C',
      },
      {
        label: 'V',
      },
      {
        label: 'B',
      },
      {
        label: 'N',
      },
      {
        label: 'M',
      },
      {
        label: ',',
      },
      {
        label: '.',
      },
      {
        label: '/',
      },
      {
        label: 'Shift',
        fontSize: 'small',
        caps: 'all-small-caps',
        width: 3,
        tryUnicode: true,
      },
    ],
    [
      {
        label: 'Control',
        fontSize: 'small',
        tryUnicode: true,
        caps: 'all-small-caps',
        width: 1.5,
      },
      {
        label: 'Meta',
        tryUnicode: true,
        fontSize: 'small',
        width: 1.5,
      },
      {
        label: 'Alt',
        tryUnicode: true,
        fontSize: 'small',
        caps: 'all-small-caps',
        width: 1.5,
      },
      {
        label: ' ',
        width: 6,
        tryUnicode: true,
      },
      {
        label: 'Alt',
        fontSize: 'small',
        caps: 'all-small-caps',
        width: 1.5,
      },
      {
        label: 'Meta',
        fontSize: 'small',
        caps: 'all-small-caps',
        width: 1.5,
      },
      {
        label: 'Control',
        fontSize: 'small',
        caps: 'all-small-caps',
        width: 1.5,
      },
    ],
  ],
}

// keyboard layout for other keys and cursor keys
export const keyboardOther: KeyboardSection = {
  name: 'other',
  gridRatio: 0.75,
  rows: [
    [
      {
        label: 'empty',
      },
      {
        label: 'empty',
      },
      {
        label: 'empty',
      },
    ],
    [
      {
        label: 'Insert',
        smallText: true,
        tryUnicode: true,
      },
      {
        label: 'Home',
        smallText: true,
      },
      {
        label: 'PageUp',
        smallText: true,
        tryUnicode: true,
      },
    ],
    [
      {
        label: 'Delete',
        tryUnicode: true,
        smallText: true,
      },
      {
        label: 'End',
        smallText: true,
      },
      {
        label: 'PageDown',
        tryUnicode: true,
        smallText: true,
      },
    ],
    [
      {
        label: 'empty',
      },
      {
        label: 'empty',
      },
      {
        label: 'empty',
      },
    ],
    [
      {
        label: 'empty',
      },
      {
        label: 'ArrowUp',
        tryUnicode: true,
      },
      {
        label: 'empty',
      },
    ],
    [
      {
        label: 'ArrowLeft',
        tryUnicode: true,
      },
      {
        label: 'ArrowDown',
        tryUnicode: true,
      },
      {
        label: 'ArrowRight',
        tryUnicode: true,
      },
    ],
  ],
}

// keyboard layout in rows for number pad
export const keyboardNum: KeyboardSection = {
  name: 'num',
  gridRatio: 1,
  rows: [
    [
      {
        label: 'empty',
      },
      {
        label: 'empty',
      },
      {
        label: 'empty',
      },
      {
        label: 'empty',
      },
    ],
    [
      {
        label: 'NumLock',
        tryUnicode: true,
      },
      {
        label: '/',
      },
      {
        label: '*',
      },
      {
        label: '-',
      },
      {
        label: 'Numpad7',
        strictCode: true,
        tryUnicode: true,
      },
    ],
    [
      {
        label: 'Numpad8',
        strictCode: true,
        tryUnicode: true,
      },
      {
        label: 'Numpad9',
        strictCode: true,
        tryUnicode: true,
      },
      {
        label: '+',
        height: 2,
      },
    ],
    [
      {
        label: 'Numpad4',
        strictCode: true,
        tryUnicode: true,
      },
      {
        label: 'Numpad5',
        strictCode: true,
        tryUnicode: true,
      },
      {
        label: 'Numpad6',
        strictCode: true,
        tryUnicode: true,
      },
    ],
    [
      {
        label: 'Numpad1',
        strictCode: true,
        tryUnicode: true,
      },
      {
        label: 'Numpad2',
        strictCode: true,
        tryUnicode: true,
      },
      {
        label: 'Numpad3',
        strictCode: true,
        tryUnicode: true,
      },
      {
        label: 'Enter',
        height: 2,
        // tryUnicode: true,
      },
    ],
    [
      {
        label: 'Numpad0',
        strictCode: true,
        tryUnicode: true,
        width: 2,
      },
      {
        label: '.',
      },
    ],
  ],
}

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
  [KeyCode: number]: { Key: string; Code: string; Unicode?: string }
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
    Unicode: 'Ctrl',
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
    Unicode: 'Esc',
  },
  32: {
    Key: ' ',
    Code: 'Space',
    Unicode: '⎵',
  },
  33: {
    Key: 'PageUp',
    Code: 'Numpad9',
    Unicode: 'Page<br>Up',
  },
  34: {
    Key: 'PageDown',
    Code: 'Numpad3',
    Unicode: 'Page<br>Down',
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
    Unicode: 'Ins',
  },
  46: {
    Key: 'Delete',
    Code: 'NumpadDecimal',
    Unicode: 'Del',
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
  // 61: {
  //   Key: '=',
  //   Code: 'Equal',
  // }, // firefox
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
    Unicode: '0',
  },
  97: {
    Key: '1',
    Code: 'Numpad1',
    Unicode: '1',
  },
  98: {
    Key: '2',
    Code: 'Numpad2',
    Unicode: '2',
  },
  99: {
    Key: '3',
    Code: 'Numpad3',
    Unicode: '3',
  },
  100: {
    Key: '4',
    Code: 'Numpad4',
    Unicode: '4',
  },
  101: {
    Key: '5',
    Code: 'Numpad5',
    Unicode: '5',
  },
  102: {
    Key: '6',
    Code: 'Numpad6',
    Unicode: '6',
  },
  103: {
    Key: '7',
    Code: 'Numpad7',
    Unicode: '8',
  },
  104: {
    Key: '8',
    Code: 'Numpad8',
    Unicode: '8',
  },
  105: {
    Key: '9',
    Code: 'Numpad9',
    Unicode: '9',
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
    Code: 'AudioVolumeDown',
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
    Code: 'MediaPlayPause',
  },
  180: {
    Key: 'LaunchMail',
    Code: 'LaunchMail',
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
    Key: '=',
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
