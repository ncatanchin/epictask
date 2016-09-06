import * as uuid from 'node-uuid'
import {ActionFactory,ActionReducer,ActionMessage} from 'typedux'
import {List} from 'immutable'
import {UIKey, DefaultTools} from "shared/Constants"
import {IToastMessage, ToastMessageType} from 'shared/models/Toast'
import {UIState} from 'shared/actions/ui/UIState'
import {Dialogs} from 'shared/Constants'
import {Provided} from 'shared/util/Decorations'
import {ToolPanelLocation, ITool,IToolPanel} from "shared/tools/ToolTypes"
import {isNumber, shortId, isString} from "shared/util"
import {cloneObject} from "shared/util/ObjectUtil"


// Import only as type - in case we are not on Renderer
const
	log = getLogger(__filename),
	dataUrl = require('dataurl')

export function makeToastMessage(opts:any) {
	return Object.assign({},opts,{
		id:uuid.v4(),
		createdAt:Date.now(),
		floatVisible: true,
		content: opts.content || 'No content provided - DANGER will robinson'
	})
}

export type TToolIndexTuple = [number,number]

@Provided
export class UIActionFactory extends ActionFactory<UIState,ActionMessage<UIState>> {

	private toolPanelPredicate = (id:string,location:ToolPanelLocation) =>
		(it:IToolPanel) =>
			it.location === location &&
			(it.location !== ToolPanelLocation.Window || it.id === id)
	
	
	private makeToolFinder(returnIndicies:boolean) {
		return (toolId:string, state:UIState = this.state) => {
			const
				panels = this.state.toolPanels,
				toolPredicate = tool => tool.id === toolId,
				
				// Find the panel first
				panelIndex = panels.findIndex(panel =>
					panel.tools.findIndex(toolPredicate) > -1)
			
			if (panelIndex === -1)
				return [-1, -1]
			
			const
				tools = panels.get(panelIndex).tools,
				toolIndex = tools.findIndex(toolPredicate)
			
			return returnIndicies ? [panelIndex, toolIndex] : tools[toolIndex]
			
		}
	}
	
	/**
	 * Get indices for tool
	 *
	 * @param toolId
	 * @param state
	 * @returns {any}
	 */
	
	private getToolIndices = this.makeToolFinder(true) as (toolId:string,state?:UIState) => TToolIndexTuple
	
	/**
	 * Get tool by id
	 *
	 * @param toolId
	 * @param state
	 * @returns {any}
	 */
	private getTool = this.makeToolFinder(false) as (toolId:string,state?:UIState) => ITool
	
	constructor() {
		super(UIState)
	}

	leaf():string {
		return UIKey;
	}
	
	
	/**
	 * Open a specific tool
	 *
	 * @param toolId
	 */
	openTool(toolId:string) {
		const tool = this.getTool(toolId)
		assert(tool,`Unable to find tool with id ${toolId}`)
		
		
		this.updateTool(cloneObject(tool,{visible:true}))
	}
	
	/**
	 * Update a tool
	 * 
	 * @param tool
	 * @returns {(state:UIState)=>Map<string, V>}
	 */
	@ActionReducer()
	updateTool(tool:ITool) {
		return (state:UIState) => state.update('toolPanels',(panels:List<IToolPanel>) => {
			
			// Find the panel first
			const [panelIndex,toolIndex] = this.getToolIndices(tool.id,state)
			
			// This is a new tool
			
			const srcPanel = panelIndex === -1 ?
				this.getToolPanelState(tool.defaultLocation) :
				panels.get(panelIndex)
			
			assert(srcPanel, `Unable to locate existing panel or find default for ${tool.id} w/defaultLocation ${tool.defaultLocation}`)
			
			const panel = cloneObject(srcPanel)
			panel.tools[toolIndex > -1 ? toolIndex : panel.tools.length] = tool
			
			return panels.set(panelIndex, panel)
			
			
		})
	}
	
	
	@ActionReducer()
	updateToolPanel(toolPanel:IToolPanel) {
		return (state:UIState) => state.update('toolPanels',(toolPanels:List<IToolPanel>) => {
			const index = toolPanels.findIndex(
				this.toolPanelPredicate(toolPanel.id,toolPanel.location))
			
			return (index > -1) ?
				toolPanels.set(index,toolPanel) :
				toolPanels.push(toolPanel)
			
		})
	}
	
	/**
	 * Get tool panel state
	 *
	 * @param location
	 * @returns {IToolPanel}
	 */
	getToolPanelState(location:ToolPanelLocation):IToolPanel
	/**
	 * Get tool panel state
	 *
	 * @param id
	 * @param location
	 * @returns {IToolPanel}
	 */
	getToolPanelState(id:string,location:ToolPanelLocation):IToolPanel
	getToolPanelState(idOrLocation:string|ToolPanelLocation,location:ToolPanelLocation = null):IToolPanel {
		let id:string = null
		
		if (isNumber(idOrLocation)) {
			location = idOrLocation
		} else {
			id = idOrLocation
		}
		
		assert(location,'Location can not be nil')
		return this.state.toolPanels.find(this.toolPanelPredicate(id,location))
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
		
		const
			panels = this.state.toolPanels,
			panelStateIndex = panels.findIndex(it =>
				it.location === location && (it.location !== ToolPanelLocation.Window || it.id === id))
			
		let panelState = panelStateIndex === -1 ? null : panels.get(panelStateIndex)
		if (panelState)
			id = panelState.id
		else {
			panelState = {
				id,
				location,
				open: [ToolPanelLocation.Window,ToolPanelLocation.Left].includes(location),
				isDefault: ToolPanelLocation.Left === location,
				tools:[]
			}
		}
		this.updateToolPanel(panelState)
		
		return id
	}
	
	/**
	 * Register a tool in the app
	 *
	 * @param tool
	 */
	registerTool(tool:ITool) {
		const existingTool = this.getTool(tool.id)
		
		
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
	setDialogOpen(name:string,open:boolean) {
		return (state:UIState) => state.set(
			'dialogs', state.dialogs.clear().set(name,open)
		)
	}

	@ActionReducer()
	closeAllDialogs() {
		return (state:UIState) => state.set(
			'dialogs',state.dialogs.clear()
		)
	}


	/**
	 * Focus on app root
	 */
	@ActionReducer()
	focusAppRoot() {
		return (state) => {
			if (Env.isRenderer)
				setTimeout(() => $('#appRoot').focus())
			return state
		}
	}
	@ActionReducer()
	focusIssuesPanel() {
		return (state) => {
			if (Env.isRenderer)
				setTimeout(() => $('#issuesPanel').focus())
			return state
		}

	}

	@ActionReducer()
	focusIssueDetailPanel() {
		return (state) => {
			if (Env.isRenderer)
				setTimeout(() => $('#issueDetailPanel').focus())
			return state
		}
	}
	
	


	showAddRepoDialog() {
		return this.setDialogOpen(Dialogs.RepoAddDialog,true)
	}


	toggleRepoPanelOpen() {
		return this.openTool(DefaultTools.RepoPanel)
	}



}

export default UIActionFactory