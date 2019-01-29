import * as React from "react"
import {useCallback} from "react"
import getLogger from "common/log/Logger"
import {
  FlexColumn,
  IThemedProperties,
  makeHeightConstraint,
  NestedStyles,
  PositionRelative, StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import IssueEditForm from "./IssueEditForm"
import {IDialogProps} from "renderer/models/Dialog"
import {IIssue} from "common/models/Issue"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"
import Deferred from "common/Deferred"
import {shortId} from "common/IdUtil"
import {SimpleDialogActions, uiTask} from "renderer/util/UIHelper"
import IssueEditController from "renderer/controllers/IssueEditController"
import {selectedRepoSelector} from "common/store/selectors/DataSelectors"

const log = getLogger(__filename)


function baseStyles(theme: Theme): StyleDeclaration {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: [{
      "& .dialogContent": [makeHeightConstraint("70vh"), FlexColumn, PositionRelative, {
        width: "70vw",
        maxWidth: 1280
      }]
    }]
  }
}

interface P extends IThemedProperties, IDialogProps<IIssue, IIssue> {

}

interface SP {
}


export const IssueEditDialogTitle = StyledComponent<P>(baseStyles)(function IssueEditDialogTitle(props: P & SP): React.ReactElement<P & SP> {
  const
    {dialog: {data: issue}} = props,
    isEdit = issue && issue.id > 0

  return <>
    {isEdit ? `Edit ${issue.title} #${issue.number}` : "Create issue"}
  </>
})

export const IssueEditDialogContent = StyledComponent<P>(baseStyles)(function IssueEditDialogContent(props: P & SP): React.ReactElement<P & SP> {
  const
    {classes, onDialogComplete, dialog} = props,
    {data: issue} = dialog,
    isEdit = issue && issue.id > 0,
    onClose = useCallback(() => {
      onDialogComplete()
    }, [onDialogComplete, dialog])


  return <IssueEditForm issue={issue} onClose={onClose}/>

})

export function showIssueEditDialog(issue: IIssue | null = null): void {
  const
    actions = new UIActionFactory(),
    deferred = new Deferred<boolean>()

  actions.showDialog({
    id: shortId(),
    type: !issue ? "IssueCreate" : "IssueEdit",
    deferred,
    controller: new IssueEditController(issue),
    title: (props: IDialogProps<IIssue>) => <IssueEditDialogTitle {...props} />,
    content: (props: IDialogProps<IIssue>) => <IssueEditDialogContent {...props} />,
    actions: (props: IDialogProps<IIssue,IIssue,IssueEditController>) => {
      const
        {controller, updateController} = props,
        onComplete = useCallback((result: boolean) => {
          if (!result) {
            props.onDialogComplete(null)
            return null
          }
          return uiTask(!issue ? "Creating" : "Updating", async () => {
            const repo = selectedRepoSelector(getStoreState())
            const newIssue = await controller.onSave(repo)
            props.onDialogComplete(newIssue)

          })
        }, [props.dialog, props.onDialogComplete, controller])
      log.info("Controller value", controller)
      return <SimpleDialogActions
        onComplete={onComplete}
        classes={props.dialogClasses}
        dialog={props.dialog}
        actionLabel="Save"
      />
    },
    data: issue,
    defaultResult: false
  })
}
