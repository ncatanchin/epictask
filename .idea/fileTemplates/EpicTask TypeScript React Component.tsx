#set ( $PropsName = "I${NAME}Props" )
#set ( $StateName = "I${NAME}State" )

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {PureRender} from 'ui/components/common/PureRender'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector,createSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root: [FlexColumn,FlexAuto,{

	}]
})


/**
 * ${PropsName}
 */
export interface ${PropsName} extends React.HTMLAttributes {
	theme?:any
	styles?:any
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
},createDeepEqualSelector))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@Radium
@PureRender
export class ${NAME} extends React.Component<${PropsName},${StateName}> {

	render() {
		const {theme,styles} = this.props

		return <div style={styles.root}>
		</div>
	}

}