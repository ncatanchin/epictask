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
import filterProps from 'react-valid-props'

import baseStyles from './TypeAheadSelect.styles'

// Constants
const log = getLogger(__filename)




export type TTypeAheadItemSelected = (chosenRequest: string, index: number) => void

export type TTypeAheadInputChanged = (query: string) => void

/**
 * ITypeAheadSelectProps
 */
export interface ITypeAheadSelectProps extends React.HTMLAttributes {
	theme?: any
	styles?: any

	hintText?: string
	hintStyle?: any

	onItemSelected?: TTypeAheadItemSelected
	onInputChanged?: TTypeAheadInputChanged

	dataSource: any
	query?: string

	underlineShow?: boolean
	openOnFocus?: boolean

	maxSearchResults?: number

	menuProps?:any
}

/**
 * ITypeAheadSelectState
 */
export interface ITypeAheadSelectState {
	internalQuery?: string
}

/**
 * TypeAheadSelect
 *
 * @class TypeAheadSelect
 * @constructor
 **/

// @connect(createStructuredSelector({
// 	// Props mapping go here, use selectors
// }, createDeepEqualSelector))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles, 'TypeAheadSelect')
@Radium
@PureRender
export class TypeAheadSelect extends React.Component<ITypeAheadSelectProps,ITypeAheadSelectState> {

	onItemSelected = (chosenRequest: string, index: number) => {
		this.props.onItemSelected && this.props.onItemSelected(chosenRequest, index)
	}

	onInputChanged = (newQuery) => {
		this.setState({internalQuery: newQuery})

		this.props.onInputChanged && this.props.onInputChanged(newQuery)
	}

	updateState(props:ITypeAheadSelectProps) {
		this.setState(props.query ? {
			internalQuery: props.query
		} : {})
	}

	componentWillMount = () => this.updateState(this.props)

	componentWillReceiveProps = (newProps:ITypeAheadSelectProps) => this.updateState(newProps)


	render() {
		const
			{
				theme,
				styles,
				hintText,
				underlineShow,
				dataSource,
				menuProps
			} = this.props,
			{
				internalQuery:query
			} = this.state || {} as any,

			hasQuery = (!query || !query.length),

			//Styles

			hintStyle = makeStyle(
				styles.hint,
				hasQuery && styles.hint.visible,
				this.props.hintStyle
			)


		return <AutoComplete
			{...filterProps(_.omit(this.props, 'style'))}
			style={makeStyle(styles.root,this.props.style)}

			value={_.get(this,'state.internalQuery','')}
			hintText={hintText}
			hintStyle={hintStyle}

			underlineShow={underlineShow}
			filter={AutoComplete.noFilter}
			listStyle={styles.list}
			menuProps={assign({},{maxHeight:300})}
			onNewRequest={this.onItemSelected}
			onUpdateInput={this.onInputChanged}

			dataSource={dataSource}
			searchText={query}
			openOnFocus={true}/>
	}

}