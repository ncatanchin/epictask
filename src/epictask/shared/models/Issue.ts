import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	Repo as TSRepo
} from 'typestore'

import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'
import {User} from './User'
import {Label} from './Label'
import {Repo} from './Repo'
import {Milestone} from './Milestone'
import {PullRequest} from './PullRequest'
import {LunrIndex} from 'shared/LunrIndex'
import {PouchDBFullTextFinder, PouchDBMangoFinder} from 'typestore-plugin-pouchdb'

export type IssueState = "open" | "closed"

/**
 * Create issue index
 *
 * @type {LunrIndex}
 */
export const IssueIndex = new LunrIndex<Issue>('Issue', {
	ref: 'id',
	fields: {
		title: 5,
		body: 3,
		allCommentsText: 2,
		assigneeName: 1,
		reporterName: 1

	},
	normalizer(issue) {
		return Object.assign({},issue,{
			allComments: 'merge comments here',
			assigneeName: 'sadasda',
			reporterName: 'sadasda'
		})
	}
})

@ModelDescriptor({
	onPersistenceEvent: IssueIndex.onPersistenceEvent
})

export class Issue extends DefaultModel {

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
	// @IndexedDBFinderDescriptor({
	// 	fn(tsRepo,...args) {
	// 		const repoIds = args
	// 		return tsRepo.table.where('repoId').anyOf(repoIds).desc().sortBy('updated_at')
	// 	}
	// })
	// @FinderDescriptor()
	findByRepoId(...repoIds:number[]):Promise<Issue[]> {
		return null
	}

	@PouchDBMangoFinder({selector:{}})
	// @IndexedDBFinderDescriptor({
	// 	fn(tsRepo,...args) {
	// 		return tsRepo.table.toArray()
	// 	}
	// })
	// @FinderDescriptor()
	findAll():Promise<Issue[]> {
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
