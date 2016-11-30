// Imports
import { PureRender, makeComponentStyles } from "epic-ui-components"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { shallowEquals, shortId, guard } from "epic-global"
import filterProps from "react-valid-props"
import { FlexScale, FlexRowCenter, TextField, Popover } from "../common"
import { getValue } from "typeguard"
import {
	CommandComponent,
	ICommandComponent,
	CommandRoot,
	CommandContainerBuilder,
	CommandContainer
} from "epic-command-manager-ui"
import { CommonKeys, CommandType } from "epic-command-manager"

// Constants
const log = getLogger(__filename)

const baseStyles = (topStyles,theme,palette) => {
	
	const
		{primary,accent,text,secondary} = palette
	
	return [makeComponentStyles(theme,palette),{
		color: text.primary,
		fill: text.secondary,
		backgroundColor: Transparent,//primary.hue2 //primary.hue2//,text.primary
		
		menu: [{
			
		}],
		
		icon: [{
			fill: text.secondary,
			transform: 'translate(0,-0.6rem)'
		}],
		
		list: {
			padding: 0,
			paddingTop: 0,
			paddingBottom: 0,
			backgroundColor: 'transparent'
		},
		
		menuItem: [{
			//color: accent.hue1,
			
			content: [{
				//color: accent.hue1
			}]
		}],
		
		item: [FlexRowCenter,makePaddingRem(0,1,0,0),{
			backgroundColor: primary.hue2,
			color: text.primary,
			hover: {
				color: text.primary + ' !important',
				backgroundColor: accent.hue1 + ' !important'
			}
			
		}],
		
		label: [FlexScale, FillHeight,FlexRow,makeFlexAlign('center','flex-start'),Ellipsis, makePaddingRem(0,2,0,0), {
			color: accent.hue1,
			fontWeight: 500,
			letterSpacing: rem(0.1),
			fontSize: themeFontSize(1.2),
			top: 'auto'
			
		}]
	}]
}




/**
 * ISelectProps
 */
export interface ISelectFieldProps extends IThemedAttributes {
	
	/**
	 * Id is required
	 */
	id?:string
	
	/**
	 * Show drop down arrow
	 */
	showIcon?:boolean
	
	/**
	 * Style drop down arrow
	 */
	iconStyle?:any
	
	/**
	 * All the items in the list
	 */
	items:ISelectFieldItemProps[]
	
	/**
	 * Currently selected item - must be a "value" in the list of items
	 */
	value:any
	
	/**
	 * On item selected
	 *
	 * @param item
	 * @param index
	 */
	onItemSelected:(item:ISelectFieldItem,index?:number) => any
	
	/**
	 * On escape key pressed
	 */
	onEscape?:() => any
	
	
	/**
	 * Enable filtering by text
	 */
	showFilter?:boolean
	
	/**
	 * Filter field style
	 */
	filterStyle?:any
	
	/**
	 * Filter input style
	 */
	filterInputStyle?:any
	
}

/**
 * ISelectState
 */
export interface ISelectFieldState {
	/**
	 * Open or closed
	 */
	open?:boolean
	
	/**
	 * Selected index
	 */
	selectedIndex?:number
	
	/**
	 * Backup id
	 */
	id?:string
	
	/**
	 * Filtering text
	 */
	filterText?:string
	
	/**
	 * Component ref
	 */
	rootRef?:any
	
	/**
	 * DOM node ref
	 */
	rootRefElem?:any
}

/**
 * Select
 *
 * @class Select
 * @constructor
 **/

@ThemedStyles(baseStyles,'dialog')
@PureRender
export class SelectField extends React.Component<ISelectFieldProps,ISelectFieldState> {
	
	static defaultProps = {
		underlineShow: true
	}
	
	constructor(props,context) {
		super(props,context)
		
		this.state = {
			open: false,
			id: `select-field-${shortId()}`,
			selectedIndex: 0
		}
	
	}

	commandItems = makeCommandBuilder(this)
	
	
	get commandComponentId() {
		return this.id
	}

	
	get id():string {
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
	onItemSelected = (item?:ISelectFieldItem,index?:number) => {
		
		if (!item) {
			index = this.state.selectedIndex
			item = this.props.items[ index ]
		}
		
		guard(() => this.props.onItemSelected(item,index))
	}
	
	/**
	 * Update state
	 *
	 * @returns {any}
	 */
	private updateState = (props = this.props) => {
		
	}
	
	/**
	 * Move the selected index
	 *
	 * @param increment
	 */
	moveSelection = increment => {
		
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
			{ placeholder,styles,style,showFilter,filterStyle,filterInputStyle,iconStyle,value,items } = this.props,
			{filterText,open} = this.state,
			{id} = this
		
		return <CommandRoot
			id={this.state.id}
			component={this}
			ref={this.setRootRef}
			style={makeStyle(
				Styles.FlexRow,
				makeFlexAlign('center','flex-start'),
				style
			)}
		>
			
			
			
			<Popover
				canAutoPosition={false}
				open={open}
				anchorOrigin={{
						vertical: 'bottom',
						horizontal: 'left',
					}}
				targetOrigin={{
						vertical: 'top',
						horizontal: 'left',
					}}
				anchorEl={this.state.rootRefElem}
				useLayerForClickAway={false}
			>
			
				<div style={styles.items}>
					
				</div>
			
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
				style={makeStyle({
					zIndex:999,
					top:0,
					left:0,
					maxWidth: '60%'
				},filterStyle)}
				inputStyle={filterInputStyle}
				value={filterText || ''}
			/>
			
		 
		
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


function SelectFieldItem(props:ISelectFieldItemProps) {
	
	const
		{
			value,
			style,
			content,
			contentStyle,
			leftAccessory,
			leftAccessoryStyle,
			rightAccessory,
			rightAccessoryStyle
		} = props
	
	return <FlexRowCenter style={style}>
		{/* LEFT ACCESSORY*/}
		{leftAccessory && <Flex style={leftAccessoryStyle} /> }
		
		{/* CONTENT */}
		<FlexScale style={[
			Styles.FlexScale,
			contentStyle
		]}>
			{content}
		</FlexScale>
		
		{/* RIGHT ACCESSORY*/}
		{rightAccessory && <Flex style={rightAccessoryStyle} /> }
	</FlexRowCenter>
}


/**
 * Commands
 */
function makeCommandBuilder(selectField:SelectField) {
 return (builder:CommandContainerBuilder) =>
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