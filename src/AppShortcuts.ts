import type { Command, Hotkey, Modifier } from 'obsidian'

const getNestedObject = (nestedObj: any, pathArr: Array<any>) => {
  return pathArr.reduce(
    (obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined),
    nestedObj
  )
}

// function hilite(keys: Array<string>, how: Object) {
//   // need to check if existing key combo is overridden by undefining it
//   if (keys && keys[1][0] !== undefined) {
//     return how + keys.flat(2).join('+').replace('Mod', 'Ctrl') + how
//   } else {
//     return how + '–' + how
//   }
// }

//@ts-ignore
// function getHotkey(arr: Array<any>, highlight = true) {
//   let hi = highlight ? '**' : ''
//   let defkeys = arr.hotkeys
//     ? [
//         [getNestedObject(arr.hotkeys, [0, 'modifiers'])],
//         [getNestedObject(arr.hotkeys, [0, 'key'])],
//       ]
//     : undefined
//   let ck = app.hotkeyManager.customKeys[arr.id]
//   var hotkeys = ck
//     ? [
//         [getNestedObject(ck, [0, 'modifiers'])],
//         [getNestedObject(ck, [0, 'key'])],
//       ]
//     : undefined
//   return hotkeys ? hilite(hotkeys, hi) : hilite(defkeys, '')
// }

//@ts-ignore
export function getCommands(app: App) {
  let commands: Command[] = Object.values(app.commands.commands)

  function checkUndefinedCommands(item: Command) {
    // function to remove undefined and without hotkeys
    if (item.hotkeys != undefined && item.hotkeys.length < 0) {
      console.log(item)
    }
    return item.hotkeys != undefined && item.hotkeys.length > 0
  }

  commands = commands.filter(checkUndefinedCommands)

  // commands.filter((command) =>
  //   command.hotkeys === undefined && command.hotkeys.length > 0
  //     ? console.log(command.hotkeys)
  //     : false
  // )

  // need to check if existing key combo is overridden by undefining it
  // let defkeys = commands
  //   ? [
  //       [getNestedObject(commands, [0, 'modifiers'])],
  //       [getNestedObject(commands, [0, 'key'])],
  //     ]
  //   : undefined
  // let ck = app.hotkeyManager.customKeys
  // var hotkeys = ck
  //   ? [
  //       [getNestedObject(ck, [0, 'modifiers'])],
  //       [getNestedObject(ck, [0, 'key'])],
  //     ]
  //   : undefined

  // console.log('app.commands:')
  // console.log(app.commands)

  console.log('commands:')
  console.log(commands)

  // console.log('defkeys:')
  // console.log(defkeys)

  // console.log('hotkeys:')
  // console.log(hotkeys)

  return commands
}

// export const commands: Command[] = Object.values(this.app.commands.commands)
