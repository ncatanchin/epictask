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
		avatarDim = Math.floor(convertRem(3.2))
	
	if (avatarDim % 2 !== 0) {
		avatarDim -= 1
	}
	
	return [
		makeTransition([ 'height', 'flex-grow', 'flex-shrink', 'flex-basis', 'box-shadow' ]),
		Styles.FlexRowCenter,
		Styles.FlexAuto,
		Styles.FillWidth,
		Styles.FillHeight,
		Styles.FlexAlignStart,
		makePaddingRem(0.6,0.6,0.6,0),
		{
			// COLORS
			backgroundColor: background,
			color: text.secondary,
			borderBottom: '0.1rem solid ' + colorAlpha(text.secondary, 0.1),
			
			// LAYOUT
			height: rem(9.4),
			cursor: 'pointer',
			
			// EMPTY HOVER STATE - Used programmaticly
			[Styles.CSSHoverState]: [],
			
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
				Styles.FlexRowCenter,
				Styles.OverflowAuto,
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
			milestone: [Styles.FlexAuto,
				{
					paddingLeft: rem(1),
					maxHeight: rem(2),
					
					// TITLE
					text: [ Ellipsis, makeFlex(0, 1, 'auto') ],
					
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
				Styles.FlexAuto,
				Styles.makeMarginRem(0,0,0.5,0),
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
			
			
			bar: [ Styles.PositionAbsolute, makeWidthConstraint(rem(0.6)), {
				top: 0,
				left: 0,
				bottom: 0,
				zIndex: 10,
				backgroundColor: Transparent
				
			} ],
			
			content: [ Styles.FlexColumn, Styles.FlexScale, Styles.OverflowHidden, makePaddingRem(0, 0.5, 0, 0) ],
			
			details: [ Styles.FlexRow, Styles.FlexAuto, Styles.FillWidth, {} ],
			
			/**
			 * Avatar and state on left
			 */
			avatarAndState: [
				Styles.FlexColumnCenter,
				Styles.PositionRelative,
				makeTransition(['opacity']),
				makePaddingRem(0, 1, 0, 0.5), {
					
					opacity: 0.7,
					
					highlight: [{
						opacity: 1
					}],
					
					// AVATAR
					avatar: [
						Styles.FlexAuto,
						Styles.FlexColumnCenter,
						makePaddingRem(),
						makeWidthConstraint(avatarDim ),
						makeHeightConstraint(avatarDim), {
							borderRadius: avatarDim / 2,
							
							zIndex: 2,
							
							
							
							root: [makeTransition('transform'),{
								boxShadow: `0rem 0.2rem 0.2rem ${colorAlpha(primary.text,0.3)}`,
								backgroundColor: Transparent,
								borderColor: Transparent,
								
								// transform: 'translate(-50%,0)',
								//
								// highlight: {
								// 	transform: 'translate(0,0)'
								// },
							}],
							
							
							image: [{
								
							}]
						}
					]
				}
			],
			
			
			row1: [
				Styles.FlexRow,
				makeFlexAlign('center', 'center'),
				Styles.FlexAuto,
				makePaddingRem(0, 0, 0.5, 0),
				{
					overflow: 'visible',
					pointerEvents: 'none',
				}
			],
			
			row2: [ makeTransition([ 'height' ]), Styles.FlexRowCenter, Styles.FillWidth, Styles.OverflowHidden, makePaddingRem(0)],
			
			
			row3: makeStyle(Styles.FlexRowCenter, {
				margin: '0rem 0 0.3rem 0',
				overflow: 'auto'
			}),
			
			
			
			
			/**
			 * Markings are in the top left of the issue item
			 */
			markings: [
				Styles.FlexAuto,
				Styles.FlexColumn,
				makeFlexAlign('flex-end', 'flex-start'),
				{
					
					maxWidth: rem(7),
					color: text.primary,
					
					state: [ {
						icon: [ makeHeightConstraint(rem(1.2)), Styles.FlexAuto, {
							fontSize: rem(1),
							fontWeight: 400,
							padding: 0,
							margin: 0,
							color: success.hue1
						} ],
						root: [
							Styles.FlexColumnCenter,
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
