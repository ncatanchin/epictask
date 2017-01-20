// Imports
import { Map, Record, List } from "immutable"
import * as React from 'react'
import { PureRender } from './PureRender'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import { Icon } from "./icon/Icon"
import {filterProps} from "./FilterProps"
import { guard } from "epic-global"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ Styles.CursorPointer, Styles.FlexColumnCenter, Styles.FlexAuto, Styles.makePaddingRem(0.5), {
		
		icon: [ {
			//color: text.disabled,
			color: accent.hue1,
			fontSize: rem(1.8),
			checked: [ {
				color: accent.hue1
			} ]
		}]
		
	} ]
}


/**
 * ICheckboxProps
 */
export interface ICheckboxProps extends IThemedAttributes {
	checked:boolean
	onChange?:(event,isChecked?:boolean) => any
}

/**
 * ICheckboxState
 */
export interface ICheckboxState {
	
}

/**
 * Checkbox
 *
 * @class Checkbox
 * @constructor
 **/

@ThemedStyles(baseStyles)
@PureRender
export class Checkbox extends React.Component<ICheckboxProps,ICheckboxState> {
	
	/**
	 * Flip the state
	 *
	 * @param event
	 */
	onClick = event => guard(() => this.props.onChange(event,!this.props.checked))
	
	render() {
		const
			{ checked,styles } = this.props
		
		log.info(`checked style`,styles.icon.checked)
		return <div {...filterProps(this.props)} className="no-focus-style" style={styles} onClick={this.onClick} >
			<Icon style={mergeStyles(styles.icon,checked && styles.icon.checked)} iconSet="fa" iconName={checked ? 'check-square' : 'square-o'} />
		</div>
	}
	
}