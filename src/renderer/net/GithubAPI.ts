import * as Octokit from "@octokit/rest"
import {IConfig} from "common/config/Config"

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
}

export function getAPI(config:IConfig = getStoreState().AppState.config):Octokit {
	setup(config.accessToken)
	if (!gh)
		throw Error("No access token found")
	
	return gh
}
