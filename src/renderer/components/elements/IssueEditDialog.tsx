import * as React from "react"
import {useCallback, useRef} from "react"
import getLogger from "common/log/Logger"
import {
  FlexColumn,
  IThemedProperties,
  makeHeightConstraint,
  NestedStyles,
  PositionRelative
} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {IIssueEdit} from "common/store/state/AppState"
import {appSelector} from "common/store/selectors/AppSelectors"
import Dialog from "@material-ui/core/Dialog/Dialog"
import {AppActionFactory} from "common/store/actions/AppActionFactory"
import DialogTitle from "@material-ui/core/DialogTitle/DialogTitle"
import {getValue} from "typeguard"
import DialogContent from "@material-ui/core/DialogContent/DialogContent"
import IssueEditForm from "./IssueEditForm"

const log = getLogger(__filename)


function baseStyles(theme: Theme): NestedStyles {
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

interface P extends IThemedProperties {

}

interface SP {
  editing: IIssueEdit
}


const selectors = {
  editing: appSelector(state => state.editing)
}



export default StyledComponent<P>(baseStyles, selectors)(function IssueEditDialog(props: P & SP): React.ReactElement<P & SP> {
  const
    {classes, editing} = props,
    {issue,open} = editing,

    isEdit = getValue(() => !!issue.id,false),
    onClose = useCallback(() => {
      new AppActionFactory().setEditing({open: false,issue: null})
    },[])



  return <Dialog
    maxWidth={false}
    className={classes.root}
    open={open}
    onClose={onClose}
    aria-labelledby="issue-edit-title"
  >
    <DialogTitle id="issue-edit-title">
      {isEdit ? `Edit ${issue.title} #${issue.number}` : "Create issue"}
    </DialogTitle>
    <DialogContent className="dialogContent">
      <IssueEditForm issue={issue} onClose={onClose}/>
    </DialogContent>
  </Dialog>
})
