
import { createStructuredSelector } from "reselect"
import { Page, PureRender, Logo } from "epic-ui-components/common"
import { connect } from "react-redux"
import { ThemedStyles, Transparent, Fill, FlexScale, rem, IThemedAttributes } from "epic-styles"
import { createDeepEqualSelector } from "epic-global"
import { uiStateSelector,getAppActions } from "epic-typedux"
import { SearchType,SearchPanel } from "epic-ui-components/search"
import { SearchItem, SearchController } from "epic-ui-components/search/SearchController"
import { getValue } from "typeguard"

const
	log = getLogger(__filename),
	WelcomeSearchId = 'welcome-repo-search'


const
	baseStyles = (topStyles,theme,palette) => ({
		
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

/**
 * WelcomeProps
 */
export interface IWelcomeRootProps extends IThemedAttributes {
	
}

/**
 * WelcomeState
 */
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
	
	/**
	 * On search result selected
	 * @param eventType
	 * @param searchId
	 * @param item
	 */
	private onResultSelected = (eventType,searchId:string,item:SearchItem) => {
		if (searchId !== WelcomeSearchId || !getValue(() => item.type === SearchType.Repo,false))
			return
		
		SearchController.getDefaultHandler(SearchType.Repo)(searchId,item)
	}
	
	/**
	 * On mount create initial state & bind listeners
	 */
	componentWillMount = () => {
		EventHub.on(EventHub.SearchItemSelected,this.onResultSelected)
		this.setState(this.getNewState())
	}
	
	/**
	 * On unmount - unbind
	 */
	componentWillUnmount = () => {
		EventHub.off(EventHub.SearchItemSelected,this.onResultSelected)
	}
	
	/**
	 * Create new state instance
	 */
	getNewState = () => ({
		width:window.innerWidth
	})
	
	updateState = () => this.setState(this.getNewState())
	
	/**
	 * on escape sequence from search panel
	 */
	private onEscape = () => {}
	
	
	private setSearchPanelRef = (searchPanelRef) => this.setState({
		searchPanelRef
	})
	
	render() {
		const
			{theme,palette,styles} = this.props,
			{accent} = palette
		
		
		return <Page
			onResize={this.updateState}
			style={[Fill,FlexColumnCenter]}
			id="welcomePage">
			
			<div style={styles.bodyWrapper}>
				<Logo eHidden style={styles.logo} />
				<SearchPanel
					ref={this.setSearchPanelRef}
					searchId={WelcomeSearchId}
					types={[SearchType.Repo]}
					hint={
						<span>
							Import <i><strong>angular</strong></i>
							&nbsp;&nbsp;or <i><strong>docker</strong></i>&nbsp;&nbsp;or one of your repos
						</span>
					}
					inlineResults={false}
					expanded={false}
					focused={true}
					panelStyle={styles.search}
					fieldStyle={styles.search.field}
					inputStyle={styles.search.input}
					onEscape={this.onEscape}
					mode={'repos'}/>
			</div>
		</Page>
	}
}
