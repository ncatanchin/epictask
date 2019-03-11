import {acceptHot, addHotDisposeHandler} from "common/HotUtil"
import getLogger from "common/log/Logger"
import {CommandType,getCommandManager} from "common/command-manager"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"
import {getApp} from "common/ElectronUtil"
import {AppActionFactory} from "common/store/actions/AppActionFactory"

const log = getLogger(__filename)


log.info(`Registering commands`)

function getUIActions():UIActionFactory {
  return new UIActionFactory()
}

function getAppActions():AppActionFactory {
  return new AppActionFactory()
}


const commands = [
  // QUIT
  {
    id: 'Quit',
    type: CommandType.App,
    name: "Quit",
    defaultAccelerator: "CommandOrControl+q",
    execute: (item, event) => getApp().quit()
  },

  // CLOSE WINDOW
  // {
  //   id: 'CloseWindow',
  //   type: CommandType.App,
  //   name: "Close Window",
  //   defaultAccelerator: "CommandOrControl+w",
  //   execute: (item, event) => getUIActions().closeWindow()
  // },

  // NEW TAB
  // {
  //   id: 'NewTab',
  //   type: CommandType.App,
  //   name: "New Tab",
  //   defaultAccelerator: "CommandOrControl+t",
  //   execute: (item, event) => {
  //     log.info(`New tab`)
  //     getUIActions().showNewTabPopup()
  //   }
  // },


  // CLOSE TAB
  // {
  //   id: 'CloseTab',
  //   type: CommandType.App,
  //   name: "Close Tab",
  //   defaultAccelerator: "Alt+w",
  //   execute: (item, event) => {
  //     log.info(`Close tab`)
  //     getUIActions().removeTabView(selectedTabViewIdSelector(getStoreState()))
  //   }
  // },

  // PREV TAB
  // {
  //   id: 'PreviousTab',
  //   type: CommandType.App,
  //   name: "Previous Tab",
  //   defaultAccelerator: "Alt+[",
  //   execute: (item, event) => {
  //     log.info(`Move tab left`)
  //     getUIActions().moveTabView(-1)
  //   }
  // },

  // NEXT TAB
  // {
  //   id: 'NextTab',
  //   type: CommandType.App,
  //   name: "Next Tab",
  //   defaultAccelerator: "Alt+]",
  //   execute: (item, event) => {
  //     log.info(`Move tab right`)
  //     getUIActions().moveTabView(1)
  //   }
  // },

  // ZOOM IN
  {
    id: 'ZoomIn',
    type: CommandType.App,
    name: "Zoom In",
    defaultAccelerator: "CommandOrControl+=",
    execute: (item, event) => getAppActions().zoom(0.15)
  },

  // ZOOM OUT
  {
    id: 'ZoomOut',
    type: CommandType.App,
    name: "Zoom Out",
    defaultAccelerator: "CommandOrControl+-",
    execute: (item, event) => getAppActions().zoom(-0.15)
  },

  // ZOOM DEFAULT
  {
    id: 'ZoomStandard',
    type: CommandType.App,
    name: "Zoom Standard",
    defaultAccelerator: "CommandOrControl+0",
    execute: (item, event) => getAppActions().setZoom(1)
  },

  // SYNC EVERYTHING
  // {
  //   id: 'SyncEverything',
  //   type: CommandType.App,
  //   name: "Github > Sync Everything",
  //   defaultAccelerator: "CommandOrControl+s",
  //   execute: (item, event) => getRepoActions().syncAll()
  // },
  //
  // // TOGGLE NOTIFICATIONS
  // {
  //   id: 'ToggleNotifications',
  //   type: CommandType.App,
  //   name: "Toggle Notifications Panel",
  //   defaultAccelerator: "CommandOrControl+1",
  //   execute: (item, event) => getUIActions().toggleNotificationsOpen()
  // },
  //
  // // SETTINGS
  // {
  //   id: 'Settings',
  //   type: CommandType.App,
  //   name: "Settings",
  //   defaultAccelerator: "CommandOrControl+Comma",
  //   execute: (item, event) => getUIActions().openWindow(getRoutes().Settings.uri),
  // },

  // OPEN TRAY
  // {
  //   id: 'ShowTrayGlobal',
  //   type: CommandType.Global,
  //   name: "Show Tray",
  //   execute: (cmd, event) => getAppActions().toggleTray(),
  //   defaultAccelerator: "Control+Shift+e"
  // },

  // FIND ACTION
  // {
  //   id: 'FindAction',
  //   type: CommandType.App,
  //   name: "Find Action",
  //   defaultAccelerator: "CommandOrControl+Shift+p",
  //   execute: (item, event) => getUIActions().openSheet(getRoutes().FindAction.uri),
  //   hidden: true
  // }
]

function registerCommands():void {
  getCommandManager().registerCommands(...commands)
}

function unregisterCommands():void {
  getCommandManager().unregisterCommands(...commands)
}


document.body.addEventListener("focus",registerCommands)
document.body.addEventListener("blur",unregisterCommands)

addHotDisposeHandler(module,() => {
  document.body.removeEventListener("focus",registerCommands)
  document.body.removeEventListener("blur",unregisterCommands)
})


registerCommands()
acceptHot(module)

export {}
