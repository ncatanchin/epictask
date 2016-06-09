import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	DefaultValue,
	Repo as TSRepo
} from 'typestore'

import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'
import {User} from './User'
import {Label} from './Label'
import {Milestone} from './Milestone'
import {PullRequest} from './PullRequest'
import {LunrIndex} from 'shared/LunrIndex'

/**
 * Create issue index
 *
 * @type {LunrIndex}
 */
export const IssueIndex = new LunrIndex(Issue, {
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


/**
 * Repository for accessing repos
 */
export class IssueRepo extends TSRepo<Issue> {
	constructor() {
		super(IssueRepo,Issue)
	}

	@IndexedDBFinderDescriptor({
		async fn(tsRepo,...args) {
			const
				allJson = await tsRepo.table.toArray(),
				titleQuery = _.lowerCase(args[0])

			return allJson
				.filter(json => _.lowerCase(json.title).includes(titleQuery))
		}
	})
	@FinderDescriptor()
	findByTitle(title:string):Promise<Issue[]> {
		return null
	}


	@IndexedDBFinderDescriptor({
		fn(tsRepo,...args) {
			return tsRepo.table.toArray()
		}
	})
	@FinderDescriptor()
	findAll():Promise<Issue[]> {
		return null
	}

}

export function isIssue(o:any):o is Issue {
	return o.title && o.id && o.labels
}
