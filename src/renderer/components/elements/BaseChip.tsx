import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  mergeClasses, rem,
  StyleDeclaration,
  Transparent,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {getContrastText} from "renderer/styles/MaterialColors"
import {Chip} from "@material-ui/core"


const log = getLogger(__filename)


function baseStyles(theme):StyleDeclaration {
  const
    {palette} = theme,
    {primary, secondary} = palette
  
  return {
    chip: [],
    label: [],
    action: []
  }
}

interface P extends IThemedProperties {
  color: string
  label: string
  opaque?: boolean
  actionIcon?: React.ReactElement<any>
  onAction?: () => void
}

@withStatefulStyles(baseStyles)
export default class BaseChip extends React.Component<P> {
  
  static defaultProps:Partial<P> = {
    opaque: true
  }
  
  constructor(props:P) {
    super(props)
    
  }
  
  render() {
    const
      {classes,color,label,className,opaque, style,actionIcon,onAction} = this.props,
      cssColor = color[0] === 'r' || color[0] === '#' ? color : `#${color}`
    return <Chip
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
      className={mergeClasses(classes.chip, className)}
      classes={{
        root: classes.chip,
        label: classes.label
      }}
      label={label}
      deleteIcon={actionIcon}
      onDelete={onAction}
    />
  }
}
