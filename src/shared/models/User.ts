import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	FinderRequest,
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
	
	
	@AttributeDescriptor()
	name:string
	
	@AttributeDescriptor()
	avatar_url: string;
	
	@AttributeDescriptor()
	gravatar_id: string;
	
	@AttributeDescriptor()
	url: string;
	html_url: string;
	
	@AttributeDescriptor()
	followers_url: string;
	
	@AttributeDescriptor()
	following_url: string;
	
	@AttributeDescriptor()
	gists_url: string;
	
	@AttributeDescriptor()
	starred_url: string;
	
	@AttributeDescriptor()
	subscriptions_url: string;
	
	@AttributeDescriptor()
	organizations_url: string;
	
	@AttributeDescriptor()
	repos_url: string;
	
	@AttributeDescriptor()
	events_url: string;
	
	@AttributeDescriptor()
	received_events_url: string;
	
	@AttributeDescriptor()
	type: string;
	
	@AttributeDescriptor()
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
	 * @param request
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
	findByRepoId(request:FinderRequest,...repoIds:number[]):Promise<User[]> {
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
