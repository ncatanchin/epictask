import { colorAlpha } from "epic-styles"
import {
	rem, makeHeightConstraint, makeTransition, FlexScale, FlexRow, Ellipsis,
	FlexRowCenter, FillWidth, OverflowHidden, FlexAuto, makeStyle, makePaddingRem, Transparent, PositionAbsolute,
	makeFlexAlign, FlexColumn, makeWidthConstraint
} from "epic-styles"
import { FlexColumnCenter, makeMarginRem, makeFlex, convertRem, OverflowAuto } from "epic-styles/styles"
export default function baseStyles(topStyles, theme, palette) {
	
	const
		{ background, primary, accent, secondary, success, alternateText, text } = palette
	
	let
		avatarDim = Math.floor(convertRem(2.8))
	
	if (avatarDim % 2 !== 0) {
		avatarDim -= 1
	}
	
	return [
		makeTransition([ 'height', 'flex-grow', 'flex-shrink', 'flex-basis', 'box-shadow' ]),
		FlexRowCenter,
		FlexAuto,
		FillWidth,
		FillHeight,
		FlexAlignStart,
		makePaddingRem(0.6),
		{
			// COLORS
			backgroundColor: background,
			color: text.secondary,
			borderBottom: '0.1rem solid ' + colorAlpha(text.secondary, 0.1),
			
			// LAYOUT
			height: rem(9.4),
			cursor: 'pointer',
			
			
			selected: [ {
				backgroundColor: secondary.hue1,//colorAlpha(secondary.hue1,0.5),
				color: alternateText.primary,
				bar: [ {
					backgroundColor: Transparent
					//backgroundColor: secondary.hue2
				} ],
				multi: [ {
					backgroundColor: primary.hue2,
					color: text.primary
				} ]
			} ],
			
			focused: [ {
				backgroundColor: accent.hue1,
				color: alternateText.primary,
				bar: [ {
					backgroundColor: Transparent
					//backgroundColor: accent.hue2
				} ]
			} ],
			
			
			number: [ makeHeightConstraint(rem(1.2)), {
				fontSize: themeFontSize(1),
				lineHeight: 1.2,
				fontWeight: 500,
				
				color: text.primary,
				
				selected: [ {
					color: alternateText.primary,
				} ],
				focused: [ {
					color: alternateText.primary,
				} ]
			} ],
			
			repo: [
				makeHeightConstraint(rem(1.2)),
				Ellipsis,
				FlexRow,
				FlexScale,
				makeTransition([ 'color', 'font-size' ]), {
					
					fontSize: themeFontSize(1),
					color: text.secondary,
					//fontFamily: fontFamilyRegular,
					fontWeight: 400,
					
					selected: [ {
						fontWeight: 400,
						fontSize: themeFontSize(1),
						color: alternateText.primary,
					} ],
					focused: [ {
						color: alternateText.primary,
					} ]
				} ],
			
			title: [ makeTransition([ 'font-size', 'font-weight' ]), Ellipsis, FlexScale, makePaddingRem(0, 1, 0, 0), {
				display: 'block',
				
				color: text.primary,
				fontWeight: 400,
				fontSize: themeFontSize(1.4),
				
				/* Selected */
				selected: [ {
					fontWeight: 500,
					color: alternateText.primary,
					fontSize: themeFontSize(1.5),
					
					/* Multi Selected */
					multi: [ {} ],
					
					
				} ],
				focused: [ {
					color: alternateText.primary,
				} ],
			} ],
			
			/**
			 * labels
			 */
			
			labels: [
				FlexRowCenter,
				OverflowAuto,
				makeHeightConstraint(rem(1.2)),
				makePaddingRem(0,0.2,0,0.5),
				makeFlex(0,1,'auto'),{
					
	
					// LABEL DOTS
					label: [
						makeHeightConstraint(rem(0.8)),
						makeWidthConstraint(rem(0.8)),
						makeMarginRem(0,0,0,0.5),{
							overflow: 'visible'
						}
					]
				}
			],
				
			
			//region MILESTONE
			milestone: [
				{
					maxHeight: rem(2),
					maxWidth: '100%',
					
					
					
					// TITLE
					text: [
						Ellipsis,
						makeFlex(0, 1, 'auto')
						
					],
					
					selected: [ {
						color: alternateText.secondary,
					} ],
					focused: [ {
						color: alternateText.secondary,
					} ],
				} ],
			//endregion
			
			//region TIME
			time: [
				FillWidth,
				FlexAuto,
				Ellipsis,
				makeMarginRem(0,0,0.5,0),
				makeHeightConstraint(rem(1.7)),{
					textAlign: 'right',
					fontSize: themeFontSize(1),
					fontWeight: 400,
					selected: [ {
						color: alternateText.primary,
					} ],
					focused: [ {
						color: alternateText.primary,
					} ],
				} ],
			//endregion
			
			
			bar: [ PositionAbsolute, makeWidthConstraint(rem(0.6)), {
				top: 0,
				left: 0,
				bottom: 0,
				zIndex: 10,
				backgroundColor: Transparent
				
			} ],
			
			content: [ FlexColumn, FlexScale, OverflowHidden, makePaddingRem(0, 0.5, 0, 0) ],
			
			details: [ FlexRow, FlexAuto, FillWidth, {} ],
			
			/**
			 * Avatar and state on left
			 */
			avatarAndState: [
				FlexColumnCenter,
				makePaddingRem(0, 1, 0, 0), {
					
					// AVATAR
					avatar: [
						FlexAuto,
						FlexColumnCenter,
						makePaddingRem(),
						makeWidthConstraint(avatarDim),
						makeHeightConstraint(avatarDim), {
							borderRadius: avatarDim / 2,
							
							root: {
								boxShadow: `0rem 0.2rem 0.2rem ${colorAlpha(primary.text,0.3)}`,
								backgroundColor: Transparent,
								borderColor: Transparent
							},
							
							image: [{
								
							}]
						}
					]
				}
			],
			
			
			row1: [
				FlexRow,
				makeFlexAlign('center', 'center'),
				FlexAuto,
				makePaddingRem(0, 0, 0.5, 0),
				{
					overflow: 'visible',
					pointerEvents: 'none',
				}
			],
			
			row2: [ makeTransition([ 'height' ]), FlexRowCenter, FillWidth, OverflowHidden, makePaddingRem(0), {
				//pointerEvents: 'none'
			} ],
			
			
			row3: makeStyle(FlexRowCenter, {
				margin: '0rem 0 0.3rem 0',
				overflow: 'auto'
			}),
			
			
			
			
			/**
			 * Markings are in the top left of the issue item
			 */
			markings: [
				//PositionAbsolute,
				FlexAuto,
				FlexColumn,
				makeFlexAlign('flex-end', 'flex-start'),
				{
					
					maxWidth: rem(7),
					// zIndex: 2,
					// bottom: 0,
					// right: 0,
					// color: alternateText.primary,
					// backgroundColor: text.primary,
					color: text.primary,
					//backgroundColor: alternateText.primary,
					
					
					state: [ {
						icon: [ makeHeightConstraint(rem(1.2)), FlexAuto, {
							fontSize: rem(1),
							fontWeight: 400,
							padding: 0,
							margin: 0,
							//color: alternateText.primary
							color: success.hue1
						} ],
						root: [
							FlexColumnCenter,
							makePaddingRem(0, 0.1),
							makeWidthConstraint(rem(1.7)),
							makeHeightConstraint(rem(1.7)), {
								// backgroundColor: success.hue1,
								
								
							} ]
					} ]
				} ]
			
			
		}
	]
}
