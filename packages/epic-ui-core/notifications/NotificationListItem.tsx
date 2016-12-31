// Imports
import { IThemedAttributes, ThemedStyles, Themed } from 'epic-styles'
import { GithubNotification } from "epic-models"
import { IRowState, RepoLabel, TimeAgo } from "epic-ui-components/common"
import { Icon } from "epic-ui-components/common/icon/Icon"
import { shallowEquals, getMillis } from "epic-global"
import { colorDarken, makeHeightConstraint, makeWidthConstraint, colorAlpha } from "epic-styles/styles"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)

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
		{ success,alternateText,text, primary, accent, background } = palette
	
	return [ Styles.FlexRowCenter, Styles.FlexAuto, Styles.FillWidth, Styles.makePaddingRem(0.5,1),{
		backgroundColor: background,
		borderBottom: `1px solid ${colorDarken(theme.inactiveColor,5)}`,
		
		
		// IF PARTICIPATING IN THREAD - not 'subscribed'
		participating: [{
			//backgroundColor: success.hue1,
			//boxShadow: Styles.makeLinearGradient(),
			boxShadow: `inset 0 0rem 0.1rem 0.2rem ${colorAlpha(success.hue1, 0.7)}`,
			//borderBottom: `1px inset ${colorDarken(success.hue1,15)}`,
		}],
		
		subjectIcon: [Styles.makePaddingRem(0.5,1,0.5,0),{
			
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
@ThemedStyles(baseStyles)

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
	
	render() {
		const
			{ styles,rowState } = this.props,
			notification = rowState.item,
			participating = notification.reason !== 'subscribed',
			{subject} = notification,
			entityType = subject.type
		
		return <div style={[styles,participating && styles.participating,rowState.style]}>
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
					style={makeStyle(styles.repo,Styles.Ellipsis)} repo={notification.repository} />
				
				<div style={Styles.Ellipsis}>
					{notification.subject.title}
					</div>
			</div>
			
			<TimeAgo
				style={styles.timestamp}
				timestamp={getMillis(notification.updated_at)} />
			
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
		{ color: notification.unread ? palette.success.hue1 : Styles.Transparent }
	]}>
		<Icon style={{fontSize: Styles.rem(0.5)}} iconSet="fa" iconName="circle" />
	</div>
)