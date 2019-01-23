import {ActionFactory, ActionMessage, ActionReducer, patchState} from "typedux"
import {DataState} from "../state/DataState"
import {IActionFactoryBase} from "./ActionFactoryBase"
import getLogger from "../../../common/log/Logger"
import {ICollaborator, IRepo} from "common/models/Repo"
import {makeDataSet, DataType, IDataSyncStatus, updateDataSet} from "common/Types"
import {IOrg} from "common/models/Org"
import {IIssue, IIssueEventData} from "common/models/Issue"
import {ILabel} from "common/models/Label"
import {IMilestone} from "common/models/Milestone"
import {IComment} from "common/models/Comment"
import moment from "moment"

const log = getLogger(__filename)

export class DataActionFactory extends ActionFactory<DataState,ActionMessage<DataState>> implements IActionFactoryBase<DataState> {

	constructor() {
		super(DataState)
	}

	leaf():string {
		return DataState.Key
	}


	@ActionReducer()
	setRepos(repos:Array<IRepo>) {
		return (state:DataState) => patchState(state,{
			repos: makeDataSet([...repos])
		})
	}

	@ActionReducer()
	setOrgs(orgs:Array<IOrg>) {
		return (state:DataState) => patchState(state,{
			orgs: makeDataSet([...orgs])
		})
	}

	@ActionReducer()
	setRepoObjects(issues:Array<IIssue>, labels:Array<ILabel>, milestones: Array<IMilestone>, collaborators: Array<ICollaborator>) {
		return (state:DataState) => patchState(state,{
			issues: updateDataSet([...issues],state.issues),
      labels: updateDataSet([...labels], state.labels),
      milestones: updateDataSet([...milestones], state.milestones),
      collaborators: updateDataSet([...collaborators], state.collaborators)
		})
	}

  @ActionReducer()
  updateIssue(issue:IIssue) {
    return (state:DataState) => {
      const
				data = [...state.issues.data],
				index = data.findIndex(it => it.id === issue.id)

			if (index > -1) {
				data[index] = {...issue}
			} else {
				data.push({...issue})
			}
    	return patchState(state, {
        issues: makeDataSet(data)
      })
    }
  }


  @ActionReducer()
  setIssueEventData(issueData:IIssueEventData) {
    return (state:DataState) => {
      return _.isEqual(issueData,state.issueData) ? state : patchState(state,{issueData})
    }
  }

  @ActionReducer()
  updateComment(comment:IComment) {
    return (state:DataState) => {
      const
        issueData = {...state.issueData},
				comments = issueData.comments = [...issueData.comments],
        index = comments.findIndex(it => it.id === comment.id)

      if (index > -1) {
        comments[index] = {...comment}
      } else {
        comments.push({...comment})
      }
      return patchState(state, {
        issueData
      })
    }
  }



	@ActionReducer()
	setState(newState:DataState) {
		return (state:DataState) => patchState(state,newState)
	}



}
