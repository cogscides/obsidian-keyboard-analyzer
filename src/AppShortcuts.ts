import type { Command, Hotkey, Modifier, App } from 'obsidian'
import type { allHotkeys } from 'src/Interfaces'

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

//   console.log(hotKeyDict)

//   return commands
// }

export function getHotkeysV2(app: App) {
  app.hotkeyManager.bake()

  // let hotKeys = app.hotkeyManager.bakedHotkeys.map((k: any) =>
  //   [...k.modifiers.split(','), k.key].join('+')
  // )
  // console.log('baked Hotkeys:', hotKeys)

  // console.log(app.hotkeyManager)

  // console.log(
  //   app.hotkeyManager.bakedIds
  //     .map((name: string, i: any) => [name, hotKeys[i]])
  //     .sort()
  // )

  // TODO combine hotkey id and hotkey
  // https://stackoverflow.com/questions/5100376/how-to-watch-for-array-changes#:~:text=I%20used%20the%20following%20code%20to%20listen%20to%20changes%20to%20an%20array.

  // app.hotkeyManager.bakedIds and app.hotkeyManager.bakedHotkeys are two arrays of the same length
  // app.hotkeyManager.bakedIds is an array of strings
  // app.hotkeyManager.bakedHotkeys is an array of Hotkey objects
  // id may have several hotkeys
  // combine the two arrays into a dictionary with the key being the id and the value being the array of hotkeys
  // ids are not unique, if there are multiple hotkeys with the same id, the value will be an array of hotkeys

  let hotKeyDict: { [id: string]: Hotkey[] } = {}
  app.hotkeyManager.bakedIds.forEach((id: string, i: number) => {
    if (hotKeyDict[id]) {
      hotKeyDict[id].push(app.hotkeyManager.bakedHotkeys[i])
    } else {
      hotKeyDict[id] = [app.hotkeyManager.bakedHotkeys[i]]
    }
    
  })

  console.log(hotKeyDict)
  return hotKeyDict
}
