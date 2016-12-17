// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector} from 'reselect'
import { View,PureRender } from 'epic-ui-components'
import { IThemedAttributes, Themed, ThemedStyles } from 'epic-styles'
import { viewStatesSelector } from "epic-typedux/selectors/UISelectors"
import ViewState from "epic-typedux/state/window/ViewState"

import { getUIActions } from "epic-typedux/provider/ActionFactoryProvider"
import { cloneObjectShallow, guard, ContextMenu } from "epic-global"
import { getValue, isDefined } from 'typeguard'
import { selectedViewStateIdSelector } from "epic-typedux/selectors"
import { Icon } from "epic-ui-components/common/icon/Icon"
import baseStyles from "epic-ui-core/ide/IDETabbedViewController.styles"
import { isHovering } from "epic-styles/styles"

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

const
	{FlexColumn,FlexRowCenter,FlexAuto,FlexScale,FillWidth,FillHeight} = Styles


/**
 * IViewContainerProps
 */
export interface IIDETabbedViewContainerProps extends IThemedAttributes {
	viewStates?: List<ViewState>
	selectedViewStateId?:string
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
	viewStates: viewStatesSelector,
	selectedViewStateId: selectedViewStateIdSelector
}))
@ThemedStyles(baseStyles)
@PureRender
export class IDETabbedViewContainer extends React.Component<IIDETabbedViewContainerProps,IIDETabbedViewContainerState> {
	
	/**
	 * Get the current selected view state id
	 *
	 * @returns {any}
	 */
	private get selectedViewStateId() {
		let
			{viewStates,selectedViewStateId} =  this.props
		
		const
			exists = selectedViewStateId && viewStates.findIndex(it => it.id === selectedViewStateId) > -1
		
		return exists ? selectedViewStateId : getValue(() => viewStates.get(0).id)
		
	}
	
	/**
	 * Ensure we have at least one view or create the default
	 *
	 * @param props
	 */
	private checkDefaultView = (props = this.props) => {
		const
			{viewStates} = props
		
		let
			defaultViewConfig = getValue(() => this.state.defaultViewConfig)
		
		if (defaultViewConfig !== ViewRegistryScope.getDefault()) {
			defaultViewConfig = ViewRegistryScope.getDefault()
			
			this.setState({defaultViewConfig})
		}
		
		// MAKE SURE WE HAVE AT LEAST 1 VIEW
		if (viewStates.size < 1 && defaultViewConfig) {
			getUIActions().createView(cloneObjectShallow(defaultViewConfig))
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
				.addCommand(viewConfig.name, () => getUIActions().createView(viewConfig))
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
			{ styles, viewStates } = this.props,
			{selectedViewStateId} = this
		
		viewStates = viewStates.filter(it => getValue(() => it.id,null) !== null) as any
		
		const
			viewState = viewStates.find(it => it.id === selectedViewStateId)
		
		if (!viewState || !viewStates || !viewStates.size || !selectedViewStateId)
			return React.DOM.noscript()
		
		
		
		return <div style={styles}>
			<div style={[styles.tabs]}>
				
				{/* New Tab Button */}
				<Icon
					style={styles.tabs.newTabButton}
				  onClick={this.showViewConfigs}>
					add
				</Icon>
				
				{viewStates.map(it =>
					<ViewStateTab
						key={it.id}
						selected={selectedViewStateId === it.id}
						styles={styles.tabs.tab}
						closeEnabled={viewStates.size > 1}
						viewState={it}/>)
				}
				<div key="spacer" style={styles.tabs.spacer}/>
			</div>
			<div id="viewContainerContent" style={[styles.content]}>
				<View key={viewState.id} viewState={viewState}/>
			</div>
		</div>
	}
	
}

/**
 * View state tab component
 */
@Radium
@PureRender
class ViewStateTab extends React.Component<any,any> {
	
	constructor(props,context) {
		super(props,context)
		this.state = {}
	}
	
	onClick = () => {
		const
			{viewState} = this.props
		
		log.info(`Clicked`,viewState.id,viewState)
		
	}
	
	render() {
		const
			{styles,viewState,selected,closeEnabled} = this.props,
			id = viewState.id,
			hovering = isHovering(this,"tab")
		
		log.info(`view state tab: ${id}`)
		return <div ref="tab"
		            style={[styles, selected && styles.selected]}
		            onClick={() => {
		            	log.info(`Clicked: ${id}`,viewState)
		            	getUIActions().setSelectedViewStateId(id)
		            }}>
			<div style={[styles.label]}>
				{viewState.title || 'No name'}
			</div>
			
			{closeEnabled &&
			<Icon
				onClick={() => getUIActions().removeView(id)}
				style={makeStyle(styles.closeButton,hovering && styles.closeButton.visible)}>close</Icon>
			}
		</div>
	}
}