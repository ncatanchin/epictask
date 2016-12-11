import { Page, PureRender } from "epic-ui-components/common"
import { ThemedStyles, Fill, rem, IThemedAttributes } from "epic-styles"
import { guard } from "epic-global"
import { getAppActions } from "epic-typedux"
import { RepoSearchProvider, GitHubSearchProvider, SearchField } from "epic-ui-components/search"
import baseStyles from "./WelcomeRoot.styles"


const
	log = getLogger(__filename),
	WelcomeSearchId = 'welcome-repo-search'




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
@ThemedStyles(baseStyles)
@PureRender
export class WelcomeRoot extends React.Component<IWelcomeRootProps,IWelcomeRootState> {
	
	appActions = getAppActions()
	
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
			style={[
				Fill,
				FlexColumnCenter,
				{backgroundImage: `url(${require('assets/images/splash/intro-bg.png')})`}
			]}
			id="welcomePage">
			
			<img
				height="250"
				width="auto"
				style={{marginBottom: rem(3)}}
				src={require("assets/images/splash/e.png")}/>
			
				<SearchField
					ref={this.setSearchFieldRef}
					searchId={WelcomeSearchId}
					providers={[GitHubSearchProvider,RepoSearchProvider]}
					autoFocus={true}
					tabIndex={0}
					placeholder='Import your first project, start managing like a boss..'
					open={true}
					focused={true}
					onItemSelected={this.onItemSelected}
					resultsHidden={false}
					styles={styles.search}
					onEscape={this.onEscape}
					/>
			
		</Page>
	}
}
