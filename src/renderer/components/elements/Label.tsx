import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  makeHeightConstraint,
  makeMarginRem, mergeClasses, rem,
  StyleDeclaration,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {ILabel} from "renderer/models/Label"
import {Chip} from "@material-ui/core"
import {getContrastText} from "renderer/styles/MaterialColors"


const log = getLogger(__filename)


function baseStyles(theme):any {
  const
    {palette} = theme,
    {primary, secondary} = palette
  
  return {
    root: [],
    chip: [makeMarginRem(0.3,0.5),makeHeightConstraint(rem(1.8)),{
      borderRadius: rem(0.9),
      margin: theme.spacing.unit,
      fontWeight: 500,
      fontSize: rem(0.8)
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
  
  render() {
    const {label, classes, className, style} = this.props
    return <Chip
      style={{
        backgroundColor: `#${label.color}`,
        color: getContrastText(`#${label.color}`),
        ...style
      }}
      className={mergeClasses(classes.chip, className)}
      label={label.name}
      
    />
  }
}
