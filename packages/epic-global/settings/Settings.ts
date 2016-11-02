
import { Record } from "immutable"
import { reviveImmutable } from "epic-global/ModelUtil"

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
	
	/**
	 * The current authenticated user
	 */
	user?:any
	
}



export default Settings

