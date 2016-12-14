// Imports

import { ThemedStyles, IThemedAttributes, Themed } from "epic-styles"
import { shallowEquals, shortId, guard, focusNextFormField } from "epic-global"
import filterProps from "react-valid-props"
import { Flex, FlexScale, FlexColumnCenter, FlexRowCenter} from "./FlexLayout"
import { PureRender} from "./PureRender"
import {TextField } from './TextField'
import {Popover} from "./Popover"
import { getValue, isNil } from "typeguard"
import { Icon } from "./icon/Icon"
import baseStyles from "./SelectField.styles"
import { isHovering } from "epic-styles/styles"

// Constants
const
	log = getLogger(__filename)

log.setOverrideLevel(LogLevel.DEBUG)

/**
 * ISelectProps
 */
export interface ISelectFieldProps extends IThemedAttributes {
	
	/**
	 * Id is required
	 */
	id?: string
	
	/**
	 * Show drop down arrow
	 */
	showOpenControl?: boolean
	
	/**
	 * Style drop down arrow
	 */
	iconStyle?: any
	
	/**
	 * All the items in the list
	 */
	items: ISelectFieldItem[]
	
	/**
	 * Currently selected item - must be a "value" in the list of items
	 */
	value: any
	
	/**
	 * On item selected
	 *
	 * @param item
	 * @param index
	 */
	onItemSelected: (item: ISelectFieldItem, index?: number) => any
	
	/**
	 * On escape key pressed
	 */
	onEscape?: () => any
	
	
	/**
	 * Enable filtering by text
	 */
	showFilter?: boolean
	
	/**
	 * Filter field style
	 */
	filterStyle?: any
	
	/**
	 * Filter input style
	 */
	filterInputStyle?: any
	
}

/**
 * ISelectState
 */
export interface ISelectFieldState {
	/**
	 * Open or closed
	 */
	open?: boolean
	
	/**
	 * Selected index
	 */
	selectedIndex?: number
	
	/**
	 * Backup id
	 */
	id?: string
	
	/**
	 * Filtering text
	 */
	filterText?: string
	
	/**
	 * Component ref
	 */
	rootRef?: any
	
	/**
	 * DOM node ref
	 */
	rootRefElem?: any
	
	/**
	 * Value content
	 */
	valueContent?: any
	
	/**
	 * Currently visible items
	 */
	visibleItems?: ISelectFieldItem[]
	
	/**
	 * Field is focused
	 */
	focused?:boolean
}

/**
 * Select
 *
 * @class Select
 * @constructor
 **/

@ThemedStyles(baseStyles,'select')
@PureRender
export class SelectField extends React.Component<ISelectFieldProps,ISelectFieldState> {
	
	static defaultProps = {
		showOpenControl: true,
		showFilter: true
	}
	
	refs:any
	
	constructor(props, context) {
		super(props, context)
		
		this.state = {
			open: false,
			id: `select-field-${shortId()}`,
			selectedIndex: 0,
			visibleItems: []
		}
		
	}
	
	get id(): string {
		return (
			this.props.id ?
				`select-field-${this.props.id}` :
				this.state.id
		)
	}
	
	/**
	 * Capture the ref to the root element
	 *
	 * @param rootRef
	 */
	setRootRef = (rootRef) => this.setState({
		rootRef,
		rootRefElem: ReactDOM.findDOMNode(rootRef)
	})
	
	
	
	/**
	 * On item selected
	 *
	 * @param item
	 * @param index
	 */
	onItemSelected = (item?: ISelectFieldItem, index?: number) => {
		
		if (!item) {
			index = this.state.selectedIndex
			item = this.props.items[ index ]
		}
		
		guard(() => this.props.onItemSelected(item, index))
	}
	
	/**
	 * Update state
	 *
	 * @returns {any}
	 */
	private updateState = (props = this.props) => {
		const
			{ items, value } = props
		
		let
			{ selectedIndex, visibleItems, filterText } = this.state,
			selectedItem = visibleItems[ selectedIndex ]
		
		let
			valueContent = getValue(() => value.content),
			valueItem = getValue(() => items.find(it => [ it.value, it.key ].includes(value)))
		
		if (!valueContent)
			valueContent = getValue(() => valueItem.content,<div>{this.props.placeholder || 'No Value Provided'}</div>)
		
		visibleItems = items.filter(item =>
			(!valueItem ||
			(item !== valueItem)) &&
			(!filterText || _.isEmpty(filterText) ||
				getValue(() => item.contentText.toLowerCase().indexOf(
					filterText.toLowerCase()) > -1))
		)
		
		selectedIndex = visibleItems.findIndex(item => item === selectedItem)
		
		if (selectedIndex === -1)
			selectedIndex = 0
		
		this.setState({
			selectedIndex,
			valueContent,
			visibleItems
		})
	}
	
	get selectedIndex() {
		return getValue(() => this.state.selectedIndex, -1)
	}
	
	get selectedItem() {
		return getValue(() => this.state.visibleItems[ this.selectedIndex ], null) as ISelectFieldItem
	}
	
	/**
	 * Set the selected index
	 *
	 * @param selectedIndex
	 */
	private setSelectedIndex = selectedIndex => this.setState({ selectedIndex })
	
	/**
	 * Make on mouseover handler
	 *
	 * @param item
	 * @param index
	 */
	private makeOnItemMouseOver = (item: ISelectFieldItem, index) => {
		return (event: React.MouseEvent<any>) => this.setSelectedIndex(index)
	}
	
	/**
	 * Make on click handler
	 *
	 * @param item
	 * @param index
	 * @returns {(event:React.MouseEvent<any>)=>undefined}
	 */
	private makeOnItemClick = (item: ISelectFieldItem, index) => {
		return (event: React.MouseEvent<any>) => {
			this.props.onItemSelected(item)
			event.preventDefault()
			event.stopPropagation()
			
			this.toggleOpen()
			//this.setSelectedIndex(index)
		}
	}
	
	/**
	 * Move the selected index
	 *
	 * @param increment
	 */
	private moveSelection = increment => {
		let
			{selectedIndex,visibleItems} = this.state
		
		selectedIndex = Math.max(Math.min(selectedIndex,visibleItems.length - 1),0) + increment
		
		if (selectedIndex < 0)
			selectedIndex = visibleItems.length - 1
		else if (selectedIndex >= visibleItems.length)
			selectedIndex = 0
		
		this.setSelectedIndex(selectedIndex)
	}
	
	/**
	 * Toggle the open state
	 */
	private toggleOpen = () => {
		const
			open = !this.state.open
		
		this.setState({ open }, open && (() => {
				
			const
				{filterInput} = this.refs
				
			log.debug(`focusing on filter input`,filterInput)
			guard(() => filterInput.focus())
				
			}))
	}
	
	/**
	 * Set the filter text
	 *
	 * @param filterText
	 */
	private setFilterText(filterText) {
		this.setState({ filterText },this.updateState)
	}
	
	/**
	 * On keydown - handle movement and filtering
	 *
	 * @param event
	 */
	private onKeyDown = event => {
		log.debug(`On key down`, event, event.key, event.charCode, event.keyCode)
		
		const
			stopEvent = () => {
				event.preventDefault()
				event.stopPropagation()
			},
			
			{ key } = event
		
		let
			filterText = getValue(() => this.state.filterText, '')
		
		switch (key) {
			case 'Up':
			case 'ArrowUp':
				this.moveSelection(-1)
				stopEvent()
				break
			case 'Down':
			case 'ArrowDown':
				if (!this.state.open) {
					this.toggleOpen()
					break
				}
				this.moveSelection(1)
				stopEvent()
				break
			case 'Escape':
				const
					isOpen = getValue(() => this.state.open, false)
				
				if (isOpen) {
					this.toggleOpen()
				} else {
					$(ReactDOM.findDOMNode(this)).find('input').blur()
				}
				
				stopEvent()
				break
			
			case 'Enter':
				event.preventDefault()
				event.stopPropagation()
				
				if (!this.state.open) {
					this.toggleOpen()
					break
				}
				
				const
					{ selectedItem, selectedIndex } = this
				
				if (selectedItem) {
					log.debug(`Selected`, selectedIndex, selectedItem)
					guard(() => this.props.onItemSelected(selectedItem))
					
					this.toggleOpen()
					
					focusNextFormField(this)
					
				} else {
					log.debug(`no item selected`, selectedIndex, selectedItem, this.state)
				}
				
				stopEvent()
				break
			case 'Backspace':
			case 'Delete':
				if (filterText.length > 0) {
					this.setFilterText(filterText.substring(0, filterText.length - 1))
				}
				
				stopEvent()
				break
			default:
				if (key.length === 1 && /[a-zA-Z0-9\s]/.test(key)) {
					this.setFilterText(filterText + key)
					
					stopEvent()
				}
			
			
		}
	}
	
	
	/**
	 * On click away - close it down
	 */
	private onClickAway = () =>  this.state.open && this.toggleOpen()
	
	/**
	 * On focus, open
	 */
	private onFocus = () => this.setState({focused: true},() => !this.state.open && this.toggleOpen())
	
	/**
	 * On blur, close
	 */
	private onBlur = () => this.setState({focused: false},this.onClickAway)
	
	/**
	 * Create the result style for the popover
	 *
	 * @param styles
	 * @param anchorElem
	 * @returns {any}
	 */
	private makeResultsStyle = (styles, anchorElem) => {
		
		const
			rect = getValue(() => anchorElem.getBoundingClientRect(), {} as any),
			{ width, left, top, height } = rect,
			winWidth = window.innerWidth
		
		return makeStyle(
			{
				//width: width || 'auto',
				minWidth: width || 'auto',
				maxWidth: isNil(left) ? "auto" : winWidth - left
			},
			styles.items,
			styles.items.focused
		)
	}
	
	
	/**
	 * On mount update the state
	 *
	 * @type {(props?:any)=>any}
	 */
	componentWillMount = this.updateState
	
	
	/**
	 * On new props check the id
	 *
	 * @type {(props?:any)=>any}
	 */
	componentWillReceiveProps = this.updateState
	
	
	render() {
		const
			{ tabIndex, palette, placeholder, styles, style, showOpenControl, showFilter, filterStyle, filterInputStyle, iconStyle } = this.props,
			{ focused,rootRefElem, filterText, open, visibleItems, valueContent, selectedIndex } = this.state,
			{ id } = this
			  
		
		
		const
			resultsStyle = this.makeResultsStyle(styles, rootRefElem)
		
		
		return <div
			id={this.state.id}
			
			ref={this.setRootRef}
			key={this.state.id}
			
			onKeyDown={this.onKeyDown}
			data-focused={focused}
			style={mergeStyles(
				styles,
				{[CSSHoverState]: {}},
				(open || focused) && styles.focused,
				isHovering(this,this.state.id) && styles.hovering,
				style
			)}
			onClick={this.toggleOpen}
		>
			{/* SELECTED VALUE */}
			<FlexScale style={[PositionRelative,styles.value]}>
				{valueContent}
			</FlexScale>
			
			{/* OPEN CONTROL */}
			{showOpenControl &&
			<FlexColumnCenter style={styles.control}>
				<Icon iconSet='fa' iconName='chevron-down'/>
			</FlexColumnCenter>
			}
			
			{/* RENDER CRITERIA */}
				{showFilter && <input
				{...filterProps(this.props)}
				{...(open || focused ? {autoFocus:true} : {})}
				id={`${id}-filter-input`}
				autoComplete="off"
				ref="filterInput"
				onFocus={this.onFocus}
				onBlur={this.onBlur}
				tabIndex={isNil(tabIndex) ? 0 : tabIndex}
				placeholder={placeholder}
				style={makeStyle(
					OverflowHidden,
					PositionAbsolute,{
						pointerEvents:'none',
						opacity: 0,
						zIndex:999,
						top:0,
						left:0,
						width: 1,
						height: 1
					}
				)}
				value={filterText || ''}
			/> }
			
			<Popover
				canAutoPosition={false}
				open={open}
				onRequestClose={this.onClickAway}
				anchorOrigin={{
						vertical: 'bottom',
						horizontal: 'left',
					}}
				targetOrigin={{
						vertical: 'top',
						horizontal: 'left',
					}}
				anchorEl={this.state.rootRefElem}
				useLayerForClickAway={true}
			>
				
				<div style={resultsStyle}>
					
					{/* SHOW FILTER TEXT */}
					{showFilter && filterText && filterText.length &&
						<SelectFilterText style={filterStyle} filterText={filterText}/>
					}
					
					{visibleItems
						.filter(item => !isNil(item))
						.map((item, index) =>
							<SelectFieldItem
								{...item}
								styles={styles}
								onMouseEnter={this.makeOnItemMouseOver(item,index)}
								onClick={this.makeOnItemClick(item,index)}
								key={item.key || index}
								selected={selectedIndex === index}
								index={index}/>
						)}
				</div>
			
			
			</Popover>
		</div>
	}
	
}


/*
 <MenuItem key={item.key}
 value={item.value || ''}
 style={makeStyle(styles.menuItem,itemStyle)}
 innerDivStyle={makePaddingRem(0.3,0.5)}
 primaryText={<div style={styles.menuItem.content}>{item.node}</div>} />
 */
interface ISelectFieldItemProps extends ISelectFieldItem {
	styles: any
	index: number
	selected: boolean
	onMouseEnter: React.MouseEventHandler<any>
	onClick: React.MouseEventHandler<any>
}

@Radium
@PureRender
class SelectFieldItem extends React.Component<ISelectFieldItemProps,any> {
	constructor(props, context) {
		super(props, context)
		
		this.state = {}
	}
	
	render() {
		const
			{
				styles,
				value,
				style,
				index,
				selected,
				content,
				contentStyle,
				leftAccessory,
				leftAccessoryStyle,
				rightAccessory,
				rightAccessoryStyle,
				onMouseEnter,
				onClick
			} = this.props
		
		
		return <FlexRowCenter
			onMouseEnter={onMouseEnter}
			onClick={onClick}
			data-selected={selected}
			style={makeStyle(
				styles.item,
				selected && styles.item.selected,
				style
			)}>
			
			{/* LEFT ACCESSORY*/}
			{leftAccessory && <Flex style={leftAccessoryStyle}/> }
			
			{/* CONTENT */}
			<FlexScale style={[
				contentStyle
			]}>
				{content}
			</FlexScale>
			
			{/* RIGHT ACCESSORY*/}
			{rightAccessory && <Flex style={rightAccessoryStyle}/> }
		</FlexRowCenter>
	}
}

/**
 * Filter text component
 *
 * @type {any}
 */
const SelectFilterText = Themed(({ style,filterText, palette }) =>
	<div style={[
			PositionAbsolute,
			Styles.FlexRowCenter,
			makePaddingRem(0.5),
			{
				right: 0,
				top: 0,
				height: rem(2.2),
				width: 'auto',
				fontWeight: 500,
				
				zIndex: 9999999,
				border: `1px solid ${palette.primary.hue3}`,
				background: palette.primary.hue2,
				color: palette.text.primary
			},
			style
		]}>
		{filterText}
	</div>)