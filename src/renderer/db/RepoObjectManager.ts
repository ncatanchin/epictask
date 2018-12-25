import ObjectManager, {ObjectEvent} from "./ObjectManager"
import {IRepo} from "../models/Repo"
import db from "./ObjectDatabase"
import getLogger from "../../common/log/Logger"
import {getAPI} from "../net/GithubAPI"
import {ReposListForUserParams} from "@octokit/rest"
import {guard} from "typeguard"
import {AppState} from "../store/state/AppState"
import {IUser} from "../models/User"

const log = getLogger(__filename)

class RepoObjectManager extends ObjectManager<IRepo,number> {
	constructor() {
		super(db.repos)
		
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
	
	getPrimaryKey(o:IRepo):number {
		return o.id
	}
	
	onChange(o:IRepo) {
	}
	
	onRemove(key:number) {
	}
	
	
	async sync(...keys:number[]):Promise<boolean> {
		try {
			const
				gh = getAPI(),
				user = getStoreState().AppState.user
			
			if (!user) {
				log.warn("Can not sync repos, not authenticated")
				return false
			}
			
			const
				opts = (gh.repos.listForUser as any).endpoint.merge({
					username: user.login
				} as ReposListForUserParams),
				repos = await (gh as any).paginate(opts) as IRepo[]
			
			log.info(`Loaded ${repos.length} repos`)
			await this.table.bulkPut(repos)
			this.emit(ObjectEvent.Loaded,repos)
			return true
		} catch (err) {
			log.error("Unable to sync repos", err)
			return false
		}
	}
}

let repoObjectManager:RepoObjectManager | null = null

export default function get():RepoObjectManager {
	if (!repoObjectManager)
		repoObjectManager = new RepoObjectManager()
	
	return repoObjectManager
}


