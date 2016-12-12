import { makePromisedComponent, acceptHot } from "epic-global"
import { EmptyRoute } from "epic-entry-ui/routes/EmptyRoute"
import { getUIActions, getRepoActions } from "epic-typedux/provider"



const CoreRouteConfigs = {
	
	Empty: {
		name: 'Empty',
		uri: "empty",
		title: 'empty',
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(EmptyRoute)
			}))
	},
	
	
	IDE: {
		name: 'IDE',
		uri: "pages/ide",
		title: 'IDE',
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(require('./ide').IDERoot)
			}))
	},
	
	
	FindAction: {
		name: 'FindAction',
		uri: 'sheet/find-action',
		title: 'Find an Epic action',
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			
			require.ensure([],function(require:any) {
				resolver.resolve(require('./find-action').FindActionTool)
			}))
		
	},
	
	
	Settings: {
		name: 'Settings',
		uri: 'dialog/settings',
		showDevTools: false,
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(require('./settings').SettingsWindow)
			}))
		
		
	}
	
	
}
Object.values(CoreRouteConfigs).forEach(RouteRegistryScope.Register)



CommandRegistryScope.Register({
	id: 'Quit',
	type: CommandType.App,
	name: "Quit",
	defaultAccelerator: "CommandOrControl+q",
	execute: (item, event) => require('electron').remote.app.quit()
},{
	id: 'CloseWindow',
	type: CommandType.App,
	name: "Close Window",
	defaultAccelerator: "CommandOrControl+w",
	execute: (item, event) => getUIActions().closeWindow()
},{
	id: 'SyncEverything',
	type: CommandType.App,
	name: "Github > Sync Everything",
	defaultAccelerator: "CommandOrControl+s",
	execute: (item, event) => getRepoActions().syncAll()
}, {
	id: 'Settings',
	type: CommandType.App,
	name: "Settings",
	defaultAccelerator: "CommandOrControl+Comma",
	execute: (item, event) => getUIActions().openWindow(getRoutes().Settings.uri),
})

acceptHot(module)