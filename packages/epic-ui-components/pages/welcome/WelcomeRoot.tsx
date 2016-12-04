
import { createStructuredSelector } from "reselect"
import { Page, PureRender, Logo } from "epic-ui-components/common"
import { connect } from "react-redux"
import { ThemedStyles, Transparent, Fill, FlexScale, rem, IThemedAttributes } from "epic-styles"
import { createDeepEqualSelector, guard } from "epic-global"
import { uiStateSelector,getAppActions } from "epic-typedux"
import { RepoSearchProvider, GitHubSearchProvider ,SearchField } from "epic-ui-components/search"

import { getValue } from "typeguard"
import { SearchItem, Repo } from "epic-models"


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
	searchFieldRef?:any
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
	
	// /**
	//  * On search result selected
	//  * @param eventType
	//  * @param searchId
	//  * @param item
	//  */
	// private onResultSelected = (eventType,searchId:string,item:SearchItem) => {
	// 	if (searchId !== WelcomeSearchId || !getValue(() => item.provider.id === Repo.$$clazz,false))
	// 		return
	//
	// 	item.provider.handleItem(item)
	// }
	
	/**
	 * On mount create initial state & bind listeners
	 */
	componentWillMount = () => {
		//EventHub.on(EventHub.SearchItemSelected,this.onResultSelected)
		this.setState(this.getNewState())
	}
	
	/**
	 * On unmount - unbind
	 */
	componentWillUnmount = () => {
		//EventHub.off(EventHub.SearchItemSelected,this.onResultSelected)
	}
	
	/**
	 * Create new state instance
	 */
	getNewState = () => ({
		width:window.innerWidth
	})
	
	updateState = () => this.setState(this.getNewState())
	
	
	/**
	 * When a result is selected
	 *
	 * @param item
	 */
	private onItemSelected = (item:ISearchItem) => {
		log.info(`Repo add result was selected`, item)
		
		guard(() => item.provider.handleItem(item))
	}
	
	/**
	 * on escape sequence from search panel
	 */
	private onEscape = () => {}
	
	
	private setSearchFieldRef = (searchFieldRef) => this.setState({
		searchFieldRef
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
				
				{/*hint={*/}
				{/*<span>*/}
							{/*Import <i><strong>angular</strong></i>*/}
							{/*&nbsp;&nbsp;or <i><strong>docker</strong></i>&nbsp;&nbsp;or one of your repos*/}
						{/*</span>*/}
			{/*}*/}
				<SearchField
					ref={this.setSearchFieldRef}
					searchId={WelcomeSearchId}
					providers={[GitHubSearchProvider,RepoSearchProvider]}
					autoFocus={true}
					tabIndex={0}
					placeholder='Search for any repo'
					open={true}
					focused={true}
					onItemSelected={this.onItemSelected}
					resultsHidden={false}
					inputStyle={styles.search.input}
					onEscape={this.onEscape}
					/>
			</div>
		</Page>
	}
}
