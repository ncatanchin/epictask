// Imports
import { PureRender } from "epic-ui-components"

// Constants
const
	log = getLogger(__filename)



/**
 * IToolWrapperProps
 */
export interface IToolWrapperProps {
	styles:any
	tool:ITool
	panel:IToolPanel
}

/**
 * IToolWrapperState
 */
export interface IToolWrapperState {
	
}

/**
 * ToolWrapper
 *
 * @class ToolWrapper
 * @constructor
 **/

@Radium
@PureRender
export class ToolWrapper extends React.Component<IToolWrapperProps,any> {
	
	render() {
		const
			{styles,tool,panel} = this.props,
			{location} = panel,
			toolStyles = styles.tool,
			ToolComponent = ToolRegistryScope.getToolComponent(tool.id),
			ToolHeaderControls = ToolRegistryScope.getToolHeaderControls(tool.id)
		
		return <div style={[toolStyles,toolStyles[location]]} className="toolWrapper">
			<div style={[toolStyles.header,toolStyles.header[location]]}>
				<div style={[toolStyles.header.label]}>{tool.label}</div>
				{ToolHeaderControls}
			</div>
			<div style={[toolStyles.container]}>
				<ToolComponent tool={tool} panel={panel} visible={panel.open && tool.active} />
			</div>
		</div>
	}
}