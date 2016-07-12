import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	Repo as TSRepo
} from 'typestore'
import {PouchDBMangoFinder} from 'typestore-plugin-pouchdb'

import {User} from './User'
import {Issue} from './Issue'
import {RegisterModel} from '../Registry'


@RegisterModel
@ModelDescriptor()
export class Comment extends DefaultModel {

	$$clazz = 'Comment'

	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new Comment(o)

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

	body: string
	user: User
	created_at: Date
	updated_at: Date

	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}
}

export class CommentStore extends TSRepo<Comment> {

	constructor() {
		super(CommentStore,Comment)
	}

	@PouchDBMangoFinder({
		indexFields: ['parentRefId'],
		selector: (repoId,issueNumber) => ({
			parentRefId:  Comment.makeParentRefId(repoId,issueNumber)
		})
	})
	findByIssueNumber(repoId:number,issueNumber:number):Promise<Comment[]> {
		return null
	}

	@PouchDBMangoFinder({
		indexDirection: 'desc',
		indexFields: ['created_at','repoId'],
		selector: (...repoIds) => ({
			repoId: { $in: repoIds },
			created_at: { $exists: true }
		}),
		sort: ['created_at','repoId'],
		sortDirection: 'desc'

	})
	findByRepoId(...repoIds:number[]):Promise<Comment[]> {
		return null
	}
}
