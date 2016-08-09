/**
 * Created by jglanz on 8/9/16.
 */

// Imports
import * as React from 'react'
import * as Radium from 'radium'
import {PureRender} from 'components/common'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {Issue, Label} from 'epictask/shared'
import {Icon} from 'epictask/ui/components'

const tinycolor = require('tinycolor2')

// Constants
const log = getLogger(__filename)

export const baseStyles = createStyles({
	label: [FlexRowCenter,{
		padding: '0.6rem 1rem',
		borderRadius: '0.3rem',
		margin: '0 1rem 0 0',
		boxShadow: '0.1rem 0.1rem 0.1rem rgba(0,0,0,0.4)'
	}],
	icon: [FlexAuto,{
		fontSize: themeFontSize(1),
		padding: '0 0.5rem 0 0'
	}],
	text: [FlexAuto,{
		fontSize: themeFontSize(1.1),
		fontWeight: 700,
		lineHeight: 1
	}],
	remove: [FlexAuto,{
		fontSize: themeFontSize(1),
		padding: '0 0 0 0.5rem',
		cursor: 'pointer'
	}]
})

export type TIssueCallback = (label:Label) => void

/**
 * ILabelChipProps
 */
export interface ILabelChipProps {
	theme?: any
	styles?: any
	label:Label
	labelStyle?:any
	showIcon?:boolean
	showRemove?:boolean
	onRemove?:TIssueCallback
}

/**
 * LabelChip
 *
 * @class LabelChip
 * @constructor
 **/


// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@Radium
@PureRender
export default class LabelChip extends React.Component<ILabelChipProps,void> {

	render() {
		const
			{
				theme,
				styles,
				showIcon,
				onRemove,
				showRemove,
				label,
				labelStyle
			} = this.props,
			{palette} = theme

		const
			backgroundColor = '#' + label.color,
			finalLabelStyle = makeStyle(styles.label, labelStyle, {
				backgroundColor,
				color: tinycolor.mostReadable(backgroundColor,[
					palette.text.secondary,
					palette.alternateText.secondary
				])
			})

		return <div style={finalLabelStyle}>
			{showIcon &&
				<Icon style={styles.icon}
				      iconSet='octicon'
				      iconName='tag'/>}

	        <div style={styles.text}>{label.name}</div>

			{onRemove &&
				<Icon
					style={styles.remove}
					onClick={() => onRemove(label)}
					iconSet='fa'
					iconName='times'/>}
		</div>
	}

}