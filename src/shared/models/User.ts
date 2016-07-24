import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	Repo as TSRepo
} from 'typestore'

import {PouchDBFullTextFinder, PouchDBMangoFinder} from 'typestore-plugin-pouchdb'
import {RegisterModel} from '../Registry'

/**
 * User model from GitHub schema
 */
@RegisterModel
@ModelDescriptor()
export class User extends DefaultModel {

	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new User(o)

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
	repoIds: number[]



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
	 * Find all users who contribute to a repo
	 *
	 * @param repoIds
	 * @returns {Promise<User[]>}
	 */
	@PouchDBMangoFinder({
		indexFields: ['repoId'],
		selector: (...repoIds:number[]) => ({
			$or: repoIds.map(repoId => ({
				repoIds: {
					$elemMatch:{
						$eq: repoId
					}
				}
			}))
		})
	})
	findByRepoId(...repoIds:number[]):Promise<User[]> {
		return null
	}

	@PouchDBMangoFinder({
		all:true,
		includeDocs:false
	})
	findAll():Promise<number[]> {
		return null
	}


}
