
import { acceptHot } from "epic-global"
import { getUIActions, getRepoActions } from "epic-typedux"
import { makePromisedComponent } from "epic-util"

const
	log = getLogger(__dirname)

/**
 * Commands
 */
Scopes.Commands.Register({
	id: 'RepoImport',
	type: CommandType.App,
	name: 'Import Repository',
	execute: (item, event) => getUIActions().openSheet(getRoutes().RepoImport.uri),
	defaultAccelerator: "CommandOrControl+Shift+n"
}, {
	id: 'RepoSettings',
	type: CommandType.App,
	name: 'Repository Labels, Milestones & Settings',
	execute: (item, event) => getRepoActions().openRepoSettings(),
	defaultAccelerator: "CommandOrControl+Shift+Comma"
})


/**
 * Register Views
 */
Scopes.Views.Register({
	id: "ReposPanel",
	name: "Repos Panel",
	type: "ReposPanel",
	defaultView: true,
	provider: makePromisedComponent(resolver => require.ensure([],function(require:any) {
		const
			modId = require.resolve('epic-ui-repos/ReposPanel'),
			mod = __webpack_require__(modId)
		
		log.debug(`Loaded repos panel module`,mod.id,modId,mod)
		resolver.resolve(mod.ReposPanel)
	}))
})
/**
 * Route Configs
 */

RouteRegistryScope.Register({
	name: 'RepoSettings',
	uri: 'dialog/repo-settings/:repoId',
	makeURI(repoId:number = 0) {
		return `dialog/repo-settings/${repoId}`
	},
	provider: makePromisedComponent((resolver: TComponentResolver) =>
		require.ensure([], function (require: any) {
			resolver.resolve(require('./RepoSettingsWindow').RepoSettingsWindow)
		}))
},{
	name: 'RepoImport',
	uri: "sheet/repo-import",
	title: 'Import Repository',
	provider: makePromisedComponent((resolver:TComponentResolver) =>
		require.ensure([],function(require:any) {
			resolver.resolve(require('./RepoAddTool').RepoAddTool)
		}))
})


// export * from "./RepoAddTool"
// export * from "./RepoLabelEditor"
// export * from "./RepoList"
// export * from "./RepoMilestoneEditor"
// export * from "./ReposPanel"
// export * from "./RepoSettingsWindow"

acceptHot(module)

