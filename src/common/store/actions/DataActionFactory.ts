import {ActionFactory, ActionMessage, ActionReducer, patchState} from "typedux"
import {DataState} from "../state/DataState"
import {IActionFactoryBase} from "./ActionFactoryBase"
import getLogger from "../../../common/log/Logger"
import {ICollaborator, IRepo} from "common/models/Repo"
import {makeDataSet, DataType, IDataSyncStatus} from "common/Types"
import {IOrg} from "common/models/Org"
import {IIssue} from "common/models/Issue"
import {ILabel} from "common/models/Label"
import {IMilestone} from "common/models/Milestone"

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
			issues: makeDataSet([...issues]),
      labels: makeDataSet([...labels]),
      milestones: makeDataSet([...milestones]),
      collaborators: makeDataSet([...collaborators])
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
        issues: {
          ...state.issues,
          data
        }
      })
    }
  }



	@ActionReducer()
	setState(newState:DataState) {
		return (state:DataState) => patchState(state,newState)
	}



}
