const {
	FlexRow,
	FlexAuto,
	FlexAlignStart,
	FillWidth,
	makePaddingRem,
	FlexRowCenter,
	FillHeight,
	rem,
	FlexColumn,
	FlexScale
} = Styles

export default function baseStyles(topStyles, theme, palette) {
	const
		{
			accent,
			warn,
			text,
			secondary
		} = palette,
		
		rowStyle = [ FlexRow, FlexAuto, FlexAlignStart, FillWidth, makePaddingRem(0, 1) ]
	
	return {
		dialog: [ {
			minHeight: 500,
			minWidth: 500
		} ],
		root: [ FlexColumn, FlexAuto ],
		
		actions: [ FlexRowCenter, FillHeight ],
		
		
		titleBar: [ {
			label: [ FlexRowCenter, {
				fontSize: rem(1.6),
				
				repo: [ makePaddingRem(0, 0.6, 0, 0), {} ],
				
				number: [ {
					paddingTop: rem(0.3),
					fontSize: rem(1.4),
					fontWeight: 100,
					color: text.secondary
				} ]
			} ]
		} ],
		
		
		form: [ FlexScale, FlexColumn, FillWidth, {
			
			title: [ FlexScale ],
			
			repo: [ FlexScale ],
			
			
			milestone: [ FlexScale ],
			
			assignee: [ FlexScale ],
			
			/**
			 * Label editor styling
			 */
			labels: [],
			
			row1: [ ...rowStyle, { marginBottom: rem(0.8) } ],
			row2: [ ...rowStyle, { marginBottom: rem(0.8) } ],
			row3: [ ...rowStyle, {} ],
			
			editor: [ FlexScale, FillWidth ]
			
		} ],
		
		
	}
}
