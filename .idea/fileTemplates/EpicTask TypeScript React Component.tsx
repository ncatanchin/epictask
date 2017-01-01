

#set ( $PropsName = "I${NAME}Props" )
#set ( $StateName = "I${NAME}State" )

// Imports
import { Map,Record,List } from "immutable"
import * as React from 'react'
import {connect} from 'react-redux'
import {createStructuredSelector,createSelector} from 'reselect'
import {PureRender} from 'epic-ui-components'
import {IThemedAttributes,ThemedStyles} from 'epic-styles'


// Constants
const 
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles,theme,palette) {
	
	const
		{text, primary, accent,background} = palette
	
	return [ Styles.FlexColumn, Styles.FlexAuto, {} ]
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