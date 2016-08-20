#set ( $PropsName = "I${NAME}Props" )
#set ( $StateName = "I${NAME}State" )

/**
 * ${NAME} 
 *
 * Created by ${USER} on ${DATE}.
 */

//region Imports
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as Radium from 'radium
import {PureRender} from 'uu/components/common'
import {connect} from 'react-redux'
import {AppKey} from 'shared/Constants'
//endregion

//region Logger
const log = getLogger(__filename)
//endregion

//region Styles
const styles = {
	root: makeStyle({
	
	})
}
//endrgion


//region Component Properties
/**
 * ${PropsName}
 */
export interface ${PropsName} {
	theme?:any
}  
//endregion

//region Redux State -> Props Mapper
function mapStateToProps(state) {
	const {theme} = getTheme()
	
	return { theme }
}
//endregion


//region State Shape
export interface ${PropsName} {
	const {theme} = state.get(AppKey)
	
	return {
		theme
	}
}

//endregion


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
	
	componentWillMount = () => log.debug('Mounting')
	componentWillReceivedProps = (nextProps) => log.debug('Next Props',nextProps)
	
	
	render() {
		const {theme} = this.props
		
		return <div style={styles.root}>
		
		</div>	
	}

}