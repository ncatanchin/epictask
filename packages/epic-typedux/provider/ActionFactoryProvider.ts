import {
	JobKey, IssueKey, RepoKey, AppKey, AuthKey, UIKey, If,
	isFunction
} from "epic-global"

const log = getLogger(__filename)

// export interface IJobLeaf {
// 	leaf: "Jo"
// }
/**
 * Map of string literal types to action factory types
 */
export type IActionFactoryKeyMap = {
	["JobState"]:IJobActionFactory
	["AuthState"]:IAuthActionFactory
	["AppState"]:IAppActionFactory
	["IssueState"]:IIssueActionFactory
	["RepoState"]:IRepoActionFactory
	["UIState"]:IUIActionFactory
}

export const ActionFactoryKeyMap = {
	["JobState"]:"JobActions",
	["AuthState"]:"AuthActions",
	["AppState"]:"AppActions",
	["IssueState"]:"IssueActions",
	["RepoState"]:"RepoActions",
	["UIState"]:"UIActions"
}



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
	return Registry.Service[ActionFactoryKeyMap[JobKey]]
}

export function getUIActions():IUIActionFactory {
	return Registry.Service[ActionFactoryKeyMap[UIKey]]
}

export function getAuthActions():IAuthActionFactory {
	return Registry.Service[ActionFactoryKeyMap[AuthKey]]
}

export function getAppActions():IAppActionFactory {
	return Registry.Service[ActionFactoryKeyMap[AppKey]]
}

export function getRepoActions():IRepoActionFactory {
	return Registry.Service[ActionFactoryKeyMap[RepoKey]]
}

export function getIssueActions():IIssueActionFactory {
	return Registry.Service[ActionFactoryKeyMap[IssueKey]]
}
