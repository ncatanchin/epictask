import * as Octokit from "@octokit/rest"
import {IConfig} from "common/config/Config"
import * as moment from "moment"
import getLogger from "common/log/Logger"
import {AppActionFactory} from "common/store/actions/AppActionFactory"
import {INetworkCall} from "common/models/AppStatus"
import {shortId} from "common/IdUtil"

const log = getLogger(__filename)

Octokit.plugin([
	require('@octokit/plugin-throttling') as Octokit.Plugin,
  require('@octokit/plugin-retry') as Octokit.Plugin
] as any)

const setupHooks = (octokit: Octokit):void => {
  //log.debug("Setting up interceptor", octokit)

	// hook into the request lifecycle
  octokit.hook.wrap('request', async (request, options) => {
    const
      time = Date.now(),
      networkCall = {
        id: shortId(),
        code: 0,
        from: "",
        ...options
      } as INetworkCall,
      actions = new AppActionFactory()

    actions.updateNetworkCall(networkCall)
    const response = await request(options)
    log.debug(`${options.method} ${options.url} – ${response.status} in ${Date.now() - time}ms`)

    actions.updateNetworkCall(networkCall, true)

    return response
  })
}




let gh:Octokit | null = null

function setup(accessToken:string | null):void {
	if (!accessToken) {
		gh = null
		return
	}

	if (gh)
		return

	gh = new Octokit({
    throttle: {
      onRateLimit: (retryAfter, options):boolean => {
        log.warn(`Request quota exhausted for request ${options.method} ${options.url}`)

        if (options.request.retryCount === 0) { // only retries once
          log.info(`Retrying after ${retryAfter} seconds!`)
          return true
        }

				return false
      },
      onAbuseLimit: (retryAfter, options) => {
        // does not retry, only logs a warning
        console.warn(`Abuse detected for request ${options.method} ${options.url}`)
      }
    }
	} as any)
  setupHooks(gh)
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

Object.assign(global, {
	getGithubAPI: getAPI
})

