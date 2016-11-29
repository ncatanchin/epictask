/**
 * Created by jglanz on 6/14/16.
 */

// Imports

import { PureRender } from "../common/PureRender"

import { shortId, guard } from  "epic-global"

import filterProps from 'react-valid-props'
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { SearchField } from "epic-ui-components/search"
import { searchItemBaseStyles, Chip } from "epic-ui-components/common"
import { List } from 'immutable'
import { SearchItem } from "epic-models"
import { getValue } from "typeguard"

const
	{ Style } = Radium,
	toaster = getNotificationCenter(),
	log = getLogger(__filename)

const baseStyles = (topStyles, theme, palette) => ({
	root: makeStyle(FlexColumn, FlexAuto, PositionRelative, {
		minHeight: 72,
		padding: '1rem 0',
		boxSizing: 'border-box',
		
		noLabel: {
			minHeight: 30,
			padding: 0
		}
	}),
	chips: makeStyle(makeTransition([ 'padding-top' ]), FlexRow, FlexAuto, PositionRelative, makeFlexAlign('center', 'flex-start'), {
		flexWrap: 'wrap',
		boxSizing: 'border-box',
		
		hasValue: {
			paddingTop: 25
		},
		
		
		// Fixed scroll mode
		'fixed-scroll-x': {
			flexWrap: 'nowrap',
			overflowX: 'auto'
		}
	}),
	
	
	input: makeStyle({
		flex: '1 0 20rem',
		width: 'auto',
		boxSizing: 'border-box'
		
	}),
	
	inputRules: makeStyle({
		'> div:first-child, div.chipAutoComplete': makeStyle({
			display: 'flex !important',
			flexDirection: 'row',
			width: 'auto !important',
			boxSizing: 'border-box'
		}),
		' div.chipAutoComplete': {
			flex: '1 0 20rem !important',
		},
		' div.chipAutoComplete.hasValue': {
			flex: '1 0 20rem !important',
			
		},
		'> div:first-child > div:first-child': makeStyle({
			boxSizing: 'border-box'
		}),
		' input': {
			//width: 'auto !important',
			flex: '1 0 20rem !important',
			boxSizing: 'border-box',
			marginTop: '14px !important',
			padding: '0 1rem !important',
			transform: 'translate(0,-25%)'
		}
	})
	
	
})


/**
 * IChipsFieldProps
 */
export interface IChipsFieldProps extends IThemedAttributes {
	theme?:any
	id:string
	
	label?:string
	hint?:string
	
	modelType:{new():IChipItem}
	allChips:IChipItem[]
	filterChip:(item:IChipItem, query:string) => boolean
	selectedChips:IChipItem[]
	onChipSelected:(item:IChipItem) => any
	keySource:(item:IChipItem) => string|number
	
	inputStyle?:any
	style?:any
	
	labelStyle?:any
	maxSearchResults?:number
	
	onEscape?:Function
}


/**
 * ChipsField
 *
 * @class ChipsField
 * @constructor
 **/


@ThemedStyles(baseStyles)
@PureRender
export class ChipsField extends React.Component<IChipsFieldProps,any> {
	
	private backupId:string = `ChipsField-${shortId()}`
	
	private chipsSearchProvider = new ChipSearchProvider(this)
	
	get id() {
		return this.props.id ? `ChipsField-${this.props.id}` : this.backupId
	}
	
	constructor(props, context) {
		super(props, context)
	}
	
	get commandComponentId():string {
		return this.id
	}
	
	
	private onChipSelected = (item) => {
		this.setState({
			query: null
		}, () => this.props.onChipSelected(item))
	}
	
	/**
	 * Create focus handler
	 *
	 * @param isFocused
	 */
	private onSetFocus = (isFocused) => () => this.setState({ isFocused })
	
	/**
	 * onFocus handler
	 */
	onFocus = this.onSetFocus(true)
	
	/**
	 * onBlur handler
	 */
	onBlur = this.onSetFocus(false)
	
	/**
	 * On escape close it up
	 */
	
	private onItemSelectedOrEnterPressed = (resultItem:ISearchItem) => {
		log.debug('Selected item', resultItem)
		
		const
			item = resultItem.value
		
		this.onChipSelected(item)
	}
	
	
	private criteriaRenderer = (selectedChips) => {
		return selectedChips.map(item => <Chip key={item.id} item={item}/>)
	}
	
	render() {
		const
			{ state, props } =this,
			{
				theme,
				styles,
				selectedChips,
				label,
				inputStyle,
				labelStyle,
				hint,
				
			} = props,
			{ id } = this,
			s = mergeStyles(styles, theme.component),
			
			query = this.state.text ? this.state.text : ''
		
		
		return <div style={makeStyle(FlexScale,PositionRelative)}><SearchField
			{..._.omit(filterProps(this.props), 'id')}
			searchId={id}
			placeholder={getValue(() => hint.toUpperCase(),'')}
			onItemSelected={this.onItemSelectedOrEnterPressed}
			providers={[this.chipsSearchProvider]}
			criteria={selectedChips}
			criteriaRenderer={this.criteriaRenderer}
			styles={{field:{minWidth: rem(30)}}}
			onEscape={this.props.onEscape}
			text={query}/>
		</div>
		
		
	}
	
}

/**
 * Search provider for chips
 */
class ChipSearchProvider implements ISearchProvider {
	
	readonly id = 'Chips'
	
	readonly name = "Chips provide"
	
	constructor(private chipsField:ChipsField) {
		
	}
	
	render(item:ISearchItem, selected:boolean) {
		log.debug(`Render item`, item, 'selected', selected)
		return <ChipsFieldSearchItem
			item={item.value}
			selected={selected}
		/>
		
	}
	
	
	/**
	 * Query for results
	 *
	 * @param criteria
	 * @param text
	 */
	async query(criteria, text):Promise<List<ISearchItem>> {
		
		const
			{ allChips, filterChip, selectedChips } = this.chipsField.props,
			results = List<ISearchItem>().asMutable()
		
		// GET DATA
		allChips
			.filter(it => filterChip(it, text) && !selectedChips.find(it2 => it2.id === it.id))
			.forEach(it =>
				results.push(new SearchItem(`chip-${it.id}`, this, it))
			)
		
		return results.asImmutable()
	}
}

interface IChipsFieldSearchItemProps extends IThemedAttributes {
	item:IIssuePanelSearchItem
	selected?:boolean
}


@ThemedStyles(searchItemBaseStyles)
@PureRender
class ChipsFieldSearchItem extends React.Component<IChipsFieldSearchItemProps,void> {
	
	render() {
		const
			{ styles, item, selected:isSelected } = this.props,
			resultStyle = makeStyle(
				styles,
				styles.normal,
				isSelected && styles.selected
			)
		
		return <div style={resultStyle}>
			<div style={styles.info}>
				<Chip item={item}/>
			</div>
		</div>
	}
}
