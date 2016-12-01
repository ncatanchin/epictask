// Imports
import { PureRender, makeComponentStyles } from "epic-ui-components"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { shallowEquals, shortId, guard } from "epic-global"
import filterProps from "react-valid-props"
import { Flex,FlexScale, FlexColumnCenter, FlexRowCenter, TextField, Popover } from "../common"
import { getValue, isNil } from "typeguard"
import {
	CommandComponent,
	ICommandComponent,
	CommandRoot,
	CommandContainerBuilder,
	CommandContainer, ICommandComponentProps
} from "epic-command-manager-ui"
import { CommonKeys, CommandType } from "epic-command-manager"
import { Icon } from "epic-ui-components/common/icon/Icon"
import { isHovering, makeWidthConstraint } from "epic-styles/styles"
import baseStyles from "./SelectField.styles"

// Constants
const log = getLogger(__filename)



/**
 * ISelectProps
 */
export interface ISelectFieldProps extends IThemedAttributes, ICommandComponentProps {
	
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
}

/**
 * Select
 *
 * @class Select
 * @constructor
 **/
@CommandComponent()
@ThemedStyles(baseStyles)
@PureRender
export class SelectField extends React.Component<ISelectFieldProps,ISelectFieldState>  implements ICommandComponent  {
	
	static defaultProps = {
		showOpenControl: true
	}
	
	constructor(props, context) {
		super(props, context)
		
		this.state = {
			open: false,
			id: `select-field-${shortId()}`,
			selectedIndex: 0,
			visibleItems: []
		}
		
	}
	
	commandItems = makeCommandBuilder(this)
	
	
	get commandComponentId() {
		return this.id
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
	 * Filter text change
	 *
	 * @param event
	 */
	onFilterChanged = event => {
	}
	
	/**
	 * Filter focus
	 *
	 * @param event
	 */
	onFilterFocus = event => {
	}
	
	/**
	 * Filter blur
	 *
	 * @param event
	 */
	onFilterBlur = event => {
	}
	
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
			{ selectedIndex, visibleItems } = this.state,
			selectedItem = visibleItems[ selectedIndex ]
		
		let
			valueContent = getValue(() => value.content),
			valueItem = getValue(() => items.find(it => [ it.value, it.key ].includes(value)))
		
		if (!valueContent)
			valueContent = getValue(() => valueItem.content,<div>No Value Provided</div>)
		
		visibleItems = items.filter(item => !valueItem ||
		(item !== valueItem))
		
		selectedIndex = visibleItems.findIndex(item => item === selectedItem)
		
		if (selectedIndex === -1)
			selectedIndex = 0
		
		this.setState({
			selectedIndex,
			valueContent,
			visibleItems
		})
	}
	
	/**
	 * Set the selected index
	 *
	 * @param selectedIndex
	 */
	private setSelectedIndex = selectedIndex => this.setState({ selectedIndex })
	
	
	private makeOnItemMouseOver = (item: ISelectFieldItem, index) => {
		return (event: React.MouseEvent<any>) => this.setSelectedIndex(index)
	}
	
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
	moveSelection = increment => {
		
	}
	
	/**
	 * Toggle the open state
	 */
	private toggleOpen = () => {
		const
			open = !this.state.open
		
		this.setState({ open }, open && (() => {
				
				const
					{ rootRefElem } = this.state
				
				
				if (rootRefElem) {
					const
						inputElem = $(rootRefElem).find('input')
					
					log.debug(`Focusing on`, inputElem, rootRefElem)
					inputElem.focus()
				}
			}))
	}
	
	/**
	 * On click away - close it down
	 */
	private onClickAway = () => this.state.open && this.toggleOpen()
	
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
	
	makeResultStyle = (styles,anchorElem) => {
		
		const
			rect = getValue(() => anchorElem.getBoundingClientRect(), {} as any),
			{width,left,top,height} = rect,
			winWidth = window.innerWidth
		
		return makeStyle(
			{
				//width: width || 'auto',
				minWidth: width || 'auto',
				maxWidth: isNil(left) ? "auto" :  winWidth - left
			},
			styles.items,
			styles.items[':focus']
		)
	}
	
	
	render() {
		const
			{ commandContainer, placeholder, styles, style, showOpenControl, showFilter, filterStyle, filterInputStyle, iconStyle } = this.props,
			{ rootRefElem, filterText, open, visibleItems, valueContent, selectedIndex } = this.state,
			{ id } = this,
			focused = commandContainer && commandContainer.isFocused()
		
		
		const
			resultsStyle = this.makeResultStyle(styles,rootRefElem)
		
		
		return <CommandRoot
			id={this.state.id}
			component={this}
			ref={this.setRootRef}
			data-focused={focused}
			style={makeStyle(
				styles,
				focused && styles[':focus'],
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
			<TextField
				{...filterProps(this.props)}
				id={`${id}-filter-input`}
				autoComplete="off"
				tabIndex={-1}
				autoFocus={true}
				onFocus={this.onFilterFocus}
				onBlur={this.onFilterBlur}
				placeholder={placeholder}
				onChange={this.onFilterChanged}
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
					})
				}
				inputStyle={filterInputStyle}
				value={filterText || ''}
			/>
			
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
					{visibleItems
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
		</CommandRoot>
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
				key = 'null',
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
 * Commands
 */
function makeCommandBuilder(selectField: SelectField) {
	return (builder: CommandContainerBuilder) =>
		builder
		//MOVEMENT
			.command(
				CommandType.Container,
				'Move down',
				(cmd, event) => selectField.moveSelection(1),
				CommonKeys.MoveDown, {
					hidden: true,
					overrideInput: true
				})
			.command(
				CommandType.Container,
				'Move up',
				(cmd, event) => selectField.moveSelection(-1),
				CommonKeys.MoveUp, {
					hidden: true,
					overrideInput: true
				})
			
			// ESCAPE
			.command(
				CommandType.Container,
				'Close results',
				(cmd, event) => guard(selectField.props.onEscape as any),
				CommonKeys.Escape,
				
				// OPTS
				{
					hidden: true,
					overrideInput: true
				})
			
			// SELECT
			.command(
				CommandType.Container,
				'Select this issue',
				(cmd, event) => {
					event.preventDefault()
					event.stopPropagation()
					selectField.onItemSelected()
					
				},
				CommonKeys.Enter, {
					hidden: true,
					overrideInput: true
				})
			
			
			
			.make()
	
	
}