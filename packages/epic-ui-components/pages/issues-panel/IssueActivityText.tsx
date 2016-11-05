/**
 * Created by jglanz on 6/16/16.
 */
// Imports


import { User, Issue, Comment } from "epic-models"
import { Avatar, Icon, Button } from "epic-ui-components"
import { Markdown } from "epic-ui-components/markdown/Markdown"
import { ThemedStyles } from "epic-styles"
import filterProps from "react-valid-props"
import { canEditComment, canEditIssue, shallowEquals } from "epic-global"

import { EventGroup, isEventGroup } from "./IssueEventGroup"
import { selectedIssueSelector } from "epic-typedux"
import { createStructuredSelector } from "reselect"
import { connect } from "react-redux"
import { getIssueActions } from "epic-typedux/provider"
import { IRowState } from "epic-ui-components/common/VisibleList"
import { TDetailItem } from "epic-ui-components/pages/issues-panel/IssueDetailPanel"
import { getValue } from "typeguard"
import { isIssue } from "epic-models/Issue"

// Constants
const log = getLogger(__filename)

const baseStyles = (topStyles,theme,palette) => ({
	root: {},

	activityContent: [FlexColumn,FlexScale,OverflowHidden,{
		borderWidth: '0.1rem',
		borderStyle: 'solid',
		borderRadius: '0 0.2rem 0.2rem 0.2rem',

		eventGroup: [
			FlexRow,
			PositionRelative,
			makeFlexAlign('center','flex-start'),
			makePaddingRem(1,1,1,5), {
			
			boxSizing: 'border-box',
			
			verticalDots: [PositionAbsolute,{
				width: rem(1.2),
				height: '100%',
				borderRightWidth: rem(0.1),
				borderRightStyle: 'dashed'
			}],
				
			horizontalDots: [PositionAbsolute,{
				height: rem(0.2),
				bottom: 0,
				left: rem(6.2),
				right: 0,
				borderBottomWidth: rem(0.1),
				borderBottomStyle: 'dashed'
			}],
			
			fontSize: themeFontSize(1.1),
			
			icon: [FlexAuto,FlexColumnCenter,makePaddingRem(0,0,0,0),makeMarginRem(0,1,0,0),{
				fontSize: rem(1.3),
				borderRadius: '50%',
				width: rem(2.4),
				height: rem(2.4),
				zIndex: 2
			}],
			
			avatar: [makePaddingRem(0,1,0,0.5),{
				
				height: rem(2.6),
				width: rem(2.6),
				
				label: [makePaddingRem(0,1,0,0),{
					fontSize: themeFontSize(1.1),
					fontWeight: 500
				}]
			}],
			
			timestamp: [FlexAuto,makePaddingRem(0,0,0,1),{
				fontStyle: 'italic',
				fontWeight: 300
			}],
			
			description: [FlexRow, makeFlexAlign('center','flex-start'),{
				flexShrink: 1,
				flexBasis: 'auto',
				flexGrow: 0,
				flexWrap: 'wrap',
				lineHeight: rem(3)
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
	
	issue?:Issue
	hideBottomBorder?:boolean
	
	activityActionText?:string
	activityStyle:any
	activityType:'post'|'comment'|'eventGroup'
	
	rowState?:IRowState<string,string,TDetailItem>
}

export interface IIssueActivityTextState {
	
}

/**
 * IssueComment
 *
 * @class IssueActivityText
 * @constructor
 **/

@connect(createStructuredSelector({
	issue: selectedIssueSelector
}))
@ThemedStyles(baseStyles,'issueActivityText')
// @PureRender
export class IssueActivityText extends React.Component<IIssueActivityTextProps,IIssueActivityTextState> {
	
	
	/**
	 * Create a the component state
	 *
	 * @param props
	 * @returns {{comment: null, user: null, text: null, createdAt: null, updatedAt: null}}
	 */
	getValues = (props:IIssueActivityTextProps = this.props) => {
		
		const
			rowState = props.rowState
		
		if (!rowState)
			return null

		const
			// Determine model
			
			{item ,style} = rowState

		// Map model props
		let
			user:User = null,
			text:string = null,
			createdAt:Date = null,
			updatedAt:Date = null
			
		
		if (item) {
			if (!isEventGroup(item)) {
				
				({ user, body: text, created_at: createdAt, updated_at: updatedAt } = item)
			} else {
				user = item.actor
			}
		}
		
		return {
			style,
			eventGroup: isEventGroup(item) && item,
			comment: !isEventGroup(item) && !isIssue(item) && item,
			user,
			text,
			createdAt: new Date(createdAt as any),
			updatedAt: new Date(updatedAt as any)
		}
	}
	
	shouldComponentUpdate(nextProps,nextState) {
		return !shallowEquals(nextProps,this.props,'issue')
	}
	
	makeOnIssueEditClick = (issue) => event =>
		getIssueActions().editIssue(issue)
	
	/**
	 * Create an onclick handler for a comment
	 *
	 * @param issue
	 * @param comment
	 */
	makeOnCommentEditClick = (issue,comment) => event =>
		getIssueActions().editComment(issue,comment)
	
	
	/**
	 * Create an onclick handler for a comment
	 *
	 * @param issue
	 * @param comment
	 */
	makeOnCommentDeleteClick = (issue,comment) => event =>
		getIssueActions().commentDelete(comment)
	
	
	
	/**
	 * When the component mounts, create the state
	 */
	//componentWillMount = () => this.setState(this.getNewState(this.props))


	/**
	 * Update the state when new props arrive
	 *
	 * @param newProps
	 */
	//componentWillReceiveProps = (newProps) =>this.setState(this.getNewState(newProps))

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
				hideBottomBorder
			} = this.props,
			values = this.getValues(this.props)
			
		if (!values)
			return React.DOM.noscript()
		
		
		const
			{
				style,
				user,
				text,
				comment,
				updatedAt,
				createdAt,
				eventGroup
			} = values,

			// Hovering header
			hovering = Radium.getState(this.state,'activity',':hover'),

			// Grab the activity type style
			rootStyle = _.merge({},styles.activityContent,activityStyle.all,activityStyle[activityType],styles[activityType]),

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
				<div {...filterProps(this.props)}
					key='activity'
					style={[
						activityStyle,
						styles.activityContent.eventGroup,
						activityStyle.eventGroup,
						{':hover': {}},
						style
					]}>
					
					{/* LEFT VERTICAL DOTS */}
					<div style={[styles.activityContent.eventGroup.verticalDots]}/>
					
					{/* BOTTOM HORIZONTAL DOTS */}
					{hideBottomBorder !== true &&
						<div style={[styles.activityContent.eventGroup.horizontalDots]}/>}
					
					<Icon iconSet='octicon'
					      iconName={groupType}
					      style={
					      	styles.activityContent.eventGroup.icon
				        }/>
					
					<Avatar user={eventGroup.actor}
					        labelStyle={styles.activityContent.eventGroup.avatar.label}
					        labelPlacement='after'
					        avatarStyle={makeStyle(styles.avatar,activityStyle.avatar,styles.activityContent.eventGroup.avatar)} />
					
					<div style={[styles.activityContent.eventGroup.description]}>
						{eventGroup.getDescription(activityStyle,styles.activityContent.eventGroup)}
					</div>
					<div style={[styles.activityContent.eventGroup.timestamp]}>
						{eventGroup.timeFromNow}
					</div>
				</div> :
				
				// COMMENT
				<div {...filterProps(this.props)}
					key='activity'
					style={[activityStyle,{':hover': {}}]}>
				
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