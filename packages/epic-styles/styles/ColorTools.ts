

const
	tc = require('tinycolor2')

export function colorAlpha(color,alpha:number) {
	return tc(color).setAlpha(alpha).toRgbString()
}

export function colorDarken(color,amount:number) {
	return tc(color).darken(amount).toRgbString()
}

export function colorLighten(color,amount:number) {
	return tc(color).lighten(amount).toRgbString()
}