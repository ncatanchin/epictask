import * as React from 'react'

import * as Radium from 'radium'
import {List} from 'immutable'
import {createStructuredSelector} from 'reselect'
import {IssuesPanel} from 'ui/components/issues'
import {Page} from './Page'
import {AppActionFactory} from 'shared/actions/app/AppActionFactory'
import {connect} from 'react-redux'

import {PureRender} from 'ui/components/common'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {uiStateSelector} from 'shared/actions/ui/UISelectors'
import {ToolPanelLocation, IToolPanel} from "shared/tools/ToolTypes"
import {ToolPanelComponent as ToolPanel} from "ui/components/ToolPanel"
import {makeLinearGradient, Transparent} from "shared/themes"
import { SearchType } from "shared/actions/search"
import { SearchPanel } from "ui/components/search"


const
	SplitPane = require('react-split-pane'),
	Resizable = require('react-component-resizable'),
	log = getLogger(__filename)


const
	transition = makeTransition(['width','minWidth','maxWidth','flex','flexBasis','flexShrink','flexGrow']),
	paneTransition = makeTransition(['min-width','max-width','min-height','max-height'])

const baseStyles:any = createStyles({
	
	page:[],
	bodyWrapper: [FlexScale,Fill],
	viewWrapper:[FlexScale,Fill,{
		borderStyle: 'solid',
		borderWidth: rem(0.1)
	}],
	
	search: [ {
		backgroundColor: Transparent,
		
		field: [ {
			backgroundColor: Transparent
		}],
		input: [ {
			backgroundColor: Transparent
		} ],
		hint: [ {} ]
		
	} ]
	
})

interface IWelcomePageProps {
	theme?:any
	styles?:any
}

interface IWelcomePageState {
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
export class WelcomePage extends React.Component<IWelcomePageProps,IWelcomePageState> {
	
	appActions = Container.get(AppActionFactory)
	
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
		
		
		return <Page onResize={this.updateState} id="homePage">
			
			<div style={styles.bodyWrapper}>
				
				<SearchPanel
					ref={this.setSearchPanelRef}
					searchId='welcome-repo-search'
					types={[
						SearchType.Repo
					]}
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
