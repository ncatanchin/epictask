
import { Record } from "immutable"

const
	log = getLogger(__filename)

export const SettingsRecord = Record({
	token: null,
	user: null,
	
})

/**
 * Application settings object
 */
export class Settings extends SettingsRecord {
	
	/**
	 * API Token
	 */
	token:string
	
	/**
	 * The current authenticated user
	 */
	user?:any
	
}



export default Settings

