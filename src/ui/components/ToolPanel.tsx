// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {PureRender} from 'components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {ToolPanelLocation, IToolPanel, ITool} from "shared/tools/ToolTypes"
import {uiStateSelector} from "shared/actions/ui/UISelectors"

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root: [FlexColumn, FlexAuto, {}]
})



export interface IToolProps extends React.HTMLAttributes {
	tool:ITool
	open:boolean
}

/**
 * IToolPanelProps
 */
export interface IToolPanelProps extends React.HTMLAttributes {
	theme?:any
	styles?:any
	id?:string
	location:ToolPanelLocation
	panel?:IToolPanel
}

/**
 * ToolPanel
 *
 * @class ToolPanel
 * @constructor
 **/

@connect(createStructuredSelector({
	panel: (state,props:IToolPanelProps) => uiStateSelector(state).toolPanels.find(it =>
		it.location === props.location &&
		(props.location !== ToolPanelLocation.Window || it.id === props.id)
	)// Props mapping go here, use selectors
}, createDeepEqualSelector))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'toolPanel')
@Radium
@PureRender
export class ToolPanel extends React.Component<IToolPanelProps,any> {
	
	render() {
		const {theme, styles} = this.props
		
		return <div style={styles.root}>
		</div>
	}
	
}