import * as React from "react"
import getLogger from "common/log/Logger"
import {
  Ellipsis, Fill,
  FillWidth,
  FlexAuto,
  FlexColumn, FlexRow, FlexRowCenter, FlexScale,
  IThemedProperties, makeHeightConstraint, makePaddingRem, makeTransition,
  OverflowHidden, PositionAbsolute, PositionRelative, rem,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import * as classNames from "classnames"
import {INotification} from "common/models/Notification"
import Moment from "react-moment"
import {Typography} from "@material-ui/core"
import {getValue} from "typeguard"
import {Color} from "csstype"

const log = getLogger(__filename)

type Classes = "root" | "top" | "focused" | "title" | "info" | "repo" | "timestamp" | "boxShadow"

declare global {
  type NotificationListItemColor = "bg" |
    "number" |
    "updatedAt" |
    "topBg" |
    "outline" |
    "boxShadow" |
    "dividerBoxShadow" |
    "text" |
    "marker" |
    "metadata"
}

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette,components:{NotificationListItem}} = theme,
    {primary, secondary} = palette,
    colorGetter = (color: NotificationListItemColor): ((props: P) => Color) => (props: P) => {
      const
        type = props.selected ? "selected" : "normal",
        colors = NotificationListItem.colors[type] || NotificationListItem.colors.normal

      return colors[color]
    }

  return {
    root: {
      ...PositionRelative,
      ...FlexColumn,
      ...FillWidth,
      ...makeHeightConstraint(70),
      ...OverflowHidden,
      background: colorGetter("bg"),

    },
    focused: {

    },
    title: {
      ...FlexScale,
      ...Ellipsis,
      textAlign: "left",
      fontSize: rem(1.2)
    },
    top: {
      ...FlexAuto,
      ...FlexRow,
      ...FillWidth,
      ...makePaddingRem(1)
    },
    info: {
      ...FlexScale,
      ...FlexRowCenter,
      ...makePaddingRem(0,1,1,1)
    },
    repo: {
      ...Ellipsis,
      ...FlexScale,
      color: colorGetter("metadata")
    },
    timestamp: {
      ...FlexAuto,
      color: colorGetter("metadata")
    },
    boxShadow: {...makeTransition("box-shadow", 100), ...PositionAbsolute, ...Fill,
      pointerEvents: "none",
      zIndex: 2,
      top: 0,
      left: 0,
      //boxShadow: colorGetter("outline"),
      boxShadow: colorGetter("boxShadow")
    }
  }
}

interface P extends IThemedProperties<Classes> {
  notification:INotification
  selected: boolean
}

interface SP {
}

const selectors = {} as Selectors<P, SP>

export default StyledComponent<P, SP>(baseStyles, selectors)(function NotificationListItem(props: SP & P): React.ReactElement<P> {
  const {classes,style,selected,notification,...other} = props
  return <div
    style={style}
    className={classNames(classes.root, {
      [classes.focused]: selected
    })}
    {...other}
  >
    <div className={classes.top}>
      <Typography className={classes.title} component="div">
        {getValue(() => (notification.payload as any).subject.title, "None")}
      </Typography>
    </div>
    <div className={classes.info}>
      <Typography className={classes.repo} component="div">
        {notification.repo_full_name}
      </Typography>

      <Typography className={classes.timestamp} component="div">
        <Moment fromNow date={notification.updated_at}/>
      </Typography>


    </div>
    <div className={classes.boxShadow}/>
  </div>
})
