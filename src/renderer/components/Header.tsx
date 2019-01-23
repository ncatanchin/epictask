import * as React from "react"
import getLogger from "common/log/Logger"
import {
  FillHeight,
  FillWidth,
  FlexAuto,
  FlexRowCenter,
  FlexScale,
  IThemedProperties,
  makeDimensionConstraints,
  makeHeightConstraint,
  makeTransition,
  mergeClasses,
  OverflowHidden,
  PositionAbsolute,
  PositionRelative,
  rem,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {WindowControls} from "renderer/components/elements/WindowControls"
import CheckIcon from "@material-ui/icons/Check"
import {StyledComponent} from "renderer/components/elements/StyledComponent"

const log = getLogger(__filename)


declare global {
	interface IHeaderStyles {
		colors: {
			bg: string
			logoBg: string
			logoBoxShadow: string
		}
	}
}

function baseStyles(theme:Theme):StyleDeclaration {
	const
		{palette,components:{Header}} = theme,
		{action, primary, secondary} = palette

	return {
		root: [makeHeightConstraint(rem(2)),FillWidth,FlexRowCenter,PositionRelative,OverflowHidden,{
			background: Header.colors.bg,
			boxShadow: Header.colors.boxShadow,
			"& > .left, & > .right": [FlexRowCenter, FlexScale, FillHeight, {

			}],
			"& > .left": [{
				justifyContent: "flex-start"
			}],
			"& > .right": [{
				justifyContent: "flex-end"
			}],

			"&:hover > .logo .overlay": {
				boxShadow: "inset 0 0 0.6rem rgba(100,100,100,0.8)"
			},

			"& > .logo": [FlexAuto,FillHeight,PositionRelative,makeDimensionConstraints(rem(1.2)),{
				color: primary.contrastText,
				fontFamily: "FiraCode",
				"-webkit-user-select": "none",
				"-webkit-app-region": "drag",
				"&, & *, &:hover, &:hover *": {
					cursor: "move !important",
				},
				"& > .icon": [makeDimensionConstraints(rem(1.2)),{
					pointerEvents: "none",
					borderRadius: rem(0.6),
					backgroundColor: Header.colors.logoBg
				}],
				"& > .overlay": [PositionAbsolute,makeTransition("box-shadow"),makeDimensionConstraints(rem(1.4)),{
					pointerEvents: "all",
					top: 0,
					left: 0,
					right:0,
					bottom:0,
					zIndex: 100,
					borderRadius: rem(0.6),
					boxShadow: Header.colors.logoBoxShadow
				}]
			}]
		}],


	} as any
}

interface P extends IThemedProperties {
	rightControls?: React.ReactNode
  leftControls?: React.ReactNode
}

export default StyledComponent<P>(baseStyles)(function Header(props:P):React.ReactElement<P> {
  const
    {classes,className,leftControls,rightControls} = props

  return <div className={mergeClasses(classes.root,className)}>

    <div className="left">
      <WindowControls />
      {leftControls}
    </div>

    <div className="logo">
      <CheckIcon className="icon"/>
      <div className="overlay"/>
    </div>

    <div className="right">
      {rightControls}
    </div>
  </div>
})
