

// Imports
import * as React from 'react'
import {Icon,Button} from 'ui/components/common'
import {RepoList} from './RepoList'

// Key mapping tools
import * as KeyMaps from 'shared/KeyMaps'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'

import {ThemedStyles, createThemedStyles} from 'shared/themes/ThemeManager'


import {RegisterTool} from "shared/Registry"
import {getBuiltInToolId, BuiltInTools} from "shared/config/ToolConfig"
import {ToolPanelLocation,IToolProps} from "shared/tools/ToolTypes"
import {
	CommandComponent, ICommandComponent, CommandRoot,
	CommandContainerBuilder
} from "shared/commands/CommandComponent"
import { getUIActions, getRepoActions } from "shared/actions/ActionFactoryProvider"
import { CommonKeys } from "shared/KeyMaps"
import { ContainerNames } from "shared/config/CommandContainerConfig"
import { Sheets } from "ui/DialogsAndSheets"
const
	{CommonKeys:Keys} = KeyMaps


// Constants
const log = getLogger(__filename)

const baseStyles:any = createStyles({
	cover: makeStyle(FlexColumn,FlexScale,Fill,{

	}),

	panel: [makeTransition(['opacity']),FlexColumn,FlexScale,Fill,{
		opacity: 1
	}],

	
	drawerWrapper: [makeTransition(['width','minWidth','maxWidth']), FlexColumn,FlexScale,Fill,{
		minWidth: rem(20),
		position: 'relative',

		
	}],

	drawer: makeStyle(FlexColumn,FlexScale,FillWidth,{
		minWidth: 200,
		position: 'relative'
	}),

	header: [Ellipsis,FlexRowCenter,FlexAuto, {
		title: [Ellipsis,FlexScale,{
			fontSize: themeFontSize(1.2),
			padding: '0.4rem 0.5rem'
		}],
		
		button: [FlexRowCenter,{
			height: rem(2),
			borderRadius: 0,
			
			label: {
				fontSize: rem(0.9),
				padding: '0 0.5rem 0 0'
			},
			icon: {
				fontSize: rem(1)
			},
		}]
	}],

	listContainer: [FlexColumn,FlexScale, {
		overflow: 'hidden'
	}]

})

/**
 * IRepoDrawerProps
 */
export interface IRepoPanelProps extends IToolProps {
	theme?:any
	styles?:any
}

function getHeaderControls() {
	const styles = createThemedStyles(baseStyles,['repoPanel'])
	return [
		<Button key="AddRepoButton"
						tabIndex={-1}
		        style={styles.header.button}
		        onClick={(event:React.MouseEvent<any>) => {
							event.preventDefault()
							event.stopPropagation()
					
							log.debug(`add repo click`,event)
					
							getUIActions().openSheet(Sheets.RepoImportSheet)
					
						}}>
			<Icon style={styles.header.button.icon} iconSet='fa' iconName='plus'/>
		</Button>
	]
}



/**
 * RepoPanel
 *
 * @class RepoPanel
 * @constructor
 **/
@RegisterTool({
	id:getBuiltInToolId(BuiltInTools.RepoPanel),
	defaultLocation: ToolPanelLocation.Left,
	label:'Repositories',
	getHeaderControls,
	buttonLabel: 'Repos'
})
@CommandComponent()
@ThemedStyles(baseStyles,'repoPanel')
export class RepoPanel extends React.Component<IRepoPanelProps,any> implements ICommandComponent {
	
	
	commands = (builder:CommandContainerBuilder) =>
		builder
			.make()
		
	
	readonly commandComponentId:string = ContainerNames.RepoPanel
	
	/**
	 * Repo Action
	 *
	 * @type {ToolPanelLocation}
	 */
	
	private repoActions = getRepoActions()
	
	
	/**
	 * UI Actions
	 *
	 * @type {UIActionFactory}
	 */
	private uiActions = getUIActions()
	
	
	
	setRepoPanelOpen = (event, open:boolean) => {
		this.uiActions.setRepoPanelOpen(open)
	}



	onBlur = () => {
		this.repoActions.clearSelectedRepos()
	}
	
		
	render() {
		const
			{theme,styles,style,visible} = this.props,
			
			panelStyle = [
				styles.panel,
				styles.root,
				style
			],

			headerStyle = [styles.header],
			headerButtonStyle = [styles.header.button]

		//handlers={this.keyHandlers}
		return <CommandRoot
			component={this}
			style={panelStyle}>

				

				{/* List */}
				<div style={styles.listContainer} className="listContainer">
					<RepoList />
				</div>

			</CommandRoot>
		


	}

}
