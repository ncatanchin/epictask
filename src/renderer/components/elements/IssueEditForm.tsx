import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  StyleDeclaration,
  withStatefulStyles,
  NestedStyles,
  mergeClasses,
  FlexColumnCenter,
  FlexAuto,
  rem,
  FlexScale,
  FlexRowCenter,
  Ellipsis,
  makePaddingRem,
  PositionRelative,
  FillWidth, FlexColumn, makeWidthConstraint, FlexRow, OverflowHidden, Fill, makeHeightConstraint, PositionAbsolute
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {IIssue, IIssueEventData} from "common/models/Issue"
import {ICollaborator, IRepo} from "common/models/Repo"
import {dataSelector, selectedRepoSelector} from "common/store/selectors/DataSelectors"
import MarkdownEditor from "renderer/components/markdown/MarkdownEditor"
import {useContext, useEffect, useMemo, useState} from "react"
import {getValue, guard} from "typeguard"
import {IssuesUpdateParams} from "@octokit/rest"
import {useCallback} from "react"
import * as _ from 'lodash'
import {ILabel} from "common/models/Label"
import TextField from "./TextField"
import Collaborators from "renderer/components/elements/Collaborators"
import Milestone from "renderer/components/elements/Milestone"
import {IMilestone} from "common/models/Milestone"
import {IDataSet} from "common/Types"
import Labels from "renderer/components/elements/Labels"
import Button from "@material-ui/core/Button/Button"
import SaveIcon from '@material-ui/icons/Save'
import CancelIcon from '@material-ui/icons/CancelOutlined'
import {createIssue, patchIssue} from "renderer/net/IssueAPI"
import {useCommandManager} from "renderer/command-manager-ui"
import {makeCommandManagerAutoFocus} from "common/command-manager"
import {useRef} from "react"
import CommonElementIds from "renderer/CommonElements"
import MUITextField from "@material-ui/core/TextField/TextField"
import IssueEditController, {IssueEditContext} from "renderer/controllers/IssueEditController"
import {useController, withController} from "renderer/controllers/Controller"
import {uiTask} from "renderer/util/UIHelper"

const log = getLogger(__filename)

type Classes = "root" | "title" | "labels"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: [FlexScale,FlexColumn, FillWidth, PositionRelative, {
      "& > .controls": [FlexRowCenter, makePaddingRem(1),{
        "& > .note": [FlexScale, Ellipsis,makePaddingRem(0,1,0,0)],
        "& > .buttons": [{
          "& > .button": [{
            "& .iconLeft": [{
              marginRight: theme.spacing.unit
            }],
            "& .iconSmall": [{
              fontSize: rem(1.6)
            }]
          }]
        }]
      }],
      "& > .row": [FlexAuto, FlexRowCenter, PositionRelative,FillWidth,{
        //maxHeight: rem(8),
        "&.body": [FlexScale, FlexColumn,PositionRelative,{
          //maxHeight: "30vh",
          overflowY: 'auto',
          overflowX: 'hidden',
          "& .body, & .CodeMirror": [FlexScale, FillWidth, Fill, PositionRelative, {
            //fontSize: rem(2)
          }],
        }],

        "&.padding": [makePaddingRem(1, 0)],
        "& .collaborators": [FlexAuto],
        "& .milestone": [FlexAuto, makePaddingRem(0, 1, 0, 0)]
      }]
    }],
    title: [FlexScale,FlexRow,FillWidth],
    labels: [FlexScale, PositionRelative, makePaddingRem(0, 1, 0, 0)],

  }
}

interface P extends IThemedProperties<Classes> {
  onClose?: (() => void) | null
  issue?: IIssue | null
}

interface SP {
  repo: IRepo
  data: IIssueEventData
  milestones: IDataSet<IMilestone>
  labels: IDataSet<ILabel>
  collaborators: IDataSet<ICollaborator>
}

const selectors = {
  repo: selectedRepoSelector,
  data: dataSelector(state => state.issueData),
  milestones: dataSelector(state => state.milestones),
  labels: dataSelector(state => state.labels),
  collaborators: dataSelector(state => state.collaborators)
}

export default StyledComponent<P>(baseStyles, selectors)(function IssueEditForm(props: P & SP): React.ReactElement<P & SP> {
  const
    {id = CommonElementIds.IssueEditForm, classes, onClose, issue, repo, labels, milestones, collaborators, data,...other} = props,
    [controller,updateController] = useController<IssueEditController>(),
    setIssuePatch = useCallback(
      (patchFn:((patch:Partial<IssuesUpdateParams>) => Partial<IssuesUpdateParams>)) => {
        updateController(oldController => {
          const newController = oldController.setPatch(patchFn)
          log.info("Patching issue on controller", controller, oldController, newController)
          return newController
        })
      }
      ,[controller,updateController]),
    defaultBody = useMemo<string>(() => controller && controller.defaultBody,[controller]),
    issuePatch = controller.patch,
    isDirty = useMemo<boolean>(() => controller && !_.isEqual(controller.defaultPatch, issuePatch),[controller]),
    makeSelectedLabels = useCallback(
      (): Array<ILabel> =>
        getValue(() =>
          issuePatch.labels
            .map(name => labels.data.find(label => label.name === name))
            .filter(label => !!label), [])
    ,[controller]),
    [selectedLabels, setSelectedLabels] = useState<Array<ILabel>>(makeSelectedLabels()),
    isEdit = !!issue && (issue.id > 0),
    formRef = useRef<HTMLFormElement | null>(null)
    // ,
    // {props:commandManagerProps} = useCommandManager(id,builder => builder.make(),formRef,{autoFocus: makeCommandManagerAutoFocus(100)})

  const
    onBodyChanged = useCallback((body: string): void => {
      setIssuePatch(issuePatch => ({...issuePatch, body}))
    }, [setIssuePatch]),
    onTitleChanged = useCallback(event => {
      const title = getValue(() => event.target.value)


      setIssuePatch(issuePatch => ({...issuePatch, title: title || ""}))
    }, [setIssuePatch]),
    onCollaboratorsSelected = useCallback((collaborators: Array<ICollaborator>) => {
      setIssuePatch(issuePatch => ({
        ...issuePatch,
        assignee: getValue(() => collaborators[0].login, null),
        assignees: getValue(() => collaborators.map(collab => collab.login), [])
      }))
    }, [setIssuePatch]),
    onLabelsSelected = useCallback((labels: Array<ILabel>) => {
      setIssuePatch(issuePatch => ({
        ...issuePatch,
        labels: getValue(() => labels.map(label => label.name), [])
      }))
    }, [setIssuePatch]),
    onMilestoneSelected = useCallback((milestone: IMilestone | null) => {
      setIssuePatch(issuePatch => ({
        ...issuePatch,
        milestone: getValue(() => milestone.number, null)
      }))
    }, [setIssuePatch]),
    onCancel = useCallback((): void => {
      guard(() => onClose())
    }, []),
    onSave = useCallback((): Promise<void> =>
      uiTask("Saving Issue", async () => {
        await controller.onSave(repo)
        guard(() => onClose())
      })
    , [repo,defaultBody, issuePatch, controller])


  return controller && issuePatch && <form id={id} ref={formRef} className={classes.root} onSubmit={onSave} {...other}>
    <div className="row padding">
      <TextField
        autoFocus
        value={issuePatch && issuePatch.title}
        onChange={onTitleChanged}
        placeholder="Issue title"
        classes={{
          root: classes.title,
          // inputRoot: classes.titleInputRoot,
          // input: classes.titleInput
        }}
      />
    </div>

    <div className="row padding">
      <div className={classes.labels}>
        <Labels
          id={`issue-${getValue(() => issue.id, 0)}-labels`}
          editable
          labels={selectedLabels}
          onChanged={onLabelsSelected}
        />
      </div>
      <Milestone
        id={`issue-${getValue(() => issue.id, 0)}-milestone`}
        className="milestone"
        milestone={milestones.data.find(milestone => milestone.number === issuePatch.milestone)}
        onSelected={onMilestoneSelected}
      />
      <Collaborators
        id={`issue-${getValue(() => issue.id, 0)}-collaborators`}
        className="collaborators"
        issue={issue}
        onSelected={onCollaboratorsSelected}
      />
    </div>
    <div className="row body">
      <MarkdownEditor
        className="body"
        defaultValue={defaultBody}
        onChanged={onBodyChanged}
      />
    </div>
    {/*<div className="row controls">*/}
      {/*<div className="note">{dirty ? "Unsaved changes" : "No changes"}</div>*/}
      {/*<div className="buttons">*/}
        {/*<Button variant="text" size="small" className="button" onClick={onCancel}>*/}
          {/*<CancelIcon className={mergeClasses("iconLeft", "iconSmall")}/>*/}
          {/*Cancel*/}
        {/*</Button>*/}
        {/*<Button variant="contained" size="small" className="button" disabled={!dirty} onClick={onSave}>*/}
          {/*<SaveIcon className={mergeClasses("iconLeft", "iconSmall")}/>*/}
          {/*Save*/}
        {/*</Button>*/}
      {/*</div>*/}
    {/*</div>*/}
  </form>
})
