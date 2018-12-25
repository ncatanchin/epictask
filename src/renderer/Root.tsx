import {createMuiTheme} from '@material-ui/core/styles'
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider'
import * as React from "react"
//import Loadable from "react-loadable"

import {getTheme, makeTransition, mergeStyles, rem, remToPx} from "renderer/styles/ThemedStyles"
import {hot} from 'react-hot-loader'
import App from "renderer/components/App"


// const App = Loadable({
//   loader: async () => (await import("renderer/components/App")).default,
//   loading: () => <div>loading</div>
// })

/**
 * Generate the MUI palette for mapper
 */
function makeMapperPalette():any {
	const
		theme = getTheme(),
		{palette} = theme,
		action = {
			light: palette.action.A100,
			main: palette.action.A400,
			dark: palette.action.A700
		}
	
	return mergeStyles({
		palette: {
			primary: {
				light: palette.primary.A200,
				main: palette.primary.A400,
				dark: palette.primary.A700,
			},
			secondary: {
				light: palette.accent.A200,
				main: palette.accent.A400,
				dark: palette.accent.A700,
			},
			action,
			type: 'dark',
		},
		typography: {
			useNextVariants: true,
			
			fontFamily: [
				'AvenirNext',
				'-apple-system',
				'BlinkMacSystemFont',
				'"Segoe UI"',
				'Roboto',
				'"Helvetica Neue"',
				'Arial',
				'sans-serif',
				'"Apple Color Emoji"',
				'"Segoe UI Emoji"',
				'"Segoe UI Symbol"',
			].join(','),
			fontWeightLight: 300,
			fontWeightRegular: 400,
			fontWeightMedium: 500
		},
		dimensions: {
			resizer: remToPx(0.6)
		},
		
		focus: [makeTransition('box-shadow'), {
			boxShadow: `inset 0px 0px 5px 5px ${action.main}`
		}],
		
		
	}) as any
}

class Root extends React.Component<{}, {}> {
	
	constructor(props, context) {
		super(props, context)
	}
	
	render() {
		// ConnectedRouter will use the store from the Provider automatically
		return <MuiThemeProvider theme={createMuiTheme(makeMapperPalette())}>
			<App/>
		</MuiThemeProvider>
		
		
	}
}


export default hot(module)(Root)
