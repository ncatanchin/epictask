import * as uuid from 'node-uuid'
import {ActionFactory,ActionReducer,ActionMessage} from 'typedux'
import {List,Map} from 'immutable'
import {UIKey, getBuiltInToolId, BuiltInTools} from "shared/Constants"
import {IToastMessage, ToastMessageType} from 'shared/models/Toast'
import {UIState} from 'shared/actions/ui/UIState'
import {Dialogs} from 'shared/Constants'
import {Provided} from 'shared/util/Decorations'
import {ToolPanelLocation, ITool,IToolPanel} from "shared/tools/ToolTypes"
import {isNumber, shortId, isString} from "shared/util"
import {cloneObject} from "shared/util/ObjectUtil"
import * as assert from "assert"


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



@Provided
export class UIActionFactory extends ActionFactory<UIState,ActionMessage<UIState>> {

	private toolPanelPredicate = (id:string,location:ToolPanelLocation) =>
		(it:IToolPanel) =>
			it.location === location &&
			(it.location !== Popup || it.id === id)
	
	
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
		const panels = state.toolPanels.valueSeq().toArray()
		
		let tool:ITool
		
		for (let panel of panels) {
			tool = panel.tools[toolId]
			
			if (tool)
				break
		}
		
		return tool
	}
	
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
	 * @param forceState
	 */
	toggleTool(toolId:string,forceState:boolean = null) {
		const tool = this.getTool(toolId)
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
		
		
		return state.set('toolPanels',this.getToolPanels(state).set(panel.id,panel))
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
			
			// Find the panel first
			const parentPanel = this.getToolParentPanel(tool.id,state) || this.getToolPanel(tool.defaultLocation)
			
			assert(parentPanel, `Unable to locate existing panel or find default for ${tool.id} w/defaultLocation ${tool.defaultLocation}`)
			
			const panel = cloneObject(parentPanel)
			
			panel.tools[tool.id] = tool
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
				tools:{}
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
	
	


	showAddRepoDialog() {
		return this.setDialogOpen(Dialogs.RepoAddDialog,true)
	}


	toggleRepoPanelOpen() {
		return this.toggleTool(getBuiltInToolId(BuiltInTools.RepoPanel),true)
	}



}

export default UIActionFactory