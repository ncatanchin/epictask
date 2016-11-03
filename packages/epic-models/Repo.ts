import {
	Attribute,
	DefaultModel,
	FinderRequest,
	FinderResultArray,
	Repo as TSRepo
} from 'typestore'


import {PouchDBModel} from 'typestore-plugin-pouchdb'

import {User} from './User'
import {Permission} from './Permission'
import {RegisterModel} from 'epic-global'

export interface ISyncChanges {
	repoId:number
	repoChanged?:boolean
	issueNumbersNew?:number[]
	issueNumbersChanged?:number[]
}

@RegisterModel
@PouchDBModel({
	keyMapper: (repo:Repo) => `${repo.id}`,
	onlyMapDefinedAttributes: true
})
export class Repo extends DefaultModel implements IRepo {

	$$clazz = 'Repo'

	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => !o ? null : o instanceof Repo ? o : new Repo(o)


	@Attribute({primaryKey:true})
	id: number
	
	/**
	 * Organization owner if not individual
	 */
	@Attribute()
	organization: User
	
	/**
	 * Individual owner
	 */
	@Attribute()
	owner: User

	@Attribute()
	name: string;

	@Attribute()
	full_name: string;

	@Attribute()
	description: string;

	@Attribute()
	//'private': boolean;
	fork: boolean;
	
	@Attribute()
	url: string;
	
	
	@Attribute()
	homepage: string;
	@Attribute()
	language: any;
	@Attribute()
	forks_count: number;
	@Attribute()
	stargazers_count: number;
	@Attribute()
	watchers_count: number;
	
	@Attribute()
	size: number;
	@Attribute()
	default_branch: string;
	@Attribute()
	open_issues_count: number;
	@Attribute()
	has_issues: boolean;
	@Attribute()
	has_wiki: boolean;
	@Attribute()
	has_pages: boolean;
	@Attribute()
	has_downloads: boolean;
	
	@Attribute()
	pushed_at: string;
	
	@Attribute()
	created_at: string;
	
	@Attribute()
	updated_at: string;
	
	@Attribute()
	permissions: Permission;
	
	html_url: string;
	archive_url: string;
	assignees_url: string;
	blobs_url: string;
	branches_url: string;
	clone_url: string;
	collaborators_url: string;
	comments_url: string;
	commits_url: string;
	compare_url: string;
	contents_url: string;
	contributors_url: string;
	deployments_url: string;
	downloads_url: string;
	events_url: string;
	forks_url: string;
	git_commits_url: string;
	git_refs_url: string;
	git_tags_url: string;
	git_url: string;
	hooks_url: string;
	issue_comment_url: string;
	issue_events_url: string;
	issues_url: string;
	keys_url: string;
	labels_url: string;
	languages_url: string;
	merges_url: string;
	milestones_url: string;
	mirror_url: string;
	notifications_url: string;
	pulls_url: string;
	releases_url: string;
	ssh_url: string;
	stargazers_url: string;
	statuses_url: string;
	subscribers_url: string;
	subscription_url: string;
	svn_url: string;
	tags_url: string;
	teams_url: string;
	trees_url: string;
	

	constructor(props:any = {}) {
		super()

		Object.assign(this,props, {
			owner: User.fromJS(props.owner),
			organization: User.fromJS(props.organization)
		})
	}
}

/**
 * Repository for accessing repos
 */
export interface RepoStore extends TSRepo<Repo> {
	
	findWithText(request:FinderRequest, name:string):Promise<FinderResultArray<Repo>>

	findByFullName(fullName:string):Promise<number>

	/**
	 * Find all repos
	 * @returns {Promise<Repo[]>}
	 */
	findAll():Promise<Repo[]>
	
}

