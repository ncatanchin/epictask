// Imports
import { PureRender, Chip, searchItemBaseStyles } from 'epic-ui-components/common'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import { getValue } from "typeguard"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)



declare global {
	interface IIssuePanelSearchItem {
		id:string
		type:string
		label:string
		value:any
	}
}
/**
 * IIssuesPanelSearchItemProps
 */
export interface IIssuesPanelSearchItemProps extends IThemedAttributes {
	item:IIssuePanelSearchItem
	selected?:boolean
}

/**
 * IssuesPanelSearchItem
 *
 * @class IssuesPanelSearchItem
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(searchItemBaseStyles)
@PureRender
export class IssuesPanelSearchItem extends React.Component<IIssuesPanelSearchItemProps,void> {
	
	render() {
		const
			{
				styles,
				item,
				selected:isSelected
			} = this.props,
			
			// Make style
			resultStyle = makeStyle(
				styles,
				styles.normal,
				isSelected && styles.selected
			),
			
			color = getValue(() => item.value.color,null),
			
			extraProps = assign({},color && {color})
			
		
		return <div style={resultStyle}>
			<div style={styles.info}>
				<Chip {...extraProps} item={item}/>
			</div>
			
		</div>
	}
	
}