// Imports
import * as React from 'react'
import { connect } from 'react-redux'
import * as Radium from 'radium'
import { PureRender } from 'ui/components/common/PureRender'
import {Events, AppKey, UIKey} from 'shared/Constants'
import { ThemedStyles } from 'shared/themes/ThemeManager'

import { UIState } from "shared/actions/ui/UIState"
import { AppState } from "shared/actions/app/AppState"
import {Header, HeaderVisibility, ToastMessages} from 'ui/components/root'
import {getPage} from 'ui/components/pages'
import {StatusBar} from "ui/components/root/StatusBar"
import {createStructuredSelector} from 'reselect'
import { availableRepoCountSelector } from "shared/actions/repo/RepoSelectors"
import { createDeepEqualSelector } from "shared/util/SelectorUtil"
import { AppStateType } from "shared/AppStateType"

// Constants
const
	log = getLogger(__filename)


//region Styles
const styles = {
	app: makeStyle(FlexColumn, FlexScale, {
		overflow: 'hidden'
	}),
	
	header: makeStyle(makeTransition(), FlexRowCenter, {}),
	
	content: makeStyle(makeTransition(), FlexColumn, PositionRelative, {
		flexBasis: 0,
		flexGrow: 1,
		flexShrink: 1
	}),
	
	collapsed: makeStyle({flexGrow: 0})
	
	
}
//endregion



/**
 * IUIRootProps
 */
export interface IUIRootProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	stateType?:AppStateType
	hasAvailableRepos?:boolean
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
	stateType: (state)=> (state.get(AppKey) as AppState).stateType,
	theme: () => getTheme(),
	dialogOpen: (state) => (state.get(UIKey) as UIState).dialogs.valueSeq().includes(true)
},createDeepEqualSelector))

// If you have a specific theme key you want to
// merge provide it as the second param
@Radium
@PureRender
export class UIRoot extends React.Component<IUIRootProps,IUIRootState> {
	
	render() {
		const
			{hasAvailableRepos, stateType, theme} = this.props,
			{palette} = theme,
			
			PageComponent = getPage(stateType),
			expanded = stateType > AppStateType.AuthLogin && !hasAvailableRepos,
			
			headerVisibility = (stateType < AppStateType.Home) ?
				HeaderVisibility.Hidden :
				(expanded) ? HeaderVisibility.Expanded :
					HeaderVisibility.Normal,
			
			contentStyles = makeStyle(styles.content, {
				backgroundColor: palette.canvasColor,
				display: 'flex',
				flexDirection: 'column'
			}, expanded && styles.collapsed)
		
		
		return <div className={'root-content'}
		            style={[FillWindow,styles.content,theme.app]}>
			
			<Header visibility={headerVisibility}/>
			
			{(stateType === AppStateType.AuthLogin || hasAvailableRepos) &&
			<div style={makeStyle(FlexScale,FlexColumn)}>
				<div style={contentStyles}>
					<PageComponent />
				</div>
				
				<ToastMessages/>
			</div>
			}
			
			<StatusBar/>
		</div>
	}
	
}