import type { KeyboardInterface } from 'src/Interfaces'
export const VIEW_TYPE_SHORTCUTS_ANALYZER = 'keyboard-shortcuts-visualization'

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
}
