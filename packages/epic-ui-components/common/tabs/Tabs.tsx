// Imports

import { FlexColumn, FlexRow,FlexScale, FlexColumnCenter, FlexRowCenter } from '../FlexLayout'
import { PureRender } from '../PureRender'

import { IThemedAttributes, ThemedStyles } from 'epic-styles'
import { getValue, isNil, isFunction, isString } from "typeguard"
import { TabTemplate } from "./TabTemplate"
import { colorAlpha } from "epic-styles/styles"
import { guard } from "epic-global"

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, secondary,accent, alternateText,background } = palette
	
	return [ Styles.FlexScale, {
		tabs: [ {
			
			backgroundColor: primary.hue3,
			
			/**
			 * Tab button styles
			 */
			tab: [ Styles.CursorPointer, Styles.makePaddingRem(1), Styles.makeTransition(['background-color']), {
				
				color: text.primary,
				
				[":hover"]: {
					backgroundColor: colorAlpha(secondary.hue1,0.5),
					
				},
				
				selected: [ {
					backgroundColor: accent.hue1
				} ],
				
				label: [Styles.makeTransition(['transform']), {
					transform: 'none',
					
					':hover': {
						transform: 'scale(1.1)'
					},
					
					selected: [ {
						transform: 'scale(1.05)',
					} ]
				} ]
			} ]
		} ]
	} ]
}

/**
 * Shape of tabs to be passed in
 */
export interface ITab {
	id?: string
	title: any
	content: React.ReactNode
	
}

/**
 * ITabsProps
 */
export interface ITabsProps extends IThemedAttributes {
	tabId?:string
	tabs: ITab[]
	onTabChanged?:(tab:ITab,index?:number) => any
	template?: any
}

/**
 * ITabsState
 */
export interface ITabsState {
	selectedIndex?: number
}

/**
 * Tabs
 *
 * @class Tabs
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class Tabs extends React.Component<ITabsProps,ITabsState> {
	
	static defaultProps = {
		template: TabTemplate
	}
	
	get selectedIndex() {
		return getValue(() => this.state.selectedIndex)
	}
	
	set selectedIndex(selectedIndex: number) {
		this.setState({ selectedIndex })
	}
	
	/**
	 * New tabs
	 *
	 * @param props
	 * @param context
	 */
	constructor(props, context) {
		super(props, context)
	}
	
	/**
	 * Update state
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		let
			{ tabs } = props,
			{ selectedIndex } = this
		
		if (getValue(() => tabs.length, 0) < 1) {
			log.warn(`No tabs passed in`)
			return
		}
		
		if (isNil(selectedIndex) || selectedIndex >= tabs.length)
			this.selectedIndex = 0
		
	}
	
	
	/**
	 * Update index on mount
	 */
	componentWillMount = this.updateState
	
	/**
	 * Update index on new props
	 */
	componentWillReceiveProps = this.updateState
	
	
	render() {
		const
			{ tabId,tabs, onTabChanged,styles, template:TabContentWrapper } = this.props
		let
			{ selectedIndex } =  this
		
		if (!isNil(tabId))
			selectedIndex = tabs.findIndex(it => it.id === tabId)
		
		
		let
			content = getValue(() => tabs[ selectedIndex ].content,null)
		
		if (selectedIndex === -1 || !content || tabs.length === 0)
			return React.DOM.noscript()
		
		return <FlexColumn flex="scale" style={[Styles.FillWidth,Styles.FlexScale]}>
			<FlexRowCenter style={[Styles.FillWidth,styles.tabs]}>
				{tabs.map((tab, index) => {
					const
						selected = index === selectedIndex
					
					return <TabButton
						key={index}
						styles={styles.tabs.tab}
						onClick={() => {
							log.debug(`Tab button pressed`,tab,index,onTabChanged)
							guard(() => onTabChanged(tab,index))
							if (isNil(tabId))
								this.selectedIndex = index
						}}
						title={tab.title}
						tab={tab}
						index={index}
						selected={selected}/>
					
				})}
			</FlexRowCenter>
			<div style={[Styles.FlexScale,Styles.FlexColumn,Styles.FillWidth]}>
				<TabContentWrapper>
				{content}
				</TabContentWrapper>
			</div>
		</FlexColumn>
	}
	
}

/**
 * Tab Button
 */
@Radium
class TabButton extends React.Component<any,any> {
	
	constructor(props,context) {
		super(props,context)
		this.state = {}
	}
	
	render() {
		const
			{styles, onClick, tab, title, index, selected } = this.props
		
		return <div
			style={[Styles.FlexColumnCenter,Styles.FlexScale,styles,selected && styles.selected]}
			onClick={onClick}
		>
			<div
				key="label"
				style={[Styles.FlexColumnCenter,styles.label,selected && styles.label.selected]}
			>
				{isFunction(title) ? <title {...{ index, selected, tab }} /> : title }
			</div>
		</div>
	}
}