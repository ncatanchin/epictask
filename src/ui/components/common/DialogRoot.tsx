// Imports

import { connect } from 'react-redux'
import * as Radium from 'radium'
import { PureRender } from 'ui/components/common/PureRender'
import { createDeepEqualSelector } from 'shared/util/SelectorUtil'
import { createStructuredSelector } from 'reselect'
import { ThemedStyles } from 'shared/themes/ThemeManager'
import { MuiThemeProvider } from "material-ui/styles"
import { CircularProgress} from "material-ui"

// Constants
const
	log = getLogger(__filename)

const baseStyles = createStyles({
	root: [ FillWindow,FlexColumn, {
		minHeight: 500
	} ],
	
	title: [ FlexColumn, FillWidth, makePaddingRem(0,1,0,1),makeFlexAlign('flex-start','center'), {
		
		// DIALOG TITLE BAR
		height: rem(7.2),
		cursor: 'move',
		
		WebkitUserSelect: 'none',
		WebkitAppRegion:  'drag',
		
		
		label: [ FlexRow,FlexScale,Ellipsis, makePaddingRem(0,0,0.5,0), {
			fontWeight: 500
		}],
		
		subLabel: [FlexRow,FlexScale,Ellipsis,{
			
		}],
		
		
	} ],
	
	form: [FlexScale,{
		paddingTop: rem(2),
		
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
@PureRender
export class DialogRoot extends React.Component<IDialogRootProps,IDialogRootState> {
	
	render() {
		const
			{ titleNode,subTitleNode,actionNodes,saving,theme, styles } = this.props
		
		return <div style={styles.root}>
			
			<MuiThemeProvider muiTheme={theme}>
				
				<div style={[FillWidth,FlexColumn,FlexScale]}>
					<div style={styles.title}>
						<div style={[styles.title.label]}>
							{titleNode}
						</div>
						<div style={[styles.title.subLabel]}>
							{subTitleNode}
						</div>
						
					
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
					{saving && <div style={makeStyle(styles.savingIndicator,saving && {opacity: 1})}>
						<CircularProgress
							color={theme.progressIndicatorColor}
							size={1}/>
					</div>}
				</div>
			</MuiThemeProvider>
			
			{/*</Dialog>*/}
		</div>
	}
	
}