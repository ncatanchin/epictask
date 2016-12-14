
import { makePromisedComponent, acceptHot } from "epic-global"
import { getUIActions } from "epic-typedux/provider"

CommandRegistryScope.Register({
	id: 'RepoImport',
	type: CommandType.App,
	name: 'Import Repository',
	execute: (item, event) => getUIActions().openSheet(getRoutes().RepoImport.uri),
	defaultAccelerator: "CommandOrControl+Shift+n"
}, {
	id: 'RepoSettings',
	type: CommandType.App,
	name: 'Repository Labels, Milestones & Settings',
	execute: (item, event) => getUIActions().openWindow(getRoutes().RepoSettings.uri),
	defaultAccelerator: "CommandOrControl+Shift+Comma"
})

const
	RepoRouteConfigs = {
		RepoSettings: {
			name: 'RepoSettings',
			uri: 'dialog/repo-settings',
			showDevTools: true,
			provider: makePromisedComponent((resolver: TComponentResolver) =>
				require.ensure([], function (require: any) {
					resolver.resolve(require('./RepoSettingsWindow').RepoSettingsWindow)
				}))
		},
		
		RepoImport: {
			name: 'RepoImport',
			uri: "sheet/repo-import",
			title: 'Import Repository',
			provider: makePromisedComponent((resolver:TComponentResolver) =>
				require.ensure([],function(require:any) {
					resolver.resolve(require('./RepoAddTool').RepoAddTool)
				}))
		}
	}

Object.values(RepoRouteConfigs).forEach(RouteRegistryScope.Register)


export * from "./RepoAddTool"
export * from "./RepoLabelEditor"
export * from "./RepoList"
export * from "./RepoMilestoneEditor"
export * from "./RepoPanel"
export * from "./RepoSettingsWindow"

acceptHot(module)

