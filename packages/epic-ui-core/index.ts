import { makePromisedComponent, acceptHot } from "epic-global"
import { EmptyRoute } from "epic-entry-ui/routes/EmptyRoute"
import { getUIActions, getRepoActions, getAppActions } from "epic-typedux/provider"
import { selectedTabViewIdSelector } from "epic-typedux/selectors"

const
	log = getLogger(__dirname)


RouteRegistryScope.Register(
	
	{
		name: 'Empty',
		uri: "empty",
		title: 'empty',
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(EmptyRoute)
			}))
	},
	
	
	{
		name: 'IDE',
		uri: "pages/ide",
		title: 'IDE',
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(require('./ide').IDERoot)
			}))
	},
	
	
	{
		name: 'FindAction',
		uri: 'sheet/find-action',
		title: 'Find an Epic action',
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			
			require.ensure([],function(require:any) {
				resolver.resolve(require('./find-action').FindActionTool)
			}))
		
	},
	
	
	{
		name: 'Settings',
		uri: 'dialog/settings',
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(require('./settings').SettingsWindow)
			}))
	},
	
	
	{
		name: 'CaptureAccelerator',
		uri: 'sheet/capture-accelerator',
		title: 'Set Accelerator',
		provider: makePromisedComponent((resolver:TComponentResolver) =>
			require.ensure([],function(require:any) {
				resolver.resolve(require('./settings/CaptureAcceleratorSheet').CaptureAcceleratorSheet)
			}))
	}
)


log.info(`Registering commands`)

CommandRegistryScope.Register(
	// QUIT
	{
		id: 'Quit',
		type: CommandType.App,
		name: "Quit",
		defaultAccelerator: "CommandOrControl+q",
		execute: (item, event) => getUIActions().quit()
	},
	
	// CLOSE WINDOW
	{
		id: 'CloseWindow',
		type: CommandType.App,
		name: "Close Window",
		defaultAccelerator: "CommandOrControl+w",
		execute: (item, event) => getUIActions().closeWindow()
	},
	
	// NEW TAB
	{
		id: 'NewTab',
		type: CommandType.App,
		name: "New Tab",
		defaultAccelerator: "CommandOrControl+t",
		execute: (item, event) => {
			log.info(`New tab`)
			getUIActions().showNewTabPopup()
		}
	},
	
	
	// CLOSE TAB
	{
		id: 'CloseTab',
		type: CommandType.App,
		name: "Close Tab",
		defaultAccelerator: "Alt+w",
		execute: (item, event) => {
			log.info(`Close tab`)
			getUIActions().removeTabView(selectedTabViewIdSelector(getStoreState()))
		}
	},
	
	// PREV TAB
	{
		id: 'PreviousTab',
		type: CommandType.App,
		name: "Previous Tab",
		defaultAccelerator: "Alt+[",
		execute: (item, event) => {
			log.info(`Move tab left`)
			getUIActions().moveTabView(-1)
		}
	},
	
	// NEXT TAB
	{
		id: 'NextTab',
		type: CommandType.App,
		name: "Next Tab",
		defaultAccelerator: "Alt+]",
		execute: (item, event) => {
			log.info(`Move tab right`)
			getUIActions().moveTabView(1)
		}
	},
	
	// ZOOM IN
	{
		id: 'ZoomIn',
		type: CommandType.App,
		name: "Zoom In",
		defaultAccelerator: "CommandOrControl+=",
		execute: (item, event) => getAppActions().zoom(0.15)
	},
	
	// ZOOM OUT
	{
		id: 'ZoomOut',
		type: CommandType.App,
		name: "Zoom Out",
		defaultAccelerator: "CommandOrControl+-",
		execute: (item, event) => getAppActions().zoom(-0.15)
	},
	
	// ZOOM DEFAULT
	{
		id: 'ZoomStandard',
		type: CommandType.App,
		name: "Zoom Standard",
		defaultAccelerator: "CommandOrControl+0",
		execute: (item, event) => getAppActions().setZoom(1)
	},
	
	// SYNC EVERYTHING
	{
		id: 'SyncEverything',
		type: CommandType.App,
		name: "Github > Sync Everything",
		defaultAccelerator: "CommandOrControl+s",
		execute: (item, event) => getRepoActions().syncAll()
	},
	
	// TOGGLE NOTIFICATIONS
	{
		id: 'ToggleNotifications',
		type: CommandType.App,
		name: "Toggle Notifications Panel",
		defaultAccelerator: "CommandOrControl+1",
		execute: (item, event) => getUIActions().toggleNotificationsOpen()
	},
	
	// SETTINGS
	{
		id: 'Settings',
		type: CommandType.App,
		name: "Settings",
		defaultAccelerator: "CommandOrControl+Comma",
		execute: (item, event) => getUIActions().openWindow(getRoutes().Settings.uri),
	},
	
	// OPEN TRAY
	{
		id: 'ShowTrayGlobal',
		type: CommandType.Global,
		name: "Show Tray",
		execute: (cmd, event) => getAppActions().toggleTray(),
		defaultAccelerator: "Control+Shift+e"
	},
		
	// FIND ACTION
	{
		id: 'FindAction',
		type: CommandType.App,
		name: "Find Action",
		defaultAccelerator: "CommandOrControl+Shift+p",
		execute: (item, event) => getUIActions().openSheet(getRoutes().FindAction.uri),
		hidden: true
	}
)

acceptHot(module)