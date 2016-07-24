/**
 * Created by jglanz on 7/24/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {PureRender, Button} from 'components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector, createSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {Issue} from 'models/Issue'
import {issueModelsSelector, milestoneModelsSelector, userModelsSelector} from 'shared/actions/data/DataSelectors'
import {patchIssuesSelector} from 'shared/actions/issue/IssueSelectors'
import {User} from 'models/User'
import {Label} from 'models/Label'
import {Milestone} from 'models/Milestone'
import {uiStateSelector} from 'shared/actions/ui/UISelectors'
import {Dialogs} from 'shared/Constants'
import {Dialog} from 'material-ui'
import {HotKeys} from 'react-hotkeys'
import {MuiThemeProvider} from 'material-ui/styles'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {AutoWired} from 'typescript-ioc'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {Inject} from 'typescript-ioc'
import {TextField} from 'material-ui'
import {cloneObject} from 'util/ObjectUtil'
import {IssuePatchModes, TIssuePatchMode} from 'shared/actions/issue'
import {Avatar} from 'material-ui'
import {getGithubErrorText} from 'ui/components/common/Renderers'
import {CircularProgress} from 'material-ui'
import {TypeAheadSelect} from 'ui/components/common/TypeAheadSelect'

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root: [FlexColumn, FlexAuto, {}],

	title: [FlexColumn,FillWidth,{
		action: [FlexRow],
		issues: [FlexRow,FillWidth,FlexScale,OverflowAuto]
	}]

})


/**
 * Acceptable modes
 */

export const IssuePatchFns = {
	[IssuePatchModes.Label]: (item) => ({labels:[item]}),
	[IssuePatchModes.Milestone]: (item) => ({milestone:item}),
	[IssuePatchModes.Assignee]: (item) => ({assignee:item})
}

/**
 * IIssuePatchDialogProps
 */
export interface IIssuePatchDialogProps extends React.HTMLAttributes {
	theme?: any
	styles?: any
	open?:boolean
	saving?:boolean
	savingError?:Error
	mode:TIssuePatchMode

	issues?:Issue[]
	userModels?:Map<string,User>
	milestoneModels?:Map<string,Milestone>
	labelModels?:Map<string,Label>

}

/**
 * IIssuePatchDialogState
 */
export interface IIssuePatchDialogState {
	selectedItem?:any
	dataSource?:any
}

/**
 * IssuePatchDialog
 *
 * @class IssuePatchDialog
 * @constructor
 **/

@connect(createStructuredSelector({
	milestoneModels: milestoneModelsSelector,
	issueModels: issueModelsSelector,
	userModels: userModelsSelector,
	issues:patchIssuesSelector,
	open: (state) => uiStateSelector(state).dialogs
		.get(Dialogs.IssueEditDialog) === true
}, createDeepEqualSelector))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'dialog')
@Radium
@PureRender
@AutoWired
export class IssuePatchDialog extends React.Component<IIssuePatchDialogProps,IIssuePatchDialogState> {

	@Inject
	issueActions:IssueActionFactory

	@Inject
	uiActions:UIActionFactory

	/**
	 * Hide and focus on issue panel
	 */
	hide = () => {
		this.uiActions.setDialogOpen(Dialogs.IssueEditDialog, false)
		this.uiActions.focusIssuesPanel()
	}

	onBlur = () => {
		log.info('blur hide')
		this.hide()
	}

	onSave = (event) => {
		const selectedItem = _.get(this.state,'selectedItem')
		const patch = IssuePatchModes[this.props.mode](selectedItem)

		log.info('Applying patch to issue',patch)

		!this.props.saving &&
			this.issueActions.patchIssues(
				patch,
				...cloneObject(this.props.issues)
			)
	}

	onItemSelected = (selectedItem) => {
		this.setState({selectedItem})
	}

	onInputChanged = (newQuery) => {
		log.info('Query updated',newQuery)
	}

	makeDataSource(newQuery, items) {

		const chipProps = {
			query: newQuery || ''
		}

		const newDataSource = items.map(item => ({
			item,
			text: '',//this.props.keySource(item),
			value: this.props.renderChipSearchItem(chipProps, item)
		}))

		log.debug('new data source =', newDataSource)
		return newDataSource
	}

	/**
	 * Hot key handlers
	 */
	keyHandlers = {

	}


	render() {
		const {
			theme,
			issues,
			mode,
			styles,
			saving,
			saveError
		} = this.props

		const actions = [
			<Button onClick={this.hide} style={styles.action}>Cancel</Button>,
			<Button onClick={this.onSave} style={styles.action} mode='raised'>Save</Button>
		]

		const title = <div style={styles.title}>
			<div style={styles.title.action}>{mode === IssuePatchModes.Label ? 'Add Label to' :
				mode === IssuePatchModes.Assignee ? 'Assign to' :
					'Set Milestone'}
			</div>
			<div style={styles.title.issues}>{mode === IssuePatchModes.Label ? 'Add Label to' :
				mode === IssuePatchModes.Assignee ? 'Assign to' :
					'Set Milestone'}
			</div>

			{/*<div style={styles.title.avatar}>*/}
				{/*<Avatar user={user}*/}
				        {/*prefix='issue being created by'*/}
				        {/*prefixStyle={{padding: '0 0.5rem 0 0'}}*/}
				        {/*labelPlacement='before'*/}
				        {/*labelStyle={styles.title.avatar.label}*/}
				        {/*avatarStyle={styles.title.avatar.avatar}/>*/}
			{/*</div>*/}
		</div>

		return <div>
			<Dialog style={styles.root}
			        open={open}
			        actions={actions}
			        actionsContainerStyle={styles.actions}
			        modal={true}
			        overlayStyle={styles.backdrop}
			        autoScrollBodyContent={true}
			        bodyStyle={styles.body}
			        titleStyle={styles.title}
			        title={title}
			        onBlur={this.onBlur}>



				{ open &&
				<MuiThemeProvider muiTheme={theme}>
					<HotKeys handlers={this.keyHandlers} style={PositionRelative}>
						<form name="issueEditDialogForm"
						      id="issueEditDialogForm"
						      style={makeStyle(saving && {opacity: 0,pointerEvents: 'none'})}>


							<TypeAheadSelect
								hintText={mode + '...'}
								menuProps={{maxHeight:300}}
								onItemSelected={this.onItemSelected}
								onInputChanged={this.onInputChanged}
								dataSource={this.state.dataSource}
								openOnFocus={true}
								underlineShow={false}/>

						</form>

						{/* Saving progress indicator */}
						<div style={makeStyle(styles.savingIndicator,saving && {opacity: 1})}>
							<CircularProgress
								color={theme.progressIndicatorColor}
								size={1} />
						</div>
					</HotKeys>
				</MuiThemeProvider>
				}
			</Dialog>
		</div>
	}

}