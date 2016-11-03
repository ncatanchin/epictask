//region Imports
import CSSTransitionGroup from "react-addons-css-transition-group"

import { connect } from "react-redux"
import {
	INotificationMessage
} from "epic-global"
import { PureRender } from "./PureRender"
import { ThemedStyles } from "epic-styles"
import { createStructuredSelector } from "reselect"
import { ToastMessage } from "./ToastMessage"
import { getUIActions } from "epic-typedux/provider"
import { settingsSelector } from "epic-typedux/selectors/AppSelectors"
import { messagesSelector } from "epic-typedux/selectors/UISelectors"
import { getValue } from "epic-global/ObjectUtil"

import {List} from 'immutable'


const
	dataUrl = require('dataurl'),
	{Style} = Radium

const
	NotificationEvents = ['click','timeout']

	

//endregion

//region Logger
const log = getLogger(__filename)
//endregion


//region Styles
function baseStyles(topStyles,theme,palette) {
	return {
		root:            [makeTransition(), PositionAbsolute, {
			backgroundColor: 'transparent',
			right:           0,
			bottom:          0,
			left:            'auto',
			padding:         '2rem',
			zIndex: 99999
		}],
		transitionGroup: [makeTransition(), FlexColumn, FlexAlignEnd, {}],
		toastMessagesTransition: [{
			'.toastMessages-enter': {
				height: 0,
				opacity: .01
			},
			'.toastMessages-enter-active': {
				height: 48,
				opacity: 1
			},
			'.toastMessages-leave': {
				height: 48,
				opacity: 1
			},
			'.toastMessages-leave-active': {
				height: 0,
				opacity: .01
			}
		}],
		
		body:         [OverflowHidden, Ellipsis, PositionRelative, {
			backgroundColor: 'transparent',
			display:         'block'
		}],
		
		
		
		
	}
}
//endregion


//region Component Properties
/**
 * INotificationMessagesProps
 */
export interface INotificationMessagesProps {
	theme?:any
	styles?:any
	settings?:ISettings
	messages?:List<INotificationMessage>
}
//endregion


let lastMessages = null
const messageNotifications = {}

/**
 * Clear a notification
 *
 * @param msgId
 */
function clearNotification(msgId:string) {
	const
		notification = messageNotifications[msgId]
	
	notification.close()
	
	delete messageNotifications[msgId]
}


/**
 * Process current notifications
 *
 * @param newMessages
 */
//TODO: Move to node process and use either node-notify or somhting else or another browser window just for notifications
function processNotifications(newMessages:List<INotificationMessage>) {
	if (newMessages === lastMessages)
		return

	Object.keys(messageNotifications)
		.forEach(msgId => {
			if (newMessages.find(msg => msg.id === msgId)) {
				log.debug('Message still exists, return')
				return
			}

			clearNotification(msgId)

		})

	lastMessages = newMessages
	
	newMessages
		.filter(msg => !messageNotifications[msg.id] && msg.notify === true)
		.forEach(msg => {

			const
				clearMessage = () => getUIActions().removeMessage(msg.id),

				// TODO: add 'tag' and 'sticky' for error
				notification = new Notification('epictask',{
					title: 'epictask',
					body: msg.content,
					tag: msg.id
				})


			// Add Notification events
			NotificationEvents
				.forEach(event => {
					notification[`on${event}`] = clearMessage
				})

			messageNotifications[msg.id] = notification

		})


}




/**
 * ToastMessages
 *
 * @class ToastMessages
 * @constructor
 **/

@connect(createStructuredSelector({
	messages: messagesSelector,
	settings: settingsSelector
		
}))
@ThemedStyles(baseStyles,'toast')

@PureRender
export class ToastMessages extends React.Component<INotificationMessagesProps,any> {

	private getNewState() {
		return {
			enabled: !getSettings().nativeNotificationsEnabled
		}
	}
	
	constructor(props,context) {
		super(props,context)
		
		this.state = this.getNewState()
	}
	
	/**
	 * Process native notifications if enabled
	 *
	 * @param props
	 */
	private processNotifications = (props = this.props) => {
		if (getValue(() => props.settings.nativeNotificationsEnabled))
			processNotifications(props.messages)
	}
	
	/**
	 * On mount process notifications
	 */
	componentWillMount = this.processNotifications
	
	/**
	 *On new props process notifications
	 */
	componentWillReceiveProps  = this.processNotifications
	
	

	/**
	 * Render the snackbar container
	 * and child messages
	 *
	 * @returns {any}
	 */
	render() {
		log.info('new toast render')
		let
			{messages, styles,theme} = this.props,
			{enabled} = this.state
		



		return !enabled ? React.DOM.noscript() : <div style={styles.root}>
			<Style scopeSelector=".toastMessageTransitionGroup"
			       rules={makeStyle(
			       	styles.transitionGroup,
			       	styles.toastMessagesTransition)}
			/>

			<CSSTransitionGroup
				className='toastMessageTransitionGroup'
				transitionName="toastMessages"
				transitionAppear={true}
				transitionAppearTimeout={250}
				transitionEnterTimeout={250}
				transitionLeaveTimeout={150}>

				{messages
					.filter(msg => !_.isNil(msg.id))
					.map(msg => <ToastMessage key={'toaster' + msg.id} msg={msg} animate/>)}
			</CSSTransitionGroup>



		</div>
	}


}