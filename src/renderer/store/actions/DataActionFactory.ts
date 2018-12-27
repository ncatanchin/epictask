import {ActionFactory, ActionMessage, ActionReducer, patchState} from "typedux"
import {DataState} from "../state/DataState"
import {IActionFactoryBase} from "./ActionFactoryBase"
import getLogger from "../../../common/log/Logger"
import {IRepo} from "renderer/models/Repo"
import {makeDataSet, DataType, IDataSyncStatus} from "common/Types"
import {IOrg} from "renderer/models/Org"
import {IIssue} from "renderer/models/Issue"

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
			repos: makeDataSet(repos)
		})
	}
	
	@ActionReducer()
	setOrgs(orgs:Array<IOrg>) {
		return (state:DataState) => patchState(state,{
			orgs: makeDataSet(orgs)
		})
	}
	
	@ActionReducer()
	setIssues(issues:Array<IIssue>) {
		return (state:DataState) => patchState(state,{
			issues: makeDataSet(issues)
		})
	}
	
	@ActionReducer()
	setState(newState:DataState) {
		return (state:DataState) => patchState(state,newState)
	}
	
	@ActionReducer()
	setDataSynced(type:DataType, ids:Array<number>, syncedAt:number) {
		return (state:DataState) => {
			const
				syncs = {...state.syncs},
				status = {...(syncs[type] || {type,records:{}})} as IDataSyncStatus
			
			status.records = {...status.records}
			ids.forEach(id => {
				status.records[id] = {id, type, timestamp: syncedAt}
			})
			
			syncs[type] = status
			
			return patchState(state, {
				syncs
			})
		}
	}
	
}
