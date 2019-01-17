import {makeMaterialPalette} from "renderer/styles/MaterialColors"
import createMuiTheme from "@material-ui/core/styles/createMuiTheme"
import {
  Ellipsis, Fill,
  IThemePalette, makePaddingRem,
  makeTransition,
  mergeStyles, NestedStyles,
  OverflowHidden, PositionAbsolute, PositionRelative,
  rem,
  remToPx, Transparent
} from "renderer/styles/ThemedStyles"
import {darken, lighten} from "@material-ui/core/styles/colorManipulator"
import getLogger from "common/log/Logger"
import {Theme as MUITheme} from "@material-ui/core"
import {Run} from "common/util/fn"

const log = getLogger(__filename)

/**
 * Global theme/palette used throughout Saffron
 */
const darkPalette = {
  type: "dark",
  primary: makeMaterialPalette("#555555", "A200", "A400", "A700"), // app icons and text
  secondary: makeMaterialPalette("#445fe9", "A200", "A400", "A700"),
  background: makeMaterialPalette("#555555", "A200", "A400", "A700"),
  text: makeMaterialPalette("rgba(0,0,0,0.8)", "A200", "A400", "A700"),
  textNight: makeMaterialPalette("#FFFFFF", "A200", "A400", "A700"),
  error: makeMaterialPalette("#ff3633", "A200", "A400", "A700"),
  success: makeMaterialPalette("#3cff32", "A200", "A400", "A700"),
  action: makeMaterialPalette("#5054ff", "A200", "A400", "A700")
} as IThemePalette


declare global {
  interface ITypographyStyles {
    highlight: NestedStyles
  }

  interface IComponentStyles {

    Typography: ITypographyStyles
    SplitPane: ISplitPaneStyles
    Header: IHeaderStyles
    IssuesLayout: IIssuesLayoutStyles
    Labels: ILabelsStyles
    IssueListItem: IIssueListItemStyles
    IIssueDetails: IIssueDetailsStyles

  }

  interface ITheme {
    palette: IThemePalette
    components: IComponentStyles
  }

  type Theme = ITheme & MUITheme & any
}


function makeDarkTheme(): ITheme & any {
  const
    {action, primary, secondary} = darkPalette,
    outlineFocused = `inset 0px 0px 0.1rem 0.1rem ${action.main}`,
    outline = {
      "&::after": [PositionAbsolute, Fill, makeTransition('box-shadow'), {
        top: 0,
        left: 0,
        boxShadow: outlineFocused,
        content: "' '"
      }]
    },
    Typography = {
      highlight: {
        background: action.main,
        color: action.contrastText
      }
    },
    Input = {
      field: [makePaddingRem(0.5, 1.2), {
        fontSize: rem(1.3),
        border: "none",
        outline: "none"
      }]
    },
    Select = Run(() => {
      const
        text = [Ellipsis, OverflowHidden, {
          color: primary.contrastText
        }],
        highlightBg = [text, {
          backgroundColor: action.main
        }],
        hover = {
          "&:hover": {
            backgroundColor: darken(action.main, 0.4),
            "&, & *": {
              fontWeight: 500
            }
          }
        },
        colors = {
          bg: darken(primary.dark, 0.6),
          filterBg: darken(primary.dark, 0.8),
          text: primary.contrastText
        }

      return {
        colors,
        paper: [PositionRelative, OverflowHidden, {
          background: colors.bg,
          color: colors.text
        }],
        option: [{
          focused: [text, outline],
          selected: [text, hover, highlightBg, highlightBg, hover],
          root: [text, hover]
        }],
        divider: {
          height: 6 * 2
        }
      }
    }),
    SplitPane = [{
      colors: [{
        splitter: darken(primary.dark, 0.8),
        splitterHover: action.main,
        pane1Bg: darken(primary.dark, 0.2),
        pane2Bg: primary.dark
      }]
    }],
    Milestone = [{
      colors: {
        bg: darken(primary.dark, 0.6),
        actionBg: darken(primary.dark, 0.4)
      }
    }],
    IssuesLayout = [{
      colors: {
        bg: darken(primary.dark, 0.7),
        controlsBg: `content-box radial-gradient(${darken(primary.dark, 0.4)}, ${darken(primary.dark, 0.5)})`,//darken(primary.dark,0.4),
        controlsBgHover: darkPalette.action.main
      }
    }],
    IssueDetails = [{
      colors: {
        none: darken(primary.contrastText, 0.4),
        bg: darken(primary.dark, 0.8),
        commentHeader: primary.contrastText,
        commentHeaderBg: darken(primary.main, 0.9),
        commentBorder: darken(primary.main, 0.8),
        commentBodyBg: darken(primary.main, 0.85),
        commentText: darken(primary.contrastText, 0.3),
        connection: darken(primary.main, 0.7)

      }
    }],

    IssueListItem = [{
      colors: Run(() => {
        const normal = {
          bg: `border-box radial-gradient(${darken(primary.dark, 0.4)}, ${darken(primary.dark, 0.5)})`,//darken(primary.dark,0.4),
          labelScrollFade: darken(primary.dark, 0.4),//`$, ${darken(primary.dark, 0.5)})`,//darken(primary.dark,0.4),
          number: darken(primary.contrastText, 0.5),
          updatedAt: darken(primary.contrastText, 0.7),
          subtitle: darken(primary.contrastText, 0.3),
          topBg: `border-box radial-gradient(${darken(primary.dark, 0.6)}, ${darken(primary.dark, 0.7)})`,
          boxShadow: "inset 0 0 0.2rem 0.2rem rgba(10,10,10,0.3)",
          dividerBoxShadow: "0px 0rem 0.5rem 0.3rem rgba(3, 12, 7, 0.80)",
          outline: Transparent,
          text: primary.contrastText
        }
        return {
          normal,
          selected: Object.assign({}, normal, {
            //context-box radial-gradient(${action.main}, ${darken(action.main, 0.1)})
            outline: outlineFocused
          })
        }

      })

    }],
    Header = [{
      colors: {
        bg: `content-box radial-gradient(${darken(primary.dark, 0.7)}, ${darken(primary.dark, 0.8)})`,
        logoBg: action.main,
        logoBoxShadow: "inset 0 0 0.4rem rgba(10,10,10,0.5)",
        boxShadow: "0 0 1rem 0.4rem rgba(10,10,10,0.5)"
      }
    }],
    Labels = [{
      colors: {
        addBg: darken(primary.dark, 0.6),
        add: primary.contrastText
      }
    }],
    Avatar = [{
      colors: {
        bg: darken(primary.main, 0.9),
        default: darken(primary.contrastText, 0.2),
      }
    }],
    Chip = [{
      dimen: {
        small: 1.4,
        normal: 2
      }
    }]


  return createMuiTheme(mergeStyles({
    palette: darkPalette,
    typography: {
      useNextVariants: true,

      fontFamily: [
        'AvenirNext',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"'
      ].join(','),
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500
    },

    spacing: {
      unit: remToPx(0.4)
    },

    background: {
      global: primary.dark
    },

    dimensions: {
      resizer: remToPx(0.6)
    },

    components: {
      Typography,
      Input,
      Select,
      SplitPane,
      Milestone,
      IssuesLayout,
      IssueListItem,
      IssueDetails,
      Header,
      Labels,
      Avatar,
      Chip
    },

    outline,

    focus: [makeTransition('box-shadow'), {
      boxShadow: `inset 0px 0px 0.1rem 0.1rem ${action.main}`
    }],

    overrides: {
      MuiDivider: {
        root: {
          backgroundColor: darken(primary.dark, 0.6),
          height: rem(0.1)
        }
      }
    }

  })) as any
}

export const darkTheme = makeDarkTheme()

/**
 * {
  "breakpoints": {
    "keys": [
      "xs",
      "sm",
      "md",
      "lg",
      "xl"
    ],
    "values": {
      "xs": 0,
      "sm": 600,
      "md": 960,
      "lg": 1280,
      "xl": 1920
    }
  },
  "direction": "ltr",
  "mixins": {
    "toolbar": {
      "minHeight": 56,
      "@media (min-width:0px) and (orientation: landscape)": {
        "minHeight": 48
      },
      "@media (min-width:600px)": {
        "minHeight": 64
      }
    }
  },
  "overrides": {
    "MuiDivider": {
      "root": {
        "backgroundColor": "rgb(21, 21, 21)",
        "height": "0.1rem"
      }
    }
  },
  "palette": {
    "common": {
      "black": "#000",
      "white": "#fff"
    },
    "type": "dark",
    "primary": {
      "50": "#cacaca",
      "100": "#acacac",
      "200": "#979797",
      "300": "#747474",
      "400": "#646464",
      "500": "#555555",
      "600": "#464646",
      "700": "#363636",
      "800": "#272727",
      "900": "#181818",
      "A100": "#dadada",
      "A200": "#b3b3b3",
      "A400": "#646464",
      "A700": "#363636",
      "main": "#646464",
      "light": "#b3b3b3",
      "dark": "#363636",
      "contrastText": "#FFFFFF"
    },
    "secondary": {
      "50": "#ffffff",
      "100": "#dfe4fb",
      "200": "#bbc4f7",
      "300": "#7b8eef",
      "400": "#5f76ec",
      "500": "#445fe9",
      "600": "#2948e6",
      "700": "#1938d7",
      "800": "#1631bb",
      "900": "#132aa0",
      "A100": "#ffffff",
      "A200": "#edeffd",
      "A400": "#5f76ec",
      "A700": "#1938d7",
      "main": "#5f76ec",
      "light": "#edeffd",
      "dark": "#1938d7",
      "contrastText": "#FFFFFF"
    },
    "error": {
      "50": "#ffffff",
      "100": "#ffe1e0",
      "200": "#ffb9b8",
      "300": "#ff7270",
      "400": "#ff5452",
      "500": "#ff3633",
      "600": "#ff1814",
      "700": "#f50400",
      "800": "#d60300",
      "900": "#b80300",
      "A100": "#ffffff",
      "A200": "#fff0f0",
      "A400": "#ff5452",
      "A700": "#f50400",
      "main": "#ff5452",
      "light": "#fff0f0",
      "dark": "#f50400",
      "contrastText": "#FFFFFF"
    },
    "grey": {
      "50": "#fafafa",
      "100": "#f5f5f5",
      "200": "#eeeeee",
      "300": "#e0e0e0",
      "400": "#bdbdbd",
      "500": "#9e9e9e",
      "600": "#757575",
      "700": "#616161",
      "800": "#424242",
      "900": "#212121",
      "A100": "#d5d5d5",
      "A200": "#aaaaaa",
      "A400": "#303030",
      "A700": "#616161"
    },
    "contrastThreshold": 3,
    "tonalOffset": 0.2,
    "text": {
      "50": "#757575",
      "100": "#575757",
      "200": "#424242",
      "300": "#1f1f1f",
      "400": "#0f0f0f",
      "500": "rgba(0,0,0,0.8)",
      "600": "#000000",
      "700": "#000000",
      "800": "#000000",
      "900": "#000000",
      "primary": "#fff",
      "secondary": "rgba(255, 255, 255, 0.7)",
      "disabled": "rgba(255, 255, 255, 0.5)",
      "hint": "rgba(255, 255, 255, 0.5)",
      "icon": "rgba(255, 255, 255, 0.5)",
      "A100": "#858585",
      "A200": "#5e5e5e",
      "A400": "#0f0f0f",
      "A700": "#000000",
      "main": "#0f0f0f",
      "light": "#5e5e5e",
      "dark": "#000000",
      "contrastText": "#FFFFFF"
    },
    "divider": "rgba(255, 255, 255, 0.12)",
    "background": {
      "50": "#cacaca",
      "100": "#acacac",
      "200": "#979797",
      "300": "#747474",
      "400": "#646464",
      "500": "#555555",
      "600": "#464646",
      "700": "#363636",
      "800": "#272727",
      "900": "#181818",
      "paper": "#424242",
      "default": "#303030",
      "A100": "#dadada",
      "A200": "#b3b3b3",
      "A400": "#646464",
      "A700": "#363636",
      "main": "#646464",
      "light": "#b3b3b3",
      "dark": "#363636",
      "contrastText": "#FFFFFF"
    },
    "action": {
      "50": "#ffffff",
      "100": "#fdfdff",
      "200": "#d5d6ff",
      "300": "#8d90ff",
      "400": "#6f72ff",
      "500": "#5054ff",
      "600": "#3136ff",
      "700": "#1318ff",
      "800": "#0006f3",
      "900": "#0005d5",
      "active": "#fff",
      "hover": "rgba(255, 255, 255, 0.1)",
      "hoverOpacity": 0.1,
      "selected": "rgba(255, 255, 255, 0.2)",
      "disabled": "rgba(255, 255, 255, 0.3)",
      "disabledBackground": "rgba(255, 255, 255, 0.12)",
      "A100": "#ffffff",
      "A200": "#ffffff",
      "A400": "#6f72ff",
      "A700": "#1318ff",
      "main": "#6f72ff",
      "light": "#ffffff",
      "dark": "#1318ff",
      "contrastText": "#FFFFFF"
    },
    "textNight": {
      "50": "#ffffff",
      "100": "#ffffff",
      "200": "#ffffff",
      "300": "#ffffff",
      "400": "#ffffff",
      "500": "#FFFFFF",
      "600": "#f0f0f0",
      "700": "#e0e0e0",
      "800": "#d1d1d1",
      "900": "#c2c2c2",
      "A100": "#ffffff",
      "A200": "#ffffff",
      "A400": "#ffffff",
      "A700": "#e0e0e0",
      "main": "#ffffff",
      "light": "#ffffff",
      "dark": "#e0e0e0",
      "contrastText": "#222222"
    },
    "success": {
      "50": "#ffffff",
      "100": "#e1ffdf",
      "200": "#baffb7",
      "300": "#76ff6f",
      "400": "#59ff51",
      "500": "#3cff32",
      "600": "#1fff13",
      "700": "#0cf400",
      "800": "#0ad500",
      "900": "#09b700",
      "A100": "#ffffff",
      "A200": "#efffef",
      "A400": "#59ff51",
      "A700": "#0cf400",
      "main": "#59ff51",
      "light": "#efffef",
      "dark": "#0cf400",
      "contrastText": "#222222"
    }
  },
  "props": {},
  "shadows": [
    "none",
    "0px 1px 3px 0px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 2px 1px -1px rgba(0,0,0,0.12)",
    "0px 1px 5px 0px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 3px 1px -2px rgba(0,0,0,0.12)",
    "0px 1px 8px 0px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 3px 3px -2px rgba(0,0,0,0.12)",
    "0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)",
    "0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)",
    "0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)",
    "0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)",
    "0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)",
    "0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)",
    "0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)",
    "0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)",
    "0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)",
    "0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)",
    "0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)",
    "0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)",
    "0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)",
    "0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)",
    "0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)",
    "0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)",
    "0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)",
    "0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)",
    "0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)",
    "0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)",
    "0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)"
  ],
  "typography": {
    "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
    "fontSize": 14,
    "fontWeightLight": 300,
    "fontWeightRegular": 400,
    "fontWeightMedium": 500,
    "display4": {
      "fontSize": "7rem",
      "fontWeight": 300,
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "letterSpacing": "-.04em",
      "lineHeight": "1.14286em",
      "marginLeft": "-.04em",
      "color": "rgba(255, 255, 255, 0.7)"
    },
    "display3": {
      "fontSize": "3.5rem",
      "fontWeight": 400,
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "letterSpacing": "-.02em",
      "lineHeight": "1.30357em",
      "marginLeft": "-.02em",
      "color": "rgba(255, 255, 255, 0.7)"
    },
    "display2": {
      "fontSize": "2.8125rem",
      "fontWeight": 400,
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "lineHeight": "1.13333em",
      "marginLeft": "-.02em",
      "color": "rgba(255, 255, 255, 0.7)"
    },
    "display1": {
      "fontSize": "2.125rem",
      "fontWeight": 400,
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "lineHeight": "1.20588em",
      "color": "rgba(255, 255, 255, 0.7)"
    },
    "headline": {
      "fontSize": "1.5rem",
      "fontWeight": 400,
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "lineHeight": "1.35417em",
      "color": "#fff"
    },
    "title": {
      "fontSize": "1.3125rem",
      "fontWeight": 500,
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "lineHeight": "1.16667em",
      "color": "#fff"
    },
    "subheading": {
      "fontSize": "1rem",
      "fontWeight": 400,
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "lineHeight": "1.5em",
      "color": "#fff"
    },
    "body2": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 400,
      "fontSize": "0.875rem",
      "lineHeight": 1.5
    },
    "body1": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 400,
      "fontSize": "1rem",
      "lineHeight": 1.5
    },
    "caption": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 400,
      "fontSize": "0.75rem",
      "lineHeight": 1.66
    },
    "button": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 500,
      "fontSize": "0.875rem",
      "lineHeight": 1.5,
      "textTransform": "uppercase"
    },
    "h1": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 300,
      "fontSize": "6rem",
      "lineHeight": 1
    },
    "h2": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 300,
      "fontSize": "3.75rem",
      "lineHeight": 1
    },
    "h3": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 400,
      "fontSize": "3rem",
      "lineHeight": 1.04
    },
    "h4": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 400,
      "fontSize": "2.125rem",
      "lineHeight": 1.17
    },
    "h5": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 400,
      "fontSize": "1.5rem",
      "lineHeight": 1.33
    },
    "h6": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 500,
      "fontSize": "1.25rem",
      "lineHeight": 1.6
    },
    "subtitle1": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 400,
      "fontSize": "1rem",
      "lineHeight": 1.75
    },
    "subtitle2": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 500,
      "fontSize": "0.875rem",
      "lineHeight": 1.57
    },
    "body1Next": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 400,
      "fontSize": "1rem",
      "lineHeight": 1.5
    },
    "body2Next": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 400,
      "fontSize": "0.875rem",
      "lineHeight": 1.5
    },
    "buttonNext": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 500,
      "fontSize": "0.875rem",
      "lineHeight": 1.5,
      "textTransform": "uppercase"
    },
    "captionNext": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 400,
      "fontSize": "0.75rem",
      "lineHeight": 1.66
    },
    "overline": {
      "color": "#fff",
      "fontFamily": "AvenirNext,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,\"Helvetica Neue\",Arial,sans-serif,\"Apple Color Emoji\",\"Segoe UI Emoji\",\"Segoe UI Symbol\"",
      "fontWeight": 400,
      "fontSize": "0.75rem",
      "lineHeight": 2.66,
      "textTransform": "uppercase"
    },
    "useNextVariants": true
  },
  "shape": {
    "borderRadius": 4
  },
  "spacing": {
    "unit": 8
  },
  "transitions": {
    "easing": {
      "easeInOut": "cubic-bezier(0.4, 0, 0.2, 1)",
      "easeOut": "cubic-bezier(0.0, 0, 0.2, 1)",
      "easeIn": "cubic-bezier(0.4, 0, 1, 1)",
      "sharp": "cubic-bezier(0.4, 0, 0.6, 1)"
    },
    "duration": {
      "shortest": 150,
      "shorter": 200,
      "short": 250,
      "standard": 300,
      "complex": 375,
      "enteringScreen": 225,
      "leavingScreen": 195
    }
  },
  "zIndex": {
    "mobileStepper": 1000,
    "appBar": 1100,
    "drawer": 1200,
    "modal": 1300,
    "snackbar": 1400,
    "tooltip": 1500
  },
  "background": {
    "global": "#363636"
  },
  "dimensions": {
    "resizer": 8.4
  },
  "components": {
    "Typography": {
      "highlight": {
        "background": "#6f72ff",
        "color": "#FFFFFF"
      }
    },
    "Input": {
      "field": {
        "paddingTop": "0.5rem",
        "paddingRight": "1.2rem",
        "paddingBottom": "0.5rem",
        "paddingLeft": "1.2rem",
        "fontSize": "1.3rem",
        "border": "none",
        "outline": "none"
      }
    },
    "Select": {
      "colors": {
        "bg": "rgb(21, 21, 21)",
        "filterBg": "rgb(10, 10, 10)",
        "text": "#FFFFFF"
      },
      "paper": {
        "position": "relative",
        "overflow": "hidden",
        "background": "rgb(21, 21, 21)",
        "color": "#FFFFFF"
      },
      "option": {
        "selected": {
          "whiteSpace": "nowrap",
          "overflow": "hidden",
          "textOverflow": "ellipsis",
          "color": "#FFFFFF",
          "&:hover": {
            "backgroundColor": "rgb(66, 68, 153)",
            "&, & *": {
              "fontWeight": 500
            }
          },
          "backgroundColor": "#6f72ff",
          "&.selected": {
            "whiteSpace": "nowrap",
            "overflow": "hidden",
            "textOverflow": "ellipsis",
            "color": "#FFFFFF",
            "backgroundColor": "#6f72ff",
            "&:hover": {
              "backgroundColor": "rgb(66, 68, 153)",
              "&, & *": {
                "fontWeight": 500
              }
            }
          }
        },
        "root": {
          "whiteSpace": "nowrap",
          "overflow": "hidden",
          "textOverflow": "ellipsis",
          "color": "#FFFFFF",
          "&:hover": {
            "backgroundColor": "rgb(66, 68, 153)",
            "&, & *": {
              "fontWeight": 500
            }
          },
          "&.selected": {
            "whiteSpace": "nowrap",
            "overflow": "hidden",
            "textOverflow": "ellipsis",
            "color": "#FFFFFF",
            "backgroundColor": "#6f72ff",
            "&:hover": {
              "backgroundColor": "rgb(66, 68, 153)",
              "&, & *": {
                "fontWeight": 500
              }
            }
          }
        }
      },
      "divider": {
        "height": 12
      }
    },
    "SplitPane": {
      "colors": {
        "splitter": "rgb(10, 10, 10)",
        "splitterHover": "#6f72ff",
        "pane1Bg": "rgb(43, 43, 43)",
        "pane2Bg": "#363636"
      }
    },
    "Milestone": {
      "colors": {
        "bg": "rgb(21, 21, 21)",
        "actionBg": "rgb(32, 32, 32)"
      }
    },
    "IssuesLayout": {
      "colors": {
        "bg": "rgb(16, 16, 16)",
        "controlsBg": "content-box radial-gradient(rgb(32, 32, 32), rgb(27, 27, 27))",
        "controlsBgHover": "#6f72ff"
      }
    },
    "IssueListItem": {
      "colors": {
        "normal": {
          "bg": "border-box radial-gradient(rgb(32, 32, 32), rgb(27, 27, 27))",
          "number": "rgb(127, 127, 127)",
          "updatedAt": "rgb(76, 76, 76)",
          "topBg": "border-box radial-gradient(rgb(21, 21, 21), rgb(16, 16, 16))",
          "boxShadow": "inset 0 0 0.2rem 0.2rem rgba(10,10,10,0.3)",
          "dividerBoxShadow": "0px 0rem 0.5rem 0.3rem rgba(3, 12, 7, 0.80)",
          "text": "#FFFFFF"
        },
        "selected": {
          "bg": "border-box radial-gradient(#6f72ff, rgb(99, 102, 229))",
          "boxShadow": "inset 0 0 0.2rem 0.2rem rgba(10,10,10,0.3)",
          "number": "rgb(229, 229, 229)",
          "updatedAt": "rgb(229, 229, 229)",
          "topBg": "border-box radial-gradient(rgb(99, 102, 229), rgb(88, 91, 204))",
          "dividerBoxShadow": "0px 0rem 0.5rem 0.3rem rgb(88, 91, 204)",
          "text": "#FFFFFF"
        }
      }
    },
    "Header": {
      "colors": {
        "bg": "content-box radial-gradient(rgb(16, 16, 16), rgb(10, 10, 10))",
        "logoBg": "#6f72ff",
        "logoBoxShadow": "inset 0 0 0.4rem rgba(10,10,10,0.5)",
        "boxShadow": "0 0 1rem 0.4rem rgba(10,10,10,0.5)"
      }
    },
    "Labels": {
      "colors": {
        "addBg": "rgb(21, 21, 21)",
        "add": "#FFFFFF"
      }
    }
  },
  "focus": {
    "transition": "box-shadow 250ms ease-out",
    "boxShadow": "inset 0px 0px 5px 5px #6f72ff"
  }
}
 */

// require("async-file")
//   .writeFile("/tmp/theme.json",JSON.stringify(darkTheme,null,2))
//   .then(() => log.info("Wrote theme file"))
//   .catch(err => log.error("Failed theme write",err))
//log.info("Full theme", JSON.stringify(darkTheme,null,2))
