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
import {remote} from "electron"
import {StyledComponent} from "renderer/components/elements/StyledComponent"

const log = getLogger(__filename)


type Classes = "root"

function baseStyles(theme:Theme):StyleDeclaration<Classes> {
	const
		{palette,components:{Header}} = theme,
		{action, primary, secondary} = palette

	return {
		root: {
			...makeHeightConstraint(rem(2)),
			...FillWidth,
			...FlexRowCenter,
			...PositionRelative,
			...OverflowHidden,
			background: Header.colors.bg,
			boxShadow: Header.colors.boxShadow,
			"& > .left, & > .right": {...FlexRowCenter, ...FillHeight,

			},
			"& > .left": {
				justifyContent: "flex-start"
			},
			"& > .right": {
				...FlexAuto,
				justifyContent: "flex-end"
			},

			"&:hover > .logo .overlay": {
				boxShadow: "inset 0 0 0.6rem rgba(100,100,100,0.8)"
			},

			"& > .logo": {
				...FlexAuto,
				...PositionRelative,
				color: primary.main,
				fontFamily: "Jura",
				fontWeight: 400,
				fontSize: rem(1.3),
				paddingLeft: rem(1),
				marginTop: rem(-0.2),
				lineHeight: 1,
				"-webkit-user-select": "none",
				"-webkit-app-region": "drag",
				"&, & *, &:hover, &:hover *": {
					cursor: "move !important",
				}
			},
			"& > .spacer": {
				...FlexScale,
        "-webkit-app-region": "drag"
			}
		}
	}
}

interface P extends IThemedProperties<Classes> {
	rightControls?: React.ReactNode
  leftControls?: React.ReactNode
}

function onDoubleClick():void {
	const win = remote.getCurrentWindow()
	if (win.isMaximized())
		win.restore()
	else
		win.maximize()
}

export default StyledComponent<P>(baseStyles)(function Header(props:P):React.ReactElement<P> {
  const
    {classes,className,leftControls,rightControls} = props


  return <div
		className={mergeClasses(classes.root,className)}
		onDoubleClick={onDoubleClick}
	>

    <div className="left">
      <WindowControls />
      {leftControls}
    </div>

    <div className="logo">
			epictask
    </div>

    <div className="spacer"/>

    <div className="right">
      {rightControls}
    </div>
  </div>
})
