import {ActionFactory, ActionMessage, ActionReducer, patchState} from "typedux"
import {AppState} from "common/store/state/AppState"
import {IConfig} from "common/config/Config"
import {IActionFactoryBase} from "./ActionFactoryBase"
import getLogger from "common/log/Logger"
import {getAPI} from "renderer/net/GithubAPI"
import {IUser} from "common/models/User"
import {IRepo} from "common/models/Repo"
import {IOrg} from "common/models/Org"
import * as _ from 'lodash'
import {DataType, IDataSyncStatus} from "common/Types"

const log = getLogger(__filename)

export class AppActionFactory extends ActionFactory<AppState,ActionMessage<AppState>> implements IActionFactoryBase<AppState> {

	constructor() {
		super(AppState)
	}

	leaf():string {
		return AppState.Key
	}

	@ActionReducer()
	setIssuesSplitter(splitter:number | string) {
		return (state:AppState) => patchState(state,{
			issues: {
				...state.issues,
				splitter
			}
		})
	}

	setSelectedRepo(selectedRepo:IRepo) {
		this.setSelectedRepoId(selectedRepo ? selectedRepo.id : 0)
	}

	setSelectedOrg(selectedOrg:IOrg) {
		this.setSelectedOrgId(selectedOrg ? selectedOrg.id : 0)
	}

	@ActionReducer()
	setSelectedRepoId(selectedRepoId:number) {
		return (state:AppState) => patchState(state, {
			selectedRepoId
		})
	}

	@ActionReducer()
	setSelectedOrgId(selectedOrgId:number) {
		return (state:AppState) => patchState(state, {
			selectedOrgId
		})
	}


	@ActionReducer()
	enableRepo(repo:IRepo) {
		return (state:AppState) => patchState(state, {
			enabledRepoIds: _.uniq([...state.enabledRepoIds,repo.id])
		})
	}
	@ActionReducer()
	setConfig(config:IConfig) {
		return (state:AppState) => patchState(state,{config})
	}

	@ActionReducer()
	setUser(user:IUser) {
		return (state:AppState) => patchState(state,{user})
	}

	@ActionReducer()
	setUserAndConfig(user:IUser,config:IConfig) {
		return (state:AppState) => patchState(state,{user,config})
	}

  @ActionReducer()
  setSelectedIssueIds(selectedIssueIds:Array<number>) {
    return (state:AppState) => patchState(state,{selectedIssueIds})
  }

	@ActionReducer()
	setState(newState:AppState) {
		return (state:AppState) => patchState(state,newState)
	}

	@ActionReducer()
	setDataSynced(type:DataType, ids:Array<number>, syncedAt:number) {
		return (state:AppState) => {
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
