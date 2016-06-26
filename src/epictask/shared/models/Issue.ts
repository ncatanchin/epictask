import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	Repo as TSRepo
} from 'typestore'


//import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'
import {User} from './User'
import {Label} from './Label'
import {Repo} from './Repo'
import {Milestone} from './Milestone'
import {PullRequest} from './PullRequest'
import {PouchDBFullTextFinder, PouchDBMangoFinder} from 'typestore-plugin-pouchdb'
import {registerModel} from './Registry'


export type IssueState = "open" | "closed"

export const IssueClassName = 'Issue'

@ModelDescriptor()
export class Issue extends DefaultModel {

	$$clazz = IssueClassName

	@AttributeDescriptor({primaryKey:true})
	id: number;

	@AttributeDescriptor()
	repoId:number

	@AttributeDescriptor()
	url: string;


	@AttributeDescriptor({transient:true})
	repo:Repo

	@AttributeDescriptor({transient:true})
	milestones:Milestone[]

	@AttributeDescriptor({transient:true})
	collaborators:User[]

	repository_url: string;
	labels_url: string;
	comments_url: string;
	events_url: string;
	html_url: string;
	number: number;
	state: IssueState;
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


/**
 * Repository for accessing repos
 */
export class IssueRepo extends TSRepo<Issue> {
	constructor() {
		super(IssueRepo,Issue)
	}

	@PouchDBFullTextFinder({
		textFields: ['title']
	})
	findByTitle(title:string):Promise<Issue[]> {
		return null
	}

	/**
	 * Find all issues in provided repo ids
	 * @param repoIds
	 * @returns {Promise<Issue[]>}
	 */
	@PouchDBMangoFinder({
		indexFields: ['repoId'],
		selector: (...repoIds:number[]) => ({
			$or: repoIds.map(repoId => ({
				$eq: repoId
			}))
		})
	})
	findByRepoId(...repoIds:number[]):Promise<Issue[]> {
		return null
	}



}

/**
 * TypeGuard for Issue shape
 *
 * @param o
 * @returns {boolean}
 */
export function isIssue(o:any):o is Issue {
	return o.title && o.id && o.labels
}

registerModel(IssueClassName,Issue)