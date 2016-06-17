import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	DefaultValue,
	Repo as TSRepo
} from 'typestore'

import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'

@ModelDescriptor()
export class User extends DefaultModel {


	@AttributeDescriptor({primaryKey:true})
	id: number;

	@AttributeDescriptor({
		index:{
			name: 'idxLogin',
			unique:true
		}
	})
	login: string;

	@AttributeDescriptor()
	repoIds: string[]



	name:string
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;

	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}

	addRepoId(repoId) {
		const repoIds = this.repoIds = this.repoIds || []

		repoIds.push(repoId)
		this.repoIds = _.uniq(repoIds)
	}


}



/**
 * Repository for accessing repos
 */
export class UserRepo extends TSRepo<User> {
	constructor() {
		super(UserRepo,User)
	}


	@IndexedDBFinderDescriptor({
		singleResult:true,
		async fn(tsRepo,...args) {
			const
				allJson = await tsRepo.table.toArray(),
				query = _.lowerCase(args[0])

			return allJson
				.filter(json => _.lowerCase(json.login) === _.lowerCase(query))
		}
	})

	@FinderDescriptor()
	findByLogin(login:string):Promise<User> {
		return null
	}

	/**
	 * Find all issues in provided repo ids
	 * @param repoIds
	 * @returns {null}
	 */
	@IndexedDBFinderDescriptor({
		fn(tsRepo,...args) {
			return tsRepo.table.where('repoIds').anyOf(args).toArray()
		}
	})
	@FinderDescriptor()
	findByRepoId(...repoIds:number[]):Promise<User[]> {
		return null
	}

	@IndexedDBFinderDescriptor({
		fn: (tsRepo,...args) => tsRepo.table.toArray()
	})
	@FinderDescriptor()
	findAll():Promise<User[]> {
		return null
	}

}