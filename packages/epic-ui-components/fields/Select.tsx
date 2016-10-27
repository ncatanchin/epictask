// Imports
import { PureRender, makeComponentStyles } from "epic-ui-components"
import { ThemedStyles } from "epic-styles"
import { MenuItem, SelectField } from "material-ui"
import { shallowEquals } from "epic-global"
import filterProps from "react-valid-props"
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


export interface ISelectItem {
	key:string|number
	value:string|number
	node: React.ReactElement<any>|string
	
	data?:any
}

/**
 * ISelectProps
 */
export interface ISelectProps {
	onKeyDown?:(event:React.KeyboardEvent<any>) => any
	style?:any
	iconStyle?:any
	menuStyle?:any
	listStyle?:any
	labelStyle?:any
	itemStyle?:any
	underlineShow?:boolean
	
	theme?:any
	styles?:any
	value:any
	
	onSelect:(item:ISelectItem,index?:number) => any
	items:ISelectItem[]
}

/**
 * ISelectState
 */
export interface ISelectState {
	menuItems?:any[]
}

/**
 * Select
 *
 * @class Select
 * @constructor
 **/

@ThemedStyles(baseStyles)
@PureRender
export class Select extends React.Component<ISelectProps,ISelectState> {
	
	static defaultProps = {
		underlineShow: true
	}
	
	/**
	 * on select
	 *
	 * @param event
	 * @param index
	 * @param value
	 */
	private onChange = (event,index:number,value:any) => {
		const
			{onSelect,items} = this.props,
			item = items[index]
		
		if (!item) {
			return log.error(`No item found at index ${index}`,event,index,value,items)
		}
		
		onSelect(item,index)
	}
	
	
	private updateState = (props = this.props) => {
		const
			{items,itemStyle,styles} = props
		
		this.setState({
			menuItems: items.map(item =>
				<MenuItem key={item.key}
				          value={item.value || ''}
				          style={makeStyle(styles.menuItem,itemStyle)}
				          innerDivStyle={makePaddingRem(0.3,0.5)}
				          primaryText={<div style={styles.menuItem.content}>{item.node}</div>} />
			)
		})
	}
	
	/**
	 * On mount create menu items
	 */
	componentWillMount = this.updateState
	
	/**
	 * If new items - recreate menu items
	 *
	 * @param nextProps
	 * @param nextContext
	 */
	componentWillReceiveProps(nextProps:ISelectProps, nextContext:any):void {
		if (!shallowEquals(this.props,nextProps,'items'))
			this.updateState(nextProps)
	}
	
	render() {
		const { theme, styles,style,underlineShow,iconStyle,menuStyle,listStyle,labelStyle,value } = this.props
		
		return <SelectField
			{...filterProps(this.props)}
			value={value || ''}
			tabIndex={-1}
			style={makeStyle(styles,style)}
			inputStyle={styles.input}
			labelStyle={makeStyle(styles.label,labelStyle)}
			iconStyle={makeStyle(styles.icon,iconStyle)}
			
			onChange={this.onChange}
			
			menuStyle={makeStyle(styles.menu,menuStyle)}
			menuListStyle={makeStyle(styles.list,listStyle)}
			underlineStyle={styles.input.underlineDisabled}
			underlineDisabledStyle={styles.input.underlineDisabled}
			underlineFocusStyle={styles.input.underlineFocus}
			
			underlineShow={underlineShow}
			fullWidth={true}
		>
			
			{this.state.menuItems}
		</SelectField>
	}
	
}