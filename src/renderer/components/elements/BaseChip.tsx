import * as React from "react"
import getLogger from "common/log/Logger"
import {
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

const log = getLogger(__filename)


function baseStyles(theme): StyleDeclaration {
  const
    {palette,components:{Chip}} = theme,
    {primary, secondary} = palette,
    smallDim = Chip.dimen.small,
    normalDim = Chip.dimen.normal,
    getDim = ({variant}:P):number | string => rem(variant === "small" ? smallDim : normalDim)

  return {
    chip: [makeHeightConstraint(getDim)],
    label: [],
    action: []
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
      {tooltip, leftIcon,onClick, innerRef, classes, color, label, className, opaque, style, actionIcon, onAction} = _.omit(this.props,"childrenClassName") as P,
      cssColor = color[0] === 'r' || color[0] === '#' ? color : `#${color}`,
      chip = <Chip
        innerRef={innerRef}
        style={opaque ? {
          backgroundColor: cssColor,
          color: getContrastText(cssColor),
          ...style
        } : {
          backgroundColor: Transparent,
          border: `${rem(0.1)} solid ${cssColor}`,
          color: cssColor,
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

    return tooltip ?
      <Tooltip
        title={tooltip}
      >
        {chip}
      </Tooltip> :
      chip

  }
}
