import {
	Model,
	Attribute,
	FinderDescriptor,
	DefaultModel,
	FinderRequest,
	Repo as TSRepo
} from 'typestore'


import {RegisterModel} from '../Registry'

/**
 * User model from GitHub schema
 */
@RegisterModel
@Model()
export class User extends DefaultModel {

	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new User(o)

	@Attribute({primaryKey:true})
	id: number;

	@Attribute({
		index:{
			name: 'idxLogin',
			unique:true
		}
	})
	login: string;

	@Attribute()
	repoIds: number[]
	
	
	@Attribute()
	name:string
	
	@Attribute()
	avatar_url: string;
	
	@Attribute()
	gravatar_id: string;
	
	@Attribute()
	url: string;
	html_url: string;
	
	@Attribute()
	followers_url: string;
	
	@Attribute()
	following_url: string;
	
	@Attribute()
	gists_url: string;
	
	@Attribute()
	starred_url: string;
	
	@Attribute()
	subscriptions_url: string;
	
	@Attribute()
	organizations_url: string;
	
	@Attribute()
	repos_url: string;
	
	@Attribute()
	events_url: string;
	
	@Attribute()
	received_events_url: string;
	
	@Attribute()
	type: string;
	
	@Attribute()
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

export interface UserStore extends TSRepo<User> {
	
	findByLogin(login:string):Promise<User>
	findByRepoId(request:FinderRequest,...repoIds:number[]):Promise<User[]>
	findAll():Promise<number[]>
}