import { makePromisedComponent, acceptHot } from "epic-global"
import { EmptyRoute } from "epic-entry-ui/routes/EmptyRoute"
import { getUIActions, getRepoActions } from "epic-typedux/provider"
import { getWindowManagerClient } from "epic-process-manager-client"
import { windowsSelector } from "epic-typedux/selectors"



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
		
		
	},
	
	
	CaptureAccelerator: {
		name: 'CaptureAccelerator',
		uri: 'sheet/capture-accelerator',
		title: 'Set Accelerator',
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(require('./settings/CaptureAcceleratorSheet').CaptureAcceleratorSheet)
			}))
		
		
	}
	
	
}
Object.values(CoreRouteConfigs).forEach(RouteRegistryScope.Register)



CommandRegistryScope.Register(
// QUIT
{
	id: 'Quit',
	type: CommandType.App,
	name: "Quit",
	defaultAccelerator: "CommandOrControl+q",
	execute: (item, event) => getUIActions().quit()
},

// CLOSE WINDOW
{
	id: 'CloseWindow',
	type: CommandType.App,
	name: "Close Window",
	defaultAccelerator: "CommandOrControl+w",
	execute: (item, event) => getUIActions().closeWindow()
},

// SYNC EVERYTHING
{
	id: 'SyncEverything',
	type: CommandType.App,
	name: "Github > Sync Everything",
	defaultAccelerator: "CommandOrControl+s",
	execute: (item, event) => getRepoActions().syncAll()
},

// SETTINGS
{
	id: 'Settings',
	type: CommandType.App,
	name: "Settings",
	defaultAccelerator: "CommandOrControl+Comma",
	execute: (item, event) => getUIActions().openWindow(getRoutes().Settings.uri),
},

// FIND ACTION
{
	id: 'FindAction',
	type: CommandType.App,
	name: "Find Action",
	defaultAccelerator: "CommandOrControl+Shift+p",
	execute: (item, event) => getUIActions().openSheet(getRoutes().FindAction.uri),
	hidden: true
})

acceptHot(module)