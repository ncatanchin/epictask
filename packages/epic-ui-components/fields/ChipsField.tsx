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
	onChipRemoved?:(item:IChipItem) => any
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
		return selectedChips.map(item =>
			<div style={makeStyle(FlexAuto,getValue(() => this.props.styles.chipWrapper,{}))}>
				<Chip
					styles={getValue(() => this.props.styles.chip,{})}
					onRemove={this.props.onChipRemoved}
					key={item.id}
					item={item}/>
			</div>)
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
				style
			} = props,
			{ id } = this,
			s = mergeStyles(styles, theme.component),
			
			query = this.state.text ? this.state.text : ''
		
		
		return <div style={makeStyle(FlexScale,PositionRelative,style)}><SearchField
			{..._.omit(filterProps(this.props), 'id')}
			searchId={id}
			searchOnEmpty={true}
			placeholder={getValue(() => hint.toUpperCase(),'')}
			onItemSelected={this.onItemSelectedOrEnterPressed}
			providers={[this.chipsSearchProvider]}
			criteria={selectedChips}
			criteriaRenderer={this.criteriaRenderer}
			styles={[{field:{minWidth: rem(30)}},props.styles]}
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
	onRemove?:(item:IChipItem) => any
	item:IIssuePanelSearchItem
	selected?:boolean
}


@ThemedStyles(searchItemBaseStyles)
@PureRender
class ChipsFieldSearchItem extends React.Component<IChipsFieldSearchItemProps,void> {
	
	render() {
		const
			{
				styles,
				item,
				onRemove,
				selected: isSelected
			} = this.props,
			
			resultStyle = makeStyle(
				styles,
				styles.normal,
				isSelected && styles.selected
			)
		
		return <div style={resultStyle}>
			<div style={styles.info}>
				<Chip onRemove={onRemove} item={item}/>
			</div>
		</div>
	}
}
