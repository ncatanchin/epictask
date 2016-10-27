import { makePromisedComponent, TComponentResolver, toJSON } from "epic-global"
import { TRouteMap } from "epic-entry-ui/routes/Router"
import { Issue,Comment } from "epic-models"


export const Roots = {
	
	Login: {
		name: 'login',
		path: "pages/login",
		defaultRoute: true,
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
			resolver.resolve(require('epic-ui-components/pages/settings').default)
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
				resolver.resolve(require('epic-ui-components/pages/issue-edit').default)
			}))
		
		
	},
	IssuePatchDialog: {
		name: 'IssuePatchDialog',
		path: 'dialog/issue-patch',
		makeURI(issues:Issue[]) {
			const
				issueIds = toJSON(
					issues.map(issue => Issue.makeIssueId(issue))
				)
			
			return `dialog/issue-patch?issueIds=${encodeURIComponent(issueIds)}`
		},
		showDevTools: false,
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(require('epic-ui-components/pages/issue-patch').default)
			}))
		
		
	},
	IssueCommentDialog: {
		name: 'IssueCommentDialog',
		showDevTools: false,
		path: 'dialog/issue-comment/:issueId/:commentId',
		makeURI(issue:Issue,comment:Comment = null) {
			return `dialog/issue-comment/${Issue.makeIssueId(issue)}/${
				!comment ? -1 : Comment.makeCommentId(comment)}`
		},
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(require('epic-ui-components/pages/issue-comment').default)
			}))
			
		
		
	}
}


export const Routes:TRouteMap = Object.values(Roots)
	.reduce((routes,root) => {
		routes[root.path] = root
		return routes
	},{})

// REGISTER ALL CONFIGS
// Object
// 	.values(DialogConfigs)
// 	.forEach(config => registerWindowConfig(config.name, config))