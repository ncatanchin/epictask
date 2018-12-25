import {ActionFactory, ActionMessage, ActionReducer, patchState} from "typedux"
import {AppState} from "renderer/store/state/AppState"
import {IConfig} from "common/config/Config"
import {IActionFactoryBase} from "./ActionFactoryBase"
import getLogger from "common/log/Logger"
import {getAPI} from "renderer/net/GithubAPI"
import {IUser} from "renderer/models/User"
import {IRepo} from "renderer/models/Repo"
import {IOrg} from "renderer/models/Org"

const log = getLogger(__filename)

export class AppActionFactory extends ActionFactory<AppState,ActionMessage<AppState>> implements IActionFactoryBase<AppState> {
	
	constructor() {
		super(AppState)
	}
	
	leaf():string {
		return AppState.Key
	}
	
	async loadUser(config:IConfig = this.state.config) {
		try {
			const
				gh = getAPI(config),
				user = (await gh.users.getAuthenticated({})).data as IUser
			
			log.debug("Got user",user)
			this.setUserAndConfig(user,config)
		} catch (err) {
			log.error("Unable to load user", err)
		}
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
