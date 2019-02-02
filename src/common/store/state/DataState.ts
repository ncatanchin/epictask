import {State} from "typedux"
import {DataType, IDataSet, IDataSyncStatus, makeDataSet} from "common/Types"
import {ICollaborator, IRepo} from "common/models/Repo"
import {IIssue, IIssueEvent, IIssueEventData} from "common/models/Issue"
import {IOrg} from "common/models/Org"
import {IMilestone} from "common/models/Milestone"
import {ILabel} from "common/models/Label"
import {IComment} from "common/models/Comment"
import {INotification} from "common/models/Notification"


const DefaultIssueEventData = {
  timeline: [],
  comments: [],
  events: []
}


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
  notifications: IDataSet<INotification> = makeDataSet()

	issueData: IIssueEventData = {...DefaultIssueEventData}


	constructor(o:any = {}) {
		Object.assign(this,o)
	}

	toJS():Object {
		return {
			...this,
			repos: makeDataSet(),
			issues: makeDataSet(),
      issueData: {...DefaultIssueEventData},
			orgs: makeDataSet(),
      collaborators: makeDataSet(),
			labels: makeDataSet(),
			milestones: makeDataSet()
		}
	}


}
