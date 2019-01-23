import * as CodeMirror from "codemirror"
import "codemirror/lib/codemirror.css"
import "codemirror/theme/darcula.css"
import "codemirror/mode/javascript/javascript"
import "codemirror/mode/clike/clike"
import "codemirror/mode/htmlmixed/htmlmixed"
import "codemirror/mode/gfm/gfm"
import "codemirror/mode/css/css"
import "codemirror/mode/markdown/markdown"
import "codemirror/mode/xml/xml"

import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  NestedStyles,
  rem,
  FillWidth, makePaddingRem, mergeClasses
} from "renderer/styles/ThemedStyles"

import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {useCallback, useEffect, useRef} from "react"
import {guard} from "typeguard"

const log = getLogger(__filename)


function baseStyles(theme: Theme): NestedStyles {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: [FillWidth, {

    }],
    "@global": [{
      ".CodeMirror-lines": [makePaddingRem(1,0),{

      }]
    }]
  }
}

interface P extends IThemedProperties {
  //value: string
  defaultValue: string
  autoFocus?:boolean
  onChanged:(source:string) => void
}

export default StyledComponent<P>(baseStyles)(function MarkdownEditor(props: P): React.ReactElement<P> {
  const
    {defaultValue, classes, className, onChanged,autoFocus = true,...other} = props,
    textareaRef = useRef<HTMLTextAreaElement | null>(null),
    codeMirrorRef = useRef<CodeMirror | null>(null),
    onChangedInternal = useCallback(event => {
      const newValue = event.getValue()
      log.debug("Changed event", newValue)
      guard(() => onChanged(newValue))
    },[])

  useEffect(() => {
    const container = textareaRef.current


    if (container && !codeMirrorRef.current) {
      const codeMirror = codeMirrorRef.current = CodeMirror.fromTextArea(container, {
        value: defaultValue,
        autofocus: autoFocus,
        lineWrapping: true,
        lineNumbers: true,
        mode: {
          name: "gfm",
          // tokenTypeOverrides: {
          //   emoji: "emoji"
          // }
        },
        theme: "darcula"
      })
      codeMirror.setValue(defaultValue)
      codeMirror.on("change",onChangedInternal)
    }
  },[textareaRef])

  // useEffect(() => {
  //   const
  //     codeMirror = codeMirrorRef.current
  //
  //   if (codeMirror) {
  //     codeMirror.setValue(value)
  //   }
  // },[value])

  return <div className={mergeClasses(classes.root,className)}>
    <textarea ref={textareaRef} {...other}/>
  </div>
})
