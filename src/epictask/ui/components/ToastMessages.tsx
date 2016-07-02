/**
 * Created by jglanz on 6/7/16.
 */

//region Imports
import * as React from 'react'
import * as CSSTransitionGroup from 'react-addons-css-transition-group'

import {List} from 'immutable'
import * as Radium from 'radium'
import {Snackbar, FlatButton} from 'material-ui'
import {connect} from 'react-redux'
import {AppKey} from 'shared/Constants'
import {IToastMessage, ToastMessageType} from 'shared/models/Toast'
import {AppActionFactory} from 'shared/actions'
import {Icon, Button} from 'ui/components'

const {Style} = Radium

//endregion

//region Logger
const log = getLogger(__filename)
//endregion

//region Constants
const appActions = new AppActionFactory()
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
	messages?:List<IToastMessage>
}
//endregion


// let lastMessages = null
// function processNotifications(newMessages) {
// 	if (newMessages === lastMessages)
// 		return
//
// 	lastMessages = newMessages
// 	newMessages
// 		.filter(msg => !messageNotifications[msg.id])
// 		.forEach(msg => {
//
// 			const buttons = msg.type === ToastMessageType.Error ?
// 				['Acknowledge'] : []
//
// 			window
// 			const notification = new Notification({
// 				body: msg.content,
// 				icon: filePathToUrl(require('assets/images/epictask-logo-rainbow-square.png')),
// 			})
// 				// notifier.notify('epictask', {
// 				//
// 				// 	buttons
// 				// })
//
// 			// Add Notification events
// 			notificationEvents.forEach(event => notification.on(event, clearMessage))
//
// 			messageNotifications[msg.id] = notification
//
// 		})
// }

//region Redux State -> Props Mapper
/**
 * Map redux state to props
 *
 * @param state
 */
function mapStateToProps(state) {
	const {messages} = state.get(AppKey)

	// processNotifications(messages)
	// if (lastMessages !== messages) {
	// 	processNotifications()
	// }

	return {
		theme: getTheme(),
		messages
	}
}
//endregion





/**
 * ToastMessages
 *
 * @class ToastMessages
 * @constructor
 **/


@connect(mapStateToProps)
@Radium
export class ToastMessages extends React.Component<IToastMessagesProps,any> {

	constructor(props,context) {
		super(props,context)
	}

	/**
	 * Render an individual message
	 *
	 * @param msg
	 * @returns {any}
	 * @param props
	 */
	renderMessageContent(msg) {
		msg = msg.toJS ? msg.toJS() : msg

		const
			isError = msg.type === ToastMessageType.Error,
			isInfo = msg.type === ToastMessageType.Info

		const
			{theme} = this.props,
			s = mergeStyles(styles, theme.toast)


		// Create an action callout if required
		const [bg,fg,actionColors] = (isError) ?
			[s.bgError, s.fgError, s.actionError] :
			[s.bgInfo, s.fgInfo, s.actionInfo]



		if (!msg.id) {
			log.error(`msg id is null`,msg)
			return null
		}

		return <div key={msg.id}
		            className='toastMessage animated bounce'
		            style={s.toast}>

			<div style={makeStyle(s.toastContent,bg)}>
				{(isError) ? <Icon style={makeStyle(s.icon,fg)}>error_outline</Icon> :
					(isInfo) ? <Icon style={makeStyle(s.icon,fg)}>info_outline</Icon> :
						null}

				<span style={makeStyle(s.text,fg)}>{msg.content}</span>
				{isError && <Button style={makeStyle(s.action,actionColors)}
				                    onClick={() => appActions.removeMessage(msg.id)}>
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
		const {messages, theme} = this.props,
			{palette} = theme

		const s = mergeStyles(styles, theme.toast)

		return <div style={s.root}>
			<Style scopeSelector=".toastMessageTransitionGroup"
			       rules={_.merge({},s.transitionGroup,s.toastMessagesTransition)}/>

			<div>
			<CSSTransitionGroup
				className='toastMessageTransitionGroup'
				transitionName="toastMessages"
				transitionAppear={true}
				transitionAppearTimeout={250}
				transitionEnterTimeout={250}
				transitionLeaveTimeout={150}>

				{this.props.messages.map(msg => this.renderMessageContent(msg))}

			</CSSTransitionGroup>
			</div>
		</div>
	}

}