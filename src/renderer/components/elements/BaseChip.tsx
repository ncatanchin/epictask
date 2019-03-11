import * as React from "react"
import getLogger from "common/log/Logger"
import {
  alpha,
  important,
  IThemedProperties, makeHeightConstraint,
  mergeClasses, rem,
  StyleDeclaration,
  Transparent,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {getContrastText} from "renderer/styles/MaterialColors"
import {Chip} from "@material-ui/core"
import Tooltip from "@material-ui/core/Tooltip/Tooltip"
import * as _ from 'lodash'
import {elevationStyles} from "renderer/components/elements/Elevation"

const log = getLogger(__filename)


function baseStyles(theme): StyleDeclaration {
  const
    {palette,components:{Chip}} = theme,
    {primary, secondary} = palette,
    smallDim = Chip.dimen.small,
    normalDim = Chip.dimen.normal,
    getDim = ({variant}:P):number | string => rem(variant === "small" ? smallDim : normalDim),
    colorProps = {
      "&, & *": {
        color: ({opaque = true, color: inColor}: P): string => {
          const
            cssColor = inColor[0] === 'r' || inColor[0] === '#' ? inColor : `#${inColor}`,
            color = opaque ? getContrastText(cssColor) : cssColor


          return color//`${color} !important`
        }
      }
    }

  return {
    chip: {
      ...makeHeightConstraint(getDim),
      ...colorProps,
      border: `0.5px solid ${alpha("#000000",0.5)}`
    },
    label: {
      ...colorProps
    },
    action: {}
  }
}

interface P extends IThemedProperties {
  color: string
  label: string
  variant?: "normal" | "small"
  opaque?: boolean
  leftIcon?: React.ReactElement<any>
  actionIcon?: React.ReactElement<any>
  onAction?: () => void
  tooltip?: string | null
}

@withStatefulStyles(baseStyles)
export default class BaseChip extends React.Component<P> {

  static defaultProps: Partial<P> = {
    opaque: true
  }

  constructor(props: P) {
    super(props)

  }

  render() {
    const
      {tooltip, leftIcon,onClick, innerRef, classes, color:inColor, label, className, opaque = true, style, actionIcon, onAction} = _.omit(this.props,"childrenClassName") as P,
      cssColor = inColor[0] === 'r' || inColor[0] === '#' ? inColor : `#${inColor}`,
      color = opaque ? getContrastText(cssColor) : cssColor,
      chip = <Chip
        innerRef={innerRef}
        color="default"
        style={opaque ? {
          backgroundColor: cssColor,
          color,
          ...style,
          //...elevationStyles.elevation6
        } : {
          backgroundColor: Transparent,
          border: `${rem(0.1)} solid ${cssColor}`,
          color,
          ...style
        }}
        avatar={leftIcon}
        className={mergeClasses(classes.chip, className)}
        classes={{
          root: classes.chip,
          label: classes.label
        }}
        label={label}
        deleteIcon={actionIcon}
        onDelete={onAction}
        onClick={onClick}
      />

    //log.info("Setting color", color)

    return tooltip ?
      <Tooltip
        title={tooltip}
      >
        {chip}
      </Tooltip> :
      chip

  }
}
