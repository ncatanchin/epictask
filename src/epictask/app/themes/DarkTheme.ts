import * as Styles from 'material-ui/styles'
//import * as _ from 'lodash'

/**
 * Get colors ref
 */
const {colors:c} = Styles
const baseTheme = _.cloneDeep(Styles.darkBaseTheme)

const navBarHeight = 50

export const DarkTheme = Styles.getMuiTheme(_.merge(baseTheme, {
	name: 'DarkTheme',
	navBar: {
		titleStyle: {
			fontFamily: 'Orbitron, sans-serif',
			letterSpacing: '0.3rem',
			fontSize: 10,
			fontWeight: 300

		},
		controlStyle: {
			color: 'white',
			height: navBarHeight * 0.66,
			fontSize: navBarHeight / 4
		},
		style: {
			color: 'white',
			height: navBarHeight,
			//backgroundImage: "-webkit-linear-gradient(#4b4e54 0%, #4b4e54 1.9%, #494c51 2%, #333539 100%)"
			// backgroundColor: c.purple500
			backgroundColor: c.indigo500
		}
	},

	fontFamily: 'Play,sans-serif',
	fontWeight: 400,
	palette: {
		primary1Color: c.indigo500,
		primary2Color: c.indigo300,
		primary3Color: c.indigo900,
		accent1Color: c.blueGrey500,
		accent2Color: c.blueGrey700,
		canvasColor: c.blueGrey700,
		textColor: 'white',
		alternateTextColor: 'white'
	}
}))