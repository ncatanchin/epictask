import * as React from "react"
import getLogger from "common/log/Logger"
import {
  Ellipsis,
  Fill, FillHeight,
  FillWidth,
  FlexAuto,
  FlexColumn,
  FlexRow,
  FlexRowCenter,
  FlexScale,
  IThemedProperties,
  makeDimensionConstraint,
  makeDimensionConstraints,
  makeHeightConstraint,
  makePaddingRem,
  makeTransition,
  OverflowHidden,
  PositionAbsolute,
  PositionRelative,
  rem,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import * as classNames from "classnames"
import {INotification} from "common/models/Notification"
import Moment from "react-moment"
import {Typography} from "@material-ui/core"
import {getValue} from "typeguard"
import {Color} from "csstype"
import {IRepoSearchResult} from "renderer/controllers/RepoImportController"
import {Repo as RepoIcon} from "@githubprimer/octicons-react"

const Octicon = require("@githubprimer/octicons-react").default
const log = getLogger(__filename)

type Classes = "root" | "top" | "focused" | "title" | "bottom" | "description" |
  "timestamp" | "boxShadow" | "accessory" | "main"


function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette, components: {ListItem}} = theme,
    {primary, secondary} = palette,
    colorGetter = (color: ListItemColor): ((props: P) => Color) => (props: P) => {
      const
        type = props.selected ? "selected" : "normal",
        colors = ListItem.colors[type] || ListItem.colors.normal

      return colors[color]
    }

  return {
    root: {
      ...PositionRelative,
      ...FlexRowCenter,
      ...FillWidth,
      ...makeHeightConstraint(70),
      ...OverflowHidden,
      background: colorGetter("bg")

    },
    focused: {},
    accessory: {
      ...makeDimensionConstraints(rem(3)),
      ...makePaddingRem(0,0,0,1),
      ...FlexAuto,
      ...FlexRowCenter,
      ...PositionRelative,
      color: colorGetter("accessory")
    },
    main: {
      ...FlexColumn,
      ...FlexScale,
      ...FillHeight
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
    bottom: {
      ...FlexScale,
      ...FlexRowCenter,
      ...makePaddingRem(0, 1, 1, 1)
    },
    description: {
      ...Ellipsis,
      ...FlexScale,
      color: colorGetter("subtext")
    },
    timestamp: {
      ...FlexAuto,
      color: colorGetter("subtext")
    },
    boxShadow: {
      ...makeTransition("boxShadow", 100), ...PositionAbsolute, ...Fill,
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
  result: IRepoSearchResult
  selected: boolean
}

interface SP {
}

const selectors = {} as Selectors<P, SP>

export default StyledComponent<P, SP>(baseStyles, selectors)(function RepoImportResultListItem(props: SP & P): React.ReactElement<P> {
  const {classes, style, selected, result, ...other} = props

  return <div
    style={style}
    className={classNames(classes.root, {
      [classes.focused]: selected
    })}
    {...other}
  >
    <div className={classes.accessory}>
      <Octicon icon={RepoIcon}/>
    </div>
    <div className={classes.main}>
      <div className={classes.top}>
        <Typography className={classes.title} component="div">
          {result.repo.full_name}
        </Typography>
      </div>
      <div className={classes.bottom}>
        <Typography className={classes.description} component="div">
          {result.repo.description}
        </Typography>
      </div>

    </div>
    <div className={classes.boxShadow}/>
  </div>
})
