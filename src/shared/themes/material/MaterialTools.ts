import * as _ from 'lodash'
import * as BasePalettes from './MaterialColorPalettes'
import {MaterialColorPalette} from './MaterialColorPalettes'

const tinycolor = require('tinycolor2');
const PaletteTypes = ['primary', 'accent', 'warn', 'background'];

export enum ThemeType {
	Light = 1,
	Dark
}

export interface ThemeTextOpacity {
	primary:number
	secondary:number
	hintOrDisabledOrIcon:number
	divider:number
}

export interface MaterialTextColors {
	primary:string
	secondary:string
	hintOrDisabledOrIcon:string
	divider:string
}

export const ThemeDefaults = {
	Type: ThemeType.Dark,
	TextOpacity: {
		[ThemeType.Dark]: {
			primary:1,
			secondary:.7,
			hintOrDisabledOrIcon:.5,
			divider:.12
		},
		[ThemeType.Light]: {
			primary:.87,
			secondary:.54,
			hintOrDisabledOrIcon:.38,
			divider:.12
		}
	}
};


export function makeMaterialPalette(hex:string):MaterialColorPalette {
	const colors = [
		{
			hex: tinycolor(hex).lighten(52).toHexString(),
			name: 'l50'
		}, {
			hex: tinycolor(hex).lighten(37).toHexString(),
			name: 'l100'
		}, {
			hex: tinycolor(hex).lighten(26).toHexString(),
			name: 'l200'
		}, {
			hex: tinycolor(hex).lighten(12).toHexString(),
			name: 'l300'
		}, {
			hex: tinycolor(hex).lighten(6).toHexString(),
			name: 'l400'
		}, {
			hex: hex,
			name: 'l500'
		}, {
			hex: tinycolor(hex).darken(6).toHexString(),
			name: 'l600'
		}, {
			hex: tinycolor(hex).darken(12).toHexString(),
			name: 'l700'
		}, {
			hex: tinycolor(hex).darken(18).toHexString(),
			name: 'l800'
		}, {
			hex: tinycolor(hex).darken(24).toHexString(),
			name: 'l900'
		}, {
			hex: tinycolor(hex).lighten(52).toHexString(),
			name: 'A100'
		}, {
			hex: tinycolor(hex).lighten(37).toHexString(),
			name: 'A200'
		}, {
			hex: tinycolor(hex).lighten(6).toHexString(),
			name: 'A400'
		}, {
			hex: tinycolor(hex).darken(12).toHexString(),
			name: 'A700'
		}
	]

	return colors.reduce((palette,nextColor) => {
		palette[nextColor.name] = nextColor.hex
		return palette
	},{}) as any
}

/**
 * Export the base palettes
 */
export const Palettes = _.cloneDeep(BasePalettes) as typeof BasePalettes

export interface MaterialColorSet {
	hue1?:string
	hue2?:string
	hue3?:string
	hue4?:string
}

export interface IPalette {
	PaletteName?:string
	palettes:{
		primary:MaterialColorPalette,
		secondary:MaterialColorPalette,
		accent:MaterialColorPalette,
		warn:MaterialColorPalette,
		background:string
	}
	primary: MaterialColorSet
	secondary: MaterialColorSet
	accent: MaterialColorSet
	warn:MaterialColorSet
	success:MaterialColorSet
	background: string
	text: MaterialTextColors
	alternateText: MaterialTextColors

}

export function makeHues(palette,colorSet) {

	function colorSetValue(index) {
		const hue = colorSet[index].toLowerCase()
		return  (['l','a'].includes(hue.charAt(0))) ?
			palette[hue] :
			hue

	}

	return {
		hue1: colorSetValue(0),
		hue2: colorSetValue(1),
		hue3: colorSetValue(2),
		hue4: colorSetValue(3)
	}
}

export function makeTextColors(textColor:string,opacities:ThemeTextOpacity) {
	return Object.keys(opacities).reduce((textColors,nextType) => {
		const textTypeColor = tinycolor(textColor).setAlpha(opacities[nextType])
		textColors[nextType] = textTypeColor.toString()
		return textColors
	},{}) as any
}

/**
 * Create a palette theme
 *
 * @param name
 * @param primary
 * @param primaryHues
 * @param secondary
 * @param secondaryHues
 * @param accent
 * @param accentHues
 * @param warn
 * @param warnHues
 * @param background
 * @param dark
 * @param textColor
 * @param textOpacities
 * @returns {{palettes: {primary: MaterialColorPalette, secondary: MaterialColorPalette, accent: MaterialColorPalette, warn: MaterialColorPalette, background: string}, primary: {hue1: any, hue2: any, hue3: any, hue4: any}, secondary: {hue1: any, hue2: any, hue3: any, hue4: any}, accent: {hue1: any, hue2: any, hue3: any, hue4: any}, warn: {hue1: any, hue2: any, hue3: any, hue4: any}, background: string, text: any, alternateText: any}}
 * @param success
 * @param successHues
 */
export function makePalette(
	name:string,
	primary:MaterialColorPalette,
	primaryHues:string[],
	secondary:MaterialColorPalette,
	secondaryHues:string[],
	accent:MaterialColorPalette,
	accentHues:string[],
	warn:MaterialColorPalette,
	warnHues:string[],
	success:MaterialColorPalette,
	successHues:string[],
	background:string,

	dark:boolean,
  textColor = null,
	textOpacities:ThemeTextOpacity = null
):IPalette {

	const
		themeType = dark ? ThemeType.Dark : ThemeType.Light

	textColor = textColor || (dark ? BasePalettes.white : BasePalettes.black)
	textOpacities =  textOpacities || ThemeDefaults.TextOpacity[themeType]


	return {
		PaletteName:name,
		palettes:{primary,secondary,accent,warn,background},
		primary: makeHues(primary,primaryHues),
		secondary: makeHues(secondary,secondaryHues),
		accent: makeHues(accent,accentHues),
		warn: makeHues(warn,warnHues),
		success: makeHues(success,successHues),
		background,
		text: makeTextColors(textColor,textOpacities),
		alternateText: makeTextColors(
			dark ? BasePalettes.black : BasePalettes.white,
			ThemeDefaults.TextOpacity[dark ? ThemeType.Light : ThemeType.Dark]
		)
	}



}
