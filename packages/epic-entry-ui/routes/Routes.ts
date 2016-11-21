import { TRouteMap } from "./Router"
import { makePromisedComponent, toJSON } from "epic-global"
import { Issue,Comment } from "epic-models"
import {List} from 'immutable'


const
	log = getLogger(__filename)

export const Pages = {
	
	Login: {
		name: 'login',
		path: "pages/login",
		defaultRoute: true,
		anonymous: true,
		title: 'Login',
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(require('epic-ui-components/pages/login').LoginRoot)
			}))
	},
	
	Welcome: {
		name: 'welcome',
		path: "pages/welcome",
		defaultRoute: true,
		title: 'Welcome',
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(require('epic-ui-components/pages/welcome').WelcomeRoot)
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
	
	
	
	RepoImport: {
		name: 'RepoImport',
		path: "sheet/repo-import",
		title: 'Import Repository',
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(require('epic-plugins-default/repos/RepoAddTool').RepoAddTool)
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


	RepoSettings: {
		name: 'RepoSettings',
		path: 'dialog/repo-settings',
		showDevTools: true,
		provider: makePromisedComponent((resolver:TComponentResolver) =>
				
			require.ensure([],function(require:any) {
				resolver.resolve(require('epic-plugins-default/repos/RepoSettingsWindow').RepoSettingsWindow)
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


export const Routes:TRouteMap = Object.values(Pages)
	.reduce((routes,root) => {
		routes[root.path] = root
		return routes
	},{})

if (module.hot) {
	module.hot.accept((err) => {
		log.info(`HMR update`,err)
	})
}

EventHub.emit(EventHub.RoutesLoaded)
// REGISTER ALL CONFIGS
// Object
// 	.values(DialogConfigs)
// 	.forEach(config => registerWindowConfig(config.name, config))