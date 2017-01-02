// Imports
import { connect } from "react-redux"
import { createStructuredSelector, createSelector } from "reselect"
import {
	IThemedAttributes,
	ThemedStyles,
	Themed,
	colorDarken,
	makeHeightConstraint,
	makeWidthConstraint,
	colorAlpha
} from "epic-styles"
import { GithubNotification, Issue } from "epic-models"
import { IRowState, RepoLabel, TimeAgo, PureRender, Icon, IconButton } from "epic-ui-components"
import { shallowEquals, getMillis } from "epic-global"
import { getUIActions, selectedNotificationIdSelector } from "epic-typedux"
import { getIssueActions } from "epic-typedux/provider"

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

let
	itemCount = 0

const
	EntityIcons = {
		Issue: 'issue-opened',
		PullRequest: 'git-pull-request',
		Release: 'tag',
		Commit: 'git-commit',
		Unknown: 'circle-slash'
	}

function baseStyles(topStyles, theme, palette) {
	
	const
		{ success,secondary,warn,alternateText,text, primary, accent, background } = palette
	
	return [ Styles.FlexRowCenter, Styles.CursorPointer,Styles.FlexAuto, Styles.FillWidth, Styles.makePaddingRem(0.5,1),Styles.makeTransition(['box-shadow']),{
		backgroundColor: background,
		borderBottom: `1px solid ${colorDarken(theme.inactiveColor,5)}`,
		boxShadow: 'none',
		
		selected: [{
			backgroundColor: secondary.hue1,
			boxShadow: 'none'
		}],
		
		[Styles.CSSHoverState]: [{
			//boxShadow: `inset 0 0rem 0.3rem 0.5rem ${colorAlpha(warn.hue1, 0.7)}`,
		}],
		
		// IF PARTICIPATING IN THREAD - not 'subscribed'
		participatingUnread: [{
			//backgroundColor: success.hue1,
			//boxShadow: Styles.makeLinearGradient(),
			boxShadow: `inset 0 0rem 0.1rem 0.2rem ${colorAlpha(success.hue1, 0.7)}`,
			//borderBottom: `1px inset ${colorDarken(success.hue1,15)}`,
		}],
		
		subjectIcon: [Styles.makePaddingRem(0.5,1,0.5,0),{
			
		}],
		
		
		
		markReadSpacer: [makeWidthConstraint(rem(4))],
		markRead:[
			Styles.makeMarginRem(0,0,0,1),
			Styles.makeTransition(['color','background-color','font-size']),
			makeHeightConstraint(rem(3)),
			makeWidthConstraint(rem(3)),{
				color: primary.hue3,
				backgroundColor: Styles.Transparent,
				borderRadius: '50%',
				fontSize: rem(1.5),
				
				[Styles.CSSHoverState]: [{
					fontSize: rem(2),
					color: background,
					backgroundColor: primary.hue3
				}],
				
				[Styles.CSSActiveState]: [{
					fontSize: rem(2),
					color: background,
					backgroundColor: warn.hue1
				}]
			}],
		
		repo: [Styles.makePaddingRem(0,0,0),{
			
		}],
		
		timestamp: [Styles.makePaddingRem(0.5,0.5),{
			fontSize: rem(1)
		}]
	} ]
}


/**
 * INotificationListItemProps
 */
export interface INotificationListItemProps extends IThemedAttributes {
	rowState?:IRowState<string,string,GithubNotification>
	
	isSelected?:boolean
	isSelectedMulti?:boolean
}

/**
 * INotificationListItemState
 */
export interface INotificationListItemState {
	
}


// If you have a specific theme key you want to
// merge provide it as the second param
@connect(() => createStructuredSelector({
	isSelected: createSelector(
		selectedNotificationIdSelector,
		(state,props:INotificationListItemProps) => props.rowState.item as GithubNotification,
		(id,notification) => notification && notification.id === id
	)
}))
@ThemedStyles(baseStyles)
@PureRender
export class NotificationListItem extends React.Component<INotificationListItemProps,INotificationListItemState> {
	
	constructor(props,context) {
		super(props,context)
		this.state = {}
		
		log.debug(`Created instance: ${itemCount++}`)
	}
	
	shouldComponentUpdate(nextProps, nextState) {
		return !shallowEquals(
				nextProps,
				this.props,
				'rowState',
				'style',
				'styles',
				'theme',
				'palette'
			) || !shallowEquals(nextState, this.state)
	}
	
	private openItem = async (n:GithubNotification) => {
		const
			electron = require('electron'),
			{remote} = electron,
			{shell} = remote || electron,
			{ url } = n.subject,
			parts = url.split('/'),
			itemNumber = parseInt(parts[ parts.length - 1 ], 10),
			repoId = n.repository.id
		
		if (n.subject.type === 'Issue') {
			
			
			
			let
				issue = new Issue({
					'number': itemNumber,
					title: n.subject.title,
					repoId,
					repo: n.repository
				})
			
			getIssueActions().openIssueViewer(issue)
		} else if (n.subject.type === 'PullRequest') {
			shell.openExternal(`https://github.com/${n.repository.full_name}/pull/${itemNumber}`)
		}
	}
	
	private showOptions = () => {
		
	}
	
	render() {
		const
			{ styles,rowState,isSelected } = this.props,
			notification = rowState.item,
			{unread} = notification,
			participating = notification.reason !== 'subscribed',
			{subject} = notification,
			entityType = subject.type
		
		return <div
			onContextMenu={this.showOptions}
			onDoubleClick={() => this.openItem(notification)}
			onClick={() => getUIActions().setSelectedNotificationId(notification.id)}
			style={[styles,participating && unread && styles.participatingUnread,isSelected && styles.selected,rowState.style]}>
			<UnreadDot notification={notification} />
			<Icon
				style={styles.subjectIcon}
				iconSet="octicon"
				iconName={EntityIcons[subject.type] || EntityIcons.Unknown} />
			
			<div
				style={[
					Styles.FlexScale,
					Styles.FlexColumn,
					Styles.Ellipsis
				]}>
				<RepoLabel
					showTooltip={true}
					style={makeStyle(styles.repo,Styles.Ellipsis)}
					repo={notification.repository} />
				
				<div style={Styles.Ellipsis}>
					{notification.subject.title}
					</div>
			</div>
			
			<TimeAgo
				style={styles.timestamp}
				timestamp={getMillis(notification.updated_at)} />
			
			{notification.unread ?
				<IconButton
					tooltip="Mark Read"
					tooltipPos="left"
					onClick={() => getUIActions().markNotificationRead(notification)}
					style={styles.markRead}>
					check
				</IconButton> :
				<div style={styles.markReadSpacer}/>
			}
		</div>
	}
	
}


/**
 * Unread dot component
 */
const UnreadDot = Themed(({theme,palette,style,notification}) =>
	<div style={[
		style,
		makeHeightConstraint(rem(1)),
		makeWidthConstraint(rem(1)),
		Styles.makeMarginRem(0,0.5,0,0),
		Styles.FlexRowCenter,
		{
			color: notification.unread ? palette.success.hue1 : Styles.Transparent
		}
	]}>
		<Icon  style={{fontSize: Styles.rem(0.5)}}  iconSet="fa" iconName="circle" />
	</div>
)

