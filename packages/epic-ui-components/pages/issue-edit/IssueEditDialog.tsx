/**
 * Created by jglanz on 6/14/16.
 */
// Imports
import { createStructuredSelector } from "reselect"
import { List } from "immutable"
import { connect } from "react-redux"
import { Issue, AvailableRepo, Repo, User, Label } from "epic-models"

import {
	RepoSelect, LabelFieldEditor, MilestoneSelect, AssigneeSelect, MarkdownEditor, Icon, RepoLabel,
	getGithubErrorText, FileDrop, PureRender, TextField, Form, FormValidators
} from "epic-ui-components/common"
import { DialogRoot, createSaveCancelActions } from "epic-ui-components/layout/dialog"

import { getValue, canAssignIssue, canCreateIssue, cloneObjectShallow, guard } from "epic-global"
import { repoIdPredicate, availableReposSelector, appUserSelector, getUIActions } from "epic-typedux"
import {
	ThemedStyles,
	makeThemeFontSize,
	FlexColumn,
	FlexAuto,
	FlexRowCenter,
	FillHeight,
	IThemedAttributes
} from "epic-styles"
import { CommandType, ContainerNames, getCommandManager } from "epic-command-manager"
import { CommandComponent, CommandRoot, CommandContainerBuilder } from "epic-command-manager-ui"
import { getIssueActions } from "epic-typedux/provider"
import { IRouterLocation } from "epic-entry-ui/routes"
import IssueEditState from "epic-ui-components/pages/issue-edit/IssueEditState"
import IssueEditController from "epic-ui-components/pages/issue-edit/IssueEditController"
import { ViewRoot } from "epic-typedux/state/window/ViewRoot"



const
	log = getLogger(__filename),
	{ Style } = Radium

// DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

const baseStyles = (topStyles, theme, palette) => {
	const
		{
			accent,
			warn,
			text,
			secondary
		} = palette,
		
		rowStyle = [ FlexRow, FlexAuto, FlexAlignStart, FillWidth, makePaddingRem(0, 1) ]
	
	return {
		dialog: [ {
			minHeight: 500,
			minWidth: 500
		} ],
		root: [ FlexColumn, FlexAuto ],
		
		actions: [ FlexRowCenter, FillHeight ],
		
		
		titleBar: [ {
			label: [ FlexRowCenter, {
				fontSize: rem(1.6),
				
				repo: [ makePaddingRem(0, 0.6, 0, 0), {} ],
				
				number: [ {
					paddingTop: rem(0.3),
					fontSize: rem(1.4),
					fontWeight: 100,
					color: text.secondary
				} ]
			} ]
		} ],
		
		
		
		form: [ FlexScale, FlexColumn, FillWidth, {
			
			title: [ FlexScale ],
			
			repo: [ FlexScale,{
				
				
			} ],
			
			
			milestone: [ FlexScale,{
				
			} ],
			
			assignee: [ FlexScale,{
				
				// avatar: [ FlexRow, makeFlexAlign('center', 'flex-start'), {
				// 	label: {
				// 		fontWeight: 500,
				// 	},
				// 	avatar: {
				// 		height: 22,
				// 		width: 22,
				// 	}
				//
				// } ]
			} ],
			
			/**
			 * Label editor styling
			 */
			labels: [],
			
			row1: [ ...rowStyle,{ marginBottom: rem(0.8) } ],
			row2: [ ...rowStyle, { marginBottom: rem(0.8) } ],
			row3: [ ...rowStyle, {} ],
			
			editor: [ FlexScale, FillWidth ]
			
		} ],
		
		
	}
}


/**
 * IIssueEditDialogProps
 */
export interface IIssueEditDialogProps extends IThemedAttributes, IRouterLocation {
	viewState?:IssueEditState
	viewController?:IssueEditController
	
	availableRepos?:List<AvailableRepo>
	user?:User
	
}

export interface IIssueEditDialogState {
	availableRepo?:AvailableRepo
	titleValue?:string
	bodyValue?:string
	
	repoMenuItems?:any[]
	
	mdEditor?:MarkdownEditor
	
	
}

/**
 * IssueEditDialog
 *
 * @class IssueEditDialog
 * @constructor
 **/


@ViewRoot(IssueEditController,IssueEditState)
@connect(createStructuredSelector({
	user: appUserSelector,
	//editingIssue: editingIssueSelector,
	availableRepos: availableReposSelector,
	// saving: issueSavingSelector,
	// saveError: issueSaveErrorSelector
	
}))

@CommandComponent()
@ThemedStyles(baseStyles, 'dialog', 'issueEditDialog', 'form')
@PureRender
export class IssueEditDialog extends React.Component<IIssueEditDialogProps,IIssueEditDialogState> {
	
	refs:any
	
	
	commandItems = (builder:CommandContainerBuilder) =>
		builder
			.command(CommandType.Container,
				'Save Comment',
				(cmd, event) => guard(() => this.refs.form.submit()),
				"CommandOrControl+Enter")
			.command(CommandType.Container,
				'Close Dialog',
				this.hide,
				"Escape")

			.make()
	
	
	commandComponentId = ContainerNames.IssueEditDialog
	
	
	private get viewState():IssueEditState {
		return getValue(() => this.props.viewState)
	}
	
	private get viewController() {
		return getValue(() => this.props.viewController)
	}
	
	private get editingIssue() {
		return getValue(() => this.viewState.editingIssue,new Issue())
	}
	
	/**
	 * Hide/close the window
	 */
	private hide = () => {
		getCurrentWindow().close()
		// const
		// 	windowId = getWindowId()
		//
		// if (windowId)
		// 	getUIActions().closeWindow(windowId)
	}
	
	/**
	 * On cancel - call hide
	 */
	private onCancel = this.hide
	
	/**
	 * On save - send to actions with child window id
	 *
	 * @param event
	 */
	private onSave = async () => {
		if (this.viewState.saving)
			return
		
		this.viewController.setSaving(true)
				
		await Promise.setImmediate()
		
		const
			savingIssue = this.editingIssue
		
		try {
			await getIssueActions().saveIssue(
				cloneObjectShallow(savingIssue, this.textInputState())
			)
			getUIActions().closeWindow(getWindowId())
		} catch (err) {
			log.error(`failed to save issue`,err)
			getNotificationCenter().addErrorMessage(`Unable to save issue: ${!savingIssue ? '' : savingIssue.title}`)
			
			this.viewController.setSaveError(err)
			this.viewController.setSaving(false)
			
		}
		
	}
	
	
	private textInputState = () => ({
		title: this.state.titleValue,
		body: this.state.bodyValue
	})
	
	/**
	 * Update the editing issue
	 * @param newIssueProps
	 */
	private updateIssueState = (newIssueProps) => {
		let
			{editingIssue} = this
		
		editingIssue = cloneObjectShallow(editingIssue,newIssueProps)
		
		this.viewController.setEditingIssue(editingIssue)
		
		return editingIssue
	}
	
	
	/**
	 * On body change, just update the state
	 *
	 * @param value
	 */
	private onMarkdownChange = (value) => {
		log.debug('markdown change', value)
		this.setState({ bodyValue: value })
	}
	
	/**
	 * Set md editor ref
	 *
	 * @param mdEditor
	 */
	private setMarkdownEditor = (mdEditor:MarkdownEditor) => {
		this.setState({ mdEditor })
	}
	
	
	/**
	 * Title change
	 *
	 * @param event
	 */
	onTitleChange = event => {
		const
			{value} = event.target as any
		
		log.debug(`Title change`,value)
		
		this.setState({ titleValue: value })
	}
	
	/**
	 * Repo Change
	 *
	 * @param repo
	 */
	onRepoChange = (repo:AvailableRepo) => {
		const
			editingIssue = new Issue(cloneObjectShallow(
				this.editingIssue || new Issue(),
				this.textInputState(),{
					repoId: repo.id
				}
			))
		
		this.viewController.setEditingIssue(editingIssue)
		
		//getIssueActions().setEditingIssue(editingIssue)
	}
	
	onMilestoneItemSelected = (milestone) => {
		this.updateIssueState({ milestone })
		
	}
	
	onAssigneeItemSelected = (assignee) => {
		this.updateIssueState({ assignee })
	}
	
	onLabelsChanged = (newLabels:Label[]) => {
		const
			{
				editingIssue
			} = this
		
		if (editingIssue) {
			this.updateIssueState({
				labels: newLabels
			})
		}
	}
	
	

	/**
	 * Create a new state for dialog
	 *
	 * @param props
	 * @returns {any}
	 * @param editingIssue
	 */
	getNewState(props:IIssueEditDialogProps, editingIssue:Issue = null) {
		const
			{
				styles
			} = props
			
		if (!editingIssue)
			editingIssue = this.editingIssue
		
		let
			{ availableRepos } = props
			//repo = availableRepos.find()
		
		if (availableRepos.size < 1)
			return {}
		
		let
			repoId = editingIssue && editingIssue.repoId,
			newState = {}
		
		if (!repoId)	{
			editingIssue = this.updateIssueState({repoId: availableRepos.get(0).id})
		}
			
		if (!editingIssue)
			return newState as any
		
		let
			labels = Array<Label>()
		
		if (editingIssue.id > 0) {
			availableRepos = availableRepos.filter(item => item.repoId === repoId) as List<AvailableRepo>
		} else {
			availableRepos = availableRepos.filter(it => canCreateIssue(it.repo)) as List<AvailableRepo>
		}
		
		let
			bodyValue = getValue(() => this.state.bodyValue,editingIssue.body),
			titleValue = getValue(() => this.state.titleValue,editingIssue.title)
		
		if (!bodyValue || !bodyValue.length)
			bodyValue = _.get(editingIssue, 'body', '')
		
		// if (!titleValue || !titleValue.length)
		// 	titleValue = _.get(editingIssue, 'title', '')
				
		
		let
			availableRepo = editingIssue && availableRepos.find(repoIdPredicate(editingIssue))
		
		if (!availableRepo && availableRepos.size) {
			editingIssue = cloneObjectShallow(editingIssue)
			availableRepo = availableRepos.get(0)
			editingIssue.repoId = availableRepo.id
		}
		return Object.assign(newState,{
			editingIssue,
			availableRepo,
			bodyValue,
			titleValue
		})
	}
	
	
	// /**
	//  * Should update
	//  *
	//  * @param nextProps
	//  * @param nextState
	//  * @returns {boolean}
	//  */
	// shouldComponentUpdate(nextProps:IIssueEditDialogProps, nextState:IIssueEditDialogState) {
	// 	return !shallowEquals(this.state, nextState, 'availableRepo', 'labels', 'repoMenuItems') ||
	// 		!shallowEquals(this.props, nextProps, 'theme', 'styles', 'editingIssue', 'saving')
	// }
	//
	
	/**
	 * On prop update
	 *
	 * @param nextProps
	 */
	componentWillReceiveProps = (nextProps) => this.setState(this.getNewState(nextProps))
	
	/**
	 * On mount
	 */
	componentWillMount = () => {
		this.viewController.setMounted(
			true,
			this.props,
			() => this.setState(this.getNewState(this.props))
		)
		
		
		log.info(`Edit dialog mounted with params`,this.props.params,this.props.uri)
		
	}
	
	/**
	 * on form valid
	 *
	 * @param values
	 */
	private onFormValid = (values:IFormFieldValue[]) => {
		log.debug(`onValid`,values)
	}
	
	/**
	 * On form invalid
	 *
	 * @param values
	 */
	private onFormInvalid = (values:IFormFieldValue[]) => {
		log.debug(`onInvalid`,values)
	}
	
	/**
	 * On submit when the form is valid
	 *
	 * @param form
	 * @param model
	 * @param values
	 */
	private onFormValidSubmit = (form:IForm,model:any,values:IFormFieldValue[]) => {
		return this.onSave()
	}
	
	
	/**
	 * On drop event handler
	 *
	 * @param data
	 */
	onDrop = (data:DataTransfer) => {
		const
			mde = getValue(() => this.state.mdEditor)
		
		mde.onDrop(data)
	}
	
	
	render() {
		
		const
			{ styles, palette, theme, open, user,availableRepos} = this.props,
			{ready,saveError, saving} = this.viewState
		
		let
			{editingIssue} = this,
			titleValue = getValue(() => this.state.titleValue,editingIssue.title || ''),
			repoId = editingIssue.repoId
		
		const
			availableRepo = getValue(() => availableRepos.find(it => it.id === repoId))
		
		let
			repo = editingIssue && (editingIssue.repo || getValue(() => availableRepo.repo))
		
		log.info('ready/repo',ready,repoId,repo,editingIssue)
		if (!ready || !repo)
			return React.DOM.noscript()
		
		
		
		
		
		const
			canAssign = canAssignIssue(repo),
			
			titleNode = <div style={makeStyle(styles.titleBar.label)}>
				{editingIssue.id ? <div style={styles.titleBar.label}>
					<RepoLabel repo={repo}
					           style={makeStyle(styles.titleBar.label,styles.titleBar.label.repo)}/>
					<span style={[styles.titleBar.label.number]}>#{editingIssue.number}</span>
				</div> : `CREATE`}
			</div>,
			
			titleActionNodes = createSaveCancelActions(
				theme,
				palette,
				() => this.refs.form.submit(),
				this.onCancel)
		
		//error={getGithubErrorText(saveError,'title')}
		
		return <CommandRoot
			id={ContainerNames.IssueEditDialog}
			component={this}
			style={makeStyle(Fill)}>
			
			<DialogRoot
				titleMode='horizontal'
				titleNode={titleNode}
				titleActionNodes={titleActionNodes}
				saving={saving}
				styles={styles.dialog}
			>
				
				<Form
					id="issue-edit-form"
					ref="form"
					onInvalid={this.onFormInvalid}
					onValid={this.onFormValid}
					onValidSubmit={this.onFormValidSubmit}
					styles={[FlexColumn,FlexScale]}>
					
				<FileDrop onFilesDropped={this.onDrop}
				          acceptedTypes={[/image/]}
				          dropEffect='all'
				          style={styles.form}>
					
					<div style={styles.form.row1}>
						<TextField value={titleValue}
						           onChange={this.onTitleChange}
						           validators={[FormValidators.makeLengthValidator(1,9999,'Issue title must be provided')]}
						           placeholder="TITLE"
						           style={styles.form.title}
						           inputStyle={FlexScale}
						           autoFocus />
						
					</div>
					<div style={styles.form.row2}>
						{/* REPO */}
						{!editingIssue.id &&
						
						<RepoSelect
							repo={availableRepo}
						  onItemSelected={this.onRepoChange}
							style={makeStyle(styles.form.repo,makeMarginRem(0.5,canAssign ? 0.5 : 0,0.5,0))}
						  />
						}
						{/* Only show assignee drop down if push permission */}
						{canAssign &&
							<AssigneeSelect
								style={makeStyle(styles.form.assignee,makeMarginRem(0.5,0.5,0.5,0))}
								assignee={editingIssue.assignee}
								repoId={editingIssue.repoId}
								onItemSelected={this.onAssigneeItemSelected}/>
						}
						
						
						{/* MILESTONE */}
						{canAssign && <MilestoneSelect
							style={makeStyle(styles.form.milestone,makeMarginRem(0.5,0))}
							milestone={editingIssue.milestone}
							repoId={editingIssue.repoId}
							onItemSelected={this.onMilestoneItemSelected}
						/>}
					
					
					</div>
					
					<div style={styles.form.row2}>
					<LabelFieldEditor labels={editingIssue.labels || []}
					                  id="issueEditDialogLabels"
					                  hint="Labels"
					                  styles={styles.form.labels}
					                  style={makeStyle(Styles.FillWidth,{marginBottom: rem(1.5)})}
					                  availableLabels={availableRepo.labels || []}
					                  onLabelsChanged={this.onLabelsChanged}
					                  onKeyDown={(event) => {
					                  	getCommandManager().handleKeyDown(event as any,true)
					                  }}
					                  
					/>
					</div>
					<MarkdownEditor
						ref={this.setMarkdownEditor}
						autoFocus={false}
						onKeyDown={(event) => getCommandManager().handleKeyDown(event as any,true)}
						onChange={this.onMarkdownChange}
						
						defaultValue={_.get(editingIssue,'body','')}
						style={styles.form.editor}
					/>
				
				</FileDrop>
				</Form>
			</DialogRoot>
		</CommandRoot>
	}
	
}


export default IssueEditDialog