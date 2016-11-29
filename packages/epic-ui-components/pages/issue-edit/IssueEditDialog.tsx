/**
 * Created by jglanz on 6/14/16.
 */
// Imports
import { createStructuredSelector } from "reselect"
import { List } from "immutable"
import { connect } from "react-redux"
import { Issue, AvailableRepo, Repo, User, Label } from "epic-models"
import { LabelFieldEditor, MilestoneSelect, AssigneeSelect, MarkdownEditor } from "epic-ui-components/fields"
import { Icon, RepoLabel, getGithubErrorText, FileDrop, PureRender } from "epic-ui-components/common"
import { DialogRoot, createSaveCancelActions } from "epic-ui-components/layout/dialog"
import { MenuItem, SelectField, TextField } from "material-ui"
import { getValue, canAssignIssue, canCreateIssue, cloneObjectShallow } from "epic-global"
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
		
		
		input: [ {
			padding: '0.3rem 1rem',
			fontWeight: 400,
			
			floatingLabel: [ {
				left: rem(1)
			} ],
			
			floatingLabelFocus: [ {
				transform: 'perspective(1px) scale(0.75) translate3d(-10px, -20px, 0px)'
			} ],
			
			underlineFocus: [ {
				width: 'auto',
				left: 10,
				right: 10
			} ]
			
		} ],
		
		
		form: [ FlexScale, FlexColumn, FillWidth, {
			
			title: [ {
				flex: '1 0 50%',
				padding: "1rem 0",
				height: 50,
				marginBottom: rem(2.2)
			} ],
			
			repo: [ FlexScale, {
				height: 50,
				margin: "1.1rem 0 1.1rem 0.5rem",
				padding: "1rem 0",
				menu: [ {
					transform: 'translate(0,-30%)'
				} ],
				list: [ {
					padding: '0 0 0 0 !important'
				} ],
				item: [ FlexRow, makeFlexAlign('center', 'flex-start'), {
					label: [ FlexScale, Ellipsis, {
						fontSize: makeThemeFontSize(1.2),
						padding: '0 0 0 1rem'
					} ]
				} ]
			} ],
			
			
			milestone: [ FlexScale, {
				height: 50,
				margin: "1.1rem 0 1.1rem 0.5rem",
				padding: "1rem 0",
				menu: [ {
					transform: 'translate(0,-30%)'
				} ],
				list: [ {
					padding: '0 0 0 0 !important'
				} ],
				item: [ FlexRow, makeFlexAlign('center', 'flex-start'), {
					label: [ FlexScale, Ellipsis, {
						fontSize: makeThemeFontSize(1),
						padding: '0 0 0 1rem'
					} ]
				} ]
			} ],
			
			assignee: [ FlexScale, {
				height: 50,
				margin: "1.1rem 0 1.1rem 0rem",
				padding: "1rem 0",
				menu: [ {
					transform: 'translate(0,-30%)'
				} ],
				list: [ {
					padding: '0 0 0 0 !important'
				} ],
				item: [ FlexRow, makeFlexAlign('center', 'flex-start'), {
					label: [ FlexScale, Ellipsis, {
						padding: '0 0 0 1rem'
					} ]
				} ],
				
				avatar: [ FlexRow, makeFlexAlign('center', 'flex-start'), {
					label: {
						fontWeight: 500,
					},
					avatar: {
						height: 22,
						width: 22,
					}
					
				} ]
			} ],
			
			row1: [ ...rowStyle, { overflow: 'visible' } ],
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
	
	
	
	
	commandItems = (builder:CommandContainerBuilder) =>
		builder
			.command(CommandType.Container,
				'Save Comment',
				(cmd, event) => this.onSave(event),
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
	private onSave = async (event) => {
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
		
		
		this.viewController.setEditingIssue(
			cloneObjectShallow(editingIssue,newIssueProps)
		)
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
	 * @param value
	 */
	onTitleChange = (event, value) => {
		log.debug(`Title change`,value)
		this.setState({ titleValue: value })
	}
	
	/**
	 * Repo Change
	 *
	 * @param event
	 * @param index
	 * @param value
	 */
	onRepoChange = (event, index, value) => {
		const
			editingIssue = new Issue(cloneObjectShallow(
				this.editingIssue || new Issue(),
				this.textInputState(),{
					repoId: value
				}
			))
		
		this.viewController.setEditingIssue(editingIssue)
		
		//getIssueActions().setEditingIssue(editingIssue)
	}
	
	onMilestoneChange = (milestone) => {
		this.updateIssueState({ milestone })
		
	}
	
	onAssigneeChange = (assignee) => {
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
	 * Create repo menu items
	 *
	 * @param availableRepos
	 * @param s
	 * @returns {any[]}
	 */
	makeRepoMenuItems(availableRepos:List<AvailableRepo>, s) {
		
		const makeRepoLabel = (availRepoItem) => (
			<div style={s.form.repo.item}>
				<Icon iconSet='octicon' iconName='repo'/>
				<RepoLabel repo={availRepoItem.repo} style={s.form.repo.item.label}/>
			
			</div>
		)
		
		return availableRepos.map(availRepoItem => (
			<MenuItem key={availRepoItem.id}
			          className='issueEditDialogFormMenuItem'
			          value={availRepoItem.id}
			          style={s.menuItem}
			          primaryText={makeRepoLabel(availRepoItem)}
			/>
		))
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
				styles,
				open
			} = props
			
		if (!editingIssue)
			editingIssue = this.editingIssue
		
		let
			{ availableRepos } = props
			//repo = availableRepos.find()
		
		const
			repoId = editingIssue && editingIssue.repoId,
			newState = {
				repoMenuItems: this.makeRepoMenuItems(availableRepos, styles)
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
			bodyValue = getValue(() => this.state.bodyValue,_.get(editingIssue, 'body', '')),
			titleValue = getValue(() => this.state.titleValue)
		
		if (!bodyValue || !bodyValue.length)
			bodyValue = _.get(editingIssue, 'body', '')
		
		if (!titleValue || !titleValue.length)
			titleValue = _.get(editingIssue, 'title', '')
				
		
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
			editingIssue = this.editingIssue
		
		const
			availableRepo = getValue(() => availableRepos.find(it => it.id === editingIssue.repoId))
		
		let
			repo = editingIssue && (editingIssue.repo || getValue(() => availableRepo.repo))
		
		log.info('ready/repo',ready,repo,editingIssue)
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
			
			titleActionNodes = createSaveCancelActions(theme, palette, this.onSave, this.onCancel)
		
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
				
				
				<FileDrop onFilesDropped={this.onDrop}
				          acceptedTypes={[/image/]}
				          dropEffect='all'
				          style={styles.form}>
					
					<div style={styles.form.row1}>
						<TextField value={this.state.titleValue || ''}
						           onChange={this.onTitleChange}
						           errorStyle={{transform: 'translate(0,1rem)'}}
						           errorText={getGithubErrorText(saveError,'title')}
						           hintText="TITLE"
						           hintStyle={makeStyle(styles.input.hint,{transform: 'translate(1.3rem,0rem)'})}
						           style={styles.form.title}
						           inputStyle={styles.input}
						           underlineStyle={styles.input.underlineDisabled}
						           underlineDisabledStyle={styles.input.underlineDisabled}
						           underlineFocusStyle={styles.input.underlineFocus}
						           underlineShow={true}
						           fullWidth={true}
						           
						           autoFocus/>
						
					</div>
					<div style={styles.form.row2}>
						{/* REPO */}
						{!editingIssue.id &&
						
						<SelectField value={editingIssue.repoId}
						             style={makeStyle(styles.form.repo,styles.menu)}
						             inputStyle={styles.input}
						             labelStyle={styles.form.repo.item.label}
						             iconStyle={styles.menu}
						             onChange={this.onRepoChange}
						             underlineStyle={styles.input.underlineDisabled}
						             underlineDisabledStyle={styles.input.underlineDisabled}
						             underlineFocusStyle={styles.input.underlineFocus}
						             menuListStyle={makeStyle(styles.select.list)}
						             menuStyle={makeStyle(styles.menu,styles.form.repo.menu)}
						             underlineShow={true}
						             fullWidth={true}
						>
							
							{this.state.repoMenuItems}
						</SelectField>
						}
						{/* Only show assignee drop down if push permission */}
						{canAssign &&
						<AssigneeSelect
							style={makeStyle(styles.form.assignee,styles.menu)}
							assignee={editingIssue.assignee}
							repoId={editingIssue.repoId}
							underlineShow={true}
							onSelect={this.onAssigneeChange}/>
						}
						
						
						{/* MILESTONE */}
						<MilestoneSelect
							style={makeStyle(styles.form.milestone,styles.menu)}
							styles={{
								label: {
									paddingTop: 0
								},
								labelChip:{
									height: rem(2),
									text: {
										fontSize: rem(1.2)
									}
								}
							}}
							milestone={editingIssue.milestone}
							repoId={editingIssue.repoId}
							iconStyle={{top:8,right:-14}}
							underlineShow={true}
							onSelect={this.onMilestoneChange}
						/>
					
					
					</div>
					
					<LabelFieldEditor labels={editingIssue.labels || []}
					                  id="issueEditDialogLabels"
					                  hint="Labels"
					             
					                  style={{marginBottom: rem(1.5)}}
					                  availableLabels={availableRepo.labels || []}
					                  onLabelsChanged={this.onLabelsChanged}
					                  onKeyDown={(event) => {
					                  	getCommandManager().handleKeyDown(event as any,true)
					                  }}
					                  
					/>
					
					<MarkdownEditor
						ref={this.setMarkdownEditor}
						autoFocus={false}
						onKeyDown={(event) => getCommandManager().handleKeyDown(event as any,true)}
						onChange={this.onMarkdownChange}
						
						defaultValue={_.get(editingIssue,'body','')}
						style={styles.form.editor}
					/>
				
				</FileDrop>
			
			</DialogRoot>
		</CommandRoot>
	}
	
}


export default IssueEditDialog