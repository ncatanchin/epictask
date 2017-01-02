import { makeHeightConstraint, makeWidthConstraint } from "epic-styles/styles"

/**
 * NotificationsPanel
 * Created by jglanz on 1/1/17.
 */

export default function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ Styles.FlexColumn, Styles.FlexScale, Styles.Fill,Styles.PositionRelative, {
		overflow: 'hidden',
		empty: [Styles.FlexColumnCenter,Styles.Ellipsis,Styles.FlexScale,{
			color: text.secondary
		}],
		
		header: [Styles.FlexAuto,Styles.FillWidth,Styles.FlexRowCenter,Styles.makePaddingRem(0.3,0.3,0.3,1.3),{
			backgroundColor: primary.hue1,
			color: text.primary,
			
			mode: [Styles.FlexScale,Styles.Ellipsis,{
				
			}],
			
			control: [Styles.FlexAuto,{
				
			}]
		}],
		
		left: [Styles.PositionAbsolute,{
			zIndex: 2,
			top: 0,
			left: 0,
			height: '100%',
			width: rem(0.2),
			backgroundColor: primary.hue3
		}]
	} ]
}
