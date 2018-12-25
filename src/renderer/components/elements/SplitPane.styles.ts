import {lighten} from "@material-ui/core/styles/colorManipulator"
import {
  mergeStyles,
  BorderBoxSizing,
  makeTransition,
  OverflowHidden,
  PositionRelative,
  Transparent,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"


/**
 * Styles
 *
 * @param theme
 */

export default function baseStyles(theme):StyleDeclaration {
  
  const
    {palette, dimensions} = theme,
    {resizer: resizerDim} = dimensions,
    resizerHalfDim = resizerDim / 2,
    hoverColor = palette.action.main,
    hoverBorder = `${resizerHalfDim}px solid ${hoverColor}`
  
  return mergeStyles({
    root: [],
    resizer: [BorderBoxSizing,makeTransition('all'), {
      //background: palette.primary.dark,
      opacity: 1,
      zIndex: 1,
      backgroundClip: 'padding-box',
      background: palette.primary.dark,
      
      
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
    pane1: [OverflowHidden,PositionRelative],
    pane2: [OverflowHidden,PositionRelative]
  })
}
