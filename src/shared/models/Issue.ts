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


export type TIssueState = "open" | "closed"


@RegisterModel
@ModelDescriptor()
export class Issue extends DefaultModel {

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

	/**
	 * Globally unique url to view the issue
	 */
	@AttributeDescriptor()
	url: string;


	/**
	 * Associated repo
	 *
	 * @transient
	 */
	@AttributeDescriptor({transient:true})
	repo:Repo


	/**
	 * Milestones
	 *
	 * @transient
	 */
	@AttributeDescriptor({transient:true})
	milestones:Milestone[]

	/**
	 * Collaborators
	 *
	 * @transient
	 */
	@AttributeDescriptor({transient:true})
	collaborators:User[]

	/**
	 * State open/closed
	 */
	@AttributeDescriptor()
	state: TIssueState;

	repository_url: string;
	labels_url: string;
	comments_url: string;
	events_url: string;
	html_url: string;
	number: number;

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
		textFields: ['title','body'],
		limit: 200,
	})
	findWithText(request:FinderRequest,title:string):Promise<FinderResultArray<Issue>> {
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
		includeDocs: true,
		indexFields: ['repoId'],
		selector: (...repoIds:number[]) => ({
			$or: repoIds.map(repoId => ({repoId}))
		})
	})
	findByRepoId(...repoIds:number[]):Promise<Issue[]> {
		return null
	}



	@PouchDBMangoFinder({
		all:true,
		includeDocs:false
	})
	findAll():Promise<number[]> {
		return null
	}


	@PouchDBMangoFinder({
		includeDocs: false,
		indexFields: ['repoId'],
		selector: (...repoIds) => ({
			$or: repoIds.map(repoId => ({repoId:{$eq:repoId}}))
		})
	})
	findIdsByRepoId(...repoIds:number[]):Promise<number[]> {
		return null
	}

	@PouchDBMangoFinder({
		includeDocs: false,
		indexFields: ['repoId','state'],
		selector: (state:TIssueState,...repoIds) => ({
			state: {
				$eq: state
			},
			$or: repoIds.map(repoId => ({repoId:{$eq:repoId}}))
		})
	})
	findIdsByStateAndRepoId(state:TIssueState,...repoIds:number[]):Promise<number[]> {
		return null
	}
	
	@PouchDBMangoFinder({
		includeDocs: false,
		indexFields: ['repoId','number'],
		selector: (repoId,issueNumber) => ({
			repoId:{
				$eq:repoId
			},
			number:{
				$eq:issueNumber
			}
		})
	})
	findByRepoIdAndIssueNumber(repoId:number,issueNumber:number):Promise<Issue> {
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
