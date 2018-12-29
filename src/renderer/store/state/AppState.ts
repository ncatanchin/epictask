import {State} from "typedux"
import {IConfig} from "common/config/Config"
import {getConfig} from "common/config/ConfigHelper"
import {IUser} from "renderer/models/User"


export class AppState implements State<string> {
	static Key = "AppState"
	
	static fromJS(o:any = {}):AppState {
		return new AppState(o)
	}
	
	type = AppState.Key
	config: IConfig
	user: IUser | null
	
	selectedRepoId:number | null
	selectedOrgId:number | null
	
	enabledRepoIds = Array<number>()
	
	constructor(o:any = {}) {
		Object.assign(this,o,{
			config: getConfig()
		})
	}
	
	toJS():Object {
		return {...this, config: null, user: null}
	}
	
	
}
