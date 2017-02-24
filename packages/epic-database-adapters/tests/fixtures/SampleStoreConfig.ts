import {
	Model,
	Attribute,
	DefaultModel,
	FinderRequest
} from 'typestore'
import { PouchDBRepo,PouchDBMangoFinder} from 'typestore-plugin-pouchdb'




/**
 * User model from GitHub schema
 */
@Model({
	onlyMapDefinedAttributes: true
})
export class Sample extends DefaultModel  {
	
	$$clazz = "Sample"
	
	@Attribute({primaryKey:true})
	value1: string
	
	@Attribute({primaryKey:true})
	value2: string
	
	constructor(props = {} as any) {
		super()
		Object.assign(this,props)
	}
}



/**
 * Repository for accessing repos
 */
export class SampleStore extends PouchDBRepo<Sample>  {
	constructor() {
		super(SampleStore,Sample)
	}
	
	
	@PouchDBMangoFinder({
		single:true,
		indexFields: ['attrs.value1'],
		selector: (value1:string) => ({value1})
	})
	findByValue1(login:string):Promise<Sample> {
		return null
	}
	
	
	@PouchDBMangoFinder({
		all:true,
		includeDocs:false
	})
	findAll():Promise<number[]> {
		return null
	}
	
	
}

export const name = SampleStore.name

export {
	Sample as model,
	SampleStore as store
}