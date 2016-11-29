/**
 * Created by jglanz on 7/23/16.
 */
// Imports

import { Icon } from "./icon/Icon"
import { ThemedStyles, IThemedAttributes, colorAlpha, CSSHoverState } from "epic-styles"

import { List } from 'immutable'
import { getIssueActions } from "epic-typedux/provider"

import { Issue } from "epic-models"
import { shallowEquals, cloneObjectShallow } from "epic-global"
import { rem, FillHeight, FlexRowCenter, makePaddingRem } from "epic-styles/styles"
import { PureRender } from "epic-ui-components/common"


// Constants
const
	log = getLogger(__filename)

// DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, alternateText, primary, secondary, accent, warn, success } = palette
	
	
	
	return [{
		
		icon: [ {
			
			fontSize: rem(1.6),
			padding: rem(0.3),
			borderRadius: rem(0.3),
			[CSSHoverState]: [{
				
			}],
			
			open: [{
				color: colorAlpha(text.primary,0.4),
			}],
			
			closed: [{
				color: success.hue1
			}],
			
		} ],
		
		
		
		root: [ PositionRelative, {
			
			toggle: [ {
				cursor: 'pointer',
				':hover': {}
			} ],
			
			':hover': {}
		} ],
		
		
		
		
		toggle: [
			makeTransition([ 'opacity', 'max-width', 'left', 'top', 'bottom', 'margin-left', 'padding-left', 'width' ]),
			PositionAbsolute, FlexRowCenter, {
				
				
				overflow: 'hidden',
				flexWrap: 'nowrap',
				opacity: 0,
				//maxWidth: '100%',transform: ''
				width: 0,
				top: 0,
				left: 0,
				bottom: 0,
				
				
				//paddingLeft: '100%',
				padding: rem(0.3),
				
				icon: [ {
					color: alternateText.primary
				} ],
				
				close: {
					backgroundColor: warn.hue1
				},
				
				open: {
					backgroundColor: success.hue1,
					
				},
				
				[CSSHoverState]: [],
				
				borderRadius: rem(0.2),
				zIndex: 5,
				
				hovering: [ {
					overflow: 'visible',
					opacity: 1,
					width: 'auto',
					//maxWidth: 'auto',
					top: rem(-0.3),
					left: rem(-0.3),
					bottom: rem(-0.3)
				} ],
				
				label: [ FillHeight, FlexRowCenter, makePaddingRem(0, 0.6, 0, 1), {
					whiteSpace: 'nowrap',
					color: text.primary
				} ]
			}
		]
	}]
}


/**
 * IIssueStateIconProps
 */
export interface IIssueStateIconProps extends IThemedAttributes {
	issue:Issue
	showToggle?:boolean
	iconSet?:TIconSet
	iconName?:string
}

/**
 * IssueStateIcon
 *
 * @class IssueStateIcon
 * @constructor
 **/

@ThemedStyles(baseStyles, 'issueStateIcon')
@PureRender
export class IssueStateIcon extends React.Component<IIssueStateIconProps,any> {
	
	
	static defaultProps = {
		iconSet: 'fa'
	}

	
	// shouldComponentUpdate(nextProps, nextState) {
	// 	return !shallowEquals(nextProps, this.props,
	// 			'style',
	// 			'styles',
	// 			'theme',
	// 			'palette',
	// 			'issue.id',
	// 			'issue.state'
	// 		) || !shallowEquals(nextState, this.state)
	// }
	
	private toggleState = () => {
		const
			{ showToggle, issue } = this.props
		
		if (!showToggle)
			return
		
		getIssueActions()
			.setIssueStatus(
				List<Issue>([ issue ]),
				issue.state === 'open' ?
					'closed' :
					'open'
			)
	}
	
	
	
	
	/**
	 * Create Icon
	 *
	 * @param iconName
	 * @param iconSet
	 * @param styles
	 * @param isOpen
	 * @param isToggleIcon
	 * @returns {any}
	 */
	private stateIcon({ iconName, iconSet, styles }, isOpen:boolean, isToggleIcon:boolean = false) {
		const
			iconStyle = mergeStyles(
				isOpen ? styles.open : styles.closed,
				FillHeight,
				styles.icon,
				isToggleIcon && styles.toggle.icon
			)
		
		
		return <Icon style={iconStyle}
		             iconSet={iconSet}
		             iconName={iconName}/>
	}
	
	
	createIcon = (iconName,isOpen) => this.stateIcon(
		cloneObjectShallow(this.props as any,{
			iconName: iconName || (isOpen ? 'circle-o' : 'check-circle-o')}
		), isOpen)
	
	render() {
		const
			{ issue, styles, showToggle,iconName } = this.props,
			{ state } = issue,
			isOpen = state === 'open',
			hovering = Radium.getState(this.state, 'issueState', ':hover')
		
			
		
		return <div
			ref="issueState"
			onClick={showToggle && this.toggleState}
			style={[
				styles.root,showToggle && styles.root.toggle
			]}>
			
			{this.createIcon(iconName,isOpen)}
			
			{/* IF TOGGLE ENABLED */}
			{showToggle && <div style={[
				styles.toggle,
				state === 'open' ? styles.toggle.close : styles.toggle.open,
				hovering && styles.toggle.hovering
			]}>
				
				{this.createIcon(iconName,isOpen)}
				
				<div style={[styles.toggle.label]}>{state === 'open' ? "I'm Done" : 'Reopen'}</div>
			</div>}
		</div>
	}
	
}


