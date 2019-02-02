import {loadAndInitStore} from "common/store/AppStore"

async function init():Promise<void> {
  await loadAndInitStore()
  await require('common/watchers/StorePersistWatcher').default

  const
  	{getCommandManager} = require("common/command-manager"),
  	{ElectronMainManagerProvider}= require("common/command-manager/CommandElectronMenuManager")

  getCommandManager().setMenuManagerProvider(ElectronMainManagerProvider)
}

export default init()
