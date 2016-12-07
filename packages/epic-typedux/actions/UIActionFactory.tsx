import { ActionFactory, ActionReducer,  ActionMessage } from "typedux"
import { List, Map } from "immutable"
import {
	UIKey,
	isNumber,
	isString,
	ToolPanelLocation,
	ITool,
	IToolPanel,
	RegisterActionFactory,
	getToolRegistrations, nilFilter,
	uuid
} from "epic-global"
import { UIState } from "../state/UIState"
import { Provided, shortId, cloneObjectShallow, getValue, cloneObject, If, focusElementById } from "epic-global"
 
import {getWindowManagerClient} from "epic-process-manager-client"
import { WindowConfigDialogDefaults } from "epic-process-manager-client/WindowConfig"
import ViewState from "epic-typedux/state/window/ViewState"
import { toolPanelsSelector } from "epic-typedux/selectors/UISelectors"
import DefaultViews from "epic-typedux/state/window/DefaultViews"



// Import only as type - in case we are not on Renderer
const
	log = getLogger(__filename),
	{Left,Right,Bottom,Popup} = ToolPanelLocation



@RegisterActionFactory
@Provided
export class UIActionFactory extends ActionFactory<UIState,ActionMessage<UIState>> {
	
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
			regs = getToolRegistrations(),
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
	 * Set the repo panel open/closed
	 *
	 * @param open
	 * @returns {(state:UIState)=>Map<string, boolean>}
	 */
	@ActionReducer()
	setRepoPanelOpen(open:boolean) {
		return (state:UIState) => state.set('repoPanelOpen',open)
	}

	@ActionReducer()
	clearNotifications() {
		return (state:UIState) => state.set('messages',List())
	}
	
	


	


	





	@ActionReducer()
	setTheme(theme:any) {
		return (state:UIState) => state.set('theme',theme)
	}
	
	
	/**
	 * Close a window
	 *
	 * @param windowId
	 */
	closeWindow(windowId:string = getWindowId()) {
		getWindowManagerClient().close(windowId)
	}
	
	
	
	
	// @ActionThunk()
	// setDialogOpen(name:string,open:boolean) {
	// 	return (state:UIState) => {
	//
	// 		if (ProcessConfig.isType(ProcessType.UI)) {
	// 			const
	// 				windowManager = getWindowManager()
	//
	// 			if (open)
	// 				windowManager.openDialog(name)
	// 			else
	// 				windowManager.close(name)
	// 		}
	//
	// 		this.internalSetDialogOpen(name,open)
	// 	}
	// }
	
	openWindow(uri:string)
	openWindow(config:IWindowConfig)
	openWindow(configOrURI:IWindowConfig|string){
		let
			config:IWindowConfig
		
		if (isString(configOrURI)) {
			config = cloneObjectShallow(WindowConfigDialogDefaults,{
				uri:configOrURI
			}) as any
		} else
			config = cloneObjectShallow(configOrURI)
		
		getWindowManagerClient().open(config)
	}
	
		
	// /**
	//  * Close all dialogs
	//  *
	//  * @returns {(dispatch:any, getState:any)=>undefined}
	//  */
	// @ActionThunk()
	// closeAllWindows() {
	// 	return (dispatch,getState) => {
	//
	// 		if (ProcessConfig.isType(ProcessType.UI)) {
	// 			getWindowManager().closeAll()
	// 		}
	//
	// 		this.internalCloseAllWindows()
	// 	}
	// }

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
	 */
	@ActionReducer()
	openSheet(sheetURI:string) {
		return (state:UIState) => state.set('sheetURI',sheetURI)
	}
	
	/**
	 * Close the current sheet
	 */
	closeSheet() {
		this.openSheet(null)
	}
	
	
	
	@ActionReducer()
	createView(viewConfig:IViewConfig) {
		return state => {
			const
				id = shortId(),
				//initialState = new (viewConfig.stateClazz)(),
				viewState = new ViewState(cloneObjectShallow(viewConfig,{
					id,
					index: state.viewStates.size,
					//controller: viewConfig.controllerClazz && new (viewConfig.controllerClazz)(id,initialState),
					//state: initialState
				}))
			
			
			
			return state.set('viewStates', state.viewStates.push(viewState))
		}
	}
	
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
	
	



}

export default UIActionFactory