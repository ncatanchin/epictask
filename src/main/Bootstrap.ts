import {loadAndInitStore} from "common/store/AppStore"

async function init():Promise<void> {
  await loadAndInitStore()
  await (await import("common/watchers")).default
  
  const
  	{getCommandManager} = await import("common/command-manager"),
  	{ElectronMainManagerProvider}= await import("common/command-manager/CommandElectronMenuManager")

  getCommandManager().setMenuManagerProvider(ElectronMainManagerProvider)
}

export default init()
