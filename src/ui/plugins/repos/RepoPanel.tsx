

// Imports
import {Container} from 'typescript-ioc'
import * as React from 'react'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {Icon,Button,PureRender} from 'ui/components/common'
import {RepoList} from './RepoList'

// Key mapping tools
import * as KeyMaps from 'shared/KeyMaps'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'

import {ThemedStyles, createThemedStyles} from 'shared/themes/ThemeManager'


import {RegisterTool} from "shared/Registry"
import {getBuiltInToolId, BuiltInTools} from "shared/Constants"
import {ToolPanelLocation,IToolProps} from "shared/tools/ToolTypes"
import {DataComponent, MapData} from "ui/components/data/DataComponent"
import { CommandComponent, ICommandComponent, getCommandProps } from "shared/commands/CommandComponent"
import { ICommand } from "shared/commands/Command"
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
					
							Container.get(UIActionFactory).showAddRepoDialog()
					
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
	label:'Repositories',getHeaderControls,
	buttonLabel: 'Repos'
})

@ThemedStyles(baseStyles,'repoPanel')
@CommandComponent()
export class RepoPanel extends React.Component<IRepoPanelProps,any> implements ICommandComponent {
	
	
	readonly commands:ICommand[] = []
	readonly commandComponentId:string = 'RepoPanel'
	/**
	 * Default location for the tool
	 *
	 * @type {ToolPanelLocation}
	 */
	
	private repoActions:RepoActionFactory = Container.get(RepoActionFactory)
	
	private uiActions = Container.get(UIActionFactory)
	
	
	
	setRepoPanelOpen = (event, open:boolean) => {
		this.uiActions.setRepoPanelOpen(open)
	}



	onBlur = () => {
		this.repoActions.clearSelectedRepos()
	}

	

	keyHandlers = {

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
		return <div {...getCommandProps(this)} style={panelStyle}>

				

				{/* List */}
				<div style={styles.listContainer} className="listContainer">
					<RepoList />
				</div>

			</div>
		


	}

}
