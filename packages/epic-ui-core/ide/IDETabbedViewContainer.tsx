// Imports
import { List } from "immutable"
import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import { cloneObjectShallow, guard, ContextMenu } from "epic-global"
import { ViewProvider, PureRender, Icon } from "epic-ui-components"
import { IThemedAttributes, ThemedStyles } from "epic-styles"
import { View,viewsSelector, getUIActions } from "epic-typedux"
import { getValue } from "typeguard"
import baseStyles from "./IDETabbedViewContainer.styles"
import ViewTab from "./ViewTab"
import { ideViewsSelector, ideSelectedViewIdSelector } from "epic-typedux/selectors"

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * IViewContainerProps
 */
export interface IIDETabbedViewContainerProps extends IThemedAttributes {
	views?: List<View>
	selectedViewId?:string
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
	views: ideViewsSelector,
	selectedViewId: ideSelectedViewIdSelector
}))
@ThemedStyles(baseStyles)
@PureRender
export class IDETabbedViewContainer extends React.Component<IIDETabbedViewContainerProps,IIDETabbedViewContainerState> {
	
	/**
	 * Get the current selected view state id
	 *
	 * @returns {any}
	 */
	private get selectedViewId() {
		let
			{views,selectedViewId} =  this.props
		
		const
			exists = selectedViewId && views.findIndex(it => it.id === selectedViewId) > -1
		
		return exists ? selectedViewId : getValue(() => views.get(0).id)
		
	}
	
	/**
	 * Ensure we have at least one view or create the default
	 *
	 * @param props
	 */
	private checkDefaultView = (props = this.props) => {
		const
			{views} = props
		
		let
			defaultViewConfig = getValue(() => this.state.defaultViewConfig)
		
		if (defaultViewConfig !== ViewRegistryScope.getDefault()) {
			defaultViewConfig = ViewRegistryScope.getDefault()
			
			this.setState({defaultViewConfig})
		}
		
		// MAKE SURE WE HAVE AT LEAST 1 VIEW
		if (views.size < 1 && defaultViewConfig) {
			getUIActions().createView(cloneObjectShallow(defaultViewConfig),false)
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
	 * On mount check views
	 */
	componentWillMount() {
		this.setState({
			viewConfigs: ViewRegistryScope.all(),
			unsubscribe: EventHub.on(EventHub.ViewsChanged,this.onViewConfigsChanged)
		},this.checkDefaultView)
	}
	
	componentWillUnmount() {
		guard(() => this.state.unsubscribe())
		
		this.setState({
			unsubscribe: null
		})
	}
	
	/**
	 * On new props check views
	 */
	componentWillReceiveProps = this.checkDefaultView
	
	
	/**
	 * SHow create popup
	 */
	private showViewConfigs = () => {
		const
			viewConfigs = getValue(() => this.state.viewConfigs),
			menu =
				ContextMenu
					.create()
					// .addLabel(`Select view...`)
					// .addSeparator()
		
		if (getValue(() => viewConfigs.length,0) < 1)
			return
		
		viewConfigs.forEach(viewConfig => {
			menu
				.addCommand(viewConfig.name, () => getUIActions().createView(viewConfig,false))
		})
		
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
			{ styles, views } = this.props,
			{selectedViewId} = this
		
		views = views.filter(it => getValue(() => it.id,null) !== null) as any
		
		const
			view = views.find(it => it.id === selectedViewId)
		
		if (!view || !views || !views.size || !selectedViewId)
			return React.DOM.noscript()
		
		
		
		return <div style={styles}>
			<div style={[styles.tabBar]}>
				
				<div key="tabs" style={styles.tabBar.tabs}>
				{views.map((it,index) =>
					<ViewTab
						key={it.id}
						selected={selectedViewId === it.id}
						styles={mergeStyles(styles.tabBar.tab,index === 0 && styles.tabBar.tab.first)}
						closeEnabled={views.size > 1}
						view={it}/>)
				}
				</div>
				{/* New Tab Button */}
				<Icon
					style={styles.tabBar.newTabButton}
					onClick={this.showViewConfigs}>
					add
				</Icon>
				
				<div key="bottomBorder" style={styles.tabBar.bottomBorder} />
			</div>
			<div id="viewContainerContent" style={[styles.content]}>
				<ViewProvider key={view.id} view={view}/>
			</div>
		</div>
	}
	
}

