// Imports

import { PureRender } from 'ui/components/common/PureRender'
import { ThemedStyles } from 'shared/themes/ThemeManager'
import { MuiThemeProvider } from "material-ui/styles"
import { CircularProgress} from "material-ui"
import { makeHeightConstraint } from "shared/themes"

// Constants
const
	log = getLogger(__filename)

const baseStyles = createStyles({
	root: [ FillWindow,FlexColumn, {
		minHeight: 500
	} ],
	
	title: [ FillWidth, makeHeightConstraint(rem(7.2)),makePaddingRem(1.5,1,0,1), {
		
		
		cursor: 'move',
		
		WebkitUserSelect: 'none',
		WebkitAppRegion:  'drag',
		
		
		vertical: [FlexColumn,makeFlexAlign('flex-start','center')],
		horizontal: [FlexRow,makeFlexAlign('center','flex-start')],
		
		label: [ FlexRow,FlexScale,Ellipsis,  {
			vertical: [FillWidth],
			horizontal: [FlexScale]
		}],
		
		subLabel: [FlexRow,Ellipsis,{
			
			vertical: [FillWidth,makePaddingRem(0.5,0,0,0)],
			horizontal: [FlexAuto,makePaddingRem(0,0,0,0.5),{
				textAlign: 'right'
			}]
		}],
		
		
	} ],
	
	form: [FlexScale,FlexColumn,FillWidth,PositionRelative,makePaddingRem(2,2),OverflowAuto,{
		
		row: [ {
			height: 72
		} ],
		
		
	}],
	
	actions: [FlexRow,makeFlexAlign('center','flex-end'),{
		height: rem(5)
	}],
	
	savingIndicator: [ PositionAbsolute, FlexColumnCenter, Fill, makeAbsolute(), {
		opacity: 0,
		pointerEvents: 'none'
	} ]
	
})


/**
 * IDialogRootProps
 */
export interface IDialogRootProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	
	titleNode:React.ReactNode|string
	subTitleNode?:React.ReactNode|string
	titleMode?:'vertical'|'horizontal'
	saving?:boolean
	actionNodes?:any
}

/**
 * IDialogRootState
 */
export interface IDialogRootState {
	
}

/**
 * DialogRoot
 *
 * @class DialogRoot
 * @constructor
 **/

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles, 'dialog')
export class DialogRoot extends React.Component<IDialogRootProps,IDialogRootState> {
	
	render() {
		const
			{ titleNode,subTitleNode,actionNodes,saving,theme, styles } = this.props,
			titleMode = this.props.titleMode || 'vertical'
		
		return <div style={styles.root}>
			
			<MuiThemeProvider muiTheme={theme}>
				
				<div style={[FillWidth,FlexColumn,FlexScale]}>
					<div style={[styles.title,styles.title[titleMode]]}>
						<div style={[styles.title.label, styles.title.label[titleMode]]}>
							{titleNode}
							
							
						</div>
						
						{subTitleNode && <div style={[styles.title.subLabel,styles.title.subLabel[titleMode]]}>
							{subTitleNode}
						</div>}
						
					
					</div>
					
					
					<form style={[
					      	styles.body,
					      	styles.form,
					      	saving && {
						        opacity: 0,
						        pointerEvents: 'none'
						      }
					      ]}>
						{this.props.children}
					</form>
					
					{actionNodes &&
						<div style={[styles.actions]}>
							{actionNodes}
						</div>
					}
					{/* Saving progress indicator */}
					{saving && <div style={[styles.savingIndicator,saving && {opacity: 1}]}>
						<CircularProgress
							color={theme.progressIndicatorColor}
							size={50}/>
					</div>}
				</div>
			</MuiThemeProvider>
			
			{/*</Dialog>*/}
		</div>
	}
	
}