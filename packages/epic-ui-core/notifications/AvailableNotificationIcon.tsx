// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender } from 'epic-ui-components'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import {
	notificationsSelector, unreadNotificationCountSelector,
	participatingUnreadNotificationCountSelector
} from "epic-typedux/selectors"
import { GithubNotification } from "epic-models"
import { Icon } from "epic-ui-components/common/icon/Icon"
import { makeHeightConstraint, makeWidthConstraint, colorAlpha, isHovering } from "epic-styles/styles"
import { getUIActions } from "epic-typedux/provider"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, warn,success,background, alternateText } = palette,
		badgeHeight = convertRem(1.4),
		transition = Styles.makeTransition([ 'color', 'background-color' ])
	
	return [
		Styles.PositionRelative,
		Styles.FlexColumnCenter,
		makeHeightConstraint(theme.navBarHeight),
		makeWidthConstraint(theme.navBarHeight),
		Styles.CursorPointer,
		Styles.FlexAuto,
		transition, {
			overflow: 'visible',
			
			icon: [ transition, {
				color: text.primary,
				
				hovering: {
					color: alternateText.primary
				}
			} ],
			
			
			badge: [
				transition,
				Styles.FlexRowCenter,
				Styles.PositionAbsolute,
				Styles.makePaddingRem(0.2, 0.5),
				makeHeightConstraint(badgeHeight), {
					transform: 'translate(0,-120%)',
					fontSize: rem(1),
					// right: rem(0.3),
					left: '55%',
					top: '50%',
					borderRadius: rem(0.7),
					fontWeight: 500,
					
					
				} ],
			
			unreadCount: [ {
				color: text.primary,
				backgroundColor: colorAlpha(accent.hue1, 0.8),
				
				
				hovering: [ {
					color: alternateText.primary
				} ]
			} ],
			
			participatingUnreadCount: [ {
				color: text.primary,
				backgroundColor: colorAlpha(success.hue1, 0.8),
				//left: rem(0.3),
				
				hovering: [ {
					color: alternateText.primary
				} ]
			} ],
			
			[Styles.CSSHoverState]: [ {
				color: text.primary,
				backgroundColor: accent.hue1,
			} ]
		} ]
}


/**
 * IAvailableNotificationIconProps
 */
export interface IAvailableNotificationIconProps extends IThemedAttributes {
	notifications?:List<GithubNotification>
	unreadCount?:number
	participatingUnreadCount?:number
}

/**
 * IAvailableNotificationIconState
 */
export interface IAvailableNotificationIconState {
	
}

/**
 * AvailableNotificationIcon
 *
 * @class AvailableNotificationIcon
 * @constructor
 **/

@connect(createStructuredSelector({
	notifications: notificationsSelector,
	unreadCount: unreadNotificationCountSelector,
	participatingUnreadCount: participatingUnreadNotificationCountSelector
}))
@ThemedStyles(baseStyles)
@PureRender
export class AvailableNotificationIcon extends React.Component<IAvailableNotificationIconProps,IAvailableNotificationIconState> {
	
	private onClick = () => getUIActions().toggleNotificationsOpen()
	
	render() {
		const
			{ styles, unreadCount, participatingUnreadCount, notifications } = this.props,
			total = notifications.size,
			hovering = isHovering(this, 'root')
		
		return <div ref="root" style={styles} onClick={this.onClick}>
			<Icon
				iconSet='octicon'
				iconName='bell'
				style={makeStyle(styles.icon,hovering && styles.icon.hovering)}/>
			
			<div
				style={[
					styles.badge,
					participatingUnreadCount ? styles.participatingUnreadCount : styles.unreadCount,
					hovering && (participatingUnreadCount ? styles.participatingUnreadCount.hovering : styles.unreadCount.hovering)
				]}
			>
				{ participatingUnreadCount && <span>{participatingUnreadCount}&nbsp;/&nbsp;</span> }
				{unreadCount}
			</div>
			
		</div>
	}
	
}