
import { Record } from "immutable"
import { reviveImmutable } from "epic-global/ModelUtil"
import { User } from "epic-models/User"

const
	log = getLogger(__filename)





export const SettingsRecord = Record({
	token: null,
	user: null,
	dropboxToken:null,
	nativeNotificationsEnabled: true,
	themeName: null,
	paletteName: null
	
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
}

export default Settings

