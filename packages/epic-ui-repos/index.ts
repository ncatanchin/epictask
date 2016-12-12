
import { makePromisedComponent, acceptHot } from "epic-global"

/*
 
 .command(
 CommandType.App,
 'Import Repository',
 (item, event) => getUIActions().openSheet(Pages.RepoImport.path),
 "CommandOrControl+Shift+n",{
 id: CIDS.GithubImport
 }
 )
 
 .command(
 CommandType.App,
 'Repository Labels, Milestones & Settings',
 (cmd, event) => getUIActions().openWindow(Pages.RepoSettings.path),
 "CommandOrControl+Shift+Comma", {
 id: CIDS.RepoSettings
 })
 */

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

