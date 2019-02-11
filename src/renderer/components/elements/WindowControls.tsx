import * as React from "react"
import withStyles, {StyleRules} from "@material-ui/core/styles/withStyles"
import {IconButton, Theme} from "@material-ui/core"
import CloseIcon from "@material-ui/icons/CloseSharp"
import MinimizeIcon from "@material-ui/icons/MinimizeSharp"
import MaximizeIcon from "@material-ui/icons/CropSquareSharp"
import {
  IThemedProperties,
  makeDimensionConstraints, makeMarginRem, makeTransition,
  mergeStyles, rem,
  StyleDeclaration, Transparent,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {remote} from "electron"
import {darken} from "@material-ui/core/styles/colorManipulator"
import {StyledComponent} from "renderer/components/elements/StyledComponent"

type Classes = "control"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette,
    baseColor = darken(primary.dark, 0.5)

  return {
    control: {
      ...makeMarginRem(0, 0.25, 0, 0.25),
      "& svg": {...makeDimensionConstraints(rem(0.9))},
      "& > .button": {
        ...makeDimensionConstraints(rem(1.2)),
        ...makeTransition(['background-color', 'color']),

        border: `${rem(0.1)} ${baseColor} solid`,
        backgroundColor: baseColor,
        color: Transparent,
        padding: 0,

        "&:hover": {
          backgroundColor: primary.dark,
          color: primary.contrastText
        }
      }
    }
  }

}

const onClose = (): void => {
  remote.getCurrentWindow().close()
}

const onMaximize = (): void => {
  remote.getCurrentWindow().maximize()
}

const onMinimize = (): void => {
  remote.getCurrentWindow().minimize()
}

type P = IThemedProperties<Classes>
/**
 * Simple window controls
 *
 * @param header
 * @constructor
 */
export const WindowControls = StyledComponent<P>(baseStyles)(({classes}: P): React.ReactElement<P> => {
  return <>
    <div className={classes.control}>
      <IconButton className="button close" onClick={onClose}>
        <CloseIcon/>
      </IconButton>
    </div>
    <div className={classes.control}>
      <IconButton className="button minimize" onClick={onMinimize}>
        <MinimizeIcon/>
      </IconButton>
    </div>

    <div className={classes.control}>
      <IconButton className="button maximize" onClick={onMaximize}>
        <MaximizeIcon/>
      </IconButton>
    </div>
  </>
})
