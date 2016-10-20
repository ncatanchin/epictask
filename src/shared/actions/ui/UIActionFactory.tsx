import * as uuid from 'node-uuid'
import {ActionFactory,ActionReducer,ActionThunk,ActionMessage} from 'typedux'
import {List,Map} from 'immutable'
import {UIKey} from "shared/Constants"
import {getBuiltInToolId, BuiltInTools} from 'shared/config/ToolConfig'
import {IToastMessage, ToastMessageType} from 'shared/models/Toast'
import {UIState} from 'shared/actions/ui/UIState'

import {Provided} from 'shared/util/ProxyProvided'
import {ToolPanelLocation, ITool,IToolPanel} from "shared/tools/ToolTypes"
import { isNumber, shortId, isString, cloneObjectShallow, getValue } from "shared/util"
import {cloneObject} from "shared/util"
import * as assert from "assert"
import { RegisterActionFactory } from "shared/Registry"
import { getWindowManager } from "ui/WindowManager"
import { If } from "shared/util/Decorations"
import { focusElementById } from "shared/util/UIUtil"
import { IUISheet } from "shared/config/WindowConfig"


// Import only as type - in case we are not on Renderer
const
	log = getLogger(__filename),
	{Left,Right,Bottom,Popup} = ToolPanelLocation

export function makeToastMessage(opts:any) {
	return Object.assign({},opts,{
		id:uuid.v4(),
		createdAt:Date.now(),
		floatVisible: true,
		content: opts.content || 'No content provided - DANGER will robinson'
	})
}


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
		return state.toolPanels.valueSeq().find(it => !!it.tools[toolId])
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
			panels = state.toolPanels.valueSeq().toArray()
		
		let
			tool:ITool
		
		for (let panel of panels) {
			tool = panel.tools[toolId]
			
			if (tool)
				break
		}
		
		return tool
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
		
		this.updateTool(cloneObject(tool,{
			active:!_.isNil(forceState) ? forceState : !tool.active
		}))
	}
	
	getToolPanels(state:UIState = this.state) {
		return state.toolPanels || Map<string,IToolPanel>()
	}
	
	/**
	 * Internal method used a few times to update panel
	 * @param state
	 * @param panel
	 * @returns {Map<string, Map<string, IToolPanel>>}
	 */
	private doPanelUpdate(state:UIState,panel:IToolPanel) {
		
		const
			toolPanels = this.getToolPanels(state)
		
		return state.set(
			'toolPanels',
			toolPanels.set(
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
	 * @param panelId
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
				panel.tools = cloneObjectShallow(panel.tools)
				
				// REMOVE FROM TOOL MAP
				delete panel.tools[toolId]
				
				// REMOVE FROM TOOL ID LIST
				panel.toolIds = panel.toolIds.filter(it => it !== toolId)
				
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
			if (!getValue(() => panel.tools[tool.id])) {
				
				panel = cloneObjectShallow(panel)
				panel.tools = cloneObjectShallow(panel.tools)
				panel.tools[tool.id] = tool
				
				panel.toolIds = panel.toolIds.concat([tool.id])
				
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
	 * @param tool
	 * @returns {(state:UIState)=>Map<string, V>}
	 */
	@ActionReducer()
	updateTool(tool:ITool) {
		return (state:UIState) => {
			
			
			
			// FIND THE NEW AND OLD PANEL
			const
				parentPanel =
					this.getToolParentPanel(tool.id,state) ||
					this.getToolPanel(tool.defaultLocation)
			
			assert(parentPanel, `Unable to locate existing panel or find default for ${tool.id} w/defaultLocation ${tool.defaultLocation}`)
			
			const
				panel = cloneObjectShallow(parentPanel)
			
			panel.tools[tool.id] = tool
			if (panel.toolIds.indexOf(tool.id) === -1)
				panel.toolIds = panel.toolIds.concat([tool.id])
			
			panel.open = Object.values(panel.tools).some(it => it.active)
			
			return this.doPanelUpdate(state,panel)
			
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
		return this.state.toolPanels.get(id)
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
				tools:{},
				toolIds: []
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
			completeTool = cloneObject(tool,_.pick(existingTool || {},'data','active')) as ITool
		
		
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
	clearMessages() {
		return (state:UIState) => state.set('messages',List())
	}
	
	


	@ActionReducer()
	addMessage(message:IToastMessage) {
		return (state:UIState) => state.messages
			.findIndex(item => _.toJS(item).id === message.id) > -1 ?
			state :
			state.update('messages',messages => {
				messages = messages.push(message)
				if (messages.size > 5)
					messages = messages.splice(0,messages.size - 5)

				return messages
			})
	}


	addErrorMessage(err:Error|string) {
		err = ((_.isString(err)) ? new Error(err) : err) as Error
		const message = makeToastMessage({
			type: ToastMessageType.Error,
			content: err.message || err.toString(),
			stack: err.stack
		})
		return this.addMessage(message)
	}
	
	@ActionReducer()
	updateMessage(message:IToastMessage) {
		return (state:UIState) => state.update(
			'messages',
			(messages) => messages.set(message.id,message)
		)
	}

	@ActionReducer()
	removeMessage(id:string) {
		return (state:UIState) => state.set(
			'messages',
			state.messages.filter(msg => msg.id !== id)
		)
	}





	@ActionReducer()
	setTheme(theme:any) {
		return (state:UIState) => state.set('theme',theme)
	}

	
	
	@ActionReducer()
	private internalSetDialogOpen(name:string,open:boolean) {
		return (state:UIState) => state.set(
			'dialogs', (state.dialogs ? state.dialogs : Map()).set(name,open)
		)
	}
	
	@ActionThunk()
	closeWindow(windowId:string) {
		return (dispatch,getState) => {
			getWindowManager().close(windowId)
		}
	}
	
	@ActionThunk()
	setDialogOpen(name:string,open:boolean) {
		return (state:UIState) => {
			
			if (ProcessConfig.isType(ProcessType.UI)) {
				const
					windowManager = getWindowManager()
						
				if (open)
					windowManager.openDialog(name)
				else
					windowManager.close(name)
			}
			
			this.internalSetDialogOpen(name,open)
		}
	}
	
	/**
	 * Close all dialogs reducer
	 *
	 * @returns {(state:UIState)=>Map<string, V>}
	 */
	@ActionReducer()
	private internalCloseAllWindows() {
		return (state:UIState) => state.set(
			'dialogs',state.dialogs ? state.dialogs.clear() : Map()
		)
	}
	
	/**
	 * Close all dialogs
	 *
	 * @returns {(dispatch:any, getState:any)=>undefined}
	 */
	@ActionThunk()
	closeAllWindows() {
		return (dispatch,getState) => {
			
			if (ProcessConfig.isType(ProcessType.UI)) {
				getWindowManager().closeAll()
			}
			
			this.internalCloseAllWindows()
		}
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
				cloneObject(state.statusBar,{
					visible:!state.statusBar.visible
				})
			)
	}
	
	/**
	 * Set the open sheet
	 *
	 * @param sheet
	 */
	@ActionReducer()
	openSheet(sheet:IUISheet) {
		return (state:UIState) => state.set('sheet',sheet)
	}
	
	/**
	 * Close the current sheet
	 */
	closeSheet() {
		this.openSheet(null)
	}
	
	toggleRepoPanelOpen() {
		return this.toggleTool(getBuiltInToolId(BuiltInTools.RepoPanel),true)
	}



}

export default UIActionFactory