
import { makePromisedComponent, toJSON } from "epic-global"
import { Issue,Comment } from "epic-models"
import {List} from 'immutable'
import EmptyRoute from './EmptyRoute'

const
	log = getLogger(__filename)

export const Pages = {
	
	Empty: {
		name: 'empty',
		path: "empty",
		defaultRoute: true,
		title: 'empty',
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(EmptyRoute)
			}))
	},
	
	
	IDE: {
		name: 'IDE',
		path: "pages/ide",
		defaultRoute: true,
		title: 'IDE',
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(require('epic-ui-components/pages/ide').IDERoot)
			}))
	},
	
	
	
	
	
	
	FindAction: {
		name: 'FindAction',
		path: 'sheet/find-action',
		title: 'Find an Epic action',
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			
		require.ensure([],function(require:any) {
			resolver.resolve(require('epic-ui-components/pages/find-action').FindActionTool)
		}))
		
	},

	
	Settings: {
		name: 'Settings',
		path: 'dialog/settings',
		showDevTools: false,
		provider: makePromisedComponent((resolver:TComponentResolver) =>
		require.ensure([],function(require:any) {
			resolver.resolve(require('epic-ui-components/pages/settings').SettingsWindow)
		}))
		
		
	},
	
	IssueEditDialog: {
		name: 'IssueEditDialog',
		path: 'dialog/issue-edit/:issueId',
		makeURI(issue:Issue = null) {
			return `dialog/issue-edit/${!issue ? -1 : Issue.makeIssueId(issue)}`
		},
		showDevTools: false,
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(require('epic-ui-components/pages/issue-edit').IssueEditDialog)
			}))
		
		
	},
	
	/**
	 * Issue patch dialog
	 */
	IssuePatchDialog: {
		name: 'IssuePatchDialog',
		path: 'dialog/issue-patch',
		makeURI(mode:TIssuePatchMode,issues:List<Issue>) {
			const
				issueKeys = toJSON(
					issues.map(issue => Issue.makeIssueId(issue)).toArray()
				)
			
			return `dialog/issue-patch?mode=${mode}&issueKeys=${encodeURIComponent(issueKeys)}`
		},
		showDevTools: false,
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(require('epic-ui-components/pages/issue-patch').IssuePatchDialog)
			}))
		
		
	},
	
	/**
	 * Comment edit dialog
	 */
	CommentEditDialog: {
		name: 'CommentEditDialog',
		showDevTools: false,
		path: 'dialog/comment-edit/:issueId/:commentId',
		makeURI(issue:Issue,comment:Comment = null) {
			return `dialog/comment-edit/${Issue.makeIssueId(issue)}/${
				!comment ? -1 : Comment.makeCommentId(comment)}`
		},
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(require('epic-ui-components/pages/comment-edit/CommentEditDialog').CommentEditDialog)
			}))
		
	}
}


if (module.hot) {
	module.hot.accept((err) => {
		log.info(`HMR update`,err)
	})
}


// REGISTER ALL CONFIGS
// Object
// 	.values(DialogConfigs)
// 	.forEach(config => registerWindowConfig(config.name, config))