import Dexie from "dexie"
//import 'dexie-observable'
import {IIssue, IssueIndexes} from "common/models/Issue"
import {IUser, UserIndexes} from "common/models/User"
import {IRepo, RepoIndexes} from "common/models/Repo"
import getLogger from "common/log/Logger"
import {IOrg, OrgIndexes} from "common/models/Org"
import {ILabel, LabelIndexes} from "common/models/Label"

const log = getLogger(__filename)

class ObjectDatabase extends Dexie {
	
	// issues: Dexie.Table<IIssue, number>
	//
	// users: Dexie.Table<IUser, number>
	//
	// labels: Dexie.Table<ILabel, number>
	//
	// repos: Dexie.Table<IRepo, number>
	//
	// orgs:Dexie.Table<IOrg, number>
	
	get issues(): Dexie.Table<IIssue, number> {
		return this.table("issues")
	}

	get users(): Dexie.Table<IUser, number> {
		return this.table("users")
	}

	get labels(): Dexie.Table<ILabel, number> {
		return this.table("labels")
	}

	get repos(): Dexie.Table<IRepo, number> {
		return this.table("repos")
	}

	get orgs(): Dexie.Table<IOrg, number> {
		return this.table("orgs")
	}
	
	constructor() {
		super("epictask")
		
		this.version(1).stores({
			issues: IssueIndexes.v1,
			labels: LabelIndexes.v1,
			users: UserIndexes.v1,
			repos: RepoIndexes.v1,
			orgs: OrgIndexes.v1
		})
		
		log.info("Start database")
	}
	
}


export interface IObjectDatabase extends ObjectDatabase {
}


const db = new ObjectDatabase()

export type ObjectDatabaseType = keyof ObjectDatabase

export default db
