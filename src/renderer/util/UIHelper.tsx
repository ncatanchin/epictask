import getLogger from "common/log/Logger"
import {isPromise} from "typeguard"
import * as moment from "moment"
import {IThemedProperties} from "renderer/styles/ThemedStyles"
import * as React from "react"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"
import Deferred from "common/Deferred"
import {shortId} from "common/IdUtil"
import {IDialog, IDialogProps} from "renderer/models/Dialog"
import {useCallback} from "react"
import Button from "@material-ui/core/Button/Button"
import Typography from "@material-ui/core/Typography/Typography"
import {AppActionFactory} from "common/store/actions/AppActionFactory"
import {makeBlockingWork} from "common/util/AppStatusHelper"
const log = getLogger(__filename)


export function uiTask<T>(description:string, fn: () => T | Promise<T>):Promise<T | null> {

  const process = async ():Promise<T | null> => {
    const
      ongoingWork = _.last(getStoreState().AppState.status.blockingWork),
      actions = new AppActionFactory()
    if (ongoingWork && !ongoingWork.deferred.isSettled()) {
      await ongoingWork.deferred.promise
    }
    const blockingWork = makeBlockingWork(description)

    try {
      actions.updateAppStatus(state => ({
        blockingWork:[blockingWork,...state.status.blockingWork]
      }))
      const result = fn() as any
      if (isPromise(result)) {
        await result
        //result.catch(err => log.error("A UI action (promise) had an error", err))
      }
      return result
    } catch (err) {
      log.error("A UI action had an error", err)
      return null
    } finally {
      if (!blockingWork.deferred.isSettled()) {
        log.warn("Unresolved blocking work", blockingWork)
        blockingWork.deferred.resolve(null)
      }

      actions.updateAppStatus(state => ({
        blockingWork:[...state.status.blockingWork.filter(it => it.id !== blockingWork.id)]
      }))
    }
  }

  return process()
}


export function uiGithubDate(timestamp:string | number):string {

  const ts = moment(timestamp)
  return (Date.now() - ts.valueOf() < 24 * 60 * 60 * 1000) ?
    ts.fromNow() :
    ts.format("MMM D, YYYY")
}

interface GithubDateProps extends IThemedProperties {
  timestamp:string | number
  component?: string | null
}

export function GithubDate(props:GithubDateProps):React.ReactElement<Partial<GithubDateProps>> {
  const {component = "span", timestamp, ...other} = props

  return React.createElement(component, other,uiGithubDate(timestamp))
}

export async function confirmDialog(content:string, title:string = "Confirm"):Promise<boolean> {
  const
    actions = new UIActionFactory(),
    deferred = new Deferred<boolean>()

  actions.showDialog({
    id: shortId(),
    type: "Confirm",
    variant: "xs",
    deferred,
    title,
    content: (props:IDialogProps<boolean>) =>
      <div className={props.dialogClasses.textContent}>
        <Typography variant="h2">{content}</Typography>
      </div>,
    actions: (props:IDialogProps<boolean>) => <SimpleDialogActions
      onComplete={props.onDialogComplete}
      classes={props.dialogClasses}
      dialog={props.dialog}
      actionLabel="Confirm"
    />,
    defaultResult: false
  })

  return await deferred.promise
}

interface SimpleDialogActionsProps<T = any> {
  onComplete: (result: T) => void
  dialog: IDialog<T>
  classes: any
  cancelLabel?: string
  actionLabel: string
}


export function SimpleDialogActions({onComplete, classes, dialog, cancelLabel = "Cancel", actionLabel}: SimpleDialogActionsProps): React.ReactElement<SimpleDialogActionsProps> {
  const
    onAction = useCallback(() => onComplete(true), [dialog,onComplete]),
    onCancel = useCallback(() => onComplete(false), [dialog,onComplete])

  return <>
    <Button
      onClick={onCancel}
      classes={{
        root: classes.actionsButtonCancelRoot,
        label: classes.actionsButtonCancelLabel
      }}
      variant="contained"
      color="primary"
    >
      {cancelLabel}
    </Button>
    <Button
      onClick={onAction}
      color="secondary"
      variant="contained"
      classes={{
        root: classes.actionsButtonRoot,
        label: classes.actionsButtonLabel
      }}
    >
      {actionLabel}
    </Button>
  </>
}

