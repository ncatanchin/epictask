// Imports
import * as React from 'react'
import { connect } from 'react-redux'
import * as Radium from 'radium'
import { PureRender } from 'ui/components/common/PureRender'
import { createDeepEqualSelector } from 'shared/util/SelectorUtil'
import { createStructuredSelector } from 'reselect'
import { ThemedStyles } from 'shared/themes/ThemeManager'

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root: [ FlexColumn, FlexAuto, {} ]
})


/**
 * IVisibleListProps
 */
export interface IVisibleListProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	items:any[]
	itemRenderer:(items:any[], index:number) => React.ReactElement<any>
	initialItemsPerPage?:number
	bufferPages?:number
}

/**
 * IVisibleListState
 */
export interface IVisibleListState {
	
}

/**
 * VisibleList
 *
 * @class VisibleList
 * @constructor
 **/

@connect(createStructuredSelector({
	// Props mapping go here, use selectors
}, createDeepEqualSelector))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@Radium
@PureRender
export class VisibleList extends React.Component<IVisibleListProps,IVisibleListState> {
	
	render() {
		const { theme, styles } = this.props
		
		return <div style={styles.root}>
		</div>
	}
	
}