import {ActionFactory, ActionMessage, ActionReducer, patchState} from "typedux"
import {DataState} from "../state/DataState"
import {IActionFactoryBase} from "./ActionFactoryBase"
import getLogger from "../../../common/log/Logger"
import {IRepo} from "renderer/models/Repo"
import {makeDataSet} from "common/Types"
import {IOrg} from "renderer/models/Org"

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
	setState(newState:DataState) {
		return (state:DataState) => patchState(state,newState)
	}
	
}
