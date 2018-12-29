import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  makeDimensionConstraints,
  mergeClasses, rem,
  StyleDeclaration,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {IUser} from "renderer/models/User"
import {getValue} from "typeguard"
import Img from 'react-image'

const AvatarDefaultURL = require("renderer/assets/images/avatar-default.png")
const log = getLogger(__filename)


function baseStyles(theme):any {
  const
    {palette} = theme,
    {primary, secondary} = palette
  
  return {
    root: [makeDimensionConstraints(rem(2)),{
      borderRadius: rem(1)
    }]
  }
}

interface P extends IThemedProperties {
  user:IUser
}


@withStatefulStyles(baseStyles)
export default class Avatar extends React.Component<P> {
  
  constructor(props:P) {
    super(props)

  }
  
  render() {
    const {classes, user, className, ...other} = this.props
    return <Img
      className={mergeClasses(classes.root,className)}
      src={getValue(() => user.avatar_url)}
      loader={<img src={AvatarDefaultURL}/>}
      {...other}
    />
  }
}
