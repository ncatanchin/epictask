import * as CodeMirror from "codemirror"
import "codemirror/lib/codemirror.css"
//import "codemirror/theme/darcula.css"
import "renderer/assets/css/darcula.css"
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
  FillWidth, makePaddingRem, mergeClasses, makePadding, PositionAbsolute, Fill, StyleDeclaration
} from "renderer/styles/ThemedStyles"

import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {useCallback, useEffect, useRef} from "react"
import {guard} from "typeguard"
import {getCommandManager} from "common/command-manager"
import {lighten} from "@material-ui/core/styles/colorManipulator"

const log = getLogger(__filename)


function baseStyles(theme: Theme): StyleDeclaration {
  const
    {palette,components:{TextField}} = theme,
    {primary, secondary} = palette,
    gutterWidth = 30

  return {
    root: [FillWidth, {

    }],
    "@global": [{
      ".CodeMirror": {
        borderRadius: theme.spacing.unit / 2,
        "&.cm-s-darcula": {
          backgroundColor: lighten(TextField.colors.bg,0.1),
        },
        "&, & *": {
          fontFamily: "FiraCode",
          fontSize: rem(1.1)
        },
        "&.CodeMirror-focused::after": [theme.focus, PositionAbsolute, Fill, {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          content: "' '",
          pointerEvents: "none"
        }],
        "& .CodeMirror-gutter": [{
          width: gutterWidth + (theme.spacing.unit / 2)
        }],
        "& .CodeMirror-linenumber": [makePadding(0),{
          width: gutterWidth
        }],

        "& .CodeMirror-linenumbers": [makePadding(0,theme.spacing.unit),{
          width: gutterWidth
        }],
        "& .CodeMirror-lines": [makePadding(theme.spacing.unit * 2, theme.spacing.unit), {
          //width: gutterWidth,
          "& .CodeMirror-gutter-wrapper": [{
            //left: `calc(-${theme.spacing.unit * 2}px - ${gutterWidth}px) !important`
          }]
        }]
      }
    }]
  }
}

interface P extends IThemedProperties {
  defaultValue: string
  autoFocus?:boolean
  onChanged:(source:string) => void
}

export default StyledComponent<P>(baseStyles)(function MarkdownEditor(props: P): React.ReactElement<P> {
  const
    {defaultValue,classes, className, onChanged,autoFocus = false,...other} = props,
    wrapperRef = useRef<HTMLDivElement | null>(null),
    textareaRef = useRef<HTMLTextAreaElement | null>(null),
    codeMirrorRef = useRef<CodeMirror | null>(null),
    onChangedInternal = useCallback(event => {
      const newValue = event.getValue()
      log.debug("Changed event", newValue)
      guard(() => onChanged(newValue))
    },[onChanged])

  useEffect(() => {
    const
      container = textareaRef.current,
      wrapper = wrapperRef.current


    if (wrapper && container && !codeMirrorRef.current) {
      log.debug("Recreating code mirror")
      const codeMirror = codeMirrorRef.current = CodeMirror.fromTextArea(container, {
        autofocus: autoFocus,
        lineWrapping: true,
        lineNumbers: true,
        mode: {
          name: "gfm"
        },
        theme: "darcula"
      })
      //codeMirror.setValue(defaultValue)
      codeMirror.on("change",onChangedInternal)
      // codeMirror.on("focus",(event) => {
      //   log.info("On focus", event, wrapper, container)
      //   if (event && wrapper && container)
      //     getCommandManager().updateFocusedContainers()
      // })
      codeMirror.on("keydown",(cm,event) => {
        getCommandManager().onKeyDown(event, true)
      })
    }
  },[wrapperRef,textareaRef])

  return <div ref={wrapperRef} className={mergeClasses(classes.root,className)}>
    <textarea ref={textareaRef} defaultValue={defaultValue} {...other}/>
  </div>
})
