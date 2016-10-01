import {ObservableStore} from 'typedux'

import {Provider} from 'react-redux'
import {MuiThemeProvider} from 'material-ui/styles'
import {PureRender} from 'ui/components/common'

import {Events, AppKey} from 'shared/Constants'

import {RootState} from 'shared/store/RootState'

import {
	CommandComponent, ICommandComponent, CommandRoot,
	CommandContainerBuilder
} from "shared/commands/CommandComponent"
import { CommandType } from "shared/commands/Command"
import { IWindowConfig } from "shared/WindowConfig"
import { getUIActions, getIssueActions, getAppActions, getRepoActions } from "shared/actions/ActionFactoryProvider"
import { acceptHot } from "shared/util/HotUtils"
import { If } from "shared/util/Decorations"
import { FillWindow} from "shared/themes"
import { isString } from "shared/util/ObjectUtil"
import { UIRoot } from "ui/components/root/UIRoot"


const
	$ = require('jquery'),
	childWindowId = process.env.EPIC_WINDOW_ID,
	isChildWindow = childWindowId && childWindowId !== 'undefined' && childWindowId.length

let
	childWindowConfig:IWindowConfig

/**
 * Global CSS
 */



// Logger
const
	log = getLogger(__filename)



// Build the container
const
	store:ObservableStore<RootState> = Container.get(ObservableStore as any) as any


//region DEBUG Components/Vars
let
	reduxStore = null,
	win = window as any
//endregion


/**
 * Properties for App/State
 */
export interface IAppProps {
	store:any
	theme:any
}



/**
 * Root App Component
 */

@CommandComponent()
@Radium
@PureRender
export class App extends React.Component<IAppProps,any> implements ICommandComponent {
	
	
	/**
	 * All global app root window commands
	 */
	commands = (builder:CommandContainerBuilder) => {
		
		If(ProcessConfig.isUI(), () => {
			builder

				// NEW ISSUE
				.command(
					CommandType.App,
					'New Issue',
					(cmd, event) => getIssueActions().newIssue(),
					"CommandOrControl+n", {
						menuPath:['Issue']
					})
		}, () => {
			
			builder
			
			// NEW ISSUE
				.command(
					CommandType.Container,
					'Close Window',
					(cmd, event) => getUIActions().closeWindow(childWindowId),
					"CommandOrControl+w", {
						menuPath:['Window']
					})
		})
		
			
		return builder.make()
	}
	readonly commandComponentId:string = 'App'
	
	appActions = getAppActions()
	repoActions =getRepoActions()
	issueActions = getIssueActions()
	uiActions = getUIActions()



	onFocus = () => {
		log.info('Focused')
	}

	onBlur = () => {
		log.info('Blur')
	}
	
	
	/**
	 * Render a child window
	 *
	 * @returns {any}
	 */
	renderChildWindow() {
		const
			ChildRootComponent = childWindowConfig && childWindowConfig.rootElement()
		
		log.debug(`Dialog Component`,ChildRootComponent)
		
		return <ChildRootComponent />
	}
	
	/**
	 * Render the main app window
	 *
	 * @returns {any}
	 */
	renderMainWindow() {
		return <UIRoot />
	}
	
	/**
	 * Render the app container
	 */
	render() {
		
		const
			{theme} = this.props
		
		
		
		
		
			
			
		return (

			<MuiThemeProvider muiTheme={theme}>
				<Provider store={reduxStore}>
					<CommandRoot
						style={FillWindow}
						component={this}
						id="appRoot">
						
						{isChildWindow ? this.renderChildWindow() : this.renderMainWindow()}
						
					</CommandRoot>
				</Provider>
			</MuiThemeProvider>


		)
	}
}

//let rendered = false


/**
 * Render App in appRoot node
 */
function render() {
	
	reduxStore = store.getReduxStore()
	
	ReactDOM.render(
		<App
			store={reduxStore}
		  theme={getTheme()}
		/>,
		document.getElementById('root'),
		(ref) => {
			log.debug('Rendered')
			
			const
				startLoadTime:number = (window as any).startLoadTime,
				loadDuration = Date.now() - startLoadTime
			
			log.tron(`It took a ${loadDuration / 1000}s to load window ${childWindowId ? childWindowId : 'main window'}`)
			
			
			If(ProcessConfig.isUI(),() => {
				
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
	if (isChildWindow)
		return render()
	
	
	const
		state = store.getState(),
		appState = state ? state.get(AppKey) : null,
		ready = appState ? appState.ready : false

	if (!ready) {
		log.info('Theme is not set yet')

		const
			observer = store.observe([AppKey,'ready'],(newReady) => {
				log.debug('RECEIVED READY, NOW RENDER',newReady)
				if (!newReady !== true) {
					log.debug('Main is not ready',newReady)
					return
				}
				observer()
				render()
			})

	} else {
		render()
	}
}


// CHILD WINDOW - GET CONFIG FIRST
if (isChildWindow) {
	
	// GET SESSION & COOKIES
	const
		{remote} = require('electron'),
		webContents = remote.getCurrentWebContents(),
		{session} = webContents,
		{cookies} = session
	
	// GET OUR COOKIE
	cookies.get({name: childWindowId},(err,cookies) => {
		if (err) {
			log.error(`Failed to get cookies`, err)
			throw err
		}
		
		log.info('cookies',cookies)
		
		const
			configStr = cookies[0].value
		
		assert(configStr,`No config found for ${childWindowId}`)
		childWindowConfig = JSON.parse(configStr,(key,value) => {
			if (key === 'rootElement' && isString(value)) {
				return eval(value)
			}
			return value
		})
		
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
acceptHot(module,log)





