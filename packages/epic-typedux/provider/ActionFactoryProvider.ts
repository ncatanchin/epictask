import {
	JobKey, IssueKey, RepoKey, AppKey, AuthKey, UIKey, If,
	isFunction, IActionFactoryKeyMap, ActionFactoryKeyMap
} from "epic-global"

const
	log = getLogger(__filename)


/**
 * A proxy provider map that either returns a class instance
 * or a proxy
 *
 * @type {any}
 */
export const ActionFactoryProviders:IActionFactoryKeyMap = new Proxy({},{
	get(target,leafKey) {
		//log.info(`Getting action factory for leaf ${leafKey}`)
		if ([ProcessType.DatabaseServer,ProcessType.Storybook].includes(ProcessConfig.getType())) {
			return require("../store/AppStoreClient").getActionClient(leafKey)
		}
	}
}) as any


export function getJobActions():IJobActionFactory {
	return Scopes.Services.get(ActionFactoryKeyMap[JobKey]) as any
}

export function getUIActions():IUIActionFactory {
	return Scopes.Services.get(ActionFactoryKeyMap[UIKey]) as any
	
}

export function getAuthActions():IAuthActionFactory {
	return Scopes.Services.get(ActionFactoryKeyMap[AuthKey]) as any
}

export function getAppActions():IAppActionFactory {
	return Scopes.Services.get(ActionFactoryKeyMap[AppKey]) as any
}


export function getRepoActions():IRepoActionFactory {
	return Scopes.Services.get(ActionFactoryKeyMap[RepoKey]) as any
}

export function getIssueActions():IIssueActionFactory {
	return Scopes.Services.get(ActionFactoryKeyMap[IssueKey]) as any
}
