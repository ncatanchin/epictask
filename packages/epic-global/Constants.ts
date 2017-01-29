


//import { getUserDataFilename } from "./Files"
export const DragTypes = {
	GutterToolButton: 'GutterToolButton'
}


// DECORATION CONSTANTS
export const
	JSONKey = 'db:json'


export const
	ReduxDebugSessionKey = 'ReduxDebugSessionKey',
	RemoteDebuggingPort = '9222',
	DataRequestIssueListId = 'DataRequestIssueListId'


export const
	AppStoreEnhancerKey = "AppStoreEnhancerKey"

/**
 * State Key constants
 */
export const
	SearchKey = 'SearchState',
	AppKey = 'AppState',
	AuthKey = 'AuthState',
	RepoKey = 'RepoState',
	UIKey = 'UIState',
	IssueKey = 'IssueState',
	JobKey = 'JobState',
	RoutingKey = 'routing'


export enum AppStoreServerEvent {
	ActionRequest = 1,
	StateRequest,
	StateResponse,
	ChildStoreAction,
	ChildStoreSubscribeRequest,
	ChildStoreSubscribeResponse,
	ChildStoreActionReducer,
	ChildStoreDetach,
	ObserveStateRequest,
	ObserveStateChange,
	ObserveStateRemove,
	ObserveStateResponse
}

/**
 * Enum event names
 *
 * @type {string[]}
 */
export const AppStoreServerEventNames = {
	ActionRequest: AppStoreServerEvent[AppStoreServerEvent.ActionRequest],
	StateRequest: AppStoreServerEvent[AppStoreServerEvent.StateRequest],
	StateResponse: AppStoreServerEvent[AppStoreServerEvent.StateResponse],
	ChildStoreAction: AppStoreServerEvent[AppStoreServerEvent.ChildStoreAction],
	ChildStoreSubscribeRequest: AppStoreServerEvent[AppStoreServerEvent.ChildStoreSubscribeRequest],
	ChildStoreSubscribeResponse: AppStoreServerEvent[AppStoreServerEvent.	ChildStoreSubscribeResponse],
	ChildStoreActionReducer: AppStoreServerEvent[AppStoreServerEvent.	ChildStoreActionReducer],
	ChildStoreDetach: AppStoreServerEvent[AppStoreServerEvent.	ChildStoreDetach],
	ObserveStateRequest: AppStoreServerEvent[AppStoreServerEvent.	ObserveStateRequest],
	ObserveStateChange: AppStoreServerEvent[AppStoreServerEvent.	ObserveStateChange],
	ObserveStateRemove: AppStoreServerEvent[AppStoreServerEvent.	ObserveStateRemove],
	ObserveStateResponse: AppStoreServerEvent[AppStoreServerEvent.	ObserveStateResponse]
}

/**
 * State leaf keys
 */
export const StateLeafKeys = [
	AppKey,
	SearchKey,
	AuthKey,
	RepoKey,
	IssueKey,
	JobKey,
	UIKey
]

/**
 * State Key literal type
 */
export type TStoreStateKey =
	'SearchState' |
		'AppState' |
		'AuthState' |
		'RepoState' |
		'UIState' |
		'IssueState' |
		'JobState' |
		'routing'


/**
 * Action factory keys
 */
export type TActionFactoryKeys =
	'AppState' |
		'AuthState' |
		'RepoState' |
		'SearchState' |
		'UIState' |
		'IssueState' |
		'JobState'


/**
 * Map of string literal types to action factory types
 */
export type IActionFactoryKeyMap = {
	["JobState"]:IJobActionFactory
	["AuthState"]:IAuthActionFactory
	["AppState"]:IAppActionFactory
	["IssueState"]:IIssueActionFactory
	["RepoState"]:IRepoActionFactory
	["UIState"]:IUIActionFactory
}

export const ActionFactoryKeyMap = {
	["JobState"]:"JobActions",
	["AuthState"]:"AuthActions",
	["AppState"]:"AppActions",
	["IssueState"]:"IssueActions",
	["RepoState"]:"RepoActions",
	["UIState"]:"UIActions"
}

export const SynchronizedStateKeys = [
	AppKey,JobKey
]

/**
 * Used for SyncStatus
 *
 * @type {string}
 */
export const NotificationsKey = "NOTIFICATIONS"

export const SettingKeys = {
	NativeNotifications: 'NativeNotifications'
}

export const SettingDefaults = {
	[SettingKeys.NativeNotifications]: true
}



/**
 * Global Event Types
 */
export enum AppEventType {
	MainReady = 1,
	MainBooted,
	ChildrenReady,
	UIReady,
	StoreReady,
	StoreGetMainState,
	StoreMainStateChanged,
	StoreRendererDispatch,
	StoreRendererRegister,
	ProcessMessage,
	
	WindowStatesChanged,
	WindowClosed,
		
	DatabaseReady,
	DatabaseChanges,
	BroadcastEventToRenderers,
	Clean,
	
	SearchItemSelected,
	ThemeChanged,
	AllWindowsClosed,
	
	RoutesLoaded,
	
	ToolsChanged,
	ViewsChanged,
	RoutesChanged,
	CommandsChanged,
	AcceleratorsChanged,
	
	Authenticated,
		
	TrayOpen,
	TrayClose,
	
	PluginFound,
	PluginUpdate,
	PluginRemoved,
	PluginResourceChanged
	
	
}

/**
 * Event Constants
 */
export const Events = {
	TrayOpen: AppEventType[AppEventType.TrayOpen],
	TrayClose: AppEventType[AppEventType.TrayClose],
	RoutesLoaded: AppEventType[AppEventType.RoutesLoaded],
	
	// AUTH
	Authenticated: AppEventType[AppEventType.Authenticated],
	
	// DATABASE
	DatabaseReady: AppEventType[AppEventType.DatabaseReady],
	DatabaseChanges:AppEventType[AppEventType.DatabaseChanges],
	
	BroadcastEventToRenderers:AppEventType[AppEventType.BroadcastEventToRenderers],
	
	WindowStatesChanged: AppEventType[AppEventType.WindowStatesChanged],
	WindowClosed: AppEventType[AppEventType.WindowClosed],
	AllWindowsClosed: AppEventType[AppEventType.AllWindowsClosed],
	ProcessMessage: AppEventType[AppEventType.ProcessMessage],
	
	
	// PROCESS MANAGEMENT
	Clean: AppEventType[AppEventType.Clean],
	MainBooted: AppEventType[AppEventType.MainBooted],
	MainReady: AppEventType[AppEventType.MainReady],
	ChildrenReady: AppEventType[AppEventType.ChildrenReady],
	
	// UI
	UIReady: AppEventType[AppEventType.UIReady],
	
	// PLUGINS
	PluginFound: AppEventType[AppEventType.PluginFound],
	PluginUpdate: AppEventType[AppEventType.PluginUpdate],
	PluginRemoved: AppEventType[AppEventType.PluginRemoved],
	PluginResourceChanged: AppEventType[AppEventType.PluginResourceChanged],
	
	// STORE
	StoreReady: AppEventType[AppEventType.StoreReady],
	StoreGetMainState: AppEventType[AppEventType.StoreGetMainState],
	StoreMainStateChanged: AppEventType[AppEventType.StoreMainStateChanged],
	StoreRendererRegister: AppEventType[AppEventType.StoreRendererRegister],
	StoreRendererDispatch: AppEventType[AppEventType.StoreRendererDispatch],
	
	ThemeChanged: AppEventType[AppEventType.ThemeChanged],
	
	SearchItemSelected: AppEventType[AppEventType.SearchItemSelected],
	
	ToolsChanged: AppEventType[AppEventType.ToolsChanged],
	RoutesChanged: AppEventType[AppEventType.RoutesChanged],
	ViewsChanged: AppEventType[AppEventType.ViewsChanged],
	CommandsChanged: AppEventType[AppEventType.CommandsChanged],
	AcceleratorsChanged: AppEventType[AppEventType.AcceleratorsChanged],
	
}


export const SettingsPath = [AppKey,'settings']

// DataStore configs & stuff
export const FinderItemsPerPage = 100


export const
	GitHubToken = 'GitHubToken',
	GitHubConfig = Env.LocalConfig.github

	
//noinspection SpellCheckingInspection
export const
	DropboxClientId = Env.LocalConfig.dropbox.clientId
	

const
	{JobServer,DatabaseServer} = ProcessType

export const
	// IPC & GENERAL TIMEOUTS
	HEARTBEAT_TIMEOUT = 1000,
	START_TIMEOUT_DEFAULT = 60000,
	REQUEST_TIMEOUT = ProcessConfig.isType(JobServer,DatabaseServer) ?
		30000 :
		5000


export const
	// JOB CONFIG CONSTANTS
	JobsMaxCompleted = 15,
	JobsMaxConcurrency = 2

