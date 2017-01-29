
import { Record } from "immutable"
import { reviveImmutable } from "epic-global/ModelUtil"
import { User } from "epic-models/User"
import { pluginDefaultPath } from "../Files"

const
	log = getLogger(__filename)





export const SettingsRecord = Record({
	token: null,
	user: null,
	dropboxToken:null,
	nativeNotificationsEnabled: true,
	themeName: null,
	paletteName: null,
	
	pluginsEnabled: {},
	pluginStores: [
		pluginDefaultPath
	]
	
} as ISettingsProps)



/**
 * Application settings object
 */
export class Settings extends SettingsRecord implements ISettingsProps {
	
	static fromJS(o:any = {}) {
		return reviveImmutable(o,Settings)
	}
	
	constructor(o:any = {}) {
		super(o)
	}
	
	/**
	 * API Token
	 */
	token:string
	
	dropboxToken:string
	
	/**
	 * The current authenticated user
	 */
	user:User
	
	
	nativeNotificationsEnabled: boolean
	themeName: string
	paletteName: string
	
	/**
	 * All plugin directories currently configured
	 */
	pluginStores: string[]
}

export default Settings

