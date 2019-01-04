import * as React from "react"
import getLogger from "common/log/Logger"
import {
  Fill,
  IThemedProperties,
  makeDimensionConstraints,
  mergeClasses, PositionRelative, rem,
  StyleDeclaration,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {IUser} from "common/models/User"
import {getValue} from "typeguard"
import Img from 'react-image'
import {lighten} from "@material-ui/core/styles/colorManipulator"

const
  AvatarDefaultURL = require("renderer/assets/images/avatar.svg"),
  AvatarDefaultSVG = require("!!raw-loader!renderer/assets/images/avatar.svg")
const log = getLogger(__filename)


function baseStyles(theme):any {
  const
    {palette} = theme,
    {primary, secondary} = palette
  
  return {
    root: [PositionRelative, makeDimensionConstraints(rem(2)), {
      "&.circle": {
        borderRadius: rem(1)
      },
      "&.square": {},
      "&.default": {
        fill: primary.main
      }
    }],
    default: [PositionRelative, makeDimensionConstraints(rem(2)), {
      "&.circle": {
        borderRadius: rem(1)
      },
      "&.square": {},
      
      "&, & svg": [Fill, {
        fill: lighten(primary.main, 0.4),
        color: lighten(primary.main, 0.4)
      }]
      
      
    }]
  }
}

interface P extends IThemedProperties {
  user:IUser
  square?:boolean
}


@withStatefulStyles(baseStyles)
export default class Avatar extends React.Component<P> {
  
  static defaultProps:Partial<P> = {
    square: false
  }
  
  constructor(props:P) {
    super(props)
    
  }
  
  render() {
    const
      {classes, user, className, square, ...other} = this.props,
      avatarUrl = getValue(() => user.avatar_url, AvatarDefaultURL),
      isDefault = avatarUrl === AvatarDefaultURL
    
    return isDefault ? <div
        className={mergeClasses(classes.default, square ? "square" : "circle", className)}
        dangerouslySetInnerHTML={{__html: AvatarDefaultSVG}}/> :
      <Img
        className={mergeClasses(classes.root, square ? "square" : "circle", className)}
        src={avatarUrl}
        loader={<img src={AvatarDefaultURL}/>}
        {...other}
      />
  }
}
