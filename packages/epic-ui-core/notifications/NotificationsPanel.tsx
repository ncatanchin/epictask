// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender } from 'epic-ui-components'
import { IThemedAttributes, ThemedStyles, Themed } from 'epic-styles'
import {
	unreadNotificationCountSelector, notificationsSelector,
	participatingUnreadNotificationCountSelector, notificationsOpenSelector
} from "epic-typedux/selectors"
import { GithubNotification } from "epic-models"
import { VisibleList, IRowTypeConfig } from "epic-ui-components/common"
import { getValue } from "typeguard"
import { NotificationListItem } from "epic-ui-core/notifications/NotificationListItem"
import { Icon } from "epic-ui-components/common/icon/Icon"
import { makeHeightConstraint, makeWidthConstraint } from "epic-styles/styles"
import { CommandComponent, CommandContainerBuilder } from "epic-command-manager-ui"
import { CommonKeys } from "epic-command-manager"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ Styles.FlexColumn, Styles.FlexScale, Styles.Fill,Styles.PositionRelative, {
		overflow: 'hidden',
		
		left: [Styles.PositionAbsolute,{
			zIndex: 2,
			top: 0,
			left: 0,
			height: '100%',
			width: rem(0.2),
			backgroundColor: primary.hue3
		}]
	} ]
}


/**
 * INotificationsPanelProps
 */
export interface INotificationsPanelProps extends IThemedAttributes {
	notificationsOpen?:boolean
	notifications?:List<GithubNotification>
	unreadCount?:number
	participatingUnreadCount?:number
}

/**
 * INotificationsPanelState
 */
export interface INotificationsPanelState {
	
}

/**
 * NotificationsPanel
 *
 * @class NotificationsPanel
 * @constructor
 **/

@connect(createStructuredSelector({
	notificationsOpen: notificationsOpenSelector,
	notifications: notificationsSelector,
	unreadCount: unreadNotificationCountSelector,
	participatingUnreadCount: participatingUnreadNotificationCountSelector
}))
@ThemedStyles(baseStyles)
@CommandComponent()
@PureRender
export class NotificationsPanel extends React.Component<INotificationsPanelProps,INotificationsPanelState> {
	
	/**
	 * Build commands
	 *
	 * @param builder
	 */
	commandItems = (builder:CommandContainerBuilder) =>
		builder
			//MOVEMENT
			.command(
				CommonKeys.MoveDown,
				(cmd,event) => this.moveDown(event),{
					hidden:true,
					overrideInput: true
				}
			)
			.command(
				CommonKeys.MoveDownSelect,
				(cmd,event) => this.moveDown(event),{
					hidden:true,
					overrideInput: true
				})
			.command(
				CommonKeys.MoveUp,
				(cmd,event) => this.moveUp(event),
				{
					hidden:true,
					overrideInput: true
				})
			.command(
				CommonKeys.MoveUpSelect,
				(cmd,event) => this.moveUp(event),
				{
					hidden:true,
					overrideInput: true
				})
			.make()
	
	/**
	 * Move selection up
	 */
	moveUp(event = null) {
		this.moveSelection(-1,event)
	}
	
	/**
	 * Move selection down
	 */
	moveDown(event = null) {
		this.moveSelection(1,event)
	}
	
	/**
	 * Create a move selector for key handlers
	 *
	 * @param increment
	 * @param event
	 */
	moveSelection(increment: number, event: React.KeyboardEvent<any> = null) {
		
	}
	
	private buildItem = (rowType:string):IRowTypeConfig<string,string,GithubNotification> => {
		const
			{styles} = this.props
		
		return {
			clazz: NotificationListItem,
			props: {
				
			}
		}
		
	}
	
	private getRowType = (itemIndexes:List<GithubNotification>,index,key) => {
		return 'notification'
	}
	
	/**
	 * Get the height of an item
	 *
	 * @param listItems
	 * @param listItem
	 * @param index
	 * @returns {number}
	 */
	private getItemHeight = (listItems, listItem, index) => {
		return convertRem(6)
	}
	
	render() {
		const { styles,notifications, notificationsOpen } = this.props
		
		return <div className="notificationList" style={styles}>
			<div style={styles.left}/>
			<NotificationsVisibleList
				items={notifications}
				itemCount={notifications.size}
				itemBuilder={this.buildItem}
				itemKeyFn={(listItems,item,index) => index}
				initialItemsPerPage={50}
				rowTypeProvider={this.getRowType}
				itemHeight={this.getItemHeight}
			
			/>
		</div>
	}
	
}


/**
 * Notification List Component
 */
const NotificationsVisibleList = VisibleList.makeVisibleList<string,number,GithubNotification>()
