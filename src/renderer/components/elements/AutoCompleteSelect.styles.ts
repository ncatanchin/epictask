import {
  CursorPointer,
  Ellipsis, FillHeight,
  FillWidth,
  FlexAuto, FlexRow,
  FlexRowCenter, FlexScale, makeHeightConstraint, makePaddingRem,
  makeWidthConstraint, NestedStyles, OverflowHidden,
  PositionRelative,
  rem,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {darken, emphasize} from "@material-ui/core/styles/colorManipulator"

export type AutoCompleteSelectClasses = "root" | "input" | "valueContainer" |
	"noOptionMessage" | "singleValue" | "control" | "placeholder" |
	"optionRoot" | "optionSelected" | "optionContent" | "paper" | "divider"


export default function baseStyles(theme:Theme):StyleDeclaration<AutoCompleteSelectClasses> {
	const
		{palette,components:{Select}} = theme,
		{primary, secondary} = palette

	return {
		root: {...FlexAuto,...PositionRelative},
		input: {...FlexRowCenter,...FillWidth,
			...makeHeightConstraint(rem(2)),
			padding: 0,

			"&:after": {
				borderBottom: 0
			}
		},
		valueContainer: {...FlexRowCenter,...FillHeight,...CursorPointer,
			minWidth: rem(15),
			// alignItems: 'center',
			overflow: 'hidden',
		},
		noOptionsMessage: {
			padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
		},
		singleValue: {
			...Ellipsis,
			fontSize: rem(1),
		},
		control: {...PositionRelative,...FlexRowCenter,
			...makeHeightConstraint(rem(2)), ...makePaddingRem(0,1,0,1)
		},
		placeholder: {
			position: 'absolute',
			left: 2,
			fontSize: rem(1.2),
		},

    optionRoot: {...Select.option.root,...FlexRow,...OverflowHidden,...Ellipsis,
			maxWidth: "100%"
		},
    optionSelected: {...Select.option.selected},
    optionContent: {...FlexScale,...OverflowHidden,...Ellipsis},

		paper: [Select.paper],
    divider: [Select.divider]
	} as any
}
