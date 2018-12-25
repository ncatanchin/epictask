import {State} from "typedux"
import {IDataSet, makeDataSet} from "common/Types"
import {IRepo} from "renderer/models/Repo"
import {IIssue} from "renderer/models/Issue"
import {IOrg} from "renderer/models/Org"


export class DataState implements State<string> {
	static Key = "DataState"
	
	static fromJS(o:any = {}):DataState {
		return new DataState(o)
	}
	
	type = DataState.Key
	
	repos: IDataSet<IRepo> = makeDataSet()
	issues: IDataSet<IIssue> = makeDataSet()
	orgs: IDataSet<IOrg> = makeDataSet()
	
	constructor(o:any = {}) {
		Object.assign(this,o)
	}
	
	toJS():Object {
		return {
			...this,
			repos: makeDataSet(),
			issues: makeDataSet(),
			orgs: makeDataSet()
		}
	}
	
	
}
