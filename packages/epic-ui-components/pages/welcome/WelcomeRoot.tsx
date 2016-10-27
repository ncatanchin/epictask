import * as React from "react"
import { createStructuredSelector } from "reselect"
import { Page, PureRender, Logo } from "../../common"
import { connect } from "react-redux"
import { ThemedStyles, Transparent, Fill, FlexScale, rem, IThemedAttributes } from "epic-styles"
import { createDeepEqualSelector } from "epic-global"
import { uiStateSelector, SearchType,getAppActions } from "epic-typedux"
import { SearchPanel } from "epic-ui-components/search"


const
	log = getLogger(__filename)


const
	transition = makeTransition(['width','minWidth','maxWidth','flex','flexBasis','flexShrink','flexGrow']),
	paneTransition = makeTransition(['min-width','max-width','min-height','max-height'])

const baseStyles = (topStyles,theme,palette) => ({
	
	page:[],
	bodyWrapper: [FlexRowCenter,Fill, makePaddingRem(1)],
	viewWrapper:[FlexScale,Fill,{
		borderStyle: 'solid',
		borderWidth: rem(0.1)
	}],
	
	logo: [makeMarginRem(0,2,0,0)],//[makeMarginRem(0,0,3,0)],
	
	search: [ {
		backgroundColor: Transparent,
		minWidth: 'auto',
		maxWidth: 600,
		
		
		field: [ {
			backgroundColor: Transparent
		}],
		input: [ {
			backgroundColor: Transparent
		} ],
		hint: [ {} ]
		
	} ]
	
})

export interface IWelcomeRootProps extends IThemedAttributes {
	
}

export interface IWelcomeRootState {
	width?:number
	searchPanelRef?:any
}


/**
 * The root container for the app
 */
@connect(createStructuredSelector({
	toolPanels: (state) => _.nilListFilter(uiStateSelector(state).toolPanels as any)
}, createDeepEqualSelector))
@ThemedStyles(baseStyles,'homePage')
@PureRender
export class WelcomeRoot extends React.Component<IWelcomeRootProps,IWelcomeRootState> {
	
	appActions = getAppActions()
	
	componentWillMount = () => this.setState(this.getNewState())
	
	getNewState = () => ({width:window.innerWidth})
	
	updateState = () => this.setState(this.getNewState())
	
	/**
	 * on escape sequence from search panel
	 */
	private onEscape = () => {
		
	}
	
	private setSearchPanelRef = (searchPanelRef) => this.setState({searchPanelRef})
	
	render() {
		const
			{theme,styles} = this.props,
			{palette} = theme,
			{accent} = palette
		
		
		return <Page onResize={this.updateState} id="welcomePage">
			
			<div style={styles.bodyWrapper}>
				<Logo eHidden style={styles.logo} />
				<SearchPanel
					ref={this.setSearchPanelRef}
					searchId='welcome-repo-search'
					types={[
						SearchType.Repo
					]}
					hint={
						<span>
							Import <i><strong>angular</strong></i>
							&nbsp;&nbsp;or <i><strong>docker</strong></i>&nbsp;&nbsp;or one of your repos
						</span>
					}
					inlineResults={false}
					expanded={false}
					panelStyle={styles.search}
					fieldStyle={styles.search.field}
					inputStyle={styles.search.input}
					onEscape={this.onEscape}
					mode={'repos'}/>
			</div>
		</Page>
	}
}
