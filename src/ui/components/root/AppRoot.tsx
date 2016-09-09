import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {Container} from 'typescript-ioc'
import {ObservableStore} from 'typedux'
import * as Radium from 'radium'
import * as injectTapEventPlugin from 'react-tap-event-plugin'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {Provider, connect} from 'react-redux'
import {MuiThemeProvider} from 'material-ui/styles'
import {PureRender} from 'ui/components/common'
import {IssueEditDialog} from 'ui/components/issues/IssueEditDialog'
import {RepoAddDialog} from 'ui/plugins/repos/RepoAddDialog'
import {Header, HeaderVisibility, ToastMessages} from 'ui/components/root'
import {getPage} from 'ui/components/pages'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {AppStateType} from 'shared/AppStateType'
import {Events, AppKey, UIKey} from 'shared/Constants'
import * as KeyMaps from 'shared/KeyMaps'
import {AppState} from 'shared/actions/AppState'
import {UIState} from 'shared/actions/ui/UIState'
import {availableRepoCountSelector} from 'shared/actions/repo/RepoSelectors'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {RootState} from 'shared/store/RootState'
import {HotKeys} from 'react-hotkeys'
import {HotKeyContext} from 'ui/components/common/HotKeyContext'
import {Themed, ThemedNoRadium} from 'shared/themes/ThemeManager'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector} from 'reselect'
import {IssuePatchDialog} from 'ui/components/issues/IssuePatchDialog'
import {IssueCommentDialog} from 'ui/components/issues/IssueCommentDialog'
import {StatusBar} from "ui/components/root/StatusBar"

const {StyleRoot} = Radium
const $ = require('jquery')


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
const store:ObservableStore<RootState> = Container.get(ObservableStore as any) as any


//region DEBUG Components/Vars
let
	appElement = null,
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
	dialogOpen:boolean
	//adjustedBodyStyle:any
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
@Radium
@PureRender
export class App extends React.Component<IAppProps,any> {


	appActions = Container.get(AppActionFactory)
	repoActions = Container.get(RepoActionFactory)
	issueActions = Container.get(IssueActionFactory)
	uiActions = Container.get(UIActionFactory)



	onFocus = () => {
		log.info('Focused')
	}

	onBlur = () => {
		log.info('Blur')
	}

	/**
	 * Map hot keys for the root
	 *
	 * @type {{}}
	 */
	keyHandlers = {
		[KeyMaps.CommonKeys.New]: () => {
			log.info('New issue keys pressed - making dialog visible')
			this.issueActions.newIssue()
		},

		[KeyMaps.CommonKeys.MoveUp]: () => log.info('key up'),
		[KeyMaps.CommonKeys.MoveDown]:() => log.info('key down'),

		[KeyMaps.CommonKeys.Edit]: () => {
			log.info('Edit issue keys pressed - making dialog visible')
			this.issueActions.editIssue()
		},
		[KeyMaps.CommonKeys.Escape]: () => {
			log.info('Escaping and moving focus')
			this.uiActions.closeAllDialogs()
			//ReactDOM.findDOMNode<HTMLDivElement>(this.pageBodyHolder).focus()
		},
		[KeyMaps.CommonKeys.View1]: () => {
			log.info('Escaping and moving focus')
			Container.get(UIActionFactory).focusIssuesPanel()
		},
		[KeyMaps.CommonKeys.View2]: () => {
			log.info('Escaping and moving focus')
			Container.get(UIActionFactory).focusIssueDetailPanel()
		},
		[KeyMaps.CommonKeys.Find]: () => {
			log.info('Escaping and moving focus')
			$('#header').find('input').focus()
		},
		[KeyMaps.CommonKeys.SetAssignee]: () => {
			log.info('Patch assignee')
			Container.get(IssueActionFactory).patchIssuesAssignee()
		},
		[KeyMaps.CommonKeys.SetMilestone]: () => {
			log.info('Patch milestone')
			Container.get(IssueActionFactory).patchIssuesMilestone()
		},
		[KeyMaps.CommonKeys.AddLabels]: () => {
			log.info('Patch labels')
			Container.get(IssueActionFactory).patchIssuesLabel()
		},
		[KeyMaps.CommonKeys.CreateComment]: () => {
			log.info('Create Comment')
			Container.get(IssueActionFactory).newComment()
		}
	}


	/**
	 * Render the app container
	 */
	render() {
		//adjustedBodyStyle
		const {hasAvailableRepos, stateType,dialogOpen, theme} = this.props,
			{palette} = theme

		const page = {component: getPage(stateType)},
			expanded = stateType > AppStateType.AuthLogin && !hasAvailableRepos

		const headerVisibility = (stateType < AppStateType.Home) ?
			HeaderVisibility.Hidden :
			(expanded) ? HeaderVisibility.Expanded :
				HeaderVisibility.Normal

		//region Create Themed Styles
		const contentStyles = makeStyle(styles.content, {
			backgroundColor: palette.canvasColor,
			display: 'flex',
			flexDirection: 'column'
		}, expanded && styles.collapsed)
		//endregion

		let rootClasses = 'fill-height fill-width root-content'
		if (dialogOpen)
			rootClasses += ' dialog-open'


		return (

			<MuiThemeProvider muiTheme={theme}>
				<Provider store={reduxStore}>
					<HotKeys keyMap={KeyMaps.App}
					         handlers={this.keyHandlers}
					         onFocus={this.onFocus}
					         onBlur={this.onBlur}
					         focused={true}
					         id="appRoot"
					>

						{/* DIALOGS */}
						<IssueEditDialog />
						<IssueCommentDialog />
						<RepoAddDialog />
						<IssuePatchDialog />

						{/* Global flex box */}
						<div className={rootClasses}
						     style={[styles.content,theme.app]}>

							<Header visibility={headerVisibility}/>

							{(stateType === AppStateType.AuthLogin || hasAvailableRepos) &&
								<div style={makeStyle(FlexScale,FlexColumn)}>
									<div style={contentStyles}>
										<page.component />
									</div>

									<ToastMessages/>
								</div>
							}
							
							<StatusBar/>
						</div>
						
					</HotKeys>
				</Provider>
			</MuiThemeProvider>


		)
	}
}

//let rendered = false

let appInstance = null

export function getAppInstance() {
	return appInstance
}

function render() {
	reduxStore = store.getReduxStore()
	const state = store.getState()

	// const appState = appActions.state
	const props = mapStateToProps(state)
	 
	appInstance = ReactDOM.render(
		<App
			store={reduxStore}
			{...props}
		/>,
		document.getElementById('root'),
		(ref) => {
			log.info('Rendered, hiding splash screen')
			window.postMessage({type:Events.UIReady},"*")
			
			//appInstance = ref as any
			win.stopLoader()
			Container.get(UIActionFactory).focusAppRoot()
		}
	)
}

/**
 * Make sure the whole front end is loaded and the backend
 * is ready for us to load everything
 */
function checkIfRenderIsReady() {
	const state = store.getState()
	const appState = state ? state.get(AppKey) : null
	const ready = appState ? appState.ready : false

	if (!ready) {
		log.info('Theme is not set yet')
		const observer = store.observe([AppKey,'ready'],(newReady) => {
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

checkIfRenderIsReady()


/**
 * Enable HMR
 */
if (module.hot) {
	module.hot.accept()
	module.hot.dispose(() => {
		log.info('HMR - App Root Disposed')
	})
}






