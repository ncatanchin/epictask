/**
 * Created by jglanz on 6/16/16.
 */

// Imports
import * as moment from 'moment'
import * as React from 'react'
import {connect} from 'react-redux'
import {User,Issue,Comment} from 'shared/models'
import {createStructuredSelector} from 'reselect'
import {Avatar, Markdown, PureRender, Icon} from 'components/common'
import {selectedIssueSelector, commentsSelector} from 'shared/actions/issue/IssueSelectors'
import {Themed} from 'shared/themes/ThemeManager'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import filterProps from 'react-valid-props'
import {canEditComment} from "shared/Permission"
import {IssueActionFactory} from "shared/actions/issue/IssueActionFactory"
import {Container} from "typescript-ioc"

// Constants
const log = getLogger(__filename)
const baseStyles = {
	root: {},

	activityContent: makeStyle(FlexColumn,FlexScale,OverflowHidden,{
		borderWidth: '0.1rem',
		borderStyle: 'solid',
		borderRadius: '0 0.2rem 0.2rem 0.2rem',

		details: makeStyle(FlexRow,makeFlexAlign('center','flex-start'),FlexAuto,PositionRelative,{
			padding: '0.3rem 1rem',
			height: 40,
			fontSize: themeFontSize(1.1),
			username: {
				fontWeight: 700
			},
			time: {
				fontSize: themeFontSize(1.1),
				padding: '0rem 0 0 0.5rem'
			}
		}),


		body: makeStyle(FlexColumn,FlexAuto,{
			padding: '1rem',

		}),

		commentor: makeStyle({
			padding: '0rem'
		})
	})
}



/**
 * IIssueCommentProps
 */
export interface IIssueActivityTextProps extends React.DOMAttributes {
	theme?:any
	commentIndex?:number
	comments?:Comment[]
	activityActionText?:string
	issue?:Issue
	activityStyle:any
	activityType:'post'|'comment'
}

export interface IIssueActivityTextState {
	comment?:Comment
	user?:User
	text?:string
	updatedAt?:Date
	createdAt?:Date
	styles?:any
}


/**
 * Map theme into props - very shorthand
 * @param state
 */
const makeStateToProps = () => createStructuredSelector({
	issue: selectedIssueSelector,
	comments: commentsSelector
},createDeepEqualSelector)


/**
 * IssueComment
 *
 * @class IssueActivityText
 * @constructor
 **/

@connect(makeStateToProps)
@Themed
@PureRender
export class IssueActivityText extends React.Component<IIssueActivityTextProps,IIssueActivityTextState> {

	/**
	 * Create a the component state
	 *
	 * @param props
	 * @returns {{comment: null, user: null, text: null, createdAt: null, updatedAt: null}}
	 */
	getNewState = (props:IIssueActivityTextProps):IIssueActivityTextState => {
		const {issue,comments,theme,commentIndex,activityStyle,activityType} = props

		// Get comment if available
		const comment = (comments && _.isNumber(commentIndex) && commentIndex > -1) ?
			comments[commentIndex] : null

		// Determine model
		const model:Comment|Issue = comment || issue

		// Map model props
		let user = null,text = null,createdAt = null, updatedAt = null
		if (model) {
			({user,body:text,created_at:createdAt,updated_at:updatedAt} = model)
		}

		// Merge styles
		const styles = mergeStyles(
			baseStyles,
			{[activityType]: baseStyles.activityContent},
			activityStyle,
			theme.issueActivityText
		)

		return {
			comment,
			user,
			text,
			createdAt,
			updatedAt,
			styles
		}
	}
	
	makeOnCommentClick = (issue,comment) => event =>
		Container.get(IssueActionFactory).editComment(issue,comment)

	/**
	 * When the component mounts, create the state
	 */
	componentWillMount = () => this.setState(this.getNewState(this.props))


	/**
	 * Update the state when new props arrive
	 *
	 * @param newProps
	 */
	componentWillReceiveProps = (newProps) =>this.setState(this.getNewState(newProps))

	/**
	 * Render the issue activity component
	 *
	 * @returns {any}
	 */
	render() {
		const
			{
				theme,
				activityStyle,
				issue,
				activityType,
				activityActionText
			} = this.props,
			{
				user,
				text,
				comment,
				updatedAt,
				createdAt,
				styles
			} = this.state,



			// Grab the activity type style
			activityTypeStyle = makeStyle(styles[activityType]),

			// Time styles
			timeStyle = makeStyle(styles.time,activityTypeStyle.details.time),

			// User/Avatar style
			userStyle = makeStyle(
				activityStyle.user,
				activityStyle[activityType].user,
				activityTypeStyle.user
			)


		return (!issue) ? null : <div {...filterProps(this.props)} style={activityStyle}>
			
			{/* COMMENTOR AVATAR*/}
			
			<Avatar user={user}
			        style={userStyle}
			        labelPlacement='none'
			        avatarStyle={makeStyle(styles.avatar,activityStyle.avatar)} />

			<div style={activityTypeStyle}>
				<div style={activityTypeStyle.details}>
					<div style={activityTypeStyle.details.username}>{user && user.login}</div>
					<div style={timeStyle}>{activityActionText} {moment(createdAt).fromNow()}</div>
					{createdAt !== updatedAt &&
						<div style={timeStyle}>updated {moment(updatedAt).fromNow()}</div>}
					
						{comment && canEditComment(issue.repo,comment) &&
						<Icon onClick={this.makeOnCommentClick(issue,comment)} >edit</Icon>
					}
				</div>
				<Markdown className={`markdown issue-${issue.id}`}
				          style={activityTypeStyle.body} source={text || 'No Body'}/>

			</div>
		</div>
	}

}