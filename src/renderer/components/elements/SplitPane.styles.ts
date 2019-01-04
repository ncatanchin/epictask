import {lighten} from "@material-ui/core/styles/colorManipulator"
import {
  BorderBoxSizing,
  makeTransition,
  OverflowHidden,
  PositionRelative,
  NestedStyles
} from "renderer/styles/ThemedStyles"


declare global {
  interface ISplitPaneStyles {
    colors: {
      splitter: string
      splitterHover: string
      pane1Bg: string
      pane2Bg: string
    }
  }
}

/**
 * Styles
 *
 * @param theme
 */

export default function baseStyles(theme:Theme):NestedStyles {
  
  const
    {palette, dimensions, components:{SplitPane}} = theme,
    {resizer: resizerDim} = dimensions,
    resizerHalfDim = resizerDim / 2,
    hoverColor = SplitPane.colors.splitterHover,
    hoverBorder = `${resizerHalfDim}px solid ${hoverColor}`
  
  return {
    root: [],
    resizer: [BorderBoxSizing,makeTransition(['background-color','border-left','border-right']), {
      //background: palette.primary.dark,
      opacity: 1,
      zIndex: 1,
      backgroundClip: 'padding-box',
      background: SplitPane.colors.splitter,
      
      
      '&:hover': [{
        //background: palette.primary.dark
        background: hoverColor,
      }],
      
      '&.horizontal': [{
        height: resizerDim + 1,
        margin: `-${resizerHalfDim}px 0`,
        borderBottom: `${resizerHalfDim}px solid transparent`,
        borderTop: `${resizerHalfDim}px solid transparent`,
        cursor: 'row-resize',
        width: '100%',
      }],
  
      '&.horizontal:hover': [{
        borderBottom: hoverBorder,
        borderTop: hoverBorder,
      }],
  
      '&.vertical': [{
        width: resizerDim + 1,
        margin: `0 -${resizerHalfDim}px`,
        borderRight: `${resizerHalfDim}px solid transparent`,
        borderLeft: `${resizerHalfDim}px solid transparent`,
        cursor: 'col-resize',
        height: '100%'
      }],
  
      '&.vertical:hover': [{
        borderRight: hoverBorder,
        borderLeft: hoverBorder,
      }],
    }],
    pane: [],
    pane1: [OverflowHidden,PositionRelative, {
      background: SplitPane.colors.pane1Bg
    }],
    pane2: [OverflowHidden,PositionRelative, {
      background: SplitPane.colors.pane2Bg
    }]
  }
}
