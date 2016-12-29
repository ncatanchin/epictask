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
export class GithubNotification extends DefaultModel implements IGithubNotification {
	
	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => {
		return !o ? null : o instanceof GithubNotification ? o : new GithubNotification(o)
	}
	
	@Attribute({primaryKey:true})
	id: number;
	
	@Attribute()
	reason:TGithubNotificationReason
	
	@Attribute()
	repository:IRepo
	
	@Attribute()
	subject:IGithubNotificationSubject
	
	@Attribute()
	last_read_at:Date
	
	@Attribute()
	updated_at:Date
	
	@Attribute()
	url:string
	
	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}
	
}

export interface GithubNotificationStore extends TSRepo<GithubNotification> {
	
	findByReason(...reasons:string[]):Promise<GithubNotification>
	findAll():Promise<GithubNotification[]>
}