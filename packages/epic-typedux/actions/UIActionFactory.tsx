import { ActionFactory, ActionReducer, ActionMessage, ActionThunk } from "typedux"
import { List, Map } from "immutable"
import {
	UIKey,
	isNumber,
	isString,
	nilFilter, guard, ContextMenu, notifyError, notifySuccess
} from "epic-global"

import { Provided, shortId, cloneObjectShallow, getValue, If, focusElementById } from "epic-global"
 
import {WindowConfigDialogDefaults,getWindowManagerClient} from "epic-process-manager-client"

import {UIState,TNotificationsMode,View} from "epic-typedux/state"
import { toolPanelsSelector,windowsSelector } from "epic-typedux/selectors"
import { isNil } from "typeguard"
import { getStores } from "epic-database-client"
import { GithubNotification } from "epic-models"
import { createClient } from "epic-github"



// Import only as type - in case we are not on Renderer
const
	log = getLogger(__filename),
	{Left,Right,Bottom,Popup} = ToolPanelLocation

//log.setOverrideLevel(LogLevel.DEBUG)

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

@Scopes.Services.Register
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
			regs = Scopes.Tools.getToolRegistrations(),
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
	 * Set selected notification id
	 *
	 * @param selectedNotificationId
	 * @returns {(state:any)=>any}
	 */
	@ActionReducer()
	setSelectedNotificationId(selectedNotificationId:number) {
		return (state) => state.merge({selectedNotificationId})
	}
	
	/**
	 * Mark notification read
	 *
	 * @param notification
	 * @returns {Promise<void>}
	 */
	async markNotificationRead(notification:GithubNotification) {
		try {
			await createClient().notificationRead(notification)
			notification = cloneObjectShallow(notification,{unread:false})
			await getStores().notification.save(notification)
			return true
		} catch (err) {
			log.error(`failed to mark read`,err)
			notifyError(`Unable to mark read: ${err.message}`)
			return false
		}
	}
	
	/**
	 * Mark all notifications as read
	 *
	 * @returns {Promise<void>}
	 */
	async markAllNotificationsRead() {
		const
			notifications = this.state.notifications.filter(it => it.unread)
		
		let
			result
		
		for (let n of notifications.toJS()) {
			result = await this.markNotificationRead(n)
			
			if (result === false)
				break
		}
		
		if (result)
			notifySuccess(`Marked ${notifications.size} notifications as read`)
	}
	
	/**
	 * Set notifications mode
	 *
	 * @param notificationsMode
	 * @returns {(state:any)=>any}
	 */
	@ActionReducer()
	setNotificationsMode(notificationsMode:TNotificationsMode) {
		return state => state.merge({notificationsMode})
	}
	
	/**
	 * Load notifications
	 *
	 * @returns {Promise<void>}
	 */
	async loadNotifications() {
		try {
			const
				{ notificationsLoading, notificationsLoaded } = this.state
			
			if (notificationsLoading || notificationsLoaded)
				return
			
			this.setNotificationsLoading(true)
			
			const
				nStore = getStores().notification,
				notifications = await nStore.findAll()
			
			this.setNotifications(List(notifications))
			
			this.setNotificationsLoaded(true)
		} catch (err) {
			log.error(`failed to load notifications`,err)
			
		} finally {
			this.setNotificationsLoading(false)
		}
	}
	
	/**
	 * Update notifications in state
	 *
	 * @param newNotifications
	 * @returns {(state:any)=>any}
	 */
	@ActionReducer()
	updateNotificationsInState(newNotifications:List<GithubNotification>) {
		return state => {
			let
				{notifications} = state as UIState
			
			newNotifications.forEach(nn => {
				const
					index = notifications.findIndex(n => n.id === nn.id)
				
				notifications = index === -1 ? notifications.push(nn) : notifications.set(index,nn)
			})
			
			return state.set('notifications',notifications)
		}
	}
	
	/**
	 * Set notifications
	 *
	 * @param notifications
	 * @returns {(state:any)=>any}
	 */
	@ActionReducer()
	setNotifications(notifications:List<GithubNotification>) {
		return state => state.set('notifications',notifications)
	}
	
	
	/**
	 * Set notifications loaded
	 *
	 * @param notificationsLoaded
	 * @returns {(state:any)=>any}
	 */
	@ActionReducer()
	setNotificationsLoaded(notificationsLoaded:boolean) {
		return state => state.merge({notificationsLoaded})
	}
	
	/**
	 * Set notifications loading
	 *
	 * @param notificationsLoading
	 * @returns {(state:any)=>any}
	 */
	@ActionReducer()
	setNotificationsLoading(notificationsLoading:boolean) {
		return state => state.merge({notificationsLoading})
	}
	
	/**
	 * Set notifications open
	 *
	 * @param notificationsOpen
	 * @returns {(state:any)=>any}
	 */
	@ActionReducer()
	setNotificationsOpen(notificationsOpen:boolean) {
		return state => state.merge({notificationsOpen})
	}
	
	/**
	 * Toggle notifications open
	 */
	toggleNotificationsOpen() {
		this.setNotificationsOpen(!this.state.notificationsOpen)
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
	 * @param selectedTabViewId
	 * @returns {(state:UIState)=>Map<string, string>}
	 */
	@ActionReducer()
	setSelectedTabViewId(selectedTabViewId:string) {
		return (state:UIState) => state.set("selectedTabViewId",selectedTabViewId)
	}
	
	@ActionReducer()
	moveTabView(increment: number) {
		return (state:UIState) => {
			let
				{tabViews,selectedTabViewId} = state,
				total = tabViews.size,
				index = tabViews.findIndex(it => it.id === selectedTabViewId)
			
			if (isNil(index) || !isNumber(index))
				index = 0
			
			let
				newIndex = index + increment
			
			newIndex = newIndex < 0 ?
				newIndex = total - 1 :
				newIndex >= total ? 0 :
				newIndex
			
			// SANITY CHECK
			newIndex = Math.max(0,Math.min(total - 1, newIndex))
			
			
			const
				selectedTabView = tabViews.get(newIndex)
			
			log.debug(`New selected tab view`,selectedTabView,'index',newIndex)
			
			return !selectedTabView ? state : state.set('selectedTabViewId',selectedTabView.id)
		}
	}
	
	/**
	 * Show new tab popup
	 */
	showNewTabPopup() {
		const
			viewConfigs = Scopes.Views.all(),
			menu =
				ContextMenu.create()
		
		if (getValue(() => viewConfigs.length, 0) < 1)
			return
		
		viewConfigs.forEach(viewConfig =>
			menu.addCommand(viewConfig.name, () => this.createTabView(viewConfig))
		)
		
		// SHOW THE MENU
		menu.popup()
		
	}
	
	/**
	 * Create a new tab
	 *
	 * @param viewConfig
	 */
	createTabView(viewConfig:IViewConfig|View) {
		const
			id = shortId()
		
		viewConfig = cloneObjectShallow(viewConfig,{id})
		
		this.createView(viewConfig,false,true)
		this.setSelectedTabViewId(viewConfig.id)
	}
	
	/**
	 * Create a new view
	 *
	 * @param viewConfig
	 * @param temp
	 * @param tab
	 */
	@ActionReducer()
	createView(viewConfig:IViewConfig|View,temp:boolean = true,tab:boolean = false) {
		return (state:UIState) => {
			const
				id = viewConfig.id || shortId(),
				//initialState = new (viewConfig.stateClazz)(),
				viewState = viewConfig instanceof View ?
					viewConfig
						.set('index',state.views.size)
						.set('temp',temp) as View :
					new View(cloneObjectShallow(viewConfig,{
						id,
						name: viewConfig.name,
						index: state.views.size,
						tab,
						temp
					}))
			
			
			
			return state.set(
				tab ? 'tabViews' : 'views',
				(tab ? state.tabViews : state.views).push(viewState)
			)
		}
	}
	
	/**
	 * Update view
	 *
	 * @param view
	 */
	@ActionReducer()
	updateView(view:View) {
		return (state:UIState) => {
			let
				id = view.id,
				useTabs = view.tab,
				views = useTabs ? state.tabViews : state.views,
				index =  views.findIndex(it => it.id === id)
			
			if (index === -1) {
				log.warn(`Unable to find view state in views`,view)
				return state
			}
			
			
			return state.set(useTabs ? 'tabViews' : 'views',views.set(index,view))
		}
	}
	
	/**
	 * Remove a tab view
	 *
	 * @param idOrView
	 * @returns {(state:UIState)=>(UIState|UIState)}
	 */
	removeTabView(idOrView:string|View) {
		return this.removeView(idOrView,true)
	}
	
	/**
	 * Remove a view
	 *
	 * @param idOrView
	 * @returns {(state:UIState)=>(UIState|UIState)}
	 * @param tab
	 */
	@ActionReducer()
	removeView(idOrView:string|View,tab = false) {
		return (state:UIState) => {
			let
				id = isString(idOrView) ? idOrView : idOrView.id,
				views = tab ? state.tabViews : state.views,
				index = views.findIndex(it => it.id === id),
				view = index > -1 && views.get(index)
			
			if (!view)
				return state
			
			if (view.temp || views.size > 1) {
				views = views.remove(index) as any
				
				state = state.set(tab ? 'tabViews' : 'views', views) as any
				
				if (tab && state.selectedTabViewId === id)
					state = state.set('selectedTabViewId', views.get(0).id) as any
			}
			
			return state
		}
			
	}


}

export default UIActionFactory