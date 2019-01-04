import {makeMaterialPalette} from "renderer/styles/MaterialColors"
import createMuiTheme from "@material-ui/core/styles/createMuiTheme"
import {IThemePalette, makeTransition, mergeStyles, rem, remToPx} from "renderer/styles/ThemedStyles"
import {darken} from "@material-ui/core/styles/colorManipulator"
import getLogger from "common/log/Logger"
import {Theme as MUITheme} from "@material-ui/core"
const log = getLogger(__filename)

/**
 * Global theme/palette used throughout Saffron
 */
const darkPalette = {
  type: "dark",
  primary: makeMaterialPalette("#555555","A200","A400","A700"), // app icons and text
  secondary: makeMaterialPalette("#445fe9","A200","A400","A700"),
  background: makeMaterialPalette("#555555","A200","A400","A700"),
  text: makeMaterialPalette("rgba(0,0,0,0.8)","A200","A400","A700"),
  textNight: makeMaterialPalette("#FFFFFF","A200","A400","A700"),
  error: makeMaterialPalette("#ff3633","A200","A400","A700"),
  success: makeMaterialPalette("#3cff32","A200","A400","A700"),
  action: makeMaterialPalette("#5054ff","A200","A400","A700")
} as IThemePalette


declare global {
  interface ITheme {
    components: {
      SplitPane: ISplitPaneStyles
      Header: IHeaderStyles
      IssuesLayout:IIssuesLayoutStyles
      Labels:ILabelsStyles
    } & any
  }
  
  type Theme = ITheme & MUITheme &  any
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
    
    background: {
      global: primary.dark
    },
    
    dimensions: {
      resizer: remToPx(0.6)
    },
    
    components: {
      SplitPane: [{
        colors: [{
          splitter: darken(primary.dark,0.8),
          splitterHover: action.main,
          pane1Bg: darken(primary.dark,0.2),
          pane2Bg: primary.dark,
        }]
      }],
      Milestone: [{
        colors: {
          bg: darken(primary.dark,0.6),
          actionBg: darken(primary.dark,0.4)
        }
      }],
      IssuesLayout: [{
        colors: {
          bg: darken(primary.dark,0.7),
          controlsBg: `content-box radial-gradient(${darken(primary.dark,0.4)}, ${darken(primary.dark, 0.5)})`,//darken(primary.dark,0.4),
          controlsBgHover: darkPalette.action.main
        }
      }],
      IssueListItem: [{
        colors: {
          bg: `border-box radial-gradient(${darken(primary.dark,0.4)}, ${darken(primary.dark, 0.5)})`,//darken(primary.dark,0.4),
          number: darken(primary.contrastText,0.5),
          boxShadow: "inset 0 0 0.2rem 0.2rem rgba(10,10,10,0.3)",
          updatedAt: darken(primary.contrastText,0.7),
          topBg: `border-box radial-gradient(${darken(primary.dark,0.6)}, ${darken(primary.dark, 0.7)})`,//darken(primary.dark,0.4),
          dividerBoxShadow: "0px 0rem 0.5rem 0.3rem rgba(3, 12, 7, 0.80)"
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
          addBg: darken(primary.dark,0.6),
          add: primary.contrastText
        }
      }]
    },
    
    focus: [makeTransition('box-shadow'), {
      boxShadow: `inset 0px 0px 5px 5px ${action.main}`
    }],
    
    overrides: {
      MuiDivider: {
        root: {
          backgroundColor: darken(primary.dark,0.6),
          height: rem(0.1)
        }
      }
    }
    
  })) as any
}

export const darkTheme = makeDarkTheme()
