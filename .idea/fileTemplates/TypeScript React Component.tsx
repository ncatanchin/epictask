#set ( $PropsName = "I${NAME}Props" )

/**
 * Created by ${USER} on ${DATE}.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import * as Models from 'shared/models'
import * as Constants from 'shared/Constants'
import {PureRender} from 'components/common'

// Constants
const log = getLogger(__filename)
const styles = {
	root: makeStyle(FlexColumn,FlexAuto,{
	
	})
}


function mapStateToProps(state) {
	const appState = state.get(Constants.AppKey)
	return {
		theme: appState.theme
	}
}

/**
 * ${PropsName}
 */
export interface ${PropsName} extends React.DOMAttributes {
	theme?:any
}  

/**
 * ${NAME}
 *
 * @class ${NAME}
 * @constructor
 **/
 
@connect(mapStateToProps)
@Radium
@PureRender
export class ${NAME} extends React.Component<${PropsName},any> {
	
	
	constructor(props,context) {
		super(props,context)
	}
	
	
	render() {
		const
			{theme} = this.props,
			s = mergeStyles(styles,theme.component)
			
		return <div style={s.root}>
		</div>	
	}

}