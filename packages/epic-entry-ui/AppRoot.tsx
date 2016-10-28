// import 'epic-entry-shared/AppEntry'
// import 'epic-ui-components/UIGlobals'

import {
	Events,
	IWindowConfig,
	Dialogs,
	acceptHot,
	addHotDisposeHandler,
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
import { getUIActions, getIssueActions, getRepoActions } from "epic-typedux/provider"
import {getReduxStore} from 'epic-typedux/store/AppStore'
import {
	FillWindow,
	makeWidthConstraint,
	makeHeightConstraint,
	Fill,
	Themed,
	ThemeEvents,
	ThemeEvent
} from "epic-styles"

// STYLES
import * as assert from "assert"
import { RouteView, WindowHashURIProvider } from "./routes"
import { Roots, Routes } from "./UIRoutes"

// Logger, Store +++
const
	{ StyleRoot } = Radium,
	log = getLogger(__filename),
	
	win = window as any,
	$ = require('jquery'),
	childWindowId = process.env.EPIC_WINDOW_ID,
	isChildWindow = childWindowId && childWindowId !== 'undefined' && childWindowId.length
		
let
	childWindowConfig:IWindowConfig

/**
 * Properties for App/State
 */
export interface IAppProps {
	store?:any
	theme?:any
}

export interface IAppState {
	windowStyle?:any
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

@CommandComponent()
@Themed
@PureRender
class App extends React.Component<IAppProps,IAppState> implements ICommandComponent {
	
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
					(item, event) => getUIActions().openSheet(Roots.RepoImport.path),
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
					(cmd, event) => getUIActions().openWindow(Roots.Settings.path),
					"CommandOrControl+Comma", {
						id: CIDS.Settings
					})
				
				
				.command(
					CommandType.App,
					'Repository Labels, Milestones & Settings',
					(cmd, event) => getUIActions().openWindow(Roots.RepoSettings.path),
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
						getUIActions().openSheet(Roots.FindAction.path)
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
					(cmd, event) => getUIActions().closeWindow(childWindowId),
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
		
		this.state = {}
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
	 * On mount create state and start listening to size
	 */
	componentWillMount() {
		// window.addEventListener('resize', this.onWindowResize)
		// this.updateState()
		
	}
	
	/**
	 * On unmount - remove window listener,
	 */
	componentWillUnmount() {
		// window.removeEventListener('resize', this.onWindowResize)
	}
	
	
	/**
	 * Render the app container
	 */
	render() {
		
		const
			{ theme } = this.props
		
		return <StyleRoot>
				
				<CommandRoot
				component={this}
				id="appRoot"
				style={Fill}>
				
					<MuiThemeProvider muiTheme={theme}>
						<Provider store={this.props.store}>
							
							<RouteView routerId="app-root"
							           routes={Routes}
							           uriProvider={this.uriProvider} />
						
						</Provider>
					</MuiThemeProvider>
					
				
			</CommandRoot>
		
		</StyleRoot>
		
	}
}


let
	rootElement = document.getElementById('root')

/**
 * Render App in appRoot node
 */

function render() {
	ReactDOM.render(
		<App store={getReduxStore()} />,
		
		// ROOT ELEMENT TO MOUNT ON
		rootElement,
		
		/**
		 * After Initial render
		 */
		(ref) => {
			
			// BENCHMARK
			benchmarkLoadTime(`render window ${childWindowId ? childWindowId : 'main window'}`)
			
			/**
			 * If main ui then stop load spinner
			 */
			If(ProcessConfig.isUI(), () => {
				require('electron').ipcRenderer.send(Events.UIReady)
			})
			
			require("epic-plugins-default")
		}
	)
}

/**
 * Unmount, clear cache and fully reload
 */
function remount() {
	
	ReactDOM.unmountComponentAtNode(rootElement)
	
	$('#root').remove()
	rootElement = $(`<div id="root"></div>`).appendTo($('body'))[0]
	
	const
		webContents = require('electron').remote.getCurrentWebContents()
			
	Object
		.keys(require.cache)
		.forEach(key => delete require.cache[key])
	
	render()
	//webContents.reload()
}

function themeChangeListener() {
	log.info(`Remounting on theme change`)
	remount()
}


benchmarkLoadTime(`Exporting loadUI`)
export function loadUI(pendingResources:Promise<void>) {
	benchmarkLoadTime(`Waiting for UI resources`)
	
	pendingResources.then(() => {
		
		benchmarkLoadTime(`UI Resources loaded, now loading UI`)
		/**
		 * On a complete theme change, destroy everything
		 */
		ThemeEvents.on(ThemeEvent.Changed,themeChangeListener)

		// ADD HMR REMOVE
		addHotDisposeHandler(module,() => ThemeEvents.removeListener(ThemeEvent.Changed,themeChangeListener))
					
		render()
		
	})
}



/**
 * Enable HMR
 */
acceptHot(module, log)





