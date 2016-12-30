// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender } from 'epic-ui-components'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import {
	unreadNotificationCountSelector, notificationsSelector,
	participatingUnreadNotificationCountSelector, notificationsOpenSelector
} from "epic-typedux/selectors"
import { GithubNotification } from "epic-models"
import { VisibleList, IRowTypeConfig } from "epic-ui-components/common"
import { getValue } from "typeguard"
import { NotificationListItem } from "epic-ui-core/notifications/NotificationListItem"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ Styles.FlexColumn, Styles.FlexScale, Styles.Fill, {
		overflow: 'auto'
	} ]
}


/**
 * INotificationCenterProps
 */
export interface INotificationCenterProps extends IThemedAttributes {
	notificationsOpen?:boolean
	notifications?:List<GithubNotification>
	unreadCount?:number
	participatingUnreadCount?:number
}

/**
 * INotificationCenterState
 */
export interface INotificationCenterState {
	
}

/**
 * NotificationCenter
 *
 * @class NotificationCenter
 * @constructor
 **/

@connect(createStructuredSelector({
	notificationsOpen: notificationsOpenSelector,
	notifications: notificationsSelector,
	unreadCount: unreadNotificationCountSelector,
	participatingUnreadCount: participatingUnreadNotificationCountSelector
}))
@ThemedStyles(baseStyles)
@PureRender
export class NotificationCenter extends React.Component<INotificationCenterProps,INotificationCenterState> {
	
	buildItem = (rowType:string):IRowTypeConfig<string,string,GithubNotification> => {
		const
			{
				styles
			} = this.props
		
		return {
			clazz: NotificationListItem,
			props: {
				
			}
		}
		
	}
	
	getRowType = (itemIndexes:List<GithubNotification>,index,key) => {
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
	getItemHeight = (listItems, listItem, index) => {
		return convertRem(4)
	}
	
	render() {
		const { styles,notifications, notificationsOpen } = this.props
		
		return <div className="notificationList" style={styles}>
			{notificationsOpen && <NotificationsVisibleList
				items={notifications}
				itemCount={notifications.size}
				itemBuilder={this.buildItem}
				itemKeyFn={(listItems,item,index) => index}
				initialItemsPerPage={50}
				rowTypeProvider={this.getRowType}
				itemHeight={this.getItemHeight}
			
			/>}
		</div>
	}
	
}


class NotificationsVisibleList extends VisibleList<string,number,GithubNotification> {
}
