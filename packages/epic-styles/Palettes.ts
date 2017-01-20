//import * as c from './material/MaterialColorPalettes'
import * as c from './material/Colors'

function makeDarkPalette() {
	const textColor = 'white'

	const bgColor = c.blueGrey700

	const primary1Color = c.grey900
	const primary1ColorText = textColor
	const primary2Color = c.grey800
	const primary2ColorText = textColor
	const primary3Color = c.grey800
	const primary3ColorText = textColor

	const alternateBgColor = textColor
	const alternateTextColor = c.blueGrey900

	const accent1Color = c.grey700
	const accent1ColorText = textColor
	const accent2Color = c.grey600
	const accent2ColorText = textColor
	const accent3Color = c.grey800
	const accent3ColorText = textColor
	const accent4Color = c.grey900
	const accent4ColorText = c.lightWhite
	// const accent1Color = c.blueGrey500
	// const accent1ColorText = textColor
	// const accent2Color = c.blueGrey700
	// const accent2ColorText = textColor
	// const accent3Color = c.blueGrey800
	// const accent3ColorText = textColor
	// const accent4Color = c.blueGrey900
	// const accent4ColorText = c.lightWhite
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
