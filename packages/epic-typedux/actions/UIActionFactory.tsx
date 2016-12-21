import { ActionFactory, ActionReducer,  ActionMessage } from "typedux"
import { List, Map } from "immutable"
import {
	UIKey,
	isNumber,
	isString,
	nilFilter, guard
} from "epic-global"
import { UIState } from "../state/UIState"
import { Provided, shortId, cloneObjectShallow, getValue, If, focusElementById } from "epic-global"
 
import {getWindowManagerClient} from "epic-process-manager-client"
import { WindowConfigDialogDefaults } from "epic-process-manager-client/WindowConfig"
import ViewState from "epic-typedux/state/window/ViewState"
import { toolPanelsSelector } from "epic-typedux/selectors/UISelectors"
import { windowsSelector } from "epic-typedux/selectors"


// Import only as type - in case we are not on Renderer
const
	log = getLogger(__filename),
	{Left,Right,Bottom,Popup} = ToolPanelLocation

/**
 * Quit Epictask
 */
function quitApp() {
	require('electron').remote.app.quit()
}


declare global {
	
	interface IUIActionFactory extends UIActionFactory {
	}
	
	/**
	 * Add the UIActions Injector
	 */
	namespace Inject {
		namespace Service {
			const UIActions: IInjector<IUIActionFactory>
		}
	}
	
	/**
	 * Add the service to the registry
	 */
	namespace Registry {
		namespace Service {
			const UIActions:IUIActionFactory
		}
	}
}


@ServiceRegistryScope.Register
@Provided
export class UIActionFactory extends ActionFactory<UIState,ActionMessage<UIState>> {
	
	static ServiceName = "UIActions"
	
	static leaf = UIKey
	
	constructor() {
		super(UIState)
	}
	
	leaf():string {
		return UIKey;
	}
	
	/**
	 * Create a predicate for finding a tool panel
	 *
	 * @param id
	 * @param location
	 */
	private toolPanelPredicate = (id:string,location:ToolPanelLocation) =>
		(it:IToolPanel) =>
			it.location === location &&
			(it.location !== Popup || it.id === id)
	
	
	
	/**
	 * Get the a tool's parent panel
	 *
	 * @param toolId
	 * @param state
	 * @returns {IToolPanel}
	 */
	getToolParentPanel(toolId:string, state:UIState = this.state):IToolPanel {
		return state.toolPanels.valueSeq().find(it => !!it.tools.get(toolId))
	}
	
	
	/**
	 * Get tool by id
	 *
	 * @param toolId
	 * @param state
	 * @returns {any}
	 */
	getTool(toolId:string, state:UIState = this.state):ITool {
		const
			panels = state.toolPanels.valueSeq()
		
		let
			tool:ITool
		
		
		for (let panel of panels.toArray()) {
			tool = panel.tools.get(toolId)
			
			if (tool)
				break
		}
		
		return tool
	}
	
	
	/**
	 * Update all registered tools for the registry
	 */
	updateRegisteredTools() {
		const
			regs = ToolRegistryScope.getToolRegistrations(),
			tools =
				nilFilter(regs)
					.map(reg => {
						let
							tool = this.getTool(reg.id)
						
						if (!tool) {
							tool = cloneObjectShallow(reg, {
								active: false,
								data: {}
							}) as ITool
						} else {
							tool = cloneObjectShallow(tool,reg)
						}
						
						 
						
						return tool
						
					})
		
		
		this.updateTool(...tools)
		
	}

	
	
	
	/**
	 * Open a specific tool
	 *
	 * @param toolId
	 * @param forceState
	 */
	toggleTool(toolId:string,forceState:boolean = null) {
		const
			tool = this.getTool(toolId)
		
		assert(tool,`Unable to find tool with id ${toolId}`)
		
		this.updateTool(cloneObjectShallow(tool,{
			active:!_.isNil(forceState) ? forceState : !tool.active
		}))
	}
	
	getToolPanels(state:UIState = null) {
		return getValue(() => state.toolPanels,toolPanelsSelector(getStoreState())) || Map<string,IToolPanel>()
	}
	
	/**
	 * Internal method used a few times to update panel
	 * @param state
	 * @param panel
	 * @returns {Map<string, Map<string, IToolPanel>>}
	 */
	private doPanelUpdate(state:UIState,panel:IToolPanel) {
		
		
		return state.set(
			'toolPanels',
			state.toolPanels.set(
				panel.id,
				cloneObjectShallow(panel)
			)
		)
	}
	
	@ActionReducer()
	setToolDragging(dragging:boolean) {
		return (state:UIState) => state.set('toolDragging',dragging)
	}
	
	/**
	 * Remove a tool from a tool panel
	 *
	 * @param toolId
	 * @returns {(state:UIState)=>UIState}
	 */
	@ActionReducer()
	private removeToolFromPanel(toolId:string) {
		return (state:UIState) => {
			
			let
				toolPanels = this.getToolPanels(state),
				panel = this.getToolParentPanel(toolId,state)
			
			// IF TOOL ON PANEL THEN REMOVE
			if (getValue(() => panel.tools[toolId])) {
				panel = cloneObjectShallow(panel)
				
				// REMOVE FROM TOOL MAP
				panel.tools = panel.tools.remove(toolId)
				
				// REMOVE FROM TOOL ID LIST
				panel.toolIds = panel.toolIds.filter(it => it !== toolId) as List<string>
				
				state = state.set('toolPanels',toolPanels.set(panel.id,panel)) as any
			}
			
			return state
		}
	}
	
	/**
	 * Add a tool to a given panel
	 *
	 * @param panelId
	 * @param tool
	 * @returns {(state:UIState)=>UIState}
	 */
	@ActionReducer()
	private addToolFromPanel(panelId:string,tool:ITool) {
		return (state:UIState) => {
			
			let
				existingPanel = this.getToolParentPanel(tool.id,state),
				toolPanels = this.getToolPanels(state),
				panel = toolPanels.get(panelId)
			
			assert(!existingPanel || existingPanel.id === panelId, `A tool can not be added to multiple panels`)
			
			// IF NOT TOOL ON PANEL THEN ADD
			if (!getValue(() => panel.tools.get(tool.id))) {
				
				panel = cloneObjectShallow(panel)
				panel.tools = panel.tools.set(tool.id,cloneObjectShallow(tool))
				panel.toolIds = panel.toolIds.push(tool.id)
				
				state = state.set('toolPanels',toolPanels.set(panelId,panel)) as any
			}
			
			return state
		}
	}
	
	
	
	/**
	 * Move a tool to a new panel
	 *
	 * @param tool
	 * @param panelId
	 */
	
	moveToolToPanel(panelId:string,tool:ITool) {
		const
			currentPanel = this.getToolParentPanel(tool.id)
		
		if (currentPanel && currentPanel.id === panelId) {
			log.debug(`Tool (${tool.id}) is already in panel ${panelId}`)
			return
		}
		
		this.removeToolFromPanel(tool.id)
		this.addToolFromPanel(panelId,tool)
	}
	
	/**
	 * Update a tool
	 * 
	 * @param tools
	 * @returns {(state:UIState)=>UIState}
	 */
	@ActionReducer()
	updateTool(...tools:ITool[]) {
		return (state:UIState) => {
			let
				toolPanels = state.toolPanels
			
			tools.forEach(tool => {
				// FIND THE NEW AND OLD PANEL
				const
					parentPanel =
						this.getToolParentPanel(tool.id,state) ||
						this.getToolPanel(tool.defaultLocation)
				
				assert(parentPanel, `Unable to locate existing panel or find default for ${tool.id} w/defaultLocation ${tool.defaultLocation}`)
				
				const
					panel = cloneObjectShallow(parentPanel)
				
				panel.tools = panel.tools.set(tool.id,cloneObjectShallow(tool))
				
				if (panel.toolIds.indexOf(tool.id) === -1)
					panel.toolIds = panel.toolIds.push(tool.id)
				
				panel.open = panel.tools.valueSeq().some(it => it.active)
				toolPanels = toolPanels.set(panel.id,panel)
				
			})
			
			
			
			return state.set('toolPanels',toolPanels)	as UIState
			
		}
	}
	
	
	@ActionReducer()
	updateToolPanel(panel:IToolPanel) {
		return (state:UIState) => this.doPanelUpdate(state,panel)
	}
	
	/**
	 * Get tool panel state
	 *
	 * @param location
	 * @returns {IToolPanel}
	 */
	getToolPanel(location:ToolPanelLocation):IToolPanel
	
	/**
	 * Get tool panel state
	 *
	 * @param id
	 * @returns {IToolPanel}
	 */
	getToolPanel(id:string):IToolPanel
	getToolPanel(idOrLocation:string|ToolPanelLocation):IToolPanel {
		const id:string = (isNumber(idOrLocation)) ? ToolPanelLocation[idOrLocation] : idOrLocation
		
		assert(id,'Location can not be nil')
		return toolPanelsSelector(getStoreState()).get(id)
	}
	
	/**
	 * Register a tool panel (Excludes windows, windows must have id)
	 *
	 * @param location
	 */
	registerToolPanel(location:ToolPanelLocation)
	/**
	 * Register a tool panel with an id
	 *
	 * @param id
	 * @param location
	 */
	registerToolPanel(id:string,location:ToolPanelLocation)
	registerToolPanel(
		idOrLocation:string|ToolPanelLocation,
		location:ToolPanelLocation = null
	) {
		
		
		let id:string
		
		if (isString(idOrLocation)) {
			id = idOrLocation
			assert(location && ToolPanelLocation[location],'If two params provided then the second must be a valid ToolPanelLocation')
		} else {
			id = shortId()
			location = idOrLocation
		}
		
		let panel = this.getToolPanel(id)
		//debugger
		
		if (panel)
			id = panel.id
		else {
			panel = {
				id,
				location,
				open: [Popup,Left].includes(location),
				isDefault: Left === location,
				tools:Map<string,ITool>(),
				toolIds: List<string>()
			}
			this.updateToolPanel(panel)
		}
		
		
		return id
	}
	
	
	/**
	 * Register a tool in the app
	 *
	 * @param tool
	 */
	registerTool(tool:ITool) {
		const
			existingTool = this.getTool(tool.id),
			completeTool = cloneObjectShallow(tool,_.pick(existingTool || {},'data','active')) as ITool
		
		
		completeTool.active = _.isNil(completeTool.active) ? false : completeTool.active
		completeTool.data = _.isNil(completeTool.data) ? {} : completeTool.data
		
		this.updateTool(completeTool)
		
	}
	
	/**
	 * Quit the app
	 */
	quit() {
		quitApp()
	}
	
	/**
	 * Create a window config with default opts and a url
	 *
	 * @param opts
	 * @param uri
	 */
	private makeWindowConfig(opts,uri:string = null):IWindowConfig {
		return cloneObjectShallow(WindowConfigDialogDefaults,uri && {
			uri
		}) as IWindowConfig
	}
	
	/**
	 * Close a window
	 *
	 * @param windowId
	 */
	closeWindow(windowId:number = getWindowId()) {
		const
			windows = windowsSelector(getStoreState()),
			wConfig = windows.find(it => it.id === windowId),
			normalWindowCount = windows.filter(it => it.type === WindowType.Normal).size
		
		if (wConfig.type === WindowType.Tray) {
			const
				wm = require('epic-process-manager-client').getWindowManagerClient(),
				wInstance = wm.getWindowInstance(windowId)
			
			guard(() => wInstance.window.hide())
		} else if (wConfig.type !== WindowType.Normal || normalWindowCount > 1) {
			getWindowManagerClient().close(windowId)
		}	else {
			quitApp()
		}
		
		
	}
	
	/**
	 * Open a window with a URI
	 *
	 * @param uri
	 */
	openWindow(uri:string)
	/**
	 * Open a window with a config
	 *
	 * @param config
	 */
	openWindow(config:IWindowConfig)
	openWindow(configOrURI:IWindowConfig|string){
		let
			config:IWindowConfig
		
		if (isString(configOrURI)) {
			config = this.makeWindowConfig(WindowConfigDialogDefaults,configOrURI)
		} else {
			config = this.makeWindowConfig(configOrURI)
		}
		
		getWindowManagerClient().open(config)
	}
	
	
	/**
	 * Focus on app root
	 */
	focusAppRoot() {
		If(ProcessConfig.isUI(),() => focusElementById('appRoot'))
	}
	
	/**
	 * Focus on issues panel
	 */
	focusIssuesPanel() {
		If(ProcessConfig.isUI(),() => focusElementById('issuesPanel'))
	}
	
	/**
	 * Focus on issue details
	 */
	focusIssueDetailPanel() {
		If(ProcessConfig.isUI(),() => focusElementById('issueDetailPanel'))
	}
	
	/**
	 * Toggle status bar visibility
	 */
	@ActionReducer()
	toggleStatusBar() {
		return (state:UIState) =>
			state.set(
				'statusBar',
				cloneObjectShallow(state.statusBar,{
					visible:!state.statusBar.visible
				})
			)
	}
	
	/**
	 * Set the open sheet
	 *
	 * @param sheetURI
	 * @param sheetParams
	 */
	@ActionReducer()
	openSheet(sheetURI:string,sheetParams = {}) {
		return (state:UIState) => state
			.set('sheetURI',sheetURI)
			.set('sheetParams',sheetParams)
	}
	
	/**
	 * Close the current sheet
	 */
	closeSheet() {
		this.openSheet(null)
	}
	
	
	/**
	 * Set the selected view state id
	 *
	 * @param selectedViewStateId
	 * @returns {(state:UIState)=>Map<string, string>}
	 */
	@ActionReducer()
	setSelectedViewStateId(selectedViewStateId:string) {
		return (state:UIState) => state.set("selectedViewStateId",selectedViewStateId)
	}
	
	/**
	 * Create a new view
	 *
	 * @param viewConfig
	 * @returns {(state:any)=>any}
	 */
	@ActionReducer()
	createView(viewConfig:IViewConfig) {
		return state => {
			const
				id = shortId(),
				//initialState = new (viewConfig.stateClazz)(),
				viewState = new ViewState(cloneObjectShallow(viewConfig,{
					id,
					name: viewConfig.name,
					index: state.viewStates.size,
					//controller: viewConfig.controllerClazz && new (viewConfig.controllerClazz)(id,initialState),
					//state: initialState
				}))
			
			
			
			return state.set('viewStates', state.viewStates.push(viewState))
		}
	}
	
	/**
	 * Update view
	 *
	 * @param viewState
	 * @returns {(state:UIState)=>(UIState|Map<string, List<ViewState>>)}
	 */
	@ActionReducer()
	updateView(viewState:ViewState) {
		return (state:UIState) => {
			const
				index = state.viewStates.findIndex(it => it.id === viewState.id)
			
			if (index === -1) {
				log.warn(`Unable to find view state in views`,viewState)
				return state
			}
			
			
			
			return state.set('viewStates',
				state.viewStates.set(
					index,
					viewState.set('index',index) as ViewState)
			)
		}
	}
	
	/**
	 * Remove a view
	 *
	 * @param id
	 * @returns {(state:UIState)=>UIState}
	 */
	@ActionReducer()
	removeView(id:string) {
		return (state:UIState) => {
			const
				index = state.viewStates.findIndex(it => it.id === id)
			
			if (state.viewStates.size > 1) {
				if (index > -1)
					state = state.set('viewStates', state.viewStates.remove(index)) as any
				
				if (state.selectedViewStateId === id)
					state = state.set('selectedViewStateId', state.viewStates.get(0)) as any
			}
			
			return state
		}
			
	}


}

export default UIActionFactory