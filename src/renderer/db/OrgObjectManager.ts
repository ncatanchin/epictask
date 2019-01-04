import ObjectManager, {ObjectEvent} from "./ObjectManager"
import {IRepo} from "common/models/Repo"
import db from "./ObjectDatabase"
import getLogger from "../../common/log/Logger"
import {getAPI} from "../net/GithubAPI"
import {ReposListForUserParams} from "@octokit/rest"
import {guard} from "typeguard"
import {AppState} from "common/store/state/AppState"
import {IUser} from "common/models/User"
import {IOrg} from "common/models/Org"
import {nextTick} from "typedux"

const log = getLogger(__filename)

class OrgObjectManager extends ObjectManager<IOrg,number> {
	
	
	constructor() {
		super(db.orgs)
		
		getStore().observe([AppState.Key,'user'],(user:IUser | null) => {
			if (user) {
				guard(() => this.sync())
			}
		})
		
		guard(() => this.sync())
		
	}
	
	async clear():Promise<any> {
		return undefined;
	}
	
	getPrimaryKey(o:IOrg):number {
		return o.id
	}
	
	onChange(o:IOrg) {
	}
	
	onRemove(key:number) {
	}
	
	
	protected async doSync(...keys:number[]):Promise<boolean> {
		
		try {
			const
				gh = getAPI(),
				syncedAt = Date.now(),
				opts = (gh.orgs.listForAuthenticatedUser as any).endpoint.merge(),
				orgs = await (gh as any).paginate(opts) as IOrg[]
			
			log.info(`Loaded ${orgs.length} orgs`)
			await this.table.bulkPut(orgs)
			this.emit(ObjectEvent.Synced,syncedAt,orgs)
			return true
		} catch (err) {
			log.error("Unable to sync orgs", err)
		}
		
		return false
	}
}

let orgObjectManager:OrgObjectManager | null = null

export default function get():OrgObjectManager {
	if (!orgObjectManager)
		orgObjectManager = new OrgObjectManager()
	
	return orgObjectManager
}


