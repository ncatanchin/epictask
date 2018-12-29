import {makeMaterialPalette} from "renderer/styles/MaterialColors"
import createMuiTheme from "@material-ui/core/styles/createMuiTheme"
import {IThemePalette, makeTransition, mergeStyles, remToPx} from "renderer/styles/ThemedStyles"
import {darken} from "@material-ui/core/styles/colorManipulator"
import getLogger from "common/log/Logger"

const log = getLogger(__filename)

/**
 * Global theme/palette used throughout Saffron
 */
const darkPalette = {
  type: "dark",
  primary: makeMaterialPalette("#555555","A200","A400","A700"), // app icons and text
  secondary: makeMaterialPalette("#445fe9","A200","A400","A700"),
  background: makeMaterialPalette("#F0F0F0","A200","A400","A700"),
  text: makeMaterialPalette("rgba(0,0,0,0.8)","A200","A400","A700"),
  textNight: makeMaterialPalette("#FFFFFF","A200","A400","A700"),
  error: makeMaterialPalette("#ff3633","A200","A400","A700"),
  success: makeMaterialPalette("#3cff32","A200","A400","A700"),
  action: makeMaterialPalette("#5054ff","A200","A400","A700")
} as IThemePalette


declare global {
  interface ITheme {
    components: {
      Header: IHeaderStyles
      IssuesLayout:IIssuesLayoutStyles
      Labels:ILabelsStyles
    } & any
  }
  
  type Theme = ITheme & any
}


function makeDarkTheme():ITheme & any {
  const
    {action,primary,secondary} = darkPalette
  
  log.info("Palette",darkPalette)
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
        '"Segoe UI Symbol"',
      ].join(','),
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500
    },
    
    
    dimensions: {
      resizer: remToPx(0.6)
    },
    
    components: {
      IssuesLayout: [{
        colors: {
          bg: darken(primary.dark,0.7),
          controlsBg: `content-box radial-gradient(${darken(primary.dark,0.4)}, ${darken(primary.dark, 0.5)})`,//darken(primary.dark,0.4),
          controlsBgHover: darkPalette.action.main
        }
      }],
      IssueListItem: [{
        colors: {
          bg: `content-box radial-gradient(${darken(primary.dark,0.4)}, ${darken(primary.dark, 0.5)})`,//darken(primary.dark,0.4),
          number: darken(primary.contrastText,0.5),
          boxShadow: "inset 0 0 0.1rem 0.1rem rgba(10,10,10,0.3)"
        }
      }],
      Header: [{
        colors: {
          bg: `content-box radial-gradient(${darken(primary.dark,0.7)}, ${darken(primary.dark, 0.8)})`,
          logoBg: action.main,
          logoBoxShadow: "inset 0 0 0.4rem rgba(10,10,10,0.5)",
          boxShadow: "0 0 1rem 0.4rem rgba(10,10,10,0.5)"
        }
      }],
      Labels: [{
        colors: {
          addBg: darken(primary.dark,0.4),
          add: primary.contrastText
        }
      }]
    },
    
    focus: [makeTransition('box-shadow'), {
      boxShadow: `inset 0px 0px 5px 5px ${action.main}`
    }],
    
    
  })) as any
}

export const darkTheme = makeDarkTheme()
