import * as React from "react"
import getLogger from "common/log/Logger"
import {
  FlexRowCenter,
  FlexScale,
  IThemedProperties,
  makePaddingRem,
  NestedStyles,
  rem, StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import MUITextField, {TextFieldProps} from "@material-ui/core/TextField/TextField"
import {ClassNameMap} from "@material-ui/core/styles/withStyles"
import * as _ from 'lodash'

const
  log = getLogger(__filename)


type Classes = "root" | "inputRoot" | "input" | "focused"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette,components:{TextField}} = theme,
    {primary, secondary} = palette

  return {
    root: {...FlexRowCenter,
      backgroundColor: TextField.colors.bg
    },
    inputRoot: {...FlexScale,
      borderRadius: rem(0.3)
    },
    input: {...makePaddingRem(1),
      fontSize: rem(1.4),
      '&::-webkit-input-placeholder': {
        fontWeight: '500'
      }
    },
    focused: {...theme.focus}
  }
}

interface P {
  classes?: Partial<ClassNameMap<Classes>>
}

export default StyledComponent<TextFieldProps & P>(baseStyles)(function TextField(props: TextFieldProps & P): React.ReactElement<TextFieldProps & P> {
  const
    classes = props.classes,
    other = _.omit(props,"classes","variant")

  return <MUITextField
    classes={{
      root: classes.root

    }}

    InputProps={{
      disableUnderline: true,
      classes: {
        root: classes.inputRoot,
        input: classes.input,
        focused: classes.focused
      }
    }}
    variant="filled"
    {...other}
  />
})
