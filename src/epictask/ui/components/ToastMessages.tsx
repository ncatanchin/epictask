/**
 * Created by jglanz on 6/7/16.
 */

//region Imports
import * as React from 'react'
import * as CSSTransitionGroup from 'react-addons-css-transition-group'

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
	messages?:IToastMessage[]
}
//endregion


//region Redux State -> Props Mapper
/**
 * Map redux state to props
 *
 * @param state
 */
function mapStateToProps(state) {
	const {theme, messages} = state.get(AppKey)

	return {
		theme,
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

	constructor(props = {}) {
		super(props)

		this.state = {messageWrappers: []}
	}


	componentWillReceiveProps(nextProps:IToastMessagesProps, nextContext:any):void {
		const messageWrappers:any[] = Array.from(this.state.messageWrappers)
		const {messages:nextMessages} = nextProps

		const nextIds = nextMessages.map(msg => msg.id)
		const existingIds = messageWrappers.map(wrapper => wrapper.msg.id)
		const removedIds = messageWrappers
			.filter(wrapper => !nextIds.includes(wrapper.msg.id))
			.map(wrapper => wrapper.msg.id)

		_.remove(messageWrappers, (wrapper:any) => removedIds.includes(wrapper.msg.id))

		messageWrappers.push(...nextMessages
			.filter(msg => !existingIds.includes(msg.id))
			.map(msg => {
				return {
					           msg,
					component: this.renderMessageContent(msg, nextProps),
					timer:     (msg.type === ToastMessageType.Error) ? null :
						           setTimeout(() => {
							           appActions.removeMessage(msg.id)
						           }, 5000)
				}


			})
		)

		this.setState({
			messageWrappers
		})
	}

	/**
	 * Render an individual message
	 *
	 * @param msg
	 * @returns {any}
	 * @param props
	 */
	renderMessageContent(msg, props) {

		const
			isError = msg.type === ToastMessageType.Error,
			isInfo = msg.type === ToastMessageType.Info

		const
			{theme} = props,
			s = mergeStyles(styles, theme.toast)


		// Create an action callout if required
		const [bg,fg,actionColors] = (isError) ?
			[s.bgError, s.fgError, s.actionError] :
			[s.bgInfo, s.fgInfo, s.actionInfo]

		const action = !isError ? null :
			<Button style={[s.action,actionColors]}
			        onClick={() => appActions.removeMessage(msg.id)}>
				Acknowledge
			</Button>

		// Construct the message
		return <div key={msg.id}
		            className='toastMessage animated bounce'
		            style={s.toast}>

			<div style={[s.toastContent,bg]} className=''>
				{(isError) ? <Icon style={[s.icon,fg]}>error_outline</Icon> :
					(isInfo) ? <Icon style={[s.icon,fg]}>info_outline</Icon> :
						null}

				<span style={[s.text,fg]}>{msg.content}</span>
				{action}
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

			<CSSTransitionGroup
				className='toastMessageTransitionGroup'
				transitionName="toastMessages"
				transitionAppear={true}
				transitionAppearTimeout={250}
				transitionEnterTimeout={250}
				transitionLeaveTimeout={150}>

				{this.state.messageWrappers.map(wrapper => wrapper.component)}

			</CSSTransitionGroup>
		</div>
	}

}