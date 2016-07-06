import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	Repo as TSRepo
} from 'typestore'

import {PouchDBFullTextFinder, PouchDBMangoFinder} from 'typestore-plugin-pouchdb'
import {registerModel} from './Registry'

export const UserClassName = 'User'

@ModelDescriptor()
export class User extends DefaultModel {

	$$clazz = UserClassName

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
export class UserStore extends TSRepo<User> {
	constructor() {
		super(UserStore,User)
	}


	@PouchDBMangoFinder({
		single:true,
		indexFields: ['login'],
		selector:{
			selector: (login:string) => {login}
		}
	})
	findByLogin(login:string):Promise<User> {
		return null
	}

	/**
	 * Find all issues in provided repo ids
	 * @param repoIds
	 * @returns {Promise<User[]>}
	 */
	@PouchDBMangoFinder({
		indexFields: ['repoId'],
		selector: (...repoIds:number[]) => ({
			$or: repoIds.map(repoId => ({
				$eq: repoId
			}))
		})
	})
	findByRepoId(...repoIds:number[]):Promise<User[]> {
		return null
	}


}

registerModel(UserClassName,User)