import * as React from "react"
import getLogger from "common/log/Logger"
import {
  child,
  directChild, FillWidth, FlexRow, FlexRowCenter,
  IThemedProperties, makeHeightConstraint, makeMarginRem, makePaddingRem, makeWidthConstraint,
  mergeClasses, rem,
  StyleDeclaration,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {ILabel} from "renderer/models/Label"
import Label from "renderer/components/elements/Label"
import AddIcon from "@material-ui/icons/Add"


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
    add: [FlexRowCenter,makeMarginRem(0.3,0.2,0.3,0),makePaddingRem(0,1.2),makeHeightConstraint(rem(1.8)),makeWidthConstraint(rem(2.4)),{
      borderRadius: rem(0.9),
      margin: theme.spacing.unit,
      fontWeight: 500,
      background: Labels.colors.addBg,
      "&, & svg": {
        fontSize: rem(1.1),
        color: Labels.colors.add,
        fill: Labels.colors.add
      }
    }]
  }
}

interface P extends IThemedProperties {
  wrap?:boolean
  labels:Array<ILabel>
  onAdd?:(label:ILabel) => void
}


@withStatefulStyles(baseStyles)
export default class Labels extends React.Component<P> {
  static defaultProps:Partial<P> = {
    wrap: false
  }
  
  constructor(props:P) {
    super(props)
  }
  
  render() {
    const {labels, wrap, onAdd, classes,className} = this.props
    return <div className={mergeClasses(classes.root, wrap && "wrap",className)}>
      {labels.map((label,index) =>
        <Label
          key={label.id}
          className={classes.chip}
          style={Object.assign({},!index && {marginLeft: 0})}
          label={label}/>)
        }
      {onAdd && <div className={classes.add} style={Object.assign({},!labels.length && {marginLeft: 0})}>
        <AddIcon/>
      </div>}
    </div>
  }
}
