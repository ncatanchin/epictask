
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
import { CommandType } from "shared/commands/Command"
import { IWindowConfig } from "shared/config/WindowConfig"
import { getUIActions, getIssueActions, getRepoActions } from "shared/actions/ActionFactoryProvider"
import { acceptHot } from "shared/util/HotUtils"
import { If } from "shared/util/Decorations"
import { FillWindow, makeWidthConstraint, makeHeightConstraint } from "shared/themes"
import { getValue, shallowEquals } from "shared/util/ObjectUtil"
import { UIRoot } from "ui/components/root/UIRoot"
import { ContainerNames } from "shared/config/CommandContainerConfig"
import { Themed } from "shared/themes/ThemeManager"
import { Sheets, DialogConfigs } from "ui/DialogsAndSheets"

// STYLES
//import "assets/styles/MarkdownEditor.SimpleMDE.global.scss"

import { PromisedComponent } from "ui/components/root/PromisedComponent"
import { benchmarkLoadTime } from "shared/util/UIUtil"


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
	commands = (builder:CommandContainerBuilder) => {
		
		If(ProcessConfig.isUI(), () => {
			builder
			// IMPORT REPO
				.command(
					CommandType.App,
					'Find action.',
					(cmd, event) => {
						log.debug(`Triggering find action`)
						getUIActions().openSheet(Sheets.FindActionSheet)
					},
					"CommandOrControl+Shift+p", {
						menuPath: [ 'Edit' ],
						hideInAllCommands: true
						
					})
				// IMPORT REPO
				.command(
					CommandType.App,
					'Import Repository',
					(cmd, event) => getUIActions().openSheet(Sheets.RepoImportSheet),
					"CommandOrControl+Shift+n", {
						menuPath: [ 'GitHub' ]
					})
				
				// SYNC EVERYTHING
				.command(
					CommandType.App,
					'Sync Everything...',
					(cmd, event) => getRepoActions().syncAll(),
					"CommandOrControl+s", {
						menuPath: [ 'GitHub' ]
					})
				// NEW ISSUE
				.command(
					CommandType.App,
					'New Issue',
					(cmd, event) => getIssueActions().newIssue(),
					"CommandOrControl+n", {
						menuPath: [ 'Issue' ]
					})
				
				.command(
					CommandType.Global,
					'New Issue Global',
					(cmd, event) => getIssueActions().newIssue(),
					"Control+Alt+n", {
						hidden: true
					})
			
			
		}, () => {
			
			builder
			
			// CLOSE CHILD WINDOW
				.command(
					CommandType.Container,
					'Close Window',
					(cmd, event) => getUIActions().closeWindow(childWindowId),
					"CommandOrControl+w", {
						menuPath: [ 'Window' ]
					})
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
		document.getElementById('root'),
		
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
 * Make sure the whole front end is loaded and the backend
 * is ready for us to load everything
 */
function checkIfRenderIsReady() {
	render()
	// if (isChildWindow)
	// 	return render()
	//
	//
	// const
	// 	state = store.getState(),
	// 	appState = state ? state.get(AppKey) : null,
	// 	ready = appState ? appState.ready : false
	//
	// if (!ready) {
	// 	log.info('Theme is not set yet')
	//
	// 	const
	// 		observer = store.observe([ AppKey, 'ready' ], (newReady) => {
	// 			log.debug('RECEIVED READY, NOW RENDER', newReady)
	// 			if (!newReady !== true) {
	// 				log.debug('Main is not ready', newReady)
	// 				return
	// 			}
	// 			observer()
	// 			render()
	// 		})
	//
	// } else {
	// 	render()
	// }
}


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
		 
		
		checkIfRenderIsReady()
	})
}

// MAIN UI
else {
	checkIfRenderIsReady()
}


/**
 * Enable HMR
 */
acceptHot(module, log)





