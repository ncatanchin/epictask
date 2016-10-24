
import * as Radium from 'radium'
import { Provider } from 'react-redux'

import { MuiThemeProvider } from 'material-ui/styles'
import { PureRender } from "epic-ui-components"
import { Events } from 'epic-global'

import {
	CommandComponent,
	ICommandComponent,
	CommandRoot,
	CommandContainerBuilder,
	CommandType,
	CommandMenuItemType
} from  "epic-command-manager"

import { IWindowConfig, Dialogs } from "epic-process-manager"
import { getUIActions, getIssueActions, getRepoActions } from "epic-typedux"
import { acceptHot, addHotDisposeHandler } from  "epic-common"
import { If } from  "epic-common"
import { FillWindow, makeWidthConstraint, makeHeightConstraint, Fill } from "epic-styles"
import { getValue, shallowEquals } from  "epic-common"
import { UIRoot } from "epic-ui-components"
import { ContainerNames } from "epic-command-manager"
import { Themed } from "epic-styles"
import { Sheets, DialogConfigs } from "epic-ui-components"

// STYLES
//import "assets/styles/MarkdownEditor.SimpleMDE.global.scss"

import { PromisedComponent } from "epic-ui-components"
import { benchmarkLoadTime } from  "epic-common"
import { MenuIds } from "epic-global"
import { ThemeEvents, ThemeEvent } from "epic-styles"
import { getReduxStore } from "epic-typedux"


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
export class App extends React.Component<IAppProps,IAppState> implements ICommandComponent {
	
	
	/**
	 * All global app root window commands
	 */
	commandItems = (builder:CommandContainerBuilder) => {
		
		If(ProcessConfig.isUI(), () => {
			builder
				
				.command(
					CommandType.App,
					'Import Repository',
					(item, event) => getUIActions().openSheet(Sheets.RepoImportSheet),
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
					(cmd, event) => getUIActions().setDialogOpen(Dialogs.SettingsWindow,true),
					"CommandOrControl+Comma", {
						id: CIDS.Settings
					})
				
				
				.command(
					CommandType.App,
					'Repository Labels, Milestones & Settings',
					(cmd, event) => getUIActions().setDialogOpen(Dialogs.RepoSettingsWindow,true),
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
						getUIActions().openSheet(Sheets.FindActionSheet)
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
	 * On unmount - remove window listener
	 */
	componentWillUnmount() {
		// window.removeEventListener('resize', this.onWindowResize)
	}
	
	
	/**
	 * Render a child window
	 *
	 * @returns {any}
	 */
	renderChildWindow() {
		return <PromisedComponent promise={getValue(() => childWindowConfig.rootElement())} />
	}
	
	/**
	 * Render the main app window
	 *
	 * @returns {any}
	 */
	renderMainWindow() {
		// const
		// 	UIRoot = require("ui/components/root/UIRoot").UIRoot
		return <UIRoot />
	}
	
	/**
	 * Render the app container
	 */
	render() {
		
		const
			{ theme } = this.props,
			windowStyle = getValue(() => this.state.windowStyle, FillWindow)
		
		return <StyleRoot>
				
				<CommandRoot
				component={this}
				id="appRoot"
				style={Fill}>
				
					<MuiThemeProvider muiTheme={theme}>
						<Provider store={this.props.store}>
							
							
							{isChildWindow ? this.renderChildWindow() : this.renderMainWindow()}
						
						
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

/**
 * On a complete theme change, destroy everything
 */
ThemeEvents.on(ThemeEvent.Changed,themeChangeListener)

// ADD HMR REMOVE
addHotDisposeHandler(module,() => ThemeEvents.removeListener(ThemeEvent.Changed,themeChangeListener))
	


// CHILD WINDOW - GET CONFIG FIRST
if (isChildWindow) {
	
	// GET SESSION & COOKIES
	const
		{ remote } = require('electron'),
		webContents = remote.getCurrentWebContents(),
		{ session } = webContents,
		{ cookies } = session
	
	// GET OUR COOKIE
	cookies.get({ name: childWindowId }, (err, cookies) => {
		if (err) {
			log.error(`Failed to get cookies`, err)
			throw err
		}
		
		log.info('cookies', cookies)
		
		const
			configName = cookies[ 0 ].value
			
		
		childWindowConfig = DialogConfigs[configName]
		assert(childWindowConfig, `No config found for ${childWindowId} / ${configName}`)
		 
		
		render()
	})
}

// MAIN UI
else {
	render()
}


/**
 * Enable HMR
 */
acceptHot(module, log)





