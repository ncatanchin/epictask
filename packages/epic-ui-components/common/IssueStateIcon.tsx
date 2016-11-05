/**
 * Created by jglanz on 7/23/16.
 */
// Imports

import { PureRender } from "./PureRender"
import { Icon } from "./icon/Icon"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { Issue } from "epic-models"
import { getIssueActions } from "epic-typedux"
import { shallowEquals } from "epic-global/ObjectUtil"

// Constants
const
	log = getLogger(__filename)

// DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

function baseStyles(topStyles,theme,palette) {
	
	const
		{text,primary,secondary,accent,warn,success} = palette
	
	return {
		root: [PositionRelative, {
			
			toggle: [ {
				cursor: 'pointer'
			} ],
			
			':hover': {}
		} ],
		
		icon: [{
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
				//maxWidth: '100%',
				width: 0,
				top: 0,
				left: 0,
				bottom: 0,
				
				
				//paddingLeft: '100%',
				padding: rem(0.3),
				
				
				close: {
					backgroundColor: warn.hue1
				},
				
				open: {
					backgroundColor: success.hue1
				},
				
				
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
		
		this.state = {}
	}
	
	shouldComponentUpdate(nextProps) {
		return !shallowEquals(nextProps,this.props,'issue.state')
	}
	
	private toggleState = () => {
		const
			{showToggle, issue} = this.props
		
		if (!showToggle)
			return
		
		getIssueActions()
			.setIssueStatus(
				issue.state === 'open' ?
					'closed' :
					'open',
				issue.id
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
			<Icon style={[styles.icon,iconStyle]}
		             iconSet='octicon'
		             iconName={iconName}/>
			
			{/* IF TOGGLE ENABLED */}
			{showToggle && <div style={[
				styles.toggle,
				state === 'open' ? styles.toggle.close : styles.toggle.open,
				hovering && styles.toggle.hovering
			]}>
				<Icon style={[FillHeight,styles.icon,iconStyle]}
				      iconSet='octicon'
				      iconName={iconName}/>
				<div style={[styles.toggle.label]}>{state === 'open' ? 'Close ' : 'Reopen '} Issue</div>
			</div>}
		</div>
	}

}