//const Styles = require('material-ui/styles')
const c = require('./Colors')


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
	const accent3Color = c.blueGrey800
	const accent3ColorText = textColor
	const accent4Color = c.blueGrey900
	const accent4ColorText = c.lightWhite
	const highlightColor = c.pink500
	const highlightColorText = c.white
	const errorColor = c.red500

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
		accent3Color,
		accent3ColorText,
		accent4Color,
		accent4ColorText,
		highlightColor,
		highlightColorText,
		canvasColor: bgColor,
		textColor,
		alternateBgColor,
		alternateTextColor,
		errorColor
	}
}


export const dark = makeDarkPalette()
