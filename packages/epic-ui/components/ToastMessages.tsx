
//region Imports
import * as React from 'react'
import * as CSSTransitionGroup from 'react-addons-css-transition-group'
import * as Radium from 'radium'

import {connect} from 'react-redux'
import {IToastMessage, ToastMessageType} from 'shared/models/Toast'

import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {Container} from 'typescript-ioc'
import {PureRender} from 'ui/components/common/PureRender'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {createStructuredSelector} from 'reselect'
import {uiStateSelector} from 'shared/actions/ui/UISelectors'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {ToastMessage} from "ui/components/ToastMessage"
import { PersistentValueEvent } from "shared/util/PersistentValue"
import { NativeNotificationsEnabled } from "shared/settings/Settings"


const dataUrl = require('dataurl')
const {Style} = Radium

const
	NotificationEvents = ['click','timeout']

	

//endregion

//region Logger
const log = getLogger(__filename)
//endregion

//region Constants
const uiActions = Container.get(UIActionFactory)
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
 * IToastMessagesProps
 */
export interface IToastMessagesProps {
	theme?:any
	styles?:any
	messages?:IToastMessage[]
}
//endregion


let lastMessages = null
const messageNotifications = {}



/**
 * Process current notifications
 *
 * @param newMessages
 */
//TODO: Move to node process and use either node-notify or somhting else or another browser window just for notifications
function processNotifications(newMessages:IToastMessage[]) {
	if (_.isEqual(newMessages, lastMessages))
		return

	Object.keys(messageNotifications)
		.forEach(msgId => {
			if (newMessages.find(msg => msg.id === msgId)) {
				log.debug('Message still exists, return')
				return
			}

			const notification = messageNotifications[msgId]
			notification.close()
			delete messageNotifications[msgId]

		})

	lastMessages = newMessages
	newMessages
		.filter(msg => !messageNotifications[msg.id] && msg.notify === true)
		.forEach(msg => {

			const clearMessage = () => uiActions.removeMessage(msg.id)

			// TODO: add 'tag' and 'sticky' for error
			const notification = new Notification('epictask',{
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
	messages: (state):IToastMessage[] => uiStateSelector(state)
		.messages
		.filter(it => it.floatVisible)
		.map(msg => _.toJS(msg))
		.toArray()
},createDeepEqualSelector))
@ThemedStyles(baseStyles,'toast')

@PureRender
export class ToastMessages extends React.Component<IToastMessagesProps,any> {

	private getNewState() {
		return {
			enabled: !NativeNotificationsEnabled.get()
		}
	}
	
	constructor(props,context) {
		super(props,context)
		
		this.state = this.getNewState()
	}

	private onNativeNotificationConfigChanged = () => {
		this.setState(this.getNewState())
	}
	
	componentWillReceiveProps(newProps) {
		if (this.state.enabled)
			processNotifications(newProps.messages)
	}
	
	
	
	
	componentWillMount() {
		NativeNotificationsEnabled.on(PersistentValueEvent.Changed,this.onNativeNotificationConfigChanged)
	}
	
	componentWillUnmount() {
		NativeNotificationsEnabled.removeListener(PersistentValueEvent.Changed,this.onNativeNotificationConfigChanged)
	}

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
			

		messages = _.toJS(messages)



		return !enabled ? React.DOM.noscript() : <div style={styles.root}>
			<Style scopeSelector=".toastMessageTransitionGroup"
			       rules={_.merge(
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