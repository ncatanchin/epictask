import {isDefined} from "typeguard"

export type Contrast = 'light' | 'dark' | 'brown'
export interface Color {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
    A100: string
    A200: string
    A400: string
    A700: string
    light: string
    main: string
    dark: string
    contrastDefaultColor: Contrast
}

const tinycolor = require('tinycolor2')

export type PaletteAttribute = keyof Color
export type PaletteDefault = "light" | "main" | "dark"
export function makeMaterialPalette(hex:string,light:PaletteAttribute | null = null,main:PaletteAttribute | null = null,dark:PaletteAttribute | null = null):Color {
    const colors = [
        {
            hex: tinycolor(hex).lighten(52).toHexString(),
            name: '50'
        }, {
            hex: tinycolor(hex).lighten(37).toHexString(),
            name: '100'
        }, {
            hex: tinycolor(hex).lighten(26).toHexString(),
            name: '200'
        }, {
            hex: tinycolor(hex).lighten(12).toHexString(),
            name: '300'
        }, {
            hex: tinycolor(hex).lighten(6).toHexString(),
            name: '400'
        }, {
            hex: hex,
            name: '500'
        }, {
            hex: tinycolor(hex).darken(6).toHexString(),
            name: '600'
        }, {
            hex: tinycolor(hex).darken(12).toHexString(),
            name: '700'
        }, {
            hex: tinycolor(hex).darken(18).toHexString(),
            name: '800'
        }, {
            hex: tinycolor(hex).darken(24).toHexString(),
            name: '900'
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

    const palette = colors.reduce((palette,nextColor) => {
        palette[nextColor.name] = nextColor.hex
        return palette
    },{}) as Color
    
    Array<[PaletteDefault,PaletteAttribute]>(["main",main],["light",light],["dark",dark])
      .filter(pair => isDefined(pair[1]))
      .forEach(([name,attr]) => {
          palette[name] = palette[attr]
      })
    return palette
}
