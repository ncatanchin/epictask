import * as CommonStyles from './CommonStyles'
export * from './CommonStyles'

declare global {
	var Fill:any,
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
		makeTransition:typeof CommonStyles.makeTransition,
		makeAbsolute:typeof CommonStyles.makeAbsolute,
		makeStyle:typeof CommonStyles.makeStyle
}

Object.assign(global as any,CommonStyles)