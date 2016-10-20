
import * as Radium from 'radium'
import { ObservableStore } from 'typedux'
import { Provider } from 'react-redux'

import { MuiThemeProvider } from 'material-ui/styles'
import { PureRender } from 'ui/components/common/PureRender'
import { Events } from 'shared/config/Events'
import { AppKey } from 'shared/Constants'
import { RootState } from 'shared/store/RootState'

import {
	CommandComponent,
	ICommandComponent,
	CommandRoot,
	CommandContainerBuilder
} from "shared/commands/CommandComponent"
import { CommandType, CommandMenuItemType } from "shared/commands/Command"
import { IWindowConfig, Dialogs } from "shared/config/WindowConfig"
import { getUIActions, getIssueActions, getRepoActions } from "shared/actions/ActionFactoryProvider"
import { acceptHot } from "shared/util/HotUtils"
import { If } from "shared/util/Decorations"
import { FillWindow, makeWidthConstraint, makeHeightConstraint } from "shared/themes/styles"
import { getValue, shallowEquals } from "shared/util"
import { UIRoot } from "ui/components/root/UIRoot"
import { ContainerNames } from "shared/config/CommandContainerConfig"
import { Themed } from "shared/themes/ThemeManager"
import { Sheets, DialogConfigs } from "ui/DialogsAndSheets"

// STYLES
//import "assets/styles/MarkdownEditor.SimpleMDE.global.scss"

import { PromisedComponent } from "ui/components/root/PromisedComponent"
import { benchmarkLoadTime } from "shared/util/UIUtil"
import { MenuIds } from "shared/UIConstants"
import { ThemeEvents, ThemeEvent } from "shared/themes/ThemeState"


// Logger, Store +++
const
	{ StyleRoot } = Radium,
	log = getLogger(__filename),
	store:ObservableStore<RootState> = Container.get(ObservableStore as any) as any,
	win = window as any,
	$ = require('jquery'),
	childWindowId = process.env.EPIC_WINDOW_ID,
	isChildWindow = childWindowId && childWindowId !== 'undefined' && childWindowId.length

let
	reduxStore = null,
	childWindowConfig:IWindowConfig


/**
 * Properties for App/State
 */
export interface IAppProps {
	store:any
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
		Settings: 'Settings'
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
		window.addEventListener('resize', this.onWindowResize)
		this.updateState()
		
	}
	
	/**
	 * On unmount - remove window listener
	 */
	componentWillUnmount() {
		window.removeEventListener('resize', this.onWindowResize)
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
				style={windowStyle}>
				<div style={windowStyle}>
					<MuiThemeProvider muiTheme={theme}>
						<Provider store={reduxStore}>
							
							
							{isChildWindow ? this.renderChildWindow() : this.renderMainWindow()}
						
						
						</Provider>
					</MuiThemeProvider>
					
				</div>
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
	
	reduxStore = store.getReduxStore()
	
	ReactDOM.render(
		<App
			store={reduxStore}
		/>,
		
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
				
				// STOP SPINNER
				if (win.stopLoader)
					win.stopLoader()
				
				window.postMessage({
					type: Events.UIReady
				}, "*")
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
	
	webContents.reload()
}

/**
 * On a complete theme change, destroy everything
 */
ThemeEvents.on(ThemeEvent.Changed,() => {
	log.info(`Remounting on theme change`)
	remount()
})



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





