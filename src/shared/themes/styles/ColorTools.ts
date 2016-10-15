

const
	tc = require('tinycolor2')

export function colorAlpha(color,alpha:number) {
	return tc(color).setAlpha(alpha).toRgbString()
}