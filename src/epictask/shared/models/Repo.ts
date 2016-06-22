import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	DefaultValue,
	IFinderRequest,
	Repo as TSRepo
} from 'typestore'


import {PouchDBFullTextFinder, PouchDBMangoFinder} from 'typestore-plugin-pouchdb'
//import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'

import {User} from './User'
import {Permission} from './Permission'

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
export class RepoRepo extends TSRepo<Repo> {
	constructor() {
		super(RepoRepo,Repo)
	}

	@PouchDBFullTextFinder({
		textFields: ['name']
	})
	findByName(name:string,opts:IFinderRequest = null):Promise<Repo[]> {
		return null
	}

	/**
	 * Find all repos
	 * @returns {Promise<Repo[]>}
	 */
	@PouchDBMangoFinder({all:true})
	findAll():Promise<Repo[]> {
		return null
	}
}
