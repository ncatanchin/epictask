import { makePromisedComponent } from "epic-global"
import { EmptyRoute } from "epic-entry-ui/routes/EmptyRoute"



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