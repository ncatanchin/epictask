// Imports
import { connect } from 'react-redux'
import { PureRender } from 'ui/components/common/PureRender'
import {Header, HeaderVisibility, ToastMessages} from 'ui/components/root'
import {getPage} from 'ui/components/pages'
import {StatusBar} from "ui/components/root/StatusBar"
import {createStructuredSelector} from 'reselect'
import { availableRepoCountSelector } from "shared/actions/repo/RepoSelectors"
import { createDeepEqualSelector } from "shared/util/SelectorUtil"
import { AppStateType } from "shared/AppStateType"
import { Themed } from "shared/themes/ThemeManager"
import { appStateTypeSelector } from "shared/actions/app/AppSelectors"
import { childWindowOpenSelector, modalWindowOpenSelector, sheetSelector } from "shared/actions/ui/UISelectors"
import { IUISheet } from "shared/config/DialogsAndSheets"
import { SheetRoot } from "ui/components/root/SheetRoot"
import { FillWindow } from "shared/themes/styles/CommonStyles"
import { FlexColumn, Fill } from "shared/themes"
import { WelcomePage } from "ui/components/pages/WelcomePage"


// Constants
const
	log = getLogger(__filename)


//region Styles
const styles = createStyles({
	app: [FlexColumn, FlexScale, {
		overflow: 'hidden'
	}],
	
	header: [makeTransition(['height','width','opacity']), FlexRowCenter, {}],
	
	content: [makeTransition(['height','width','opacity']), FlexColumn, PositionRelative, {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1
	}],
	
	collapsed: [{
		flexGrow: 0
	}],
	
	blur: [{
		WebkitFilter: "blur(0.2rem)", /* Chrome, Safari, Opera */
		filter: "blur(0.2rem)"
	}]
	
	
})
//endregion



/**
 * IUIRootProps
 */
export interface IUIRootProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	stateType?:AppStateType
	hasAvailableRepos?:boolean
	childOpen?:boolean
	modalOpen?:boolean
	sheet?:IUISheet
	
}

/**
 * IUIRootState
 */
export interface IUIRootState {
	
}

/**
 * UIRoot
 *
 * @class UIRoot
 * @constructor
 **/

@connect(createStructuredSelector({
	hasAvailableRepos: availableRepoCountSelector,
	stateType: appStateTypeSelector,
	childOpen: childWindowOpenSelector,
	modalOpen: modalWindowOpenSelector,
	sheet: sheetSelector
}))
@Themed
@PureRender
export class UIRoot extends React.Component<IUIRootProps,IUIRootState> {
	
	render() {
		const
			{hasAvailableRepos, stateType, theme, modalOpen, sheet} = this.props,
			{palette} = theme,
			
			PageComponent = hasAvailableRepos ? getPage(stateType) : WelcomePage,
			expanded = stateType > AppStateType.AuthLogin && !hasAvailableRepos,
			
			headerVisibility = (stateType < AppStateType.Home) ?
				HeaderVisibility.Hidden :
				(expanded) ? HeaderVisibility.Expanded :
					HeaderVisibility.Normal,
			
			contentStyles = makeStyle(styles.content, {
				backgroundColor: theme.canvasColor,
				display: 'flex',
				flexDirection: 'column'
			}, expanded && styles.collapsed)
		
		
		return <div className={'root-content'}
		            style={[
		            	FillWindow,
		            	styles.content,
		            	theme.app
	              ]}
		>
			<div style={[
				Fill,
				FlexColumn,
				
				(sheet || modalOpen) && styles.blur
			]}>
				{/* HEADER */}
				<Header visibility={headerVisibility}/>
				
			
				<div style={[FlexScale,FlexColumn]}>
					<div style={contentStyles}>
						<PageComponent />
					</div>
				</div>
				
				{/* TOASTER */}
				<ToastMessages/>
				
				{/* STATUS BAR */}
				<StatusBar/>
			</div>
			{/* SHEET ROOT */}
			<SheetRoot />
		</div>
	}
	
}