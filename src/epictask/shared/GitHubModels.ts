import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	DefaultValue,
	Repo as TSRepo
} from 'typestore'

import * as uuid from 'node-uuid'
import * as _ from 'lodash'
import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'
import {getRepo} from './DBService'

@ModelDescriptor()
export class User extends DefaultModel {


	@AttributeDescriptor({primaryKey:true})
	id: number;

	@AttributeDescriptor()
	login: string;


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


}

@ModelDescriptor()
export class Label extends DefaultModel {
	@AttributeDescriptor({primaryKey:true})
	url: string;


	name: string;
	color: string;

	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}
}

@ModelDescriptor()
export class Milestone extends DefaultModel {

	@AttributeDescriptor({primaryKey:true})
	id: number;

	url: string;
	html_url: string;
	labels_url: string;


	number: number;
	state: string;
	title: string;
	description: string;
	creator: User;
	open_issues: number;
	closed_issues: number;
	created_at: Date;
	updated_at: Date;
	closed_at: Date;
	due_on: Date;

	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}
}


export class PullRequest {
	url: string;
	html_url: string;
	diff_url: string;
	patch_url: string;

	constructor(props = {}) {
		Object.assign(this,props)
	}
}


@ModelDescriptor()
export class Issue extends DefaultModel {

	@AttributeDescriptor({primaryKey:true})
	id: number;


	url: string;
	repository_url: string;
	labels_url: string;
	comments_url: string;
	events_url: string;
	html_url: string;
	number: number;
	state: string;
	title: string;
	body: string;
	user: User;
	labels: Label[];
	assignee: User;
	milestone: Milestone;
	locked: boolean;
	comments: number;
	pull_request: PullRequest;
	closed_at: any;
	created_at: Date;
	updated_at: Date;
	closed_by: User;

	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}
}


export class Reactions {
	total_count: number;
	"+1": number;
	"-1": number;
	laugh: number;
	confused: number;
	heart: number;
	hooray: number;
	url: string;

	constructor(props = {}) {
		Object.assign(this,props)
	}
}

@ModelDescriptor()
export class Comment extends DefaultModel {

	@AttributeDescriptor({primaryKey:true})
	id: number;
	url: string;
	html_url: string;

	@AttributeDescriptor()
	body: string;

	user: User;
	created_at: Date;
	updated_at: Date;

	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}
}


export class Permission {
	admin: boolean;
	push: boolean;
	pull: boolean;

	constructor(props = {}) {
		Object.assign(this,props)
	}
}



@ModelDescriptor()
export class Repo extends DefaultModel {

	@AttributeDescriptor({primaryKey:true})
	id: number;
	owner: User;

	@AttributeDescriptor()
	name: string;

	@AttributeDescriptor()
	full_name: string;

	@AttributeDescriptor()
	description: string;

	@AttributeDescriptor()
	private: boolean;
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
export class RepoRepo extends TSRepo<Repo> {
	constructor() {
		super(RepoRepo,Repo)
	}

	@IndexedDBFinderDescriptor({
		async fn(repo,...args) {
			const {table,mapper,db} = repo
			const limit = args[1] || 5000
			const query = args[0]
			return await table
				.filter(json => _.lowerCase(json.name).indexOf(_.lowerCase(query)) > -1)
				.limit(limit)
				.toArray()

			//const jsons = await table.where('name').equalsIgnoreCase(args[0]).toArray()
			//return jsons.map(json => mapper.fromObject(json))
		}
	})
	@FinderDescriptor()
	findByName(name:string,limit = null):Promise<Repo[]> {
		return null
	}

	@IndexedDBFinderDescriptor({
		async fn(tsRepo,...args) {
			const {mapper} = tsRepo
			return await tsRepo.table.toArray()
			//return allJson.map(json => mapper.fromObject(json))
		}
	})
	@FinderDescriptor()
	findAll():Promise<Repo[]> {
		return null
	}
}


/**
 * Maps repos that have been configured for tasks
 * to real repos
 *
 */
@ModelDescriptor({transientAttrs: ['repo']})
export class AvailableRepo extends DefaultModel {

	@DefaultValue(() => uuid.v4())
	@AttributeDescriptor({primaryKey:true})
	id:string

	@AttributeDescriptor({index:{unique:true,name:'repoId'}})
	repoId:number

	@AttributeDescriptor()
	enabled:boolean

	@AttributeDescriptor({transient:true})
	repo

	constructor(props = {}) {
		super()

		Object.assign(this,props)
	}


	async getRepo() {
		if (this.repo)
			return this.repo

		const repoRepo = getRepo(RepoRepo)
		const repo = await repoRepo.get(repoRepo.key(this.repoId))

		if (!repo) {
			throw new Error('Integrated repo must have a valid repo')
		}

		this.repo = repo
		return repo
	}
}


/**
 * Repository for accessing repos
 */
export class AvailableRepoRepo extends TSRepo<AvailableRepo> {
	constructor() {
		super(AvailableRepoRepo,AvailableRepo)
	}

	@IndexedDBFinderDescriptor({
		async fn(tsRepo,...args) {
			const allJson = await tsRepo.table.toArray()

			// Finally map the results
			const repoRepo = getRepo(RepoRepo)
			return allJson
				.filter(async (json) => {

					const repo = await repoRepo.get(repoRepo.key(json.repoId))

					return _.lowerCase(repo.name).includes(_.lowerCase(args[0]))
				})

		}
	})
	@FinderDescriptor()
	findByName(name:string):Promise<AvailableRepo[]> {
		return null
	}


	@IndexedDBFinderDescriptor({
		fn(tsRepo,...args) {
			const {mapper} = tsRepo
			return tsRepo.table.toArray()
			// 	.then(allJson => {
			//
			// 	return allJson.map(json => mapper.fromObject(json))
			// })
		}
	})
	@FinderDescriptor()
	findAll():Promise<AvailableRepo[]> {
		return null
	}

}

export function isIssue(o:any):o is Issue {
	return o.title && o.id && o.labels
}
