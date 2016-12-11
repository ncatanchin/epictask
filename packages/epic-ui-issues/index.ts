

import { makePromisedComponent, toJSON } from "epic-global"
import {Issue,Comment} from 'epic-models'
import { List } from "immutable"

const
	log = getLogger(__filename)

const IssueRouteConfigs = {
	IssueEditDialog: {
		name: 'IssueEditDialog',
		uri: 'dialog/issue-edit/:issueId',
		makeURI(issue: Issue = null) {
			return `dialog/issue-edit/${!issue ? -1 : Issue.makeIssueId(issue)}`
		},
		showDevTools: false,
		provider: makePromisedComponent((resolver: TComponentResolver) =>
			require.ensure([], function (require: any) {
				resolver.resolve(require('epic-ui-issues/issue-edit').IssueEditDialog)
			}))
		
		
	},
	
	/**
	 * Issue patch dialog
	 */
	IssuePatchDialog: {
		name: 'IssuePatchDialog',
		uri: 'dialog/issue-patch',
		makeURI(mode: TIssuePatchMode, issues: List<Issue>) {
			const
				issueKeys = toJSON(
					issues.map(issue => Issue.makeIssueId(issue)).toArray()
				)
			
			return `dialog/issue-patch?mode=${mode}&issueKeys=${encodeURIComponent(issueKeys)}`
		},
		showDevTools: false,
		provider: makePromisedComponent((resolver: TComponentResolver) =>
			require.ensure([], function (require: any) {
				resolver.resolve(require('epic-ui-issues/issue-patch').IssuePatchDialog)
			}))
		
		
	},
	
	/**
	 * Comment edit dialog
	 */
	CommentEditDialog: {
		name: 'CommentEditDialog',
		showDevTools: false,
		uri: 'dialog/comment-edit/:issueId/:commentId',
		makeURI(issue: Issue, comment: Comment = null) {
			return `dialog/comment-edit/${Issue.makeIssueId(issue)}/${
				!comment ? -1 : Comment.makeCommentId(comment)}`
		},
		provider: makePromisedComponent((resolver: TComponentResolver) =>
			require.ensure([], function (require: any) {
				resolver.resolve(require('epic-ui-issues/comment-edit/CommentEditDialog').CommentEditDialog)
			}))
		
	}
}

Object.values(IssueRouteConfigs).forEach(RouteRegistryScope.Register)

/**
 * Register Views
 */
ViewRegistryScope.Register({
	name: "IssuesPanel",
	type: "IssuesPanel",
	defaultView: true,
	provider: makePromisedComponent(resolver => require.ensure([],function(require:any) {
		const
			modId = require.resolve('epic-ui-issues/issues-panel'),
			mod = __webpack_require__(modId)
		
		log.debug(`Loaded issues panel module`,mod.id,modId,mod)
		resolver.resolve(mod.IssuesPanel)
	}))
})