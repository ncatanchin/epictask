import {getStore} from 'shared/store'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {MuiThemeProvider} from "material-ui/styles"
import {PropTypes} from 'react'
import * as React from 'react'

const store = getStore()
const log = getLogger(__filename)
const appActions = new AppActionFactory()

import * as Styles from 'ui/styles'

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
 * Base state for themed component
 */
export interface IThemedState {
	theme:any
}

/**
 * A component with the theme injected into the state
 */
export abstract class BaseThemedComponent<P,S extends IThemedState> extends React.Component<P,S> {

	private observer

	constructor(props,context,state = null) {
		super(props,context)

		this.state = _.assign({},state,this.getNewThemedState() as any) as any
	}

	getNewThemedState():IThemedState {
		return {
			theme: getTheme()
		}
	}

	componentDidMount() {
		this.observer = store.observe([appActions.leaf(),'theme'],() => {
			this.setState(this.getNewThemedState() as any)
		})
	}

	componentWillUnmount() {
		if (this.observer) {
			this.observer()
			this.observer = null
		}
	}

}

/**
 * ThemeableComponent wrapper
 */
export class ThemedComponent extends React.Component<any,any> {
	static childContextTypes = {
		theme:React.PropTypes.object
	}

	private observer


	constructor(props,context) {
		super(props,context)
		this.state = this.getNewState()
	}

	getNewState() {
		return {
			theme: getTheme()
		}
	}

	getChildContext() {
    return this.state
  }


	componentDidMount() {
		this.observer = store.observe([appActions.leaf(),'theme'],() => {
			this.setState(this.getNewState())
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

		TargetComponent.contextTypes = {
			theme:React.PropTypes.object
		}

		return ThemedComponentWrapper;
	}
}

/**
 * Create a font size based on the themes font size
 *
 * This is needed due to the fact that font sizes
 * can vary between fonts so dramatically,
 * best example is Roboto and FiraCode
 *
 * @param multiplier
 * @returns {number}
 */
export function makeThemeFontSize(multiplier:number) {
	return getTheme().fontSize * multiplier
}

/**
 * Export getTheme globally
 *
 * @global getTheme
 */

declare global {
	var getTheme:any
	var themeFontSize:typeof makeThemeFontSize
}


// Export globals
Object.assign(global as any,{
	getTheme,
	themeFontSize:makeThemeFontSize
})


if (module.hot) {
	module.hot.accept(['./themes'],(updates) => {
		log.info(`Theme Updates, HMR`,updates)
		loadThemes()
	})
}
