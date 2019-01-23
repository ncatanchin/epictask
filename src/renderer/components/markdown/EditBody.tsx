import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  StyleDeclaration,
  withStatefulStyles,
  NestedStyles,
  mergeClasses
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {IIssue} from "common/models/Issue"
import {IComment} from "common/models/Comment"
import {useCallback} from "react"
import {useState} from "react"
import {getValue} from "typeguard"
import {useEffect} from "react"
import MarkdownEditor from "renderer/components/markdown/MarkdownEditor"
import Button from "@material-ui/core/Button/Button"
import SaveIcon from '@material-ui/icons/Save'
import CancelIcon from '@material-ui/icons/CancelOutlined'

const log = getLogger(__filename)


function baseStyles(theme: Theme): NestedStyles {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: []
  }
}

export type BodyType = "comment" | "issue"

interface P extends IThemedProperties {
  issue: IIssue
  type: BodyType
  object: Partial<IIssue> | Partial<IComment>
  objectId: number
  onSave: (type:BodyType, issue: IIssue, object:Partial<IIssue> | Partial<IComment>, objectId:number,source:string) => void
  onCancel: () => void
}


export default StyledComponent<P>(baseStyles)(function EditBody(props: P): React.ReactElement<P> {
  const
    {classes,className,issue, onSave,onCancel,type,object,objectId} = props,
    [dirty, setDirty] = useState<boolean>(false),

    defaultSourceValue = getValue(() => object.body, "No content provided"),
    [source, setSource] = useState<string | null>(defaultSourceValue)

  useEffect(() => {
    if (source === defaultSourceValue) return
    setSource(defaultSourceValue)
    setDirty(false)
  },[`${issue.id}-${getValue(() => objectId)}`])

  useEffect(() => {
    setDirty(source !== defaultSourceValue)
  },[source])

  const
    onChanged = useCallback((newSource:string):void => {
      setSource(newSource)
    },[source]),
    onSaveInternal = useCallback(():void => {
      onSave(type,issue,object,objectId,source)
    },[source,onSave])

  return <div className={mergeClasses(classes.root,"editor",className)}>

    <MarkdownEditor
      className="markdown"
      defaultValue={defaultSourceValue}
      onChanged={onChanged}
      autoFocus
    />

    <div className="controls">
      <div className="note">{dirty ? "Unsaved changes" : "No changes"}</div>
      <div className="buttons">
        <Button variant="text" size="small" className="button" onClick={onCancel}>
          <CancelIcon className={mergeClasses("iconLeft", "iconSmall")} />
          Cancel
        </Button>
        <Button variant="contained" size="small" className="button" disabled={!dirty}  onClick={onSaveInternal}>
          <SaveIcon className={mergeClasses("iconLeft", "iconSmall")} />
          Save
        </Button>
      </div>
    </div>
  </div>
})
