const Styles = require('material-ui/styles')
const {colors:c} = Styles


function makeDarkPalette() {
	const textColor = 'white'

	const bgColor = c.blueGrey700

	const primary1Color = c.indigo500
	const primary1ColorText = textColor
	const primary2Color = c.indigo300
	const primary2ColorText = textColor
	const primary3Color = c.indigo900
	const primary3ColorText = textColor

	const alternateBgColor = textColor
	const alternateTextColor = c.blueGrey900

	const accent1Color = c.blueGrey500
	const accent1ColorText = textColor
	const accent2Color = c.blueGrey700
	const accent2ColorText = textColor

	return {
		primary1Color,
		primary1ColorText,
		primary2Color,
		primary2ColorText,
		primary3Color,
		primary3ColorText,
		accent1Color,
		accent1ColorText,
		accent2Color,
		accent2ColorText,
		canvasColor: bgColor,
		textColor,
		alternateBgColor,
		alternateTextColor
	}
}



module.exports = {
	"dark": makeDarkPalette()
}
