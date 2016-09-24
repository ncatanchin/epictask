/**
 * Created by jglanz on 6/16/16.
 */

// Imports
import * as moment from 'moment'
import * as React from 'react'
import {User,Issue,Comment} from 'shared/models'
import {Avatar, Markdown, PureRender, Icon, Button} from 'ui/components/common'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import filterProps from 'react-valid-props'
import {canEditComment,canEditIssue} from "shared/Permission"
import {IssueActionFactory} from "shared/actions/issue/IssueActionFactory"
import {Container} from "typescript-ioc"
import * as Radium from "radium"
import { EventGroup } from "ui/components/issues/IssueDetailPanel"

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root: {},

	activityContent: [FlexColumn,FlexScale,OverflowHidden,{
		borderWidth: '0.1rem',
		borderStyle: 'solid',
		borderRadius: '0 0.2rem 0.2rem 0.2rem',

		eventGroup: [{
			
			icon: [{
				
			}],
			
			avatar: [{
				
			}],
			
			timestamp: [{
				
			}],
			
			description: [{
				
			}]
		}],
		
		details: [makeTransition(['opacity','flex-basis','width','max-width']),FlexRow,makeFlexAlign('center','flex-start'),FlexAuto,PositionRelative,{
			padding: '0.3rem 1rem',
			height: 40,
			fontSize: themeFontSize(1.1),
			
			username: [FlexScale,{
				fontWeight: 700
			}],
			
			time: [FlexColumn,{
				fontSize: themeFontSize(1.1),
				padding: '0rem 0 0 0.5rem',
				
				createdAt: [],
				updatedAt: []
			}],
			
			
			control: [FlexRow,makeTransition(['opacity','flex','padding','flex-basis','width','max-width']),OverflowHidden,{
				maxWidth: 0,
				width: 0,
				opacity: 0,
				flex: '0 0 0',
				padding: 0,
				alignItems: 'flex-end',
				justifyContent: 'flex-end',
				textAlign: 'right',
				
				hover: [{
					flex: '0 0 auto',
					opacity: 1,
					maxWidth: rem(4),
					width: rem(4),
					padding: makePaddingRem(0.2,0,0.2,1)
				}],
				
				
				icon: [FlexAuto,makeTransition('color')]
			}]
		}],


		body: makeStyle(FlexColumn,FlexAuto,{
			padding: '1rem',

		}),

		commenter: [{
			padding: '0rem'
		}]
	}]
})



/**
 * IIssueCommentProps
 */
export interface IIssueActivityTextProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	comment?:Comment
	eventGroup?:EventGroup
	issue:Issue
	activityActionText?:string
	activityStyle:any
	activityType:'post'|'comment'|'eventGroup'
}

export interface IIssueActivityTextState {
	comment?:Comment
	user?:User
	text?:string
	updatedAt?:Date
	createdAt?:Date
}

/**
 * IssueComment
 *
 * @class IssueActivityText
 * @constructor
 **/

@ThemedStyles(baseStyles,'issueActivityText')
@PureRender
export class IssueActivityText extends React.Component<IIssueActivityTextProps,IIssueActivityTextState> {

	/**
	 * Create a the component state
	 *
	 * @param props
	 * @returns {{comment: null, user: null, text: null, createdAt: null, updatedAt: null}}
	 */
	getNewState = (props:IIssueActivityTextProps):IIssueActivityTextState => {
		const
			{issue,comment} = props,

		
			// Determine model
			model:Comment|Issue = comment || issue

		// Map model props
		let
			user = null,
			text = null,
			createdAt = null,
			updatedAt = null
		
		if (model) {
			({user,body:text,created_at:createdAt,updated_at:updatedAt} = model)
		}
		
		return {
			comment,
			user,
			text,
			createdAt,
			updatedAt
		}
	}
	
	
	makeOnIssueEditClick = (issue) => event =>
		Container.get(IssueActionFactory).editIssue(issue)
	
	/**
	 * Create an onclick handler for a comment
	 *
	 * @param issue
	 * @param comment
	 */
	makeOnCommentEditClick = (issue,comment) => event =>
		Container.get(IssueActionFactory).editComment(issue,comment)
	
	
	/**
	 * Create an onclick handler for a comment
	 *
	 * @param issue
	 * @param comment
	 */
	makeOnCommentDeleteClick = (issue,comment) => event =>
		Container.get(IssueActionFactory).commentDelete(comment)
	
	
	
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
				styles,
				activityStyle,
				issue,
				activityType,
				activityActionText,
				eventGroup
			} = this.props,
			{
				user,
				text,
				comment,
				updatedAt,
				createdAt
			} = this.state,

			// Hovering header
			hovering = Radium.getState(this.state,'activity',':hover'),

			// Grab the activity type style
			rootStyle = _.merge({},baseStyles.activityContent,activityStyle.all,activityStyle[activityType],styles[activityType]),

			// Time styles
			timeStyle = rootStyle.details.time,

			// User/Avatar style
			userStyle = [
				activityStyle.user,
				activityStyle[activityType] && activityStyle[activityType].user,
				rootStyle.user
			],
			
			controlStyle = makeStyle(
				rootStyle.details.control,
				hovering && rootStyle.details.control.hover
			),
			
			{groupType} = eventGroup || ({} as EventGroup)


		return (!issue || groupType === 'none') ? React.DOM.noscript() :
			eventGroup ?
				
				// EVENT GROUP
				<div {...filterProps(this.props)} style={[activityStyle,activityStyle.eventGroup,{':hover': {}}]}>
					
					<Icon iconSet='octicon' iconName={groupType} style={styles.activityContent.eventGroup.icon}/>
					
					<Avatar user={user}
					        style={userStyle}
					        labelPlacement='after'
					        avatarStyle={makeStyle(styles.avatar,activityStyle.avatar,styles.activityContent.eventGroup.avatar)} />
					
					{eventGroup.getDescription(activityStyle,styles.activityContent.eventGroup)}
					
					<div style={[styles.activityContent.eventGroup.timestamp]}>
						{eventGroup.timeFromNow}
					</div>
				</div> :
				
				// COMMENT
				<div {...filterProps(this.props)} style={[activityStyle,{':hover': {}}]}>
				
				{/* COMMENTER AVATAR*/}
				<Avatar user={user}
				        style={userStyle}
				        labelPlacement='none'
				        avatarStyle={makeStyle(styles.avatar,activityStyle.avatar)} />
	
				{/* HEADER FOR ACTIVITY */}
				<div style={rootStyle}>
					<div key="header" style={rootStyle.details}>
						
						{/* Username/Login */}
						<div style={rootStyle.details.username}>
							{user && user.login}
						</div>
						
						{/* Created At Timestamp*/}
						<div style={timeStyle}>
							<div style={timeStyle.createdAt}>
								{activityActionText} {moment(createdAt).fromNow()}
							</div>
							
							{/* If there has been a subsequent update */}
							{/*{createdAt !== updatedAt &&*/}
								{/*<div style={timeStyle.updatedAt}>*/}
									{/*updated {moment(updatedAt).fromNow()}*/}
								{/*</div>*/}
							{/*}*/}
						
						</div>
						
											
						{/* If i have permission to edit the com*/}
						{((!comment && canEditIssue(issue.repo,issue)) || (comment && canEditComment(issue.repo, comment))) &&
							<div style={controlStyle}>
								<Button onClick={
											comment ?
												this.makeOnCommentEditClick(issue,comment) :
											    this.makeOnIssueEditClick(issue)
										}
								        style={controlStyle.button}>
									<Icon style={controlStyle.icon}>edit</Icon>
								</Button>
							</div>
								
							
						}
						
						{comment && canEditComment(issue.repo,comment) &&
							<div style={controlStyle}>
								<Button onClick={this.makeOnCommentDeleteClick(issue,comment)} style={controlStyle.button}>
									<Icon style={controlStyle.icon}>delete</Icon>
								</Button>
							</div>
						}
					</div>
					
					
					{/* Markdown of body */}
					<Markdown className={`markdown issue-${issue.id}`}
					          style={rootStyle.body}
					          source={text || 'No Body'} />
	
				</div>
			</div>
	}

}