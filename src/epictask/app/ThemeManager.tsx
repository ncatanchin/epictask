import {getStore} from './store'
import {AppActionFactory} from './actions'
import {MuiThemeProvider} from "material-ui/styles"
import {PropTypes} from 'react'
import * as React from 'react'

const store = getStore()
const log = getLogger(__filename)
const appActions = new AppActionFactory()



/**
 * Define our dark palette
 */

export const DefaultThemeName = 'DarkTheme'

// ONLY LET FOR HMR
export let Themes = null
export let DefaultTheme = null

// Internal ref to the current theme
let theme = null
let themeName = DefaultThemeName



/**
 * Set the current theme
 *
 * @param newTheme
 */
export function setTheme(newTheme) {
	themeName = newTheme.name
	theme = newTheme

	appActions.setTheme(newTheme)
}

export function getTheme() {
	return theme
}

function loadThemes() {
	Themes = require('./themes')
	DefaultTheme = Themes[DefaultThemeName]
	setTheme(Themes[themeName || DefaultThemeName])
}

loadThemes()



/**
 * ThemeableComponent wrapper
 */
export class ThemedComponent extends React.Component<any,any> {
	private observer

	constructor(props,context) {
		super(props,context)
		this.state = {
			theme: getTheme()
		}
	}



	componentDidMount() {
		this.observer = store.observe([appActions.leaf(),'theme'],() => {
			this.setState({
				theme: getTheme()
			})
		})
	}

	componentWillUnmount() {
		this.observer()
	}

	render() {
		return <MuiThemeProvider muiTheme={this.state.theme}>
			{this.props.children}
		</MuiThemeProvider>
	}

}

/**
 * Themeable decorator
 */

export function Themeable() {
	return TargetComponent => {
		const ThemedComponentWrapper:any = (props, context) => {
			return <ThemedComponent>
				<TargetComponent {...props} />
			</ThemedComponent>
		}

		return ThemedComponentWrapper;
	}
}

/**
 * Export getTheme globally
 *
 * @global getTheme
 */
declare global {
	var getTheme:any
}


// Export globals
Object.assign(global as any,{
	getTheme
})


if (module.hot) {
	module.hot.accept(['./themes'],(updates) => {
		log.info(`Theme Updates, HMR`,updates)
		loadThemes()
	})
}