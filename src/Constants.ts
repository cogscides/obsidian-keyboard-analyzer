import type { Keyboard } from 'src/Interfaces'

export const VIEW_TYPE_SHORTCUTS_ANALYZER = 'keyboard-shortcuts-visualization'

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

export const kbWinNum: Keyboard = [
  [
    {
      label: 'F1',
      output: 'output F1',
    },
    {
      label: 'F2',
      width: 2,
      height: 1,
    },
    {
      x: 2,
    },
    {
      label: 'F3',
      width: 1,
      height: 2,
    },
  ],
]
