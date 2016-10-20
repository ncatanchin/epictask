// Imports
import HTML5Backend from 'react-dnd-html5-backend'
import { DragDropContext } from 'react-dnd'
import { connect } from 'react-redux'
import { PureRender } from 'ui/components/common/PureRender'
import { Header, HeaderVisibility, ToastMessages } from 'ui/components/root'
import { getPage } from 'ui/components/pages'
import { StatusBar } from "ui/components/root/StatusBar"
import { createStructuredSelector } from 'reselect'
import { availableRepoCountSelector } from "shared/actions/repo/RepoSelectors"
import { AppStateType } from "shared/AppStateType"
import { appStateTypeSelector } from "shared/actions/app/AppSelectors"
import { childWindowOpenSelector, modalWindowOpenSelector, sheetSelector } from "shared/actions/ui/UISelectors"
import { IUISheet } from "shared/config/WindowConfig"
import { SheetRoot } from "ui/components/root/SheetRoot"
import { FillWindow } from "shared/themes/styles/CommonStyles"
import { FlexColumn, Fill, FlexScale } from "shared/themes/styles"
import { WelcomePage } from "ui/components/pages/WelcomePage"
import { ThemedStyles, IThemedAttributes } from "shared/themes/ThemeDecorations"
import { ToolDragLayer } from "ui/components/ToolDragLayer"
import { authenticatingSelector } from "shared/actions/auth/AuthSelectors"

// Constants
const
	log = getLogger(__filename)


//region Styles
function baseStyles(topStyles, theme, palette) {
	return {
		app: [ FlexColumn, FlexScale, {
			overflow: 'hidden'
		} ],
		
		header: [ makeTransition([ 'height', 'width', 'opacity' ]), FlexRowCenter, {} ],
		
		content: [ makeTransition([ 'height', 'width', 'opacity' ]), FlexColumn, PositionRelative, {
			flexBasis: 0,
			flexGrow: 1,
			flexShrink: 1
		} ],
		
		collapsed: [ {
			flexGrow: 0
		} ],
		
		blur: [ {
			WebkitFilter: "blur(0.2rem)", /* Chrome, Safari, Opera */
			filter: "blur(0.2rem)"
		} ]
		
		
	}
}
//endregion


/**
 * IUIRootProps
 */
export interface IUIRootProps extends IThemedAttributes {
	stateType?:AppStateType
	hasAvailableRepos?:boolean
	childOpen?:boolean
	modalOpen?:boolean
	authenticating?:boolean
	sheet?:IUISheet
	
}

/**
 * IUIRootState
 */
export interface IUIRootState {
	statusBarHasItems?:boolean
}

/**
 * UIRoot
 *
 * @class UIRoot
 * @constructor
 **/
@(DragDropContext as any)(HTML5Backend)
@connect(createStructuredSelector({
	hasAvailableRepos: availableRepoCountSelector,
	stateType: appStateTypeSelector,
	childOpen: childWindowOpenSelector,
	modalOpen: modalWindowOpenSelector,
	authenticating: authenticatingSelector,
	sheet: sheetSelector
}))
@ThemedStyles(baseStyles)
@PureRender
export class UIRoot extends React.Component<IUIRootProps,IUIRootState> {
	
	constructor(props,context) {
		super(props,context)
		
		this.state = {statusBarHasItems: false}
	}
	
	render() {
		const
			{ hasAvailableRepos, authenticating,stateType, styles, theme, modalOpen, sheet } = this.props,
			
			PageComponent = ((hasAvailableRepos || stateType < AppStateType.Home) ?
					getPage(stateType) :
					WelcomePage
			) as any,
			
			headerVisibility = (stateType < AppStateType.Home || !hasAvailableRepos) ?
				HeaderVisibility.Hidden :
				HeaderVisibility.Normal,
			
			contentStyles = makeStyle(styles.content, {
				backgroundColor: theme.canvasColor,
				display: 'flex',
				flexDirection: 'column'
			})
		
		
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
				(sheet || modalOpen || authenticating) && styles.blur
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
				<StatusBar open={
					headerVisibility !== HeaderVisibility.Hidden
				}/>
				
				
			</div>
			{/* SHEET ROOT */}
			<SheetRoot />
			<ToolDragLayer />
		</div>
	}
	
}