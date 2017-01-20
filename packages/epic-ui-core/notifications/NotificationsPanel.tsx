// Imports
import { List } from "immutable"
import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import { PureRender, VisibleList, IRowTypeConfig, IconButton } from "epic-ui-components"
import { IThemedAttributes, ThemedStyles } from "epic-styles"
import {
	unreadNotificationCountSelector,
	notificationsSelector,
	participatingUnreadNotificationCountSelector,
	notificationsOpenSelector,
	notificationsModeSelector,
	getUIActions
} from "epic-typedux"
import { GithubNotification } from "epic-models"
import { NotificationListItem } from "./NotificationListItem"
import { CommandComponent, CommandContainerBuilder, ICommandContainerItems } from "epic-command-manager-ui"
import { CommonKeys } from "epic-command-manager"
import baseStyles from "./NotificationsPanel.styles"
import { ContextMenu } from "epic-global"
import { Button } from "epic-ui-components"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)




/**
 * INotificationsPanelProps
 */
export interface INotificationsPanelProps extends IThemedAttributes {
	open?:boolean
	notifications?:List<GithubNotification>
	unreadCount?:number
	participatingUnreadCount?:number
	mode?:'unread'|'all'
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
	mode: notificationsModeSelector,
	open: notificationsOpenSelector,
	notifications: notificationsSelector,
	unreadCount: unreadNotificationCountSelector,
	participatingUnreadCount: participatingUnreadNotificationCountSelector
}))
@ThemedStyles(baseStyles)
@CommandComponent()
@PureRender
export class NotificationsPanel extends React.Component<INotificationsPanelProps,INotificationsPanelState> {
	
	static defaultProps = {
		mode: 'unread'
	}
	
	/**
	 * Build commands
	 *
	 * @param builder
	 */
	commandItems = (builder:CommandContainerBuilder):ICommandContainerItems =>
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
	
	
	private showOptions = () => {
		const
			{mode} = this.props,
			unreadOnly = mode === 'unread'
		
		ContextMenu.create()
			.addCheckbox(`Unread notifications only`,unreadOnly,() => !unreadOnly && getUIActions().setNotificationsMode('unread'))
			.addCheckbox(`All notifications`,!unreadOnly,() => unreadOnly && getUIActions().setNotificationsMode('all'))
			.addSeparator()
			.addCommand(`Mark all read`,this.markAllRead)
			.popup()
	}
	
	private markAllRead = () => getUIActions().markAllNotificationsRead()
	
	render() {
		const
			{ styles,notifications, mode,open } = this.props
		
		return <div className="notificationList" style={styles}>
			<div style={styles.left}/>
			<div style={styles.header}>
				<div style={styles.header.mode}>{mode === 'unread' ? "Unread notifications only" : "All notifications"}</div>
				<IconButton
					style={styles.header.control}
					onClick={this.showOptions}>arrow_drop_down</IconButton>
				{/*<Button onClick={this.markAllRead}>All Read</Button>*/}
			</div>
			{notifications.size < 1 ?
				<div style={styles.empty}>
					0 notifications
				</div> :
				<NotificationsVisibleList
					items={notifications}
					itemCount={notifications.size}
					itemBuilder={this.buildItem}
					itemKeyFn={(listItems,item,index) => index}
					initialItemsPerPage={50}
					rowTypeProvider={this.getRowType}
					itemHeight={this.getItemHeight}
				/>
			}
		</div>
	}
	
}


/**
 * Notification List Component
 */
const NotificationsVisibleList = VisibleList.makeVisibleList<string,number,GithubNotification>()
