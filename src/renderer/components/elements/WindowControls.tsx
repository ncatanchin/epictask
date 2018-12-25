import * as React from "react"
import withStyles, {StyleRules} from "@material-ui/core/styles/withStyles"
import {IconButton, Theme} from "@material-ui/core"
import CloseIcon from "@material-ui/icons/CloseSharp"
import MinimizeIcon from "@material-ui/icons/MinimizeSharp"
import MaximizeIcon from "@material-ui/icons/CropSquareSharp"
import {
	IThemedProperties,
	makeDimensionConstraints, makeMarginRem, makeTransition,
	mergeStyles, rem,
	StyleDeclaration, Transparent,
	withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {darken} from "@material-ui/core/styles/colorManipulator"

function baseStyles(theme:Theme):StyleRules<string> {
	const
		{palette} = theme,
		{primary,secondary} = palette,
		baseColor = darken(primary.dark,0.5)
	
	return mergeStyles({
		control: [makeMarginRem(0,0.25,0,0.25),{
			"& svg": [makeDimensionConstraints(rem(0.6))],
			"& > .button": [
				makeDimensionConstraints(rem(0.9)),
				makeTransition(['background-color','color']),
				{
					border: `${rem(0.1)} ${baseColor} solid`,
					backgroundColor: baseColor,
					color: Transparent,
					padding: 0,
					
					"&:hover": [{
						backgroundColor: primary.dark,
						color: primary.contrastText,
					}]
				}
			]
		}]
	})
}

const onClose = ():void => {
	require("electron").remote.getCurrentWindow().close()
}

const onMaximize = ():void => {
	require("electron").remote.getCurrentWindow().maximize()
}

const onMinimize = ():void => {
	require("electron").remote.getCurrentWindow().minimize()
}

/**
 * Simple window controls
 *
 * @param header
 * @constructor
 */
export const WindowControls = withStyles(baseStyles)(({classes}:IThemedProperties):JSX.Element => {
	return <>
		<div className={classes.control}>
		<IconButton className="button" onClick={onClose}>
			<CloseIcon/>
		</IconButton>
		</div>
		<div className={classes.control}>
		<IconButton className="button" onClick={onMinimize}>
			<MinimizeIcon/>
		</IconButton>
		</div>
		
		<div className={classes.control}>
		<IconButton className="button" onClick={onMaximize}>
			<MaximizeIcon/>
		</IconButton>
		</div>
	</>
})
