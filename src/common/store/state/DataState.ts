import {State} from "typedux"
import {DataType, IDataSet, IDataSyncStatus, makeDataSet} from "common/Types"
import {ICollaborator, IRepo} from "common/models/Repo"
import {IIssue} from "common/models/Issue"
import {IOrg} from "common/models/Org"
import {IMilestone} from "common/models/Milestone"
import {ILabel} from "common/models/Label"


export class DataState implements State<string> {
	static Key = "DataState"

	static fromJS(o:any = {}):DataState {
		return new DataState(o)
	}

	type = DataState.Key



	repos: IDataSet<IRepo> = makeDataSet()
	issues: IDataSet<IIssue> = makeDataSet()
	orgs: IDataSet<IOrg> = makeDataSet()
  collaborators: IDataSet<ICollaborator> = makeDataSet()
  labels: IDataSet<ILabel> = makeDataSet()
  milestones: IDataSet<IMilestone> = makeDataSet()

	constructor(o:any = {}) {
		Object.assign(this,o)
	}

	toJS():Object {
		return {
			...this,
			repos: makeDataSet(),
			issues: makeDataSet(),
			orgs: makeDataSet(),
      collaborators: makeDataSet(),
			labels: makeDataSet(),
			milestones: makeDataSet()
		}
	}


}
