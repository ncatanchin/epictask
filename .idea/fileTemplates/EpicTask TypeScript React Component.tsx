#set ( $PropsName = "I${NAME}Props" )
#set ( $StateName = "I${NAME}State" )

// Imports
import {connect} from 'react-redux'
import {PureRender} from 'ui/components/common/PureRender'
import {createStructuredSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import { IThemedAttributes } from "shared/themes/ThemeDecorations"

// Constants
const 
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles,theme,palette) {
	
	const
		{text, primary, accent,background} = palette
	
	return [ FlexColumn, FlexAuto, {} ]
}



/**
 * ${PropsName}
 */
export interface ${PropsName} extends IThemedAttributes {
	
}

/**
 * ${StateName}
 */
export interface ${StateName} {

}

/**
 * ${NAME}
 *
 * @class ${NAME}
 * @constructor
 **/

@connect(createStructuredSelector({
	// Props mapping go here, use selectors
}))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class ${NAME} extends React.Component<${PropsName},${StateName}> {

	render() {
		const {styles} = this.props

		return <div style={styles.root}>
		</div>
	}

}