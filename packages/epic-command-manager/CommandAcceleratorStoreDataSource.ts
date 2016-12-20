

import { customAcceleratorsSelector } from "epic-typedux/selectors"
import { getCommandManager } from "./CommandManager"
import { addHotDisposeHandler, AppKey } from "epic-global"

function updateGlobalCommands() {
	getCommandManager().updateGlobalCommands(CommandRegistryScope.all())
}

updateGlobalCommands()

const
	unsubscribers = []
		
unsubscribers.push(EventHub.on(EventHub.CommandsChanged,updateGlobalCommands))

unsubscribers.push(getStore().observe([AppKey,'customAccelerators'],updateGlobalCommands))
unsubscribers.push(EventHub.on(EventHub.CommandsChanged,updateGlobalCommands))

addHotDisposeHandler(module,() => unsubscribers.forEach(unsub => unsub()))

export default function () {
	return customAcceleratorsSelector(getStoreState())
}