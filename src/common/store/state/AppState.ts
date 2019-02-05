import {State} from "typedux"
import {IConfig} from "common/config/Config"
import {getConfig} from "common/config/ConfigHelper"
import {IUser} from "common/models/User"
import {IAcceleratorMap} from "common/models/CommandTypes"
import {IDataSyncStatus} from "common/Types"
import {IIssue} from "common/models/Issue"
import {IAppStatus, makeDefaultAppStatus} from "common/models/AppStatus"


export interface IIssueEdit {
  issue: IIssue | null
  open: boolean
}

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
  selectedIssueIds = Array<number>()
	selectedNotificationIds = Array<string>()

	status: IAppStatus = makeDefaultAppStatus()

	customAccelerators:IAcceleratorMap

	enabledRepoIds = Array<number>()

	syncs:{[table:string]:IDataSyncStatus} = {}



	constructor(o:any = {}) {
		Object.assign(this,o,{
			config: getConfig()
		})
	}

	toJS():Object {
		return {...this, config: null, editing: {
        open: false,
				issue: null,
				status: {
        	...this.status,
          blockingWork: []
				}
      }}
	}


}
