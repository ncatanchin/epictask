import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties, makeDimensionConstraints,
  makeHeightConstraint,
  makeMarginRem, makePaddingRem, makeTransition, MarginProps,
  mergeClasses, NestedStyles, PaddingProps,
  rem,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {ILabel} from "common/models/Label"
import {getContrastText} from "renderer/styles/MaterialColors"
import BaseChip from "renderer/components/elements/BaseChip"
import {darken} from "@material-ui/core/styles/colorManipulator"
import {Tooltip} from "@material-ui/core"
import RemoveIcon from "@material-ui/icons/Close"
import {guard} from "typeguard"

const log = getLogger(__filename)


function baseStyles(theme: Theme): NestedStyles {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: [{
      "&:hover": [{
        "& .action": [makeDimensionConstraints(rem(1.5)), makePaddingRem(0.25), makeMarginRem(0, 0, 0, -0.4), {
          opacity: 1
        }]
      }]
    }],
    action: [
      makeTransition(["opacity", "min-width", "width", "max-width", ...PaddingProps, ...MarginProps]),
      makeDimensionConstraints(0),
      makePaddingRem(0),
      makeMarginRem(0), {
        opacity: 0,
        background: (props: P) => darken(`#${props.label.color}`, 0.2),
        borderRadius: rem(0.8),
        "& > .icon": [makeTransition("color"), {
          color: (props: P) => darken(getContrastText(`#${props.label.color}`), 0.4),
          pointerEvents: "none",
          fontSize: rem(1),
          "&,& > svg": [makeDimensionConstraints(rem(1))]
        }],
        "&:hover": {
          "& > .icon": [{
            color: (props: P) => getContrastText(`#${props.label.color}`)
          }]
        }
      }]
  }
}

interface P extends IThemedProperties {
  label: ILabel
  editable?: boolean
  onDelete?: (label: ILabel) => void
}


@withStatefulStyles(baseStyles)
export default class Label extends React.Component<P> {

  static defaultProps: Partial<P> = {
    editable: false
  }

  constructor(props: P) {
    super(props)

  }

  private onAction = () => guard(() => this.props.onDelete(this.props.label))

  render() {
    const
      {onDelete: onAction, label, classes, className, ...other} = this.props,
      actionIcon = <div className={mergeClasses(classes.action, "action")}>
        <RemoveIcon className="icon"/>
      </div>,
      actionProps = onAction ? {
        onAction: this.onAction,
        actionIcon
      } : {}


    return <Tooltip title={label.name} aria-label={label.name}>
      <BaseChip
        variant="small"
        color={label.color}
        label={label.name}
        className={mergeClasses(classes.root, className)}
        classes={{...classes, action: classes.add, root: null, add: null}}
        {...actionProps}
      />
    </Tooltip>
  }
}
