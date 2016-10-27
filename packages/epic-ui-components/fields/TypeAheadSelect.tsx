/**
 * Created by jglanz on 7/24/16.
 */

// Imports
import {PureRender} from "epic-ui-components"
import {ThemedStyles} from "epic-styles"
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
export interface ITypeAheadSelectProps extends React.HTMLAttributes<any> {
	theme?: any
	styles?: any

	hintText?: string
	hintStyle?: any

	onItemSelected?: TTypeAheadItemSelected
	onInputChanged?: TTypeAheadInputChanged
	onEscKeyDown?: () => void
	dataSource: any
	query?: string

	openAlways?:boolean
	
	underlineStyle?: any
	underlineFocusStyle?: any
	underlineDisabledStyle?:any
	underlineShow?: boolean
	openOnFocus?: boolean

	maxSearchResults?: number

	fullWidth?:boolean
	menuProps?:any
}

/**
 * ITypeAheadSelectState
 */
export interface ITypeAheadSelectState {
	internalQuery?: string
	autoCompleteRef?:any
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
@ThemedStyles(baseStyles, 'typeAheadSelect')
@PureRender
export class TypeAheadSelect extends React.Component<ITypeAheadSelectProps,ITypeAheadSelectState> {

	static defaultProps = {
		fullWidth: false,
		openOnFocus: false
	}

	get autoCompleteRef() {
		return _.get(this.state,'autoCompleteRef')
	}

	setAutoCompleteRef = (autoCompleteRef) => this.setState({autoCompleteRef})

	setQuery = (newQuery) => {
		this.setState({internalQuery: newQuery})

		this.props.onInputChanged && this.props.onInputChanged(newQuery)
	}


	onItemSelected = (chosenRequest: string, index: number) => {
		log.info(`item selected @ index ${index}`,chosenRequest,index)
		this.props.onItemSelected && this.props.onItemSelected(chosenRequest, index)

		this.onInputChanged("")

	}

	onEscKeyDown = () => {
		this.props.onEscKeyDown && this.props.onEscKeyDown()
	}

	onInputChanged = this.setQuery

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
				menuProps,
				fullWidth,
				openOnFocus,
				openAlways,
				underlineDisabledStyle,
				underlineFocusStyle,
				underlineStyle
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

		const otherProps = {} as any


		return <AutoComplete
			{...filterProps(_.omit(this.props, 'style'))}
			{...otherProps}
			ref={this.setAutoCompleteRef}
			style={makeStyle(styles.root,this.props.style)}
			className={styles.className}
			value={_.get(this,'state.internalQuery','')}
			hintText={hintText}
			hintStyle={hintStyle}
			listStyle={styles.list}
			fullWidth={fullWidth}
			underlineDisabledStyle={underlineDisabledStyle}
			underlineFocusStyle={underlineFocusStyle}
			underlineStyle={underlineStyle}
			underlineShow={underlineShow}
			filter={AutoComplete.noFilter}

			menuProps={{
				maxHeight:300
			}}
			onEscKeyDown={this.onEscKeyDown}
			onNewRequest={this.onItemSelected}
			onUpdateInput={this.onInputChanged}

			dataSource={dataSource}
			searchText={query}
			openOnFocus={openOnFocus}/>
	}

}