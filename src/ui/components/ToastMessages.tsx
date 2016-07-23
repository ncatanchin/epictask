/**
 * Created by jglanz on 6/7/16.
 */

//region Imports
import * as React from 'react'
import * as CSSTransitionGroup from 'react-addons-css-transition-group'

import {List} from 'immutable'
import * as Radium from 'radium'

import {connect} from 'react-redux'
import {IToastMessage, ToastMessageType} from 'shared/models/Toast'
import {Icon, Button} from './common'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {Container} from 'typescript-ioc'
import {PureRender} from 'ui/components/common/PureRender'
import {Themed} from 'shared/themes/ThemeManager'
import {createStructuredSelector} from 'reselect'
import {uiStateSelector} from 'shared/actions/ui/UISelectors'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'

const dataUrl = require('dataurl')
const {Style} = Radium

const NotificationEvents = ['click','timeout']

//endregion

//region Logger
const log = getLogger(__filename)
//endregion

//region Constants
const uiActions = Container.get(UIActionFactory)
//endregion


//region Styles
const styles = {
	root:            makeStyle(makeTransition(), PositionAbsolute, {
		backgroundColor: 'transparent',
		right:           0,
		bottom:          0,
		left:            'auto',
		padding:         '2rem',
		zIndex: 99999
	}),
	transitionGroup: makeStyle(makeTransition(), FlexColumn, FlexAlignEnd, {}),
	toastMessagesTransition: {
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
	},
	body:         makeStyle(OverflowHidden, Ellipsis, PositionRelative, {
		backgroundColor: 'transparent',
		display:         'block'
	}),

	toast:        makeStyle(makeTransition(['opacity', 'height']), OverflowHidden, PositionRelative, FlexRow, FlexAlignEnd, {
		backgroundColor: 'transparent',
		margin:          '0.5rem',
		width:           '100%',
		maxWidth:        '100%',
		maxHeight:       '100%',
		animationDuration: '1s',
		animationIterationCount: '2'

	}),
	toastContent: makeStyle(FlexRowCenter, {
		borderRadius: '0.2rem',
		maxWidth:     '100%',
		maxHeight:    '100%',
		padding:      '0 0 0',

	}),
	icon:         makeStyle({
		display: 'block',
		padding: '0 1rem'
	}),
	text:         makeStyle(FlexScale, Ellipsis, {
		display: 'block',
		padding: '0 1rem 0 0'
	}),
	action:       makeStyle(FlexRowCenter, FlexAuto, {
		textTransform: 'uppercase',
		padding:       '0 1rem'
	})

}
//endregion


//region Component Properties
/**
 * IToastMessagesProps
 */
export interface IToastMessagesProps {
	theme?:any
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
	messages: (state):IToastMessage[] => uiStateSelector(state).messages.toArray().map(msg => _.toJS(msg))
},createDeepEqualSelector))
@Themed
@PureRender
export class ToastMessages extends React.Component<IToastMessagesProps,any> {

	constructor(props,context) {
		super(props,context)
	}

	componentWillReceiveProps(newProps) {
		processNotifications(newProps.messages)
	}

	/**
	 * Render an individual message
	 *
	 * @param msg
	 * @returns {any}
	 * @param props
	 */
	renderMessageContent(msg,theme,s) {

		const
			isError = msg.type === ToastMessageType.Error,
			isInfo = msg.type === ToastMessageType.Info




		// Create an action callout if required
		const [bg,fg,actionColors] = (isError) ?
			[s.bgError, s.fgError, s.actionError] :
			[s.bgInfo, s.fgInfo, s.actionInfo]

		const iconStyle = makeStyle(s.icon,fg)


		// if (!msg.id) {
		// 	log.error(`msg id is null`,msg)
		// 	return null
		// }

		const icon = (isError || isInfo) ?
			<Icon style={iconStyle}>{isError ? 'error_outline' : 'info_outline'}</Icon>
			: null

		log.info(`Toast message with id: ${msg.id}`)
		return <div key={msg.id}
		            className='toastMessage animated bounce'
		            style={s.toast}>

			<div style={makeStyle(s.toastContent,bg)}>
				{icon}

				<span style={makeStyle(s.text,fg)}>{msg.content}</span>
				{isError && <Button style={makeStyle(s.action,actionColors)}
				                    onClick={() => uiActions.removeMessage(msg.id)}>
					Acknowledge
				</Button>}
			</div>
		</div>
	}

	/**
	 * Render the snackbar container
	 * and child messages
	 *
	 * @returns {any}
	 */
	render() {
		log.info('new toast render')
		let {messages, theme} = this.props,
			{palette} = theme

		messages = _.toJS(messages)
		const s = mergeStyles(styles, theme.toast)


		return <div style={s.root}>
			<Style scopeSelector=".toastMessageTransitionGroup"
			       rules={mergeStyles({},s.transitionGroup,s.toastMessagesTransition)}/>

			<CSSTransitionGroup
				className='toastMessageTransitionGroup'
				transitionName="toastMessages"
				transitionAppear={true}
				transitionAppearTimeout={250}
				transitionEnterTimeout={250}
				transitionLeaveTimeout={150}>

				{messages.filter(msg => !_.isNil(msg.id))
					.map(msg => this.renderMessageContent(msg,theme,s))}
			</CSSTransitionGroup>



		</div>
	}


}