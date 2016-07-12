import {
	ModelDescriptor,
	AttributeDescriptor,
	DefaultModel,
	Repo as TSRepo,
	FinderRequest,
	FinderResultArray
} from 'typestore'


//import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'
import {User} from './User'
import {Label} from './Label'
import {Repo} from './Repo'
import {Milestone} from './Milestone'
import {PullRequest} from './PullRequest'
import {PouchDBFullTextFinder, PouchDBMangoFinder} from 'typestore-plugin-pouchdb'
import {RegisterModel} from '../Registry'


export type IssueState = "open" | "closed"


@RegisterModel
@ModelDescriptor()
export class Issue extends DefaultModel {

	$$clazz = 'Issue'

	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new Issue(o)

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
export class IssueStore extends TSRepo<Issue> {
	constructor() {
		super(IssueStore,Issue)
	}


	@PouchDBFullTextFinder({
		includeDocs:false,
		textFields: ['title','body'],
		limit: 200,
	})
	findWithText(request:FinderRequest,title:string):Promise<FinderResultArray<number>> {
		return null
	}


	@PouchDBFullTextFinder({
		textFields: ['title'],
		limit: 200,
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
		selector: (...repoIds:number[]) => {
			return {$or: repoIds.map(repoId => ({repoId}))}
		}
	})
	findByRepoId(...repoIds:number[]):Promise<Issue[]> {
		return null
	}

	@PouchDBMangoFinder({
		indexFields: ['id','repoId','milestone.id','assignee.id','user.id'],
		includeDocs: false,
		selector: (
			issueId:number,
			repoIds:number[],
			milestoneIds:number[],
			labelUrls:string[],
			assigneeIds:number[]
		) => {
			if (issueId)
				return {issueId}

			const sel:any = {}

			// return {$or: repoIds.map(repoId => ({repoId}))}

			return sel
		}
	})
	findForListView(
		request:FinderRequest,
		issueId:number,
		repoIds:number[],
	    milestoneIds:number[],
	    labelUrls:string[],
	    assigneeIds:number[]
	):Promise<Issue[]> {
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
