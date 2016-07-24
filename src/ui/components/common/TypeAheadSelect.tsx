/**
 * Created by jglanz on 7/24/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {PureRender} from 'components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector, createSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {AutoComplete} from 'material-ui'

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root: [FlexColumn, FlexAuto, {}]
})


/**
 * ITypeAheadSelectProps
 */
export interface ITypeAheadSelectProps extends React.HTMLAttributes {
	theme?: any
	styles?: any
}

/**
 * ITypeAheadSelectState
 */
export interface ITypeAheadSelectState {

}

/**
 * TypeAheadSelect
 *
 * @class TypeAheadSelect
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
export class TypeAheadSelect extends React.Component<ITypeAheadSelectProps,ITypeAheadSelectState> {

	render() {
		const {theme, styles} = this.props

		return <AutoComplete onKeyDown={props.onKeyDown}
		                     className='chipAutoComplete'
		                     hintText={hint}
		                     hintStyle={makeStyle({zIndex: 3,bottom: 5,opacity: !query.length ? 1 : 0},hintStyle)}
		                     style={makeStyle(s.input,((hasValue || isFocused) && label))}
		                     underlineShow={false}

		                     filter={AutoComplete.noFilter}
		                     listStyle={{
								paddingTop: 0,
								paddingBottom: 0,
								backgroundColor: 'transparent !important'
							  }}
		                     menuProps={{maxHeight:300}}
		                     onNewRequest={this.onItemSelectedOrEnterPressed}
		                     dataSource={this.state.dataSource}
		                     searchText={query}
		                     onUpdateInput={this.handleUpdateInput}
		                     openOnFocus={true}/>
	}

}