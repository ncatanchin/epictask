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
import {LunrIndex} from '../LunrIndex'

/**
 * Create comment index
 *
 * @type {LunrIndex}
 */
export const CommentIndex = new LunrIndex(Comment, {
	ref: 'id',
	fields: {
		body: 3,
		userName: 1

	},
	normalizer(comment) {
		return Object.assign({},comment,{
			userName: 'sadasda'
		})
	}
})


@ModelDescriptor({onPersistenceEvent:CommentIndex.onPersistenceEvent})
export class Comment extends DefaultModel {

	@AttributeDescriptor({primaryKey:true})
	id: number;

	@AttributeDescriptor()
	repoId:number

	@AttributeDescriptor()
	issueId:number

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

export class CommentRepo extends TSRepo<Comment> {
	constructor() {
		super(CommentRepo,Comment)
	}


	// @IndexedDBFinderDescriptor({
	// 	fn(tsRepo,...args) {
	// 		return tsRepo.table.toArray()
	// 	}
	// })
	// @FinderDescriptor()
	// findAll():Promise<Comment[]> {
	// 	return null
	// }

}
