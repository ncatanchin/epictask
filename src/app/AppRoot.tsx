import * as Log from 'typelogger'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as Styles from 'material-ui/styles'
import {MuiThemeProvider} from "material-ui/styles"
import Header from './components/Header'
import {getTheme} from "./ThemeManager";

const log = Log.create(__filename)


log.info('BootStrapping')

class App extends React.Component<any,any> {

	static childContextTypes = {
		muiTheme: React.PropTypes.object.isRequired
	}

	getChildContext() {
		return {muiTheme: getTheme()};
	}

	/**
	 * Render the app container
	 *
	 * @returns {any}
	 */
	render() {
		const theme = getTheme()

		const canvasStyle = {
			backgroundColor: theme.palette.canvasColor
		}

		return (
			<MuiThemeProvider muiTheme={theme}>
				<div className="fill-width fill-height" style={canvasStyle}>
					<Header/>
				</div>
			</MuiThemeProvider>
		)
	}
}

ReactDOM.render(
	<App />,
	document.getElementById('root')
)



