import EventHub from "../../common/events/Event"

import getLogger from "../../common/log/Logger"
import {getConfig} from "common/config/ConfigHelper"
import {IConfig} from "common/config/Config"
import delay from "common/util/Delay"
import {getAPI} from "renderer/net/GithubAPI"
import {IUser} from "renderer/models/User"
import {AppActionFactory} from "renderer/store/actions/AppActionFactory"

const log = getLogger(__filename)

async function loadUser(config:IConfig):Promise<void> {
	log.info("Loading user with config",config)
	try {
		const
			gh = getAPI(config),
			user = (await gh.users.getAuthenticated({})).data as IUser
		
		log.info("Got user",user)
		const appActions = new AppActionFactory()
		await appActions.setUserAndConfig(user,config)
	} catch (err) {
		log.error("Unable to load user", err)
	}
	
}

EventHub.on("ConfigChanged",loadUser)

async function init():Promise<void> {
	let config = getConfig()
	log.info("Config is", config)
	if (config) {
		while((config = getConfig()) && !getStoreState().AppState.user) {
			await loadUser(config)
			await delay(10)
		}
	}
}

export default init()
