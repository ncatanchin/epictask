import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	Repo as TSRepo
} from 'typestore'

import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'
import {User} from './User'
import {Issue} from './Issue'
import {LunrIndex} from '../LunrIndex'
import {PouchDBMangoFinder} from 'typestore-plugin-pouchdb'



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
	@AttributeDescriptor({index:{name:'created_at'}})
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

	@PouchDBMangoFinder({
		indexFields: ['parentRefId'],
		selector: ({repoId,number:issueNumber}) => ({
			parentRefId:  Comment.makeParentRefId(repoId,issueNumber)
		}),
		sort: {
			'attrs.created_at': 'desc'
		}
	})

	@IndexedDBFinderDescriptor({
		fn(tsRepo,...args) {
			const {repoId,number:issueNumber} = args[0] || {} as any
			const refId = Comment.makeParentRefId(repoId,issueNumber)
			return tsRepo.table.where('parentRefId').equals(refId).desc().sortBy('created_at') //.toArray()
		}
	})
	findByIssue(issue:Issue):Promise<Comment[]> {
		return null
	}

	@PouchDBMangoFinder({
		indexFields: ['repoId','created_at'],
		selector: (...repoIds) => ({
			repoId: {
				$in: repoIds
			},
			created_at: {
				$exists: true
			}
		}),
		sort: { created_at: 'desc' }
		// filter: (model:Comment,{repoId,number:issueNumber}:Issue) =>
		// 	model.parentRefId === Comment.makeParentRefId(repoId,issueNumber),

	})
	@IndexedDBFinderDescriptor({
		fn(tsRepo,...args) {
			const repoIds = args
			return tsRepo.table.where('repoId').anyOf(repoIds).toArray()
		}
	})
	findByRepoId(...repoIds:number[]):Promise<Comment[]> {
		return null
	}
}
