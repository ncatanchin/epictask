// Imports
import * as React from 'react'
import * as Radium from 'radium'
import {PureRender, Icon, Button} from 'ui/components/common'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {IToastMessage, ToastMessageType} from "shared/models/Toast"
import {UIActionFactory} from "shared/actions/ui/UIActionFactory"

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root:        [makeTransition(['opacity', 'height']), OverflowHidden, PositionRelative, FlexRow, FlexAlignEnd,makeMarginRem(0.5), {
		
		width:           '100%',
		maxWidth:        '100%',
		maxHeight:       '100%',
		minHeight: rem(2),
		animationDuration: '1s',
		animationIterationCount: '2',
		
		
		
	}],
	
	content: [FlexRowCenter,makePaddingRem(0), {
		height: rem(4.8),
		borderRadius: '0.2rem',
		maxWidth:     '100%',
		maxHeight:    '100%',
		
		
	}],
	
	icon:         [FlexRowCenter, makePaddingRem(1,1),{
		height: '100%'
	}],
	
	text:         [FlexScale, Ellipsis, makePaddingRem(1,1), {
		display: 'block',
	}],
	action:       [FlexRowCenter, FlexAuto, makePaddingRem(0,1),{
		height: rem(4.8),
		textTransform: 'uppercase'
	}]
})


/**
 * IToastMessageProps
 */
export interface IToastMessageProps extends React.HTMLAttributes<any> {
	theme?: any
	styles?: any
	msg: IToastMessage
	animate?: boolean
}


/**
 * ToastMessage
 *
 * @class ToastMessage
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'toast')

@PureRender
export class ToastMessage extends React.Component<IToastMessageProps,void> {
	
	render() {
		const
			{styles,animate,msg} = this.props,
			isError = msg.type === ToastMessageType.Error,
			isSuccess = msg.type === ToastMessageType.Success,
			isInfo = msg.type === ToastMessageType.Info
		
		
		
		
		// Create an action callout if required
		const [bg,fg,actionColors] = (isError) ?
			[styles.bgError, styles.fgError, styles.action.error] :
			(isSuccess) ?
				[styles.bgSuccess, styles.fgSuccess, styles.action.success] :
				[styles.bgInfo, styles.fgInfo, styles.action.info]
		
		const iconStyle = makeStyle(styles.icon,fg,bg)
		
		
		// if (!msg.id) {
		// 	log.error(`msg id is null`,msg)
		// 	return null
		// }
		
		const icon = (isError || isInfo || isSuccess) ?
			<div style={iconStyle}>
				<Icon>{isError ? 'error_outline' : (isSuccess) ? 'check' : 'info_outline'}</Icon>
			</div>
			: null
		
		log.info(`Toast message with id: ${msg.id}`)
		return <div key={msg.id}
		            className={'toastMessage ' + (animate ? 'animated bounce' : '')}
		            onClick={() => Container.get(UIActionFactory).removeMessage(msg.id)}
		            style={styles.root}>
			
			<div style={makeStyle(styles.content)}>
				{icon}
				
				<span style={makeStyle(styles.text,fg)}>{msg.content}</span>
				{isError && <Button style={[styles.action,actionColors]}
				                    onClick={() => Container.get(UIActionFactory).removeMessage(msg.id)}>
					Acknowledge
				</Button>}
			</div>
		</div>
	}
	
}