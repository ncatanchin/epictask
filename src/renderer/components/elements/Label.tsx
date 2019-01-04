import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties, makeDimensionConstraints,
  makeHeightConstraint,
  makeMarginRem, makePaddingRem, makeTransition,
  mergeClasses, NestedStyles,
  rem,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {ILabel} from "common/models/Label"
import {getContrastText} from "renderer/styles/MaterialColors"
import BaseChip from "renderer/components/elements/BaseChip"
import {darken} from "@material-ui/core/styles/colorManipulator"
import RemoveIcon from "@material-ui/icons/Close"

const log = getLogger(__filename)


function baseStyles(theme:Theme):NestedStyles {
  const
    {palette} = theme,
    {primary, secondary} = palette
  
  return {
    root: [],
    action: [makeDimensionConstraints(rem(1.5)),makePaddingRem(0.25),{
      background: (props:P) => darken(`#${props.label.color}`,0.2),
      borderRadius: rem(0.8),
      "& > .icon": [makeTransition("color"),{
        color: (props:P) => darken(getContrastText(`#${props.label.color}`),0.4),
        pointerEvents: "none",
        fontSize: rem(1),
        "&,& > svg": [makeDimensionConstraints(rem(1))]
      }],
      "&:hover": {
        "& > .icon": [{
          color: (props:P) => getContrastText(`#${props.label.color}`),
        }]
      }
    }]
  }
}

interface P extends IThemedProperties {
  label:ILabel
  editable?:boolean
}


@withStatefulStyles(baseStyles)
export default class Label extends React.Component<P> {
  
  static defaultProps:Partial<P> = {
    editable: false
  }
  
  constructor(props:P) {
    super(props)
    
  }
  
  private onDelete = () => {
  
  }
  
  render() {
    const {label, classes, className, style} = this.props
    return <BaseChip
      color={label.color}
      label={label.name}
      className={className}
      classes={{...classes, action: classes.add, root:null, add: null}}
      onAction={this.onDelete}
      actionIcon={<div className={classes.action}>
        <RemoveIcon className="icon" />
      </div>}
    />
  }
}
