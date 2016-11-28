import * as CommonStyles from './CommonRules'

export * from './ColorTools'
export * from './CommonRules'
export * from './GlobalStyles'


declare global {
	export const
		TinyColor:any,
		CSSHoverState:string,
		CSSActiveState:string,
		CSSFocusState:string,
		Transparent:string,
		Fill:any,
		FillWidth:any,
		FillHeight:any,
		FillWindow:any,
		Flex:any,
		FlexScale:any,
		FlexAuto:any,
		FlexRow:any,
		FlexRowCenter:any,
		FlexRowReverse:any,
		FlexColumn:any,
		FlexColumnReverse:any,
		FlexColumnCenter:any,
		FlexAlignCenter:any,
		FlexAlignStart:any,
		FlexAlignEnd:any,
		FlexNoWrap:any,
		FlexWrap:any,
		
		Ellipsis:any,
		PositionRelative:any,
		PositionAbsolute:any,
		FontBlack:any,
		OverflowHidden:any,
		OverflowAuto:any,
		rem: typeof CommonStyles.rem,
		makeLinearGradient:typeof CommonStyles.makeLinearGradient,
		makeBorderRem:typeof CommonStyles.makeBorderRem,
		makePaddingRem: typeof CommonStyles.makePaddingRem,
		makeMarginRem: typeof CommonStyles.makeMarginRem,
		createStyles: typeof CommonStyles.createStyles,
		convertRem: typeof CommonStyles.convertRem,
		makeTransition:typeof CommonStyles.makeTransition,
		makeAbsolute:typeof CommonStyles.makeAbsolute,
		makeStyle:typeof CommonStyles.makeStyle,
		mergeStyles: typeof CommonStyles.mergeStyles,
		makeFlex:typeof CommonStyles.makeFlex,
		makeFlexAlign:typeof CommonStyles.makeFlexAlign,
		CursorPointer: typeof CommonStyles.CursorPointer,
		Styles:typeof CommonStyles
}

Object.assign(global as any,CommonStyles,{Styles:CommonStyles})