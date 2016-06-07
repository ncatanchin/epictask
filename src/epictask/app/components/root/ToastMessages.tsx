/**
 * Created by jglanz on 6/7/16.
 */

//region Imports
import * as React from 'react'
import * as CSSTransitionGroup from 'react-addons-css-transition-group'
import * as Radium from 'radium'
import {Snackbar,FlatButton} from 'material-ui'
import {connect} from 'react-redux'
import {AppKey} from 'shared/Constants'
import {IToastMessage,ToastMessageType,AppActionFactory} from 'app/actions'
import {Icon,Button} from 'app/components'
import {Themeable} from 'app/ThemeManager'
//endregion

//region Logger
const log = getLogger(__filename)
//endregion

//region Constants
const appActions = new AppActionFactory()
//endregion


//region Styles
const baseStyles = {
	root: makeStyle(makeTransition(),PositionAbsolute,{
		backgroundColor: 'transparent',
		right: 0,
		bottom: 0,
		margin: '2rem'
	}),
	toast: makeStyle(makeTransition(),PositionAbsolute,Ellipsis,{
		backgroundColor: 'transparent',
		margin: '0.5rem',
		// bottom: 0,
		// left: '50%',
		// transform: 'translateX(-50%)',
		overflow: 'hidden'
	}),
	icon: makeStyle({
		paddingRight: '1rem'
	}),
	text: makeStyle(FlexScale,Ellipsis),
	action: makeStyle(FlexRowCenter,FlexAuto,{
		marginLeft: '1rem',
		textTransform: 'uppercase',
		padding: '0 1rem'
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
	const {theme,messages} = state.get(AppKey)

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
	}


	makeStyles(theme,palette) {
		const
			toastBodyStyle = makeStyle(Ellipsis,{
				backgroundColor: palette.accent3Color,
				overflow: 'hidden',
				position: 'relative',
				display: 'block'
			}),
			toastStyle = makeStyle(baseStyles.toast,toastBodyStyle,{
				fontFamily: theme.fontFamily
			}),
			toastContentStyle = makeStyle(toastBodyStyle, FlexRow,FlexScale,makeFlexAlign('center','flex-start'), {
				color: palette.accent3ColorText,
				maxWidth: '100%'
			}),
			action = makeStyle(baseStyles.action,{
				height: theme.snackbar.root.height,
				backgroundColor: palette.accent4Color,
				color: palette.accent4ColorText,
				':hover': {
					backgroundColor: palette.highlightColor,
					color: palette.highlightText
				}
			})

		return Object.assign({},baseStyles,{
			toastBodyStyle,
			toastStyle,
			toastContentStyle,
			action
		})
	}

	/**
	 * Render an individual message
	 *
	 * @param msg
	 * @param isError
	 * @param isInfo
	 * @param palette
	 * @param styles
	 * @returns {any}
	 */
	renderMessageContent(msg,isError,isInfo,palette,styles) {

		function iconStyle(color) {
			return makeStyle(styles.icon,{color})
		}

		// Create an action callout if required
		const action = !isError ? null :
			<Button
	            style={styles.action}
	            onClick={() => appActions.removeMessage(msg.id)}>
				Acknowledge
			</Button>

		// Construct the message
		return <div style={styles.toastContentStyle}>
			{(isError) ? <Icon style={iconStyle(palette.highlightColor)}>error_outline</Icon> :
				(isInfo) ? <Icon style={iconStyle(palette.highlightColor)}>info_outline</Icon> :
					null}

			<span style={styles.text}>{msg.content}</span>
			{action}
		</div>
	}

	/**
	 * Render the snackbar container
	 * and child messages
	 *
	 * @returns {any}
	 */
	render() {
		const {messages,theme} = this.props,
			{palette} = theme

		const styles = this.makeStyles(theme,palette)

		return <div style={styles.root}>
			<CSSTransitionGroup
				transitionName="messages"
				transitionAppear={true}
				transitionAppearTimeout={250}
				transitionEnterTimeout={250}
				transitionLeaveTimeout={150}>
				{messages.map(msg => {

					const
						isError = msg.type === ToastMessageType.Error,
						isInfo = msg.type === ToastMessageType.Info

					return <Snackbar
						key={msg.id}
						open={true}
						className="messages"
						message={this.renderMessageContent(msg,isError,isInfo,palette,styles)}
						bodyStyle={styles.toastBodyStyle}
						style={styles.toastStyle}
						autoHideDuration={isError ? 0 : 5000}
						onRequestClose={(reason) => reason !== 'clickaway' && appActions.removeMessage(msg.id)}
					/>
				})}
			</CSSTransitionGroup>
		</div>
	}

}