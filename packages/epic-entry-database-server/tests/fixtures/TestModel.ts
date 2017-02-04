import { Attribute, DefaultModel, FinderRequest, FinderResultArray, Repo as TSRepo } from "typestore"
import { PouchDBRepo, PouchDBFullTextFinder, PouchDBMangoFinder, PouchDBModel } from "typestore-plugin-pouchdb"


export interface ISyncChanges {
	repoId:number
	repoChanged?:boolean
	issueNumbersNew?:number[]
	issueNumbersChanged?:number[]
}

@Scopes.Models.Register
@PouchDBModel({
	keyMapper: (model:TestModel) => `${model.id}`,
	onlyMapDefinedAttributes: true
})
export class TestModel extends DefaultModel {
	
	$$clazz = 'TestModel'
	
	/**
	 * Revive from JS/JSON
	 *
	 * @param o
	 */
	static fromJS = (o:any) => !o ? null : o instanceof TestModel ? o : new TestModel(o)
	
	
	@Attribute({primaryKey:true})
	id: string
	
	@Attribute()
	name: string;
	
	@Attribute()
	val1: boolean;
	
	
	constructor(props:any = {}) {
		super()
		
		Object.assign(this,props)
	}
}

/**
 * Repository for accessing repos
 */
export interface TestModelStore extends TSRepo<TestModel> {
	
	findWithText(request:FinderRequest, name:string):Promise<FinderResultArray<TestModel>>
	
	findByName(name:string):Promise<number>
	
	/**
	 * Find all repos
	 * @returns {Promise<Repo[]>}
	 */
	findAll():Promise<TestModel[]>
	
}


// import {
// 	FinderRequest,
// 	FinderResultArray,
//
// } from 'typestore'



export class TestModelStoreImpl extends PouchDBRepo<TestModel> implements TestModelStore {
	
	constructor() {
		super(TestModelStoreImpl,TestModel)
	}
	
	@PouchDBFullTextFinder({
		includeDocs: true,
		textFields: ['name']
	})
	findWithText(request:FinderRequest, name:string):Promise<FinderResultArray<TestModel>> {
		return null
	}
	
	@PouchDBMangoFinder({
		single: true,
		includeDocs: false,
		indexFields: ['name'],
		selector: (name) => ({name})
	})
	findByName(name:string):Promise<number> {
		return null
	}
	
	/**
	 * Find all repos
	 * @returns {Promise<Repo[]>}
	 */
	@PouchDBMangoFinder({all:true})
	findAll():Promise<TestModel[]> {
		return null
	}
}

