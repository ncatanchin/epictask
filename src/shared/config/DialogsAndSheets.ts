
import {ClassType} from 'react'

/**
 * Dialog Names
 */
export const Dialogs = {
	IssueEditDialog: 'IssueEditDialog',
	IssuePatchDialog: 'IssuePatchDialog',
	RepoAddTool: 'RepoAddTool',
	IssueCommentDialog: 'IssueCommentDialog'
}


export interface IUISheet {
	name:string
	title:string
	rootElement:() => ClassType<any,any,any>
}

export const Sheets = {
	RepoImportSheet: {
		name: 'RepoImportSheet',
		title: 'Import Repository',
		rootElement: () =>
			require('ui/plugins/repos/RepoAddTool').RepoAddTool
	}
}


