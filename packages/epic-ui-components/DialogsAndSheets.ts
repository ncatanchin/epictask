

import { WindowType, IWindowConfig } from "epic-process-manager"
import { makePromisedComponent, TComponentResolver } from  "epic-common"


export const Sheets = {
	RepoImportSheet: {
		name: 'RepoImportSheet',
		title: 'Import Repository',
		rootElement: makePromisedComponent((resolver:TComponentResolver) =>
			//resolver.resolve(require('epic-plugins-default').RepoAddTool))
			resolver.resolve(node_require('./epic-plugins-default').RepoAddTool))
			// require.ensure(['ui/plugins/repos/RepoAddTool'],function(require:any) {
			// 	resolver.resolve(require('ui/plugins/repos/RepoAddTool').RepoAddTool)
			// }))
			
	},
	FindActionSheet: {
		name: 'FindActionSheet',
		title: 'Find an Epic action',
		rootElement: makePromisedComponent((resolver:TComponentResolver) =>
			resolver.resolve(require('./pages/FindActionTool').FindActionTool))
			// require.ensure(['ui/components/actions/FindActionTool'],function(require:any) {
			// 	resolver.resolve(require('ui/components/actions/FindActionTool').FindActionTool)
			// }))
		
	}
}


/**
 * Default Window Configs
 */
export const DialogConfigs = {
	RepoSettingsWindow: {
		name: 'RepoSettingsWindow',
		type: WindowType.Dialog,
		showDevTools: true,
		rootElement: makePromisedComponent((resolver:TComponentResolver) =>
			resolver.resolve(require('epic-plugins-default').RepoSettingsWindow))
		
	},
	
	SettingsWindow: {
		name: 'SettingsWindow',
		type: WindowType.Dialog,
		showDevTools: false,
		rootElement: makePromisedComponent((resolver:TComponentResolver) =>
			resolver.resolve(require('./windows/SettingsWindow').default))
		
		
	},
	
	IssueEditDialog: {
		name: 'IssueEditDialog',
		type: WindowType.Dialog,
		showDevTools: false,
		rootElement: makePromisedComponent((resolver:TComponentResolver) =>
			
				resolver.resolve(require('./pages/IssueEditDialog').default))
			

			
	},
	IssuePatchDialog: {
		name: 'IssuePatchDialog',
		type: WindowType.Dialog,
		showDevTools: false,
		rootElement: makePromisedComponent((resolver:TComponentResolver) =>
			
				resolver.resolve(require('./pages/IssuePatchDialog').default))
			
		
			
	},
	IssueCommentDialog: {
		name: 'IssueCommentDialog',
		type: WindowType.Dialog,
		showDevTools: false,
		rootElement: makePromisedComponent((resolver:TComponentResolver) =>
				resolver.resolve(require('./pages/IssueCommentDialog').default))
			
	}
} as {[configName:string]:IWindowConfig}
