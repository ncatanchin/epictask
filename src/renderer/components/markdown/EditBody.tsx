import * as React from "react"
import {useCallback, useContext, useEffect, useMemo, useRef, useState} from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  mergeClasses,
  NestedStyles, rem,
  StyleDeclaration,
  Transparent
} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {IIssue} from "common/models/Issue"
import {IComment} from "common/models/Comment"
import {getValue, guard} from "typeguard"
import MarkdownEditor from "renderer/components/markdown/MarkdownEditor"
import Button from "@material-ui/core/Button/Button"
import SaveIcon from '@material-ui/icons/Save'
import CancelIcon from '@material-ui/icons/CancelOutlined'
import {useCommandManager} from "renderer/command-manager-ui"
import {getCommandManager, CommonKeys, GlobalKeys, makeCommandManagerAutoFocus} from "common/command-manager"
import {DirtyDataContext} from "renderer/components/DirtyDataInterceptor"


const log = getLogger(__filename)

type Classes = "root" | "buttonSaveRoot" | "buttonCancelRoot" | "buttonSaveLabel" | "buttonCancelLabel"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: {},
    buttonSaveRoot: {
      borderRadius: 0
    },

    buttonCancelRoot: {
      borderRadius: 0,
      background: Transparent
    },

    buttonSaveLabel: {
      fontSize: rem(1.4),
      fontWeight: 600
    },

    buttonCancelLabel: {
      fontSize: rem(1.4),
      fontWeight: 400
    }
  }
}

export type BodyType = "comment" | "newComment" | "issue"

interface P extends IThemedProperties<Classes> {
  issue: IIssue
  type: BodyType
  object: Partial<IIssue> | Partial<IComment>
  objectId: number
  onSave: (type:BodyType, issue: IIssue, object:Partial<IIssue> | Partial<IComment>, objectId:number,source:string) => void
  onCancel: () => void
  onDirty?: (dirty:boolean) => void
}


export default StyledComponent<P>(baseStyles)(function EditBody(props: P): React.ReactElement<P> {
  const
    dirtyDataContext = useContext(DirtyDataContext),
    {classes,className,issue, onDirty:onDirtyCallback, onSave,onCancel,type,object,objectId} = props,
    [dirty, setDirty] = useState<boolean>(false),
    containerRef = useRef<HTMLDivElement | null>(null),
    defaultSourceValue = getValue(() => object.body, ""),
    [source, setSource] = useState<string | null>(defaultSourceValue),
    id = `issue-edit-body-${objectId}`

  useEffect(() => {
    log.info("Updating", source, defaultSourceValue, objectId)
    const newDirty = source !== defaultSourceValue
    setDirty(newDirty)
    guard(() => onDirtyCallback(newDirty))
  },[source,objectId])

  const
    onChanged = useCallback((newSource:string):void => {
      setSource(newSource)
    },[source]),
    onSaveInternal = useCallback(():void => {
      onSave(type,issue,object,objectId,source)
    },[source,onSave,issue,object,objectId]),
    onSaveInternalRef = useRef<() => void>(onSaveInternal),
    resetDirtyRef = useRef<() => void>(null),
    {props: commandManagerProps} = useCommandManager(
      id,
      useMemo(() => builder => builder
        .command(GlobalKeys[CommonKeys.Escape], () => {
          log.info("Escape - reset")
          resetDirtyRef.current()
        }, {
          overrideInput: true
        })
        .command("CommandOrControl+Enter", () => onSaveInternalRef.current(), {
          overrideInput: true
        })
        .make()
      ,[]),
      containerRef,
      {
        autoFocus: makeCommandManagerAutoFocus(100)
      }
    )


  useEffect(() => {
    onSaveInternalRef.current = onSaveInternal
    resetDirtyRef.current = () => {
      log.info("Starting reset")
      dirtyDataContext.reset()
      // const container = getCommandManager().focusedContainers()[0]
      // if (container) {
      //   log.info("Blurring", container,container.element)
      //   $((container.element as HTMLElement)).blur()
      // }
    }//() => dirtyDataContext.reset() () => {
  }, [source,onSave,issue,object,objectId,onSaveInternal,dirtyDataContext])

  return <div id={id} ref={containerRef} className={mergeClasses(classes.root,"editor",className)}>

    <MarkdownEditor
      className="markdown"
      defaultValue={defaultSourceValue}
      onChanged={onChanged}
      autoFocus
    />

    <div className="controls">
      <div className="note">{dirty ? "Unsaved changes" : "No changes"}</div>
      <div className="buttons">
        <Button
          variant="text"
          size="small"
          className="button"
          classes={{
            root: classes.buttonCancelRoot,
            label: classes.buttonCancelLabel
          }}
          onClick={onCancel}
        >
          {/*<CancelIcon className={mergeClasses("iconLeft", "iconSmall")} />*/}
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          className="button"
          disabled={!dirty}
          classes={{
            root: classes.buttonSaveRoot,
            label: classes.buttonSaveLabel
          }}
          onClick={onSaveInternal}
        >
          {/*<SaveIcon className={mergeClasses("iconLeft", "iconSmall")} />*/}
          Save
        </Button>
      </div>
    </div>
  </div>
})
