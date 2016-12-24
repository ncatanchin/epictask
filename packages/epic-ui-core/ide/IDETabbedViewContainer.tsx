// Imports
import { List } from "immutable"
import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import { cloneObjectShallow, guard, ContextMenu } from "epic-global"
import { ViewProvider, PureRender, Icon } from "epic-ui-components"
import { IThemedAttributes, ThemedStyles } from "epic-styles"
import { View, getUIActions, tabViewsSelector, selectedTabViewIdSelector } from "epic-typedux"
import { getValue } from "typeguard"
import baseStyles from "./IDETabbedViewContainer.styles"
import ViewTab from "./ViewTab"

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * IViewContainerProps
 */
export interface IIDETabbedViewContainerProps extends IThemedAttributes {
	tabViews?:List<View>
	selectedTabViewId?:string
}

/**
 * IViewContainerState
 */
export interface IIDETabbedViewContainerState {
	defaultViewConfig?:IViewConfig
	viewConfigs?:IViewConfig[]
	
	unsubscribe?:any
}

/**
 * ViewContainer
 *
 * @class ViewContainer
 * @constructor
 **/

@connect(createStructuredSelector({
	tabViews: tabViewsSelector,
	selectedTabViewId: selectedTabViewIdSelector
}))
@ThemedStyles(baseStyles)
@PureRender
export class IDETabbedViewContainer extends React.Component<IIDETabbedViewContainerProps,IIDETabbedViewContainerState> {
	
	/**
	 * Get the current selected view state id
	 *
	 * @returns {any}
	 */
	private get selectedTabViewId() {
		let
			{ tabViews, selectedTabViewId } =  this.props
		
		const
			exists = selectedTabViewId && tabViews.findIndex(it => it.id === selectedTabViewId) > -1
		
		return exists ? selectedTabViewId : getValue(() => tabViews.get(0).id)
		
	}
	
	/**
	 * Ensure we have at least one view or create the default
	 *
	 * @param props
	 */
	private checkDefaultView = (props = this.props) => {
		const
			{ tabViews } = props
		
		let
			defaultViewConfig = getValue(() => this.state.defaultViewConfig)
		
		
		// MAKE SURE WE HAVE A DEFAULT
		if (defaultViewConfig !== ViewRegistryScope.getDefault()) {
			defaultViewConfig = ViewRegistryScope.getDefault()
			
			this.setState({ defaultViewConfig })
		}
		
		// MAKE SURE WE HAVE AT LEAST 1 VIEW
		if (tabViews.size < 1 && defaultViewConfig) {
			getUIActions().createTabView(cloneObjectShallow(defaultViewConfig))
		}
	}
	
	/**
	 * Update the view configs from the registry
	 */
	private updateViewConfigs = () => this.setState({
		viewConfigs: ViewRegistryScope.all()
	})
	
	/**
	 * On view configs changed - update
	 */
	private onViewConfigsChanged = () => this.updateViewConfigs()
	
	/**
	 * On mount check tabViews
	 */
	componentWillMount() {
		this.setState({
			viewConfigs: ViewRegistryScope.all(),
			unsubscribe: EventHub.on(EventHub.ViewsChanged, this.onViewConfigsChanged)
		}, this.checkDefaultView)
	}
	
	componentWillUnmount() {
		guard(() => this.state.unsubscribe())
		
		this.setState({
			unsubscribe: null
		})
	}
	
	/**
	 * On new props check tabViews
	 */
	componentWillReceiveProps = this.checkDefaultView
	
	
	/**
	 * SHow create popup
	 */
	private showViewConfigs = () => {
		const
			viewConfigs = getValue(() => this.state.viewConfigs),
			menu =
				ContextMenu.create()
		
		if (getValue(() => viewConfigs.length, 0) < 1)
			return
		
		viewConfigs.forEach(viewConfig =>
			menu.addCommand(viewConfig.name, () => getUIActions().createTabView(viewConfig))
		)
		
		// SHOW THE MENU
		menu.popup()
		
	}
	
	/**
	 * Render the view container
	 *
	 * @returns {any}
	 */
	render() {
		let
			{ styles, tabViews } = this.props,
			{ selectedTabViewId } = this
		
		tabViews = tabViews.filter(it => getValue(() => it.id, null) !== null) as any
		
		const
			view = tabViews.find(it => it.id === selectedTabViewId)
		
		if (!view || !tabViews || !tabViews.size || !selectedTabViewId)
			return React.DOM.noscript()
		
		
		return <div style={[
			Styles.FlexScale,
			Styles.FillHeight,
			Styles.FlexColumn,
			Styles.OverflowHidden
		]}>
			<div style={styles}>
				<div style={[styles.tabBar]}>
					
					<div key="tabs" style={styles.tabBar.tabs}>
						{tabViews.map((it, index) =>
							<ViewTab
								key={it.id}
								selected={selectedTabViewId === it.id}
								styles={mergeStyles(styles.tabBar.tab,index === 0 && styles.tabBar.tab.first)}
								closeEnabled={tabViews.size > 1}
								view={it}/>)
						}
					</div>
					{/* New Tab Button */}
					<Icon
						style={styles.tabBar.newTabButton}
						onClick={this.showViewConfigs}>
						add
					</Icon>
					
					<div key="bottomBorder" style={styles.tabBar.bottomBorder}/>
				</div>
				<div id="viewContainerContent" style={[styles.content]}>
					<ViewProvider key={view.id} view={view}/>
				</div>
			</div>
		</div>
	}
	
}

