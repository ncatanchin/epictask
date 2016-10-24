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
	keyMapper: (repo:Repo) => `${repo.id}`
})
export class Repo extends DefaultModel {

	$$clazz = 'Repo'

	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new Repo(o)


	@Attribute({primaryKey:true})
	id: number
	
	/**
	 * Organization owner if not individual
	 */
	organization: User
	
	/**
	 * Individual owner
	 */
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
	url: string;
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
	homepage: string;
	language: any;
	forks_count: number;
	stargazers_count: number;
	watchers_count: number;
	size: number;
	default_branch: string;
	open_issues_count: number;
	has_issues: boolean;
	has_wiki: boolean;
	has_pages: boolean;
	has_downloads: boolean;
	pushed_at: string;
	created_at: string;
	updated_at: string;
	permissions: Permission;

	constructor(props = {}) {
		super()

		Object.assign(this,props)
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

