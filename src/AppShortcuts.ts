import type { Command, Hotkey, Modifier, App } from 'obsidian'

//@ts-ignore V0.0.1
// export function getCommands(app: App) {
//   let commands: Command[] = Object.values(app.commands.commands)
//   // console.log(Object.values(app.commands.commands))

//   // check
//   console.log('hotkeyManager: ')
//   console.log(app.hotkeyManager)

//   if (app.hotkeyManager.customKeys) {
//     // for each key in customKeys (which is an object) get the value (which is an array of hotkeys)
//     // for each hotkey in the array, get the command and add it to the commands array
//     Object.values(app.hotkeyManager.customKeys).forEach((hotkeys: Hotkey[]) => {
//       hotkeys.forEach((hotkey: Hotkey) => {
//         console.log('hotkey: ', hotkey)

//         // commands.push(hotkey)
//       })
//     })
//   }

//   function checkUndefinedCommands(item: Command) {
//     // function to remove undefined and without hotkeys
//     if (item.hotkeys != undefined) {
//       console.log(item)
//     }

//     // from key-promoter plugin

//     // if (command.hotkeys) {
//     //   command.hotkeys.forEach((hotkey: Hotkey) => {
//     //     let hotkeyDescription = ''
//     //     hotkeyDescription += hotkey.modifiers
//     //       .map((modifier) => {
//     //         if (modifier === 'Mod') {
//     //           return 'Ctrl/Cmd'
//     //         }
//     //         if (modifier === 'Meta') {
//     //           return 'Win/Cmd'
//     //         }
//     //         return modifier
//     //       })
//     //       .join('+')
//     //     hotkeyDescription += '+' + hotkey.key
//     //     hotkeys.push(hotkeyDescription)
//     //   })
//     //   console.log(hotkeys)

//     return item.hotkeys != undefined
//     // && item.hotkeys.length > 0
//   }

//   console.log('commands:')
//   commands = commands.filter(checkUndefinedCommands)
//   console.log(commands)

//   console.log('commands-2:')

//   let hotKeyDict = Object.assign(
//     {},
//     ...app.hotkeyManager.bakedIds.map((id: any, i: number) => ({
//       [id]: app.hotkeyManager.bakedHotkeys[i],
//     }))
//   )
//   console.log(hotKeyDict)

//   return commands
// }

export function getHotkeysV2(app: App) {
  let tKeyDict: Hotkey[] = Object.assign(
    {},
    ...app.hotkeyManager.bakedIds.map((id: any, i: any) => ({
      [id]: app.hotkeyManager.bakedHotkeys[i],
    }))
  )
  console.log(tKeyDict)
  return tKeyDict
}
