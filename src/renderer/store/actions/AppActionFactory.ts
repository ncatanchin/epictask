import {ActionFactory, ActionMessage, ActionReducer, patchState} from "typedux"
import {AppState} from "renderer/store/state/AppState"
import {IConfig} from "common/config/Config"
import {IActionFactoryBase} from "./ActionFactoryBase"
import getLogger from "common/log/Logger"
import {getAPI} from "renderer/net/GithubAPI"
import {IUser} from "renderer/models/User"
import {IRepo} from "renderer/models/Repo"
import {IOrg} from "renderer/models/Org"
import * as _ from 'lodash'
const log = getLogger(__filename)

export class AppActionFactory extends ActionFactory<AppState,ActionMessage<AppState>> implements IActionFactoryBase<AppState> {
	
	constructor() {
		super(AppState)
	}
	
	leaf():string {
		return AppState.Key
	}
	
	// async loadUser(config:IConfig = this.state.config) {
	//
	// }
	
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
	setState(newState:AppState) {
		return (state:AppState) => patchState(state,newState)
	}
	
}
