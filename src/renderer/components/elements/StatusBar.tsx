import * as React from "react"
import classNames from "classnames"
import getLogger from "common/log/Logger"
import {
  CssClassMap,
  FillWidth, FlexAuto, FlexColumn,
  FlexRowCenter, FlexScale, HeightProperties,
  IThemedProperties,
  makeHeightConstraint, makePadding, makePaddingRem, makeTransition,
  NestedStyles, PositionAbsolute, PositionRelative
} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import {IAppStatus} from "common/models/AppStatus"
import {appSelector} from "common/store/selectors/AppSelectors"
import {getValue} from "typeguard"
import LinearProgress from "@material-ui/core/LinearProgress/LinearProgress"
import Divider from "@material-ui/core/Divider/Divider"

const log = getLogger(__filename)


type Classes = "root" | "progress" | "progressColorPrimary" | "progressBarColorPrimary"

function baseStyles(theme: Theme): CssClassMap<Classes> {
  const
    {palette, components: {StatusBar}, spacing:{unit}} = theme,
    {primary, secondary} = palette,
    {colors, dimensions: dimen} = StatusBar

  return {
    root: {
      ...makeHeightConstraint(dimen.height),
      ...FillWidth,
      ...FlexColumn,
      ...FlexAuto,
      ...PositionRelative,
      color: colors.text,
      background: colors.bg,
      "&::after": {
        ...PositionAbsolute,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        content: "' '",
        boxShadow: colors.divider
      },
      "& > .top": {
        ...makeTransition(HeightProperties),
        ...FillWidth,
        ...FlexAuto,
        ...makeHeightConstraint(dimen.progressHeight),
        "&.hidden": {
          ...makeHeightConstraint(0)
        }
      },
      "& > .bottom": {
        ...FlexRowCenter,
        ...FlexScale,
        ...FillWidth,
        "& > .left": {
          ...makePadding(0,unit),
          ...FlexScale,
          textAlign: "left"
        }
      },

    },

    progress: {
      ...makeHeightConstraint(dimen.progressHeight)
    },

    progressBarColorPrimary: {
      background: colors.progressBar
    },

    progressColorPrimary: {
      background: colors.progress
    }
  }
}

interface P extends IThemedProperties<Classes> {

}

interface SP {
  status: IAppStatus
}

const selectors = {
  status: appSelector(state => state.status)
} as Selectors<P, SP>

export default StyledComponent<P, SP>(baseStyles, selectors)(function StatusBar(props: SP & P): React.ReactElement<P> {
  const {classes, status} = props
  return <div
    className={classNames(classes.root, {
      hidden: status.hidden
    })}
  >
    <div className={classNames("top", {
      hidden: status.network.pending.length === 0
    })}>
      <LinearProgress
        classes={{
          root: classNames(classes.progress),
          colorPrimary: classes.progressColorPrimary,
          barColorPrimary: classes.progressBarColorPrimary
        }}
      />
    </div>
    <div className="bottom">
      <div className="left">
        {getValue(() => status.message.content, "No current messages")}
      </div>
      <div className="right">

      </div>
    </div>
  </div>
})
