/**
 * Created by jglanz on 7/23/16.
 */
// Imports

import { Icon } from "./icon/Icon"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { Issue } from "epic-models"

import { shallowEquals } from "epic-global/ObjectUtil"
import {List} from 'immutable'
import { getIssueActions } from "epic-typedux/provider"
import { colorAlpha } from "epic-styles/styles"
// Constants
const
	log = getLogger(__filename)

// DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

function baseStyles(topStyles,theme,palette) {
	
	const
		{text,alternateText,primary,secondary,accent,warn,success} = palette
	
	return {
		open: {
			//backgroundColor: 'rgba(101,181,73,1)',
			color: colorAlpha(text.disabled,0.1)
		},
		closed: {
			//color: text.primary,
			color: success.hue1
			//backgroundColor: warn.hue1
		},
		
		root: [PositionRelative, {
			
			toggle: [ {
				cursor: 'pointer',
				':hover': {}
			} ],
			
			':hover': {}
		} ],
		
		
		
		icon: [{
			
			fontSize: rem(1.6),
			padding: rem(0.3),
			borderRadius: rem(0.3),
			':hover': {}
		}],
		
		toggle: [
			makeTransition(['opacity','max-width','left','top','bottom','margin-left','padding-left','width']),
			PositionAbsolute, FlexRowCenter,  {
				
				
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
					color: alternateText.secondary
				}],
				
				close: {
					backgroundColor: warn.hue1
				},
				
				open: {
					backgroundColor: success.hue1,
					
				},
				
				[CSSHoverState]: [],
				
				borderRadius: rem(0.2),
				zIndex: 5,
				
				hovering: [{
					overflow: 'visible',
					opacity: 1,
					width: 'auto',
					//maxWidth: 'auto',
					top: rem(-0.3),
					left: rem(-0.3),
					bottom: rem(-0.3)
				}],
				
				label: [FillHeight,FlexRowCenter,makePaddingRem(0,0.6,0,1),{
					whiteSpace: 'nowrap',
					color: text.primary
				}]
			}
		]
	}
}


/**
 * IIssueStateIconProps
 */
export interface IIssueStateIconProps extends IThemedAttributes {
	issue:Issue
	showToggle?:boolean
}

/**
 * IIssueStateIconState
 */
export interface IIssueStateIconState {

}




/**
 * IssueStateIcon
 *
 * @class IssueStateIcon
 * @constructor
 **/


// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'issueStateIcon')
export class IssueStateIcon extends React.Component<IIssueStateIconProps,IIssueStateIconState> {
	
	/**
	 * Component must have state to get radium state
	 *
	 * @param props
	 * @param context
	 */
	constructor(props,context) {
		super(props,context)
		
		this.state = {
			
		}
	}
	
	shouldComponentUpdate(nextProps,nextState) {
		return !shallowEquals(nextProps,this.props,
				'style',
				'styles',
				'theme',
				'palette',
				'issue.id',
				'issue.state'
			) || !shallowEquals(nextState,this.state)
	}
	
	private toggleState = () => {
		const
			{showToggle, issue} = this.props
		
		if (!showToggle)
			return
		
		getIssueActions()
			.setIssueStatus(
				List<Issue>([issue]),
				issue.state === 'open' ?
					'closed' :
					'open'
			)
	}
	
	render() {
		const
			{issue,theme, styles,showToggle} = this.props,
			{state} = issue,
			{palette} = theme,
			[iconName,iconStyle] = (state === 'open') ?
				['issue-opened',styles.open] :
				['issue-closed',styles.closed],
			
			hovering = Radium.getState(this.state,'issueState',':hover')
		
		
		log.debug(`Hovering: ${hovering}`)
		return <div ref="issueState" onClick={showToggle && this.toggleState} style={[styles.root,showToggle && styles.root.toggle]}>
			{/*<Icon style={[styles.icon,iconStyle]}*/}
		             {/*iconSet='octicon'*/}
		             {/*iconName={iconName}/>*/}
			
			<Icon style={[FillHeight,styles.icon,iconStyle]}
			      iconSet='fa'
			      iconName={'check-circle-o'}/>
		             
			{/* IF TOGGLE ENABLED */}
			{showToggle && <div style={[
				styles.toggle,
				state === 'open' ? styles.toggle.close : styles.toggle.open,
				hovering && styles.toggle.hovering
			]}>
				{/*<Icon style={[FillHeight,styles.icon,iconStyle]}*/}
				      {/*iconSet='octicon'*/}
				      {/*iconName={iconName}/>*/}
				<Icon
					style={[
						FillHeight,
						styles.icon,
						iconStyle,
						styles.toggle.icon
					]}
		      iconSet='fa'
		      iconName={'check-circle-o'}/>
				<div style={[styles.toggle.label]}>{state === 'open' ? "I'm Done": 'Reopen'}</div>
			</div>}
		</div>
	}

}