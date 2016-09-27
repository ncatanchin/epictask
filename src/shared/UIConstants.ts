

export interface IDialogConfig {
	name:string
	rootElement:() => any
}

export const DialogConfigs = {
	IssueEditDialog: {
		name: 'IssueEditDialog',
		rootElement: () =>
			require('ui/components/issues/IssueEditDialog').default
	},
	IssuePatchDialog: {
		name: 'IssuePatchDialog',
		rootElement: () =>
			require('ui/components/issues/IssuePatchDialog').default
	},
	RepoAddDialog: {
		name: 'RepoAddDialog',
		rootElement: () =>
			require('ui/plugins/repos/RepoAddDialog').default
	},
	IssueCommentDialog: {
		name: 'IssueCommentDialog',
		rootElement: () =>
			require('ui/components/issues/IssueCommentDialog').default
	}
}

// export const Dialogs = Object
// 	.values(DialogConfigs)
// 	.reduce((nameMap,next) => {
// 		nameMap[next.name] = name
//
// 		return nameMap
// 	},{}) as {[name:string]:string}
export const Dialogs = {
	IssueEditDialog: 'IssueEditDialog',
	IssuePatchDialog: 'IssuePatchDialog',
	RepoAddDialog: 'RepoAddDialog',
	IssueCommentDialog: 'IssueCommentDialog'
}

export const ContainerNames = {
	IssuesPanel: 'IssuesPanel',
	IssueDetailPanel: 'IssueDetailPanel',
	Header: 'Header'
}

