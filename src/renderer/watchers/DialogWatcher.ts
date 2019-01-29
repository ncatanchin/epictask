import UIState from "renderer/store/state/UIState"
import {IDialog} from "renderer/models/Dialog"
import {getCommandManager} from "common/command-manager"
import {getValue} from "typeguard"

// getStore().observe([UIState.Key,'dialogs'],(newDialogs:Array<IDialog>,oldDialogs:Array<IDialog>) => {
//   const oldLength = getValue(() => oldDialogs.length,0)
//   if (newDialogs.length && !oldLength) {
//     getCommandManager().pushStack()
//   } else if (!newDialogs.length && oldLength) {
//     getCommandManager().popStack()
//   }
// })

export {}


