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
import {Issue} from './Issue'
import {LunrIndex} from '../LunrIndex'



/**
 * Create comment index
 *
 * @type {LunrIndex}
 */
export const CommentIndex = new LunrIndex<Comment>('Comment', {
	ref: 'id',
	fields: {
		body: 3,
		login: 1
	},
	normalizer(comment) {
		return Object.assign({},comment,{
			login: comment.user.login
		})
	}
})


@ModelDescriptor({onPersistenceEvent:CommentIndex.onPersistenceEvent})
export class Comment extends DefaultModel {

	static makeParentRefId(repoId,issueNumber) {
		return `${repoId}-${issueNumber}`
	}

	@AttributeDescriptor({primaryKey:true})
	id: number;

	@AttributeDescriptor()
	repoId:number

	@AttributeDescriptor()
	issueNumber:number

	@AttributeDescriptor()
	parentRefId:string

	url: string
	html_url: string
	issue_url:string

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

export class CommentRepo extends TSRepo<Comment> {

	constructor() {
		super(CommentRepo,Comment)
	}

	@IndexedDBFinderDescriptor({
		fn(tsRepo,...args) {
			const {repoId,number:issueNumber} = args[0] || {} as any
			const refId = Comment.makeParentRefId(repoId,issueNumber)
			return tsRepo.table.where('parentRefId').equals(refId).desc().sortBy('created_at') //.toArray()
		}
	})
	@FinderDescriptor()
	findByIssue(issue:Issue):Promise<Comment[]> {
		return null
	}

	@IndexedDBFinderDescriptor({
		fn(tsRepo,...args) {
			const repoIds = args
			return tsRepo.table.where('repoId').anyOf(repoIds).toArray()
		}
	})
	@FinderDescriptor()
	findByRepoId(...repoIds:number[]):Promise<Comment[]> {
		return null
	}
}
