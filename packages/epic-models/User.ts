import {
	Model,
	Attribute,
	DefaultModel,
	FinderRequest,
	Repo as TSRepo
} from 'typestore'




/**
 * User model from GitHub schema
 */
@ModelRegistryScope.Register
@Model({
	onlyMapDefinedAttributes: true
})
export class User extends DefaultModel implements IUser {
	
	static UnknownUser = new User({
		id: -1,
		login: 'n/a',
		avatar_url: require('assets/images/avatar/avatar-unknown.png')
	})
	
	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => {
		return !o ? null : o instanceof User ? o : new User(o)
	}

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
	
	
	@Attribute()
	type: string;
	
	@Attribute()
	site_admin: boolean;
	
	@Attribute()
	company: string
	
	@Attribute()
	blog: string
	
	@Attribute()
	location: string
	
	@Attribute()
	email: string
	
	@Attribute()
	hireable: boolean
	
	@Attribute()
	bio: string
	
	@Attribute()
	public_repos: number
	
	@Attribute()
	public_gists: number
	
	@Attribute()
	followers: number
	
	@Attribute()
	following: number
	
	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}

	addRepoId(repoId) {
		const repoIds = this.repoIds = this.repoIds || []

		repoIds.push(repoId)
		this.repoIds = _.uniq(repoIds)
	}
	
	
	
	//
	// html_url: string;
	//
	//
	// followers_url: string;
	//
	// following_url: string;
	//
	// gists_url: string;
	//
	// starred_url: string;
	//
	// subscriptions_url: string;
	//
	// organizations_url: string;
	//
	// repos_url: string;
	//
	// events_url: string;
	//
	// received_events_url: string;
}

export interface UserStore extends TSRepo<User> {
	
	findByLogin(login:string):Promise<User>
	findByRepoId(request:FinderRequest,...repoIds:number[]):Promise<User[]>
	findAll():Promise<number[]>
}