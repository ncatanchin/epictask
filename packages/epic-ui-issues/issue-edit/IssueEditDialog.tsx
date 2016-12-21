/**
 * Created by jglanz on 6/14/16.
 */
// Imports
import { createStructuredSelector } from "reselect"
import { List } from "immutable"
import { connect } from "react-redux"
import { Issue, AvailableRepo, User, Label, Repo } from "epic-models"
import {
	RepoSelect,
	LabelFieldEditor,
	MilestoneSelect,
	AssigneeSelect,
	MarkdownEditor,
	RepoLabel,
	FileDrop,
	PureRender,
	TextField,
	Form,
	FormValidators
} from "epic-ui-components/common"
import { DialogRoot, createSaveCancelActions } from "epic-ui-components/layout/dialog"
import { getValue, canAssignIssue, canCreateIssue, cloneObjectShallow, guard, PersistentValue } from "epic-global"
import { repoIdPredicate, availableReposSelector, appUserSelector, getUIActions } from "epic-typedux"
import { ThemedStyles, FlexColumn, IThemedAttributes } from "epic-styles"
import { CommandType, ContainerNames, getCommandManager } from "epic-command-manager"
import { CommandComponent, CommandRoot, CommandContainerBuilder } from "epic-command-manager-ui"
import { getIssueActions } from "epic-typedux/provider"
import { IRouterLocation } from "epic-entry-ui/routes"
import IssueEditState from "./IssueEditState"
import IssueEditController from "./IssueEditController"
import { ViewRoot } from "epic-typedux/state/window/ViewRoot"
import { getWindowManagerClient } from "epic-process-manager-client"
import baseStyles from "./IssueEditDialog.styles"


const
	log = getLogger(__filename),
	{ Style } = Radium

// DEBUG
log.setOverrideLevel(LogLevel.DEBUG)


const
	repoIdValue = new PersistentValue<number>('createIssueRepoId')

/**
 * IIssueEditDialogProps
 */
export interface IIssueEditDialogProps extends IThemedAttributes, IRouterLocation {
	viewState?: IssueEditState
	viewController?: IssueEditController
	
	availableRepos?: List<AvailableRepo>
	user?: User
	
}

export interface IIssueEditDialogState {
	availableRepo?: AvailableRepo
	titleValue?: string
	bodyValue?: string
	
	repoMenuItems?: any[]
	
	mdEditor?: MarkdownEditor
	
	
}

/**
 * IssueEditDialog
 *
 * @class IssueEditDialog
 * @constructor
 **/


@ViewRoot(IssueEditController, IssueEditState)
@connect(createStructuredSelector({
	user: appUserSelector,
	availableRepos: availableReposSelector
}))
@ThemedStyles(baseStyles, 'dialog', 'issueEditDialog', 'form')
@PureRender
export class IssueEditDialog extends React.Component<IIssueEditDialogProps,IIssueEditDialogState> {
	
	refs: any
	
	get form(): Form {
		return getValue(() => this.refs.form)
	}
	
	private get viewState(): IssueEditState {
		return getValue(() => this.props.viewState)
	}
	
	private get viewController() {
		return getValue(() => this.props.viewController)
	}
	
	private get repo() {
		const
			{availableRepos} = this.props,
			issue = getValue(() => this.viewState.editingIssue)
		
		let
			repo:Repo
		
		
		if (issue) {
			if (issue.repo) {
				return issue.repo
			} else if (issue.repoId) {
				const
					availRepo = availableRepos.find(it => it.id === issue.repoId)
				
				repo = getValue(() => availRepo.repo,null)
			}
		}
		
		if (!repo) {
			const
				repoId = repoIdValue.get()
			
			if (repoId) {
				repo = getValue(() => availableRepos.find(it => it.repo.id === repoId).repo)
			}
			
			if (!repo)
				repo = getValue(() => availableRepos.get(0).repo)
		}
		
		return repo
	}
	
	private get editingIssue() {
		let
			issue = getValue(() => this.viewState.editingIssue)
		
		return issue
	}
	
	/**
	 * Hide/close the window
	 */
	private hide = () => getWindowManagerClient().close(getWindowId())
	
	/**
	 * On cancel - call hide
	 */
	private onCancel = this.hide
	
	/**
	 * On save - send to actions with child window id
	 *
	 * @param event
	 */
	private onSave = async() => {
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
			log.error(`failed to save issue`, err)
			getNotificationCenter().notifyError(`Unable to save issue: ${!savingIssue ? '' : savingIssue.title}`)
			
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
			{ editingIssue } = this
		
		if (!editingIssue || (!this.viewState.ready && this.props.params.issueId !== '-1'))
			return null
		
		
		
		editingIssue = cloneObjectShallow(editingIssue, newIssueProps)
		
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
	private setMarkdownEditor = (mdEditor: MarkdownEditor) => {
		this.setState({ mdEditor })
	}
	
	
	/**
	 * Title change
	 *
	 * @param event
	 */
	onTitleChange = event => {
		const
			{ value } = event.target as any
		
		log.debug(`Title change`, value)
		
		this.setState({ titleValue: value })
	}
	
	/**
	 * Repo Change
	 *
	 * @param repo
	 */
	onRepoChange = (repo: AvailableRepo) => {
		if (repo)
			repoIdValue.set(repo.id)
		
		const
			editingIssue = new Issue(cloneObjectShallow(
				this.editingIssue,
				this.textInputState(), {
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
	
	onLabelsChanged = (newLabels: Label[]) => {
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
	getNewState(props: IIssueEditDialogProps, editingIssue: Issue = null) {
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
		
		if (!repoId) {
			editingIssue = this.updateIssueState({ repoId: availableRepos.get(0).id })
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
			bodyValue = getValue(() => this.state.bodyValue, editingIssue.body),
			titleValue = getValue(() => this.state.titleValue, editingIssue.title)
		
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
		return Object.assign(newState, {
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
		
		
		log.info(`Edit dialog mounted with params`, this.props.params, this.props.uri)
		
	}
	
	/**
	 * on form valid
	 *
	 * @param values
	 */
	private onFormValid = (values: IFormFieldValue[]) => {
		log.debug(`onValid`, values)
	}
	
	/**
	 * On form invalid
	 *
	 * @param values
	 */
	private onFormInvalid = (values: IFormFieldValue[]) => {
		log.debug(`onInvalid`, values)
	}
	
	/**
	 * On submit when the form is valid
	 *
	 * @param form
	 * @param model
	 * @param values
	 */
	private onFormValidSubmit = (form: IForm, model: any, values: IFormFieldValue[]) => {
		return this.onSave()
	}
	
	
	/**
	 * On drop event handler
	 *
	 * @param data
	 */
	onDrop = (data: DataTransfer) => {
		const
			mde = getValue(() => this.state.mdEditor)
		
		mde.onDrop(data)
	}
	
	
	render() {
		
		const
			{ styles, palette, theme, open, user, availableRepos } = this.props
		
		let
			{ ready, editingIssue, saveError, saving } = this.viewState
		
		if (!ready || !editingIssue) {
			return <div />
		}
		
		let
			titleValue = getValue(() => this.state.titleValue, editingIssue.title || ''),
			repoId = editingIssue.repoId
		
		const
			availableRepo = getValue(() => availableRepos.find(it => it.id === repoId))
		
		let
			repo = editingIssue && (editingIssue.repo || getValue(() => availableRepo.repo))
		
		log.info('ready/repo', ready, repoId, repo, editingIssue,availableRepos)
		if (!ready || !repo)
			return <div />
		
		
		const
			canAssign = canAssignIssue(repo),
			
			titleActionNodes = createSaveCancelActions(
				theme,
				palette,
				() => this.refs.form.submit(),
				this.onCancel)
		
		return <DialogRoot
			titleMode='horizontal'
			titleNode={editingIssue.id ? `editing issue #${editingIssue.number}` : `create issue`}
			subTitleNode={editingIssue.title}
			titleActionNodes={titleActionNodes}
			saving={saving}
			styles={styles.dialog}
		>
			
			<Form
				id="issue-edit-form"
				ref="form"
				submitOnCmdCtrlEnter={true}
				onInvalid={this.onFormInvalid}
				onValid={this.onFormValid}
				onValidSubmit={this.onFormValidSubmit}
				styles={[Styles.FlexColumn, Styles.FlexScale, Styles.makePaddingRem(1,0,0,0)]}>
				
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
						           autoFocus/>
					
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
						                  
						
						/>
					</div>
					<MarkdownEditor
						ref={this.setMarkdownEditor}
						autoFocus={false}
						onKeyDown={getValue(() => this.form.onKeyDown)}
						onChange={this.onMarkdownChange}
						defaultValue={getValue(() => editingIssue.body,'')}
						style={styles.form.editor}
					/>
				
				</FileDrop>
			</Form>
		</DialogRoot>
		
	}
	
}


export default IssueEditDialog