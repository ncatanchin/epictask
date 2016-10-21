import { Transparent, createStyles} from "shared/themes/styles"
import { colorAlpha } from "shared/themes/styles/ColorTools"

export function LightTheme(palette,baseTheme) {
	
	
	const
		// PALETTE
		{
			primary,
			secondary,
			accent,
			warn,
			success,
			background,
			text,
			alternateText
		} = palette
	
	return _.merge(baseTheme,createStyles({
		ThemeName: LightTheme.ThemeName,
		
		issueItem: {
			
			selected: [{
				backgroundColor: secondary.hue1,//colorAlpha(secondary.hue1,0.5),
				color: alternateText.primary,
				bar: [{
					backgroundColor: Transparent
					//backgroundColor: secondary.hue2
				}]
			}],
			
			focused: [{
				backgroundColor: accent.hue1,
				color: alternateText.primary,
				bar: [{
					backgroundColor: Transparent
					//backgroundColor: accent.hue2
				}]
			}],
			
			
			number: [{
				selected:[{
					color: alternateText.primary,
				}],
				focused:[{
					color: alternateText.primary,
				}]
			}],
			
			repo:[{
				selected:[{
					color: alternateText.primary,
				}],
				focused:[{
					color: alternateText.primary,
				}]
			}],
			
			title: [{
				selected:[{
					color: alternateText.primary,
				}],
				focused:[{
					color: alternateText.primary,
				}],
			}]
			
		}
	}))
}
export namespace LightTheme {
	export const BaseThemeName = 'DefaultTheme'
	export const ThemeName = 'LightTheme'
}
export default LightTheme