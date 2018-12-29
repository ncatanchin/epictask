import * as Octokit from "@octokit/rest"
import {IConfig} from "common/config/Config"
import moment from "moment"

let gh:Octokit | null = null

function setup(accessToken:string | null):void {
	if (!accessToken) {
		gh = null
		return
	}
	
	if (gh)
		return
	
	gh = new Octokit()
	gh.authenticate({
		type: 'oauth',
		token: accessToken
	})
	
	Object.assign(global,{gh})
}

export function getAPI(config:IConfig = getStoreState().AppState.config):Octokit {
	setup(config.accessToken)
	if (!gh)
		throw Error("No access token found")
	
	return gh
}


export function formatTimestamp(timestamp:number):string {
	return moment(timestamp).format("YYYY-MM-DDTHH:mm:ssZ")
}
