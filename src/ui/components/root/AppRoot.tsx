import {ObservableStore} from 'typedux'
import * as injectTapEventPlugin from 'react-tap-event-plugin'
import {Provider, connect} from 'react-redux'
import {MuiThemeProvider} from 'material-ui/styles'
import {PureRender} from 'ui/components/common'
import {Header, HeaderVisibility, ToastMessages} from 'ui/components/root'
import {getPage} from 'ui/components/pages'

import {AppStateType} from 'shared/AppStateType'
import {Events, AppKey, UIKey} from 'shared/Constants'
import {AppState} from 'shared/actions/app/AppState'
import {UIState} from 'shared/actions/ui/UIState'
import {availableRepoCountSelector} from 'shared/actions/repo/RepoSelectors'
import {RootState} from 'shared/store/RootState'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector} from 'reselect'
import {StatusBar} from "ui/components/root/StatusBar"
import {
	CommandComponent, ICommandComponent, CommandRoot,
	CommandContainerBuilder
} from "shared/commands/CommandComponent"
import { CommandType } from "shared/commands/Command"
import { WindowConfigs, IWindowConfig } from "shared/UIConstants"
import { getUIActions, getIssueActions, getAppActions, getRepoActions } from "shared/actions/ActionFactoryProvider"
import { acceptHot } from "shared/util/HotUtils"
import { If } from "shared/util/Decorations"
import { FillWindow, makeStyle } from "shared/themes"
import { isString } from "shared/util/ObjectUtil"


const
	{StyleRoot} = Radium,
	$ = require('jquery'),
	childWindowId = process.env.EPIC_WINDOW_ID,
	isChildWindow = childWindowId && childWindowId !== 'undefined' && childWindowId.length

let
	childWindowConfig:IWindowConfig

/**
 * Global CSS
 */

require('styles/split-pane.global.scss')


// Logger
const log = getLogger(__filename)

try {
	injectTapEventPlugin()
} catch (err) {
	log.info('Failed to inject tap event handler = HMR??')
}


// Build the container
const
	store:ObservableStore<RootState> = Container.get(ObservableStore as any) as any


//region DEBUG Components/Vars
let
	reduxStore = null,
	win = window as any
//endregion


//region Styles
const styles = {
	app: makeStyle(FlexColumn, FlexScale, {
		overflow: 'hidden'
	}),

	header: makeStyle(makeTransition(), FlexRowCenter, {}),

	content: makeStyle(makeTransition(), FlexColumn, PositionRelative, {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1
	}),

	collapsed: makeStyle({flexGrow: 0})


}
//endregion


/**
 * Properties for App/State
 */
export interface IAppProps {
	store:any
	theme:any
	stateType:AppStateType
	hasAvailableRepos:boolean
}


/**
 * State selector for AppRoot
 */
const mapStateToProps = createStructuredSelector({
	hasAvailableRepos: availableRepoCountSelector,
	stateType: (state)=> (state.get(AppKey) as AppState).stateType,
	theme: () => getTheme(),
	dialogOpen: (state) => (state.get(UIKey) as UIState).dialogs.valueSeq().includes(true)
},createDeepEqualSelector)

/**
 * Root App Component
 */

@connect(mapStateToProps)
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
	 * Render the app container
	 */
	render() {
		
		const
			{hasAvailableRepos, stateType, theme} = this.props,
			{palette} = theme,
			
			PageComponent = getPage(stateType),// {component: getPage(stateType)},
			expanded = stateType > AppStateType.AuthLogin && !hasAvailableRepos,

			headerVisibility = (stateType < AppStateType.Home) ?
				HeaderVisibility.Hidden :
				(expanded) ? HeaderVisibility.Expanded :
					HeaderVisibility.Normal,
			
			contentStyles = makeStyle(styles.content, {
				backgroundColor: palette.canvasColor,
				display: 'flex',
				flexDirection: 'column'
			}, expanded && styles.collapsed),
		
			DialogComponent = childWindowConfig && childWindowConfig.rootElement()
		
		log.info(`Dialog Component`,DialogComponent)
			
		return (

			<MuiThemeProvider muiTheme={theme}>
				<Provider store={reduxStore}>
					<CommandRoot
						style={FillWindow}
						component={this}
						id="appRoot">
						
						{isChildWindow ? <DialogComponent />:
							
						
						
						<div className={'root-content'}
						     style={[FillWindow,styles.content,theme.app]}>
							
							<Header visibility={headerVisibility}/>
							
							{(stateType === AppStateType.AuthLogin || hasAvailableRepos) &&
							<div style={makeStyle(FlexScale,FlexColumn)}>
								<div style={contentStyles}>
									<PageComponent />
								</div>
								
								<ToastMessages/>
							</div>
							}
							
							<StatusBar/>
						</div>
						}
						
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
	
	const
		state = store.getState(),
		props = mapStateToProps(state)
	 
	ReactDOM.render(
		<App
			store={reduxStore}
			{...props}
		/>,
		document.getElementById('root'),
		(ref) => {
			log.info('Rendered, hiding splash screen')
			
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
				log.info('RECEIVED READY, NOW RENDER',newReady)
				if (!newReady !== true) {
					log.info('Main is not ready',newReady)
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





