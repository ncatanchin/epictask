
import * as CommonStyles from './CommonStyles'
export * from './CommonStyles'

declare global {
	var CSSHoverState:string,
		CSSActiveState:string,
		CSSFocusState:string,
		Fill:any,
		FillWidth:any,
		FillHeight:any,
		Flex:any,
		FlexScale:any,
		FlexAuto:any,
		FlexRow:any,
		FlexRowCenter:any,
		FlexColumn:any,
		FlexColumnCenter:any,
		FlexAlignCenter:any,
		FlexAlignStart:any,
		FlexAlignEnd:any,
		Ellipsis:any,
		PositionRelative:any,
		PositionAbsolute:any,
		FontBlack:any,
		OverflowHidden:any,
		OverflowAuto:any,
		rem: typeof CommonStyles.rem,
		makeMarginRem: typeof CommonStyles.makeMarginRem,
		createStyles: typeof CommonStyles.createStyles,
		convertRem: typeof CommonStyles.convertRem,
		makeTransition:typeof CommonStyles.makeTransition,
		makeAbsolute:typeof CommonStyles.makeAbsolute,
		makeStyle:typeof CommonStyles.makeStyle,
		mergeStyles: typeof CommonStyles.mergeStyles,
		makeFlexAlign:typeof CommonStyles.makeFlexAlign,
		CursorPointer: typeof CommonStyles.CursorPointer,
		Styles:typeof CommonStyles
}

Object.assign(global as any,CommonStyles,{Styles:CommonStyles})