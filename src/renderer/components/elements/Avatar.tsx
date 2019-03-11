import * as React from "react"
import getLogger from "common/log/Logger"
import {
  Fill, FlexRowCenter,
  IThemedProperties,
  makeDimensionConstraints, makeHeightConstraint,
  mergeClasses, PositionRelative, rem,
  StyleDeclaration,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {IUser} from "common/models/User"
import {getValue} from "typeguard"
import Img from 'react-image'
import {lighten} from "@material-ui/core/styles/colorManipulator"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {assert} from "common/ObjectUtil"
import BaseChip from "renderer/components/elements/BaseChip"
import * as _ from 'lodash'

const
  AvatarDefaultURL = require("renderer/assets/images/avatar.svg"),
  AvatarDefaultSVG = require("!!file-loader!renderer/assets/images/avatar.svg")
const log = getLogger(__filename)


function baseStyles(theme): any {
  const
    {palette,components:{Chip}} = theme,
    {primary, secondary} = palette,
    smallAvatarDim = Chip.dimen.small,
    normalAvatarDim = Chip.dimen.normal,
    getAvatarDim = ({variant}:P):number | string => rem(variant === "small" ? smallAvatarDim : normalAvatarDim)

  return {
    chip: [PositionRelative, FlexRowCenter, makeHeightConstraint(getAvatarDim),{
      "&.circle": {
        borderRadius: (props:P) => `calc(${getAvatarDim(props)} / 2)`
      },
      "&.square": {},
      "&.default": {
        fill: primary.main
      }
    }],
    text: [{
      fontWeight: 500,
      color: primary.contrastText
    }],
    picture: [
      PositionRelative,
      makeDimensionConstraints(getAvatarDim),
      {
        "&.circle": {
          borderRadius: (props:P) => `calc(${getAvatarDim(props)} / 2)`
        },
        "&.square": {},
        "&.default": {
          fill: primary.main
        }
      }
    ],
    default: [PositionRelative, makeDimensionConstraints(({variant}:P) => rem(variant === "small" ? 1 : 2)), {
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
  user: IUser
  variant?: "normal" | "small"
  chip?:boolean
  square?: boolean
  picture?: boolean
  text?: boolean
}


export default StyledComponent(baseStyles, {withTheme: true})(function Avatar(props: P): React.ReactElement<P> {
  const
    {
      theme,
      square = false,
      classes,
      user,
      chip,
      className,
      picture = true,
      text = !square,
      ...other
    } = _.omit(props,'childrenClassName') as P,
    avatarUrl = getValue(() => user.avatar_url, AvatarDefaultURL),
    login = getValue(() => user.login, "None"),
    isDefault = avatarUrl === AvatarDefaultURL

  assert((text && !square) || (square && !text), "square and text are mutually exclusive")

  const
    IconFn = (_props:any):React.ReactElement<any> => <Img
      className={mergeClasses(classes.picture, square ? "square" : "circle", className)}
      src={avatarUrl}
      loader={<img src={AvatarDefaultURL}/>}
      {...other}
    />,
    icon = <IconFn />

  // return isDefault ? <div
  //     className={mergeClasses(classes.default, square ? "square" : "circle", className)}
  //     dangerouslySetInnerHTML={{__html: AvatarDefaultSVG}}/> :
  //AvatarDefaultSVG
  //log.info("props",Object.keys(other))
  return !!text && !!picture ? <BaseChip
      color={theme.components.Avatar.colors.bg}
      leftIcon={icon}
      classes={{
        chip: classes.chip
      }}
      label={login}
    /> :
    picture ? icon : <span className={classes.text}>{login}</span>

})
