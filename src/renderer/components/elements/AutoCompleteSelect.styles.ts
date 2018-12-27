import {
	CursorPointer,
	Ellipsis, FillHeight,
	FillWidth,
	FlexAuto,
	FlexRowCenter, makeHeightConstraint, makePaddingRem,
	makeWidthConstraint,
	PositionRelative,
	rem,
	StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {darken, emphasize} from "@material-ui/core/styles/colorManipulator"

export default function baseStyles(theme):StyleDeclaration {
	const
		{palette} = theme,
		{primary, secondary} = palette
	
	return {
		root: [FlexAuto,PositionRelative,{
		
		}],
		input: [FlexRowCenter,FillWidth,makeHeightConstraint(rem(2)),{
			padding: 0,
			
			"&:after": {
				borderBottom: 0
			}
		}],
		valueContainer: [FlexRowCenter,FillHeight,CursorPointer,{
			minWidth: rem(15),
			// alignItems: 'center',
			overflow: 'hidden',
		}],
		chip: {
			margin: `${theme.spacing.unit / 2}px ${theme.spacing.unit / 4}px`,
		},
		chipFocused: {
			backgroundColor: emphasize(
				theme.palette.type === 'light' ? theme.palette.primary.dark : theme.palette.primary.dark,
				0.08,
			),
		},
		noOptionsMessage: {
			padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
		},
		singleValue: [Ellipsis,{
			fontSize: rem(1),
		}],
		control: [PositionRelative,FlexRowCenter,makeHeightConstraint(rem(2)), makePaddingRem(0,1,0,1), {
			// backgroundColor: darken(primary.dark,0.2)
		}],
		placeholder: {
			position: 'absolute',
			left: 2,
			fontSize: rem(1.2),
		},
		
		option: {
		
		},
		paper: {
			background: darken(primary.dark,0.6),
			position: 'absolute',
			zIndex: 1,
			//marginTop: theme.spacing.unit,
			left: 0,
			right: 0,
		},
		divider: {
			height: theme.spacing.unit * 2,
		}
	} as any
}
