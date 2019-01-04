import EventHub from "common/events/Event"
import {addHotDisposeHandler} from "common/HotUtil"
import {customAcceleratorsSelector} from "common/store/selectors/AppSelectors"
import {StringMap} from "common/Types"
import getCommandManager from "common/command-manager/CommandManager"
import {AppState} from "common/store/state/AppState"


function updateGlobalCommands():void {
	//TODO: implement
	getCommandManager().updateGlobalCommands()
}

function setup():void {
	updateGlobalCommands()
	
	const
		unsubscribers = Array<() => void>()
	
	unsubscribers.push(EventHub.on("WindowClosed",updateGlobalCommands))
	unsubscribers.push(EventHub.on("CommandsChanged",updateGlobalCommands))
	unsubscribers.push(getStore().observe([AppState.Key,'customAccelerators'],(accelerators:StringMap<string>) => {
		updateGlobalCommands()
		EventHub.emit("AcceleratorsChanged",accelerators)
	}))
	addHotDisposeHandler(module,() => unsubscribers.forEach(unsub => unsub()))
}


setup()


export default function ():StringMap<string> {
	return customAcceleratorsSelector(getStoreState())
}
