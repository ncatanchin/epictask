import {isDefined} from "typeguard"
import {getContrastRatio} from "@material-ui/core/styles/colorManipulator"
// import {dark, light} from "@material-ui/core/styles/createPalette"

export type Contrast = 'light' | 'dark' | 'brown'
export interface Color {
    "50": string
    "100": string
    "200": string
    "300": string
    "400": string
    "500": string
    "600": string
    "700": string
    "800": string
    "900": string
    A100: string
    A200: string
    A400: string
    A700: string
    light: string
    main: string
    dark: string
    contrastDefaultColor: Contrast
    contrastText:string
}

const tinycolor = require('tinycolor2')

export type PaletteAttribute = keyof Color
export type PaletteDefault = "light" | "main" | "dark"
export function makeMaterialPalette(hex:string, light:PaletteAttribute | null = null,main:PaletteAttribute | null = null,dark:PaletteAttribute | null = null):Color {
    const colors = [
        {
            hex: tinycolor(hex).lighten(46).toHexString(),
            name: '50'
        }, {
            hex: tinycolor(hex).lighten(34).toHexString(),
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

    palette.contrastText = getContrastText(hex)
    return palette
}

const contrastThreshold = 3

export function getContrastText(background:string):string {
    // Use the same logic as
    // Bootstrap: https://github.com/twbs/bootstrap/blob/1d6e3710dd447de1a200f29e8fa521f8a0908f70/scss/_functions.scss#L59
    // and material-components-web https://github.com/material-components/material-components-web/blob/ac46b8863c4dab9fc22c4c662dc6bd1b65dd652f/packages/mdc-theme/_functions.scss#L54
    //const contrastText =
    //debugger
    return  getContrastRatio(background, "#FFFFFF") >= contrastThreshold
        ? "#FFFFFF"
        : "#222222"

    // if (process.env.NODE_ENV !== 'production') {
    //     const contrast = getContrastRatio(background, contrastText);
    //     warning(
    //       contrast >= 3,
    //       [
    //           `Material-UI: the contrast ratio of ${contrast}:1 for ${contrastText} on ${background}`,
    //           'falls below the WACG recommended absolute minimum contrast ratio of 3:1.',
    //           'https://www.w3.org/TR/2008/REC-WCAG20-20081211/#visual-audio-contrast-contrast',
    //       ].join('\n'),
    //     );
    // }

    //return contrastText;
}
