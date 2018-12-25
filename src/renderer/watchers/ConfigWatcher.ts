import EventHub from "../../common/events/Event"
import {AppActionFactory} from "../store/actions/AppActionFactory"
import getLogger from "../../common/log/Logger"
import {getConfig} from "../../common/config/ConfigHelper"
import {IConfig} from "../../common/config/Config"

const log = getLogger(__filename)

async function loadUser(config:IConfig):Promise<void> {
	await new AppActionFactory().loadUser(config)
}

EventHub.on("ConfigChanged",loadUser)

async function init():Promise<void> {
	const config = getConfig()
	log.info("Config is", config)
	if (config) {
		await loadUser(config)
	}
}

export default init()
