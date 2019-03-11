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
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import {ILayoutConfig} from "renderer/store/state/UIState"
import {currentLayoutSelector} from "renderer/store/selectors/UISelectors"
import LayoutConfigSelector from "renderer/components/elements/LayoutConfigSelector"

const log = getLogger(__filename)


type Classes = "root" | "layoutSelector"

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

		},
		layoutSelector: {
			maxWidth: "70vw"
		}
	}
}

interface P extends IThemedProperties<Classes> {

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
    {classes,className} = props


  return <div
		className={mergeClasses(classes.root,className)}
		onDoubleClick={onDoubleClick}
	>

    <div className={classes.layoutSelector}>
			<LayoutConfigSelector />
    </div>

  </div>
})
