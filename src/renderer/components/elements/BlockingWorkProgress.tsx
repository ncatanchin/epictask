import * as React from "react"
import getLogger from "common/log/Logger"
import {
  Ellipsis,
  FillWidth,
  FillWindow, FlexAuto,
  FlexColumn, FlexRowCenter, FlexScale,
  IThemedProperties, makePadding,
  makeTransition,
  NestedStyles,
  OverflowHidden, PositionAbsolute, rem, remToPx, StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import {IAppStatusWork} from "common/models/AppStatus"
import {appSelector} from "common/store/selectors/AppSelectors"
import {FlexSpacer} from "renderer/components/elements/FlexSpacer"
import CircularProgress from "@material-ui/core/CircularProgress/CircularProgress"
import classNames from "classnames"
import {getValue, isFunction} from "typeguard"
import {useEffect} from "react"
import {getCommandManager} from "common/command-manager"
import * as _ from 'lodash'
const log = getLogger(__filename)


function baseStyles(theme: Theme): StyleDeclaration {
  const
    {palette,components:{BlockingWorkProgress},spacing:{unit}} = theme,
    {primary, secondary,action} = palette,
    {colors} = BlockingWorkProgress

  return {
    root: {
      ...FillWindow,
      ...FlexColumn,
      ...PositionAbsolute,
      pointerEvents: "none",
      OverflowHidden,
      zIndex: theme.zIndex.blockingWork,

      "&.open": {
        pointerEvents: "auto",
        "&::before": {
          opacity: 1,
        },
      },

      "&::before": {
        ...makeTransition(["opacity"]),
        ...FillWindow,
        ...PositionAbsolute,
        background: colors.backdrop,
        top:0,
        left: 0,
        opacity: 0,
        zIndex: 1,
        content: "' '",



      },
    },



    content: {
      ...makeTransition(["top","opacity"]),
      ...FlexAuto,
      ...FillWidth,
      ...FlexRowCenter,
      ...makePadding(unit * 4),
      background: colors.bg,
      top: "100%",
      opacity: 0.6,
      zIndex: 2,
      color: colors.text,

      "&.open": {
        top: 0,
        opacity: 1
      },

      "& > .description": {
        ...Ellipsis,
        ...FlexScale,
        paddingLeft: unit * 8,
        fontSize: rem(4),
        fontWeight: 700
      }
    },

    progressColor: {
      color: action.main
    }
  }
}

interface P extends IThemedProperties {

}

interface SP {
  blockingWork: Array<IAppStatusWork>
}

const selectors = {
  blockingWork: appSelector(state => state.status.blockingWork)
} as Selectors<P, SP>

export default StyledComponent<P, SP>(baseStyles, selectors)(function BlockingWorkProgress(props: SP & P): React.ReactElement<P> {
  const
    {classes,blockingWork} = props,
    work = _.first(blockingWork),
    open = !!work,
    makeClasses = (clazz:string):string => classNames(clazz,{open}),
    content = getValue(() => work.content),
    node = !content ? "No Content" : isFunction(content) ? content({work}) : content

  useEffect(() => {
    if (work) {
      getCommandManager().pushStack()
    } else {
      getCommandManager().popStack()
    }
  },[work])


  return <div tabIndex={-1} className={makeClasses(classes.root)}>
    <FlexSpacer/>
    {work && <div className={makeClasses(classes.content)}>
      <CircularProgress
        size={remToPx(5)}
        thickness={remToPx(0.4)}
        classes={{
          colorPrimary: classes.progressColor
        }}
      />
      <div className="description">{node}</div>
    </div>}
  </div>
})
