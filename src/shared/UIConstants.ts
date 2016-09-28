/**
 * Window Type
 */
export enum WindowType {
	Normal,
	Dialog,
	Modal
}


/**
 * Window Configuration
 */
export interface IWindowConfig {
	
	/**
	 * Configuration name
	 */
	name:string
	
	/**
	 * In dev mode - show dev tools
	 */
	showDevTools?:boolean
	
	/**
	 * Store the windows state for future openings
	 */
	
	storeState?:boolean
	
	/**
	 * Only allow this config to exist 1 at a time
	 */
	singleWindow?:boolean
	
	/**
	 * Method that retrieves the root React Class
	 */
	rootElement:() => any
	
	/**
	 * Window type, this drivers parent/child enforcement
	 */
	type:WindowType
	
	/**
	 * Window options (Browser Window)
	 */
	opts?:Electron.BrowserWindowOptions
	
	
}


/**
 * Default Window Configs
 */
export const WindowConfigs = {
	IssueEditDialog: {
		name: 'IssueEditDialog',
		type: WindowType.Dialog,
		rootElement: () =>
			require('ui/components/issues/IssueEditDialog').default
	},
	IssuePatchDialog: {
		name: 'IssuePatchDialog',
		type: WindowType.Dialog,
		rootElement: () =>
			require('ui/components/issues/IssuePatchDialog').default
	},
	RepoAddDialog: {
		name: 'RepoAddDialog',
		type: WindowType.Dialog,
		rootElement: () =>
			require('ui/plugins/repos/RepoAddDialog').default
	},
	IssueCommentDialog: {
		name: 'IssueCommentDialog',
		type: WindowType.Dialog,
		rootElement: () =>
			require('ui/components/issues/IssueCommentDialog').default
	}
} as {[configName:string]:IWindowConfig}

/**
 * Dialog Names
 */
export const Dialogs = {
	IssueEditDialog: 'IssueEditDialog',
	IssuePatchDialog: 'IssuePatchDialog',
	RepoAddDialog: 'RepoAddDialog',
	IssueCommentDialog: 'IssueCommentDialog'
}


/**
 * Container Names
 */
export const ContainerNames = {
	IssuesPanel: 'IssuesPanel',
	IssueDetailPanel: 'IssueDetailPanel',
	Header: 'Header'
}

