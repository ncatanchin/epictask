// import 'epic-entry-shared/AppEntry'
// import 'epic-ui-components/UIGlobals'

import {
	If,
	getValue,
	shallowEquals,
	benchmarkLoadTime,
	MenuIds
} from "epic-global"



benchmarkLoadTime(`Starting to loading AppRoot`)

import { Provider } from "react-redux"
import { MuiThemeProvider } from "material-ui/styles"
import { PureRender } from "epic-ui-components/common"

import {
	CommandComponent,
	ICommandComponent,
	CommandRoot,
	CommandContainerBuilder,
} from 'epic-command-manager-ui'

import {
	
	CommandType,
	CommandMenuItemType,
	ContainerNames
} from "epic-command-manager"
import { getUIActions, getRepoActions, getIssueActions } from "epic-typedux/provider"

import {
	FillWindow,
	makeWidthConstraint,
	makeHeightConstraint,
	Fill
} from "epic-styles"

// STYLES
import { RouteView, WindowHashURIProvider, IRoute, IRouteInstance, Router, RouterEvent } from "./routes"

import { availableRepoCountSelector, appStateTypeSelector } from "epic-typedux/selectors"

import { AppStateType } from "epic-typedux/state/app"
import { connect } from "react-redux"
import {createStructuredSelector} from 'reselect'
import { ThemedWithOptions } from "epic-styles/ThemeDecorations"

// Logger, Store +++
const
	{ StyleRoot } = Radium,
	log = getLogger(__filename),
	Tooltip = require('react-tooltip'),
	win = window as any,
	$ = require('jquery'),
	windowId = process.env.EPIC_WINDOW_ID


//DEBUG LOG
//log.setOverrideLevel(LogLevel.DEBUG)


// We dont import to allow for HMR to work
let
	Pages:any,
	Routes:any

function reloadRoutes() {
	({Routes,Pages} = require("./routes/Routes"))
}

reloadRoutes()

/**
 * Properties for App/State
 */
export interface IAppRootProps {
	store?:any
	theme?:any
	repoCount?:number
	appStateType?:AppStateType
	
}

export interface IAppRootState {
	windowStyle?:any
	routeViewRef?:RouteView
	routeView?: any
	
	Routes?:any
	Pages?:any
}

const
	CIDS = {
		GithubImport: 'GithubImport',
		GithubSync: 'GithubSync',
		GlobalNewIssue: 'GlobalNewIssue',
		FindAction: 'FindAction',
		CloseWindow: 'CloseWindow',
		Settings: 'Settings',
		RepoSettings: 'RepoSettings'
	}
/**
 * Root App Component
 */
@connect(createStructuredSelector({
	appStateType: appStateTypeSelector,
	repoCount: availableRepoCountSelector
}))
@CommandComponent()
@ThemedWithOptions({enableRef:true})
@PureRender
class AppRoot extends React.Component<IAppRootProps,IAppRootState> implements ICommandComponent {
	
	uriProvider = new WindowHashURIProvider()
	
	/**
	 * All global app root window commands
	 */
	commandItems = (builder:CommandContainerBuilder) => {
		
		If(ProcessConfig.isUI(), () => {
			builder
				
				.command(
					CommandType.App,
					'Import Repository',
					(item, event) => getUIActions().openSheet(Pages.RepoImport.path),
					"CommandOrControl+Shift+n",{
						id: CIDS.GithubImport
					}
				)
				
				.command(
					CommandType.App,
					'Sync Everything',
					(item, event) => getRepoActions().syncAll(),
					"CommandOrControl+s",{
						id: CIDS.GithubSync
					}
				)
				
				.command(
					CommandType.App,
					'Settings',
					(cmd, event) => getUIActions().openWindow(Pages.Settings.path),
					"CommandOrControl+Comma", {
						id: CIDS.Settings
					})
				
				
				.command(
					CommandType.App,
					'Repository Labels, Milestones & Settings',
					(cmd, event) => getUIActions().openWindow(Pages.RepoSettings.path),
					"CommandOrControl+Shift+Comma", {
						id: CIDS.RepoSettings
					})
				
				.command(
					CommandType.Global,
					'New Issue Global',
					(cmd, event) => getIssueActions().newIssue(),
					"Control+Alt+n", {
						id: CIDS.GlobalNewIssue,
						hidden: true
					})
				
				.command(
					CommandType.App,
					'Find action',
					(item, event) => {
						log.debug(`Triggering find action`)
						getUIActions().openSheet(Pages.FindAction.path)
					},
					"CommandOrControl+Shift+p",{
						id: CIDS.FindAction,
						hidden: true
					}
				)
				
				.menuItem(
					MenuIds.Navigate,
					CommandMenuItemType.Menu,
					'Find',
					{iconSet: 'fa', iconName: 'search'},
					{
						subItems: [builder.makeMenuItem('find-action-menu-item', CIDS.FindAction)]
					}
				)
				
				// GitHub Menu
				.menuItem(
					MenuIds.GitHub,
					CommandMenuItemType.Menu,
					'GitHub',
					{iconSet: 'fa', iconName: 'github'},
					{
						id: MenuIds.GitHub,
						subItems: [
							{
								id: 'gh-import-menu-item',
								type: CommandMenuItemType.Command,
								commandId: CIDS.GithubImport
							},
							{
								id: 'gh-sync-menu-item',
								type: CommandMenuItemType.Command,
								commandId: CIDS.GithubSync
								
								
							}
						]
					}
				)
				
				.menuItem(
					'settings-menu-item',
					CommandMenuItemType.Command,
					'Settings',
					{iconSet: 'fa', iconName: 'cog'},
					{
						commandId: CIDS.Settings
					}
				)
				
				.menuItem(
					'repo-settings-menu-item',
					CommandMenuItemType.Command,
					'Repository Settings',
					{iconSet: 'octicons', iconName: 'repo'},
					{
						commandId: CIDS.RepoSettings
					}
				)
			
			
		}, () => {
			
			builder
				
				.command(
					CommandType.App,
					'Close Window',
					(cmd, event) => getUIActions().closeWindow(windowId),
					"CommandOrControl+w",{
						id: CIDS.CloseWindow
					}
				)
				.menuItem(
					MenuIds.Navigate,
					CommandMenuItemType.Menu,
					'Find',
					{iconSet: 'fa', iconName: 'search'},
					{
						subItems: [{
							id: 'close-window-menu-item',
							type: CommandMenuItemType.Command,
							commandId: CIDS.CloseWindow
						}]
					}
				)
				
		})
		
		
		return builder.make()
	}
	
	
	constructor(props, context) {
		super(props, context)
		
		this.state = {
			routeView: null
		}
	}
	
	/**
	 * Container id
	 */
	readonly commandComponentId:string = ContainerNames.AppRoot
	
	/**
	 * On focus
	 */
	onFocus() {
		log.debug('Focused')
	}
	
	/**
	 * On blur
	 */
	onBlur() {
		log.debug('Blur')
	}
	
	/**
	 * on resize update the state
	 *
	 * @param event
	 */
	onWindowResize = (event) => this.updateState()
	
	/**
	 * Update the window style
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		const
			windowStyle = getValue(() => makeStyle(
				makeWidthConstraint(window.innerWidth),
				makeHeightConstraint(window.innerHeight)
			), FillWindow)
		
		if (shallowEquals(windowStyle, getValue(() => this.state.windowStyle)))
			return
		
		
		this.setState({
			windowStyle,
		})
	}
	
	/**
	 * When a route changes
	 */
	private onRoutesChanged = () => {
		log.info(`Routes Loaded/Changed - loading`)
		reloadRoutes()
		
		this.setState({
			Routes,Pages
		})
			
	}
	
	/**
	 * On mount create state and start listening to size
	 */
	componentWillMount() {
		this.onRoutesChanged()
		
		EventHub.on(EventHub.RoutesLoaded,this.onRoutesChanged)
		
		this.checkRoute()
		
	}
	
	
	/**
	 * Component will receive props
	 *
	 * @param nextProps
	 */
	componentWillReceiveProps(nextProps) {
		this.checkRoute(nextProps)
	}
	
	/**
	 * On unmount - remove window listener,
	 */
	componentWillUnmount() {
		this.setState({
			routeView: null
		})
	}
	
	private checkRoute = _.debounce((props = this.props,router:Router = null,route:IRouteInstance<any> = null) => {
		setImmediate(() => {
			router = router || getValue(() => this.state.routeViewRef.getRouter())
			route = route || getValue(() => router.getRoute())
			
			if (!router || !route)
				return log.warn(`Router and route can not be null`)
			
			const
				{path} = route,
				{uriProvider} = router,
				{uri,params} = !uriProvider ? ({} as any) : uriProvider.getLocation(),
				{repoCount,appStateType} = props,
				isAuthenticated = appStateType !== AppStateType.AuthLogin,
				isLogin = uri === Pages.Login.path,
				isWelcome = uri === Pages.Welcome.path,
				isIDERoot = [null,'',Pages.IDE.path].includes(uri)
			
			log.debug(`Checking root: ${uri} for IDE and no repos`,uri,path,isAuthenticated, isLogin,isIDERoot,repoCount)
			
			if (!isAuthenticated) {
				if (!isLogin) {
					log.debug(`Scheduling redirect to login`)
					uriProvider.setLocation({
						uri: Pages.Login.path,
						params
					})
				}
			} else if (isLogin || (isWelcome && repoCount > 0) || (isIDERoot && repoCount < 1)) {
				log.debug(`Scheduling redirect to welcome/ide`)
				
				uriProvider.setLocation({
					uri: repoCount < 1 ? Pages.Welcome.path : Pages.IDE.path,
					params
				})
				
			}
		})
	},100)
	
	/**
	 * When the route changes come here
	 *
	 * @param event
	 * @param router
	 * @param route
	 */
	private onRouteChange = (event:RouterEvent,router:Router,route:IRouteInstance<any>) => {
		this.checkRoute(this.props,router,route)
	}
	
	
	/**
	 * Render the app container
	 */
	render() {
		
		const
			{ theme } = this.props,
			{Routes} = this.state
		
		return <StyleRoot style={Fill}>
				
				<CommandRoot
				component={this}
				id="appRoot"
				style={Fill}>
					
					<MuiThemeProvider muiTheme={theme}>
						<Provider store={this.props.store}>
							
							<RouteView
								ref={(routeViewRef) => this.setState({routeViewRef},() => this.checkRoute())}
								routerId="app-root"
								routes={Routes}
								onRouteChange={this.onRouteChange}
								uriProvider={this.uriProvider}/>
						
						</Provider>
					</MuiThemeProvider>
					
				
			</CommandRoot>
			
		</StyleRoot>
		
	}
}




export default AppRoot

