

import { Dialogs, WindowType, IWindowConfig } from "shared/config/WindowConfig"
import { makePromisedComponent, TComponentResolver } from "shared/util/UIUtil"


export const Sheets = {
	RepoImportSheet: {
		name: 'RepoImportSheet',
		title: 'Import Repository',
		rootElement: makePromisedComponent((resolver:TComponentResolver) =>
			resolver.resolve(require('ui/plugins/repos/RepoAddTool').RepoAddTool))
			// require.ensure(['ui/plugins/repos/RepoAddTool'],function(require:any) {
			// 	resolver.resolve(require('ui/plugins/repos/RepoAddTool').RepoAddTool)
			// }))
			
	},
	FindActionSheet: {
		name: 'FindActionSheet',
		title: 'Find an Epic action',
		rootElement: makePromisedComponent((resolver:TComponentResolver) =>
			resolver.resolve(require('ui/components/actions/FindActionTool').FindActionTool))
			// require.ensure(['ui/components/actions/FindActionTool'],function(require:any) {
			// 	resolver.resolve(require('ui/components/actions/FindActionTool').FindActionTool)
			// }))
		
	}
}


/**
 * Default Window Configs
 */
export const DialogConfigs = {
	SettingsWindow: {
		name: 'SettingsWindow',
		type: WindowType.Dialog,
		showDevTools: false,
		rootElement: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure(['ui/entries/SettingsWindow'],function(require:any) {
				resolver.resolve(require('ui/entries/SettingsWindow').default)
			}))
		
		
	},
	
	IssueEditDialog: {
		name: 'IssueEditDialog',
		type: WindowType.Dialog,
		showDevTools: false,
		rootElement: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure(['ui/components/issues/IssueEditDialog'],function(require:any) {
				resolver.resolve(require('ui/components/issues/IssueEditDialog').default)
			}))

			
	},
	IssuePatchDialog: {
		name: 'IssuePatchDialog',
		type: WindowType.Dialog,
		showDevTools: false,
		rootElement: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure(['ui/components/issues/IssuePatchDialog'],function(require:any) {
				resolver.resolve(require('ui/components/issues/IssuePatchDialog').default)
			}))
		
			
	},
	IssueCommentDialog: {
		name: 'IssueCommentDialog',
		type: WindowType.Dialog,
		showDevTools: false,
		rootElement: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure(['ui/components/issues/IssueCommentDialog'],function(require:any) {
				resolver.resolve(require('ui/components/issues/IssueCommentDialog').default)
			}))
	}
} as {[configName:string]:IWindowConfig}
