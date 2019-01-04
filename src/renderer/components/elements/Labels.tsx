import * as React from "react"
import getLogger from "common/log/Logger"
import {
  FlexRow,
  IThemedProperties,
  mergeClasses,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {ILabel} from "common/models/Label"
import Label from "renderer/components/elements/Label"
import {getValue} from "typeguard"
import {Tag as TagIcon} from "@githubprimer/octicons-react"
import BaseChip from "renderer/components/elements/BaseChip"
const Octicon = require("@githubprimer/octicons-react").default

const log = getLogger(__filename)

declare global {
  interface ILabelsStyles {
    colors: {
      addBg: string
      add: string
    }
  }
}


function baseStyles(theme:Theme):any {
  const
    {palette,components:{Labels}} = theme,
    {primary, secondary} = palette
  
  return {
    root: [FlexRow,{
    
    }],
    chip: {},
    label: {},
    add: {}
  }
}

interface P extends IThemedProperties {
  wrap?:boolean
  labels:Array<ILabel>
  onAdd?:(label:ILabel) => void
}


@withStatefulStyles(baseStyles,{withTheme: true})
export default class Labels extends React.Component<P> {
  static defaultProps:Partial<P> = {
    wrap: false
  }
  
  constructor(props:P) {
    super(props)
  }
  
  private onAdd = () => {
  
  }
  
  render() {
    const {labels, wrap, theme,onAdd, classes,className} = this.props
    return <div className={mergeClasses(classes.root, wrap && "wrap",className)}>
      {labels.map((label,index) =>
        <Label
          key={label.id}
          className={classes.chip}
          style={Object.assign({},!index && {marginLeft: 0})}
          label={label}/>)
        }
      {onAdd && <BaseChip
        color={theme.components.Labels.colors.addBg}
        label={"+"}
        actionIcon={<div className={classes.add}>
          <Octicon className="icon" icon={TagIcon} />
        </div>}
        onAction={this.onAdd}
        classes={{
          chip: classes.chip,
          label: classes.label
        }}
      />}
    </div>
  }
}
