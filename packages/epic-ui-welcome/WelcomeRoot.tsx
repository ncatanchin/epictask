import { Page, PureRender } from "epic-ui-components/common"
import { ThemedStyles, Fill, rem, IThemedAttributes } from "epic-styles"
import { guard } from "epic-global"
import { getAppActions } from "epic-typedux"
import { RepoSearchProvider, GitHubSearchProvider, SearchField } from "epic-ui-components/search"
import baseStyles from "./WelcomeRoot.styles"
import * as React from "react"


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

}


/**
 * The root container for the app
 */
@ThemedStyles(baseStyles)
@PureRender
export class WelcomeRoot extends React.Component<IWelcomeRootProps, IWelcomeRootState> {
	
	/**
	 * When a result is selected
	 *
	 * @param item
	 */
	private onItemSelected = (item:ISearchItem) => guard(() => item.provider.handleItem(item))
	
	
	render() {
		const
			{ theme, palette, styles } = this.props,
			{ accent } = palette
		
		
		return <Page
			style={[
				Styles.Fill,
				Styles.FlexColumnCenter,
				Styles.makePaddingRem(3,0,3,0),
				{ backgroundImage: `url(${require('assets/images/splash/intro-bg.png')})` }
			]}
			id="welcomePage">
			
			<h1 style={styles.header}>Import a repository</h1>
			<SearchField
				searchId={WelcomeSearchId}
				providers={[ RepoSearchProvider,GitHubSearchProvider ]}
				autoFocus={true}
				inlineResults={true}
				tabIndex={0}
				searchOnEmpty={true}
				placeholder='Import your first project, start managing like a boss..'
				open={true}
				focused={true}
				onItemSelected={this.onItemSelected}
				resultsHidden={false}
				styles={styles.search}
			/>
		
		</Page>
	}
}
