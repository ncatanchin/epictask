import { IActionFactoryConstructor } from "epic-global"
import { JobActionFactory } from "epic-typedux"
import { AppActionFactory } from "epic-typedux"
import { IssueActionFactory } from "epic-typedux"
import { RepoActionFactory } from "epic-typedux"
import { UIActionFactory } from "epic-typedux"
import { JobKey, IssueKey, RepoKey, AppKey, AuthKey, UIKey } from "epic-global"
import { AuthActionFactory } from "epic-typedux"
import { If } from  "epic-common"

const log = getLogger(__filename)

// export interface IJobLeaf {
// 	leaf: "Jo"
// }
/**
 * Map of string literal types to action factory types
 */
export type IActionFactoryKeyMap = {
	["JobState"]:JobActionFactory
	["AuthState"]:AuthActionFactory
	["AppState"]:AppActionFactory
	["IssueState"]:IssueActionFactory
	["RepoState"]:RepoActionFactory
	["UIState"]:UIActionFactory
}

/**
 * Internal leaf to action factory class map
 */
const actionFactoryClazzMap = {} as any

/**
 * A proxy provider map that either returns a class instance
 * or a proxy
 *
 * @type {any}
 */
export const ActionFactoryProviders:IActionFactoryKeyMap = new Proxy({},{
	get(target,leafKey) {
		//log.info(`Getting action factory for leaf ${leafKey}`)
		if (ProcessConfig.isType(ProcessType.UI,ProcessType.UIChildWindow,ProcessType.Storybook) && actionFactoryClazzMap[leafKey]) {
			return new actionFactoryClazzMap[leafKey]()
		} else {
			return require("../store/AppStoreClient").getActionClient(leafKey)
		}
	}
}) as any

// export function getActionFactory(leafKey:TActionFactoryKeys) {
// 	return actionFactoryProviderMap[leafKey]
// }

export function getJobActions():JobActionFactory {
	return ActionFactoryProviders[JobKey]
}

export function getUIActions():UIActionFactory {
	return ActionFactoryProviders[UIKey]
}

export function getAuthActions():AuthActionFactory {
	return ActionFactoryProviders[AuthKey]
}

export function getAppActions():AppActionFactory {
	return ActionFactoryProviders[AppKey]
}

export function getRepoActions():RepoActionFactory {
	return ActionFactoryProviders[RepoKey]
}

export function getIssueActions():IssueActionFactory {
	return ActionFactoryProviders[IssueKey]
}

/**
 * Load all the action factories
 */
export function loadActionFactories() {
	
	
	
	const
		allActions = require('../actions/index')
	
	Object.keys(allActions)
		.filter(modName => modName.endsWith('ActionFactory'))
		.forEach(modName => {
			const
				actionFactoryClazz = allActions[modName].default as IActionFactoryConstructor
			
			if (!actionFactoryClazz) {
				return log.debug(`Unable to get action clazz from ${modName}`)
			}
			
			const
				{leaf} = actionFactoryClazz
			
			actionFactoryClazzMap[leaf] = actionFactoryClazz
			
			const actionFactoryProvider = () => {
				return ActionFactoryProviders[leaf]
			}
			
			Container
				.bind(actionFactoryClazz)
				.provider({
					get: actionFactoryProvider
				})
		})
	
	// IN DEBUG EXPOSE ALL PROVIDERS
	If(DEBUG,() => {
		assignGlobal(exports)
	})
	
	
	if (module.hot) {
		module.hot.accept(['../actions/index'], (updates) => {
			log.info(`HMR update action factories`,updates)
			loadActionFactories()
		})
	}
}