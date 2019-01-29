import * as React from "react"
import {useCallback, useEffect, useMemo, useState} from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties, remToPx} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent, StyledComponentProducer} from "renderer/components/elements/StyledComponent"
import {IIssue, IIssueEventData} from "common/models/Issue"
import {getIssueEvents} from "renderer/net/IssueAPI"
import baseStyles from "renderer/components/elements/IssueDetails.styles"
import IssueEvents from "renderer/components/elements/IssueEvents"
import IssueInfo from "renderer/components/elements/IssueInfo"
import {dataSelector, selectedIssuesSelector} from "common/store/selectors/DataSelectors"
import FocusedDiv from "renderer/components/elements/FocusedDiv"
import {useRef} from "react"
import {useCommandManager, useFocused} from "renderer/command-manager-ui"
import CommandContainerIds from "renderer/CommandContainers"
import {getValue} from "typeguard"
import IssueViewController from "renderer/controllers/IssueViewController"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"
import {makeCommandManagerAutoFocus} from "common/command-manager"
import {
  ControllerContext,
  ControllerProviderState, useController, withController
} from "renderer/controllers/Controller"

const log = getLogger(__filename)


interface P extends IThemedProperties {

}

interface SP {
  data: IIssueEventData
  issues: Array<IIssue>
}

const selectors = {
  issues: selectedIssuesSelector,
  data: dataSelector(state => state.issueData)
} as Selectors<P, SP>


export default StyledComponent<P, SP>(baseStyles, selectors, {
  extraWrappers: {
    inner: [withController<P & SP,IssueViewController>(
      props => new IssueViewController(props.issues[0] ? props.issues[0].id : -1),
      ["issues"])]
  }
})(function IssueView(props: P & SP): React.ReactElement<P & SP> {
  const
    {classes, data, issues} = props,
    issue = issues[0],
    id = CommandContainerIds.IssueView,
    [controller,setController] = useController(),
    updateController = setController,
    providerProps = [controller,updateController],
    containerRef = useRef<HTMLDivElement | null>(null),
    moveFocusRef = useRef<(increment: number) => void>(null),
    editRef = useRef<() => void>(null),
    newCommentRef = useRef<() => void>(null),
    focused = useFocused(containerRef),
    focusedId = getValue(() => controller.focusedContentId, -1),
    setFocusedId = useCallback((id: number) =>
      !controller.isEditingContent() &&
      updateController(controller.setFocusedContentId(id)),
      [controller,updateController]
    ),
    builder = useCallback(builder => builder
        .command("Enter", () => moveFocusRef.current(1), {
          overrideInput: false
        })
        .command("ArrowDown", () => moveFocusRef.current(1), {
          overrideInput: false
        })
        .command("ArrowUp", () => moveFocusRef.current(-1), {
          overrideInput: false
        })
        .command("e", () => editRef.current(), {
          overrideInput: false
        })
        .command("m", () => newCommentRef.current(), {
          overrideInput: false
        })
        .make()
    ,[]),
    {props: commandManagerProps} = useCommandManager(
      id,
      builder,
      containerRef,
      {
        autoFocus: makeCommandManagerAutoFocus(100)
      }
    )

  useEffect(() => {
    if (controller && controller.issueId !== getValue(() => issue.id)) {
      log.info("Resetting controller",controller,issue)
      updateController(controller.setIssueId(!issue ? -1 : issue.id))
    }
  }, [issue, controller])

  useEffect(() => {
    const
      contents = [issue, ...data.timeline
        .mapNotNull(activity =>
          activity.type !== "comment" ? null :
            activity.payload
        )],
      contentsLength = Math.max(contents.length - 1, 0)

    if (focused && focusedId === -1) {
      updateController(controller.setFocusedContentId(issue.id))
    }

    newCommentRef.current = () => {
      if (!controller.isEditingContent())
        updateController(controller.setNewComment())
    }

    editRef.current = () => {
      log.debug("Edit item", controller)
      if (!controller.isEditingContent()) {
        updateController(controller.setEditContentId(controller.focusedContentId))
      }
    }

    moveFocusRef.current = (increment: number) => {
      log.debug("Move focus", focused, controller, increment, contents)
      const focusedIndex = contents.findIndex(content => content.id === focusedId)
      let newIndex: number = 0
      if (increment > 0) {
        newIndex = focusedIndex + increment
      } else if (increment < 0) {
        newIndex = focusedIndex + increment
      }


      newIndex = Math.max(0, Math.min(newIndex, contentsLength))

      const newFocusedId = getValue(() => contents[newIndex].id)
      log.debug("New focused id", newFocusedId, focusedId, contents, focusedIndex)
      if (!newFocusedId || newFocusedId === focusedId) return

      const newController = controller.setFocusedContentId(newFocusedId)
      log.debug("Move focus controller update", newController, controller)
      updateController(newController)
    }
  }, [controller, focused, data, issue, issues, focusedId])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      const
        contentElementId = `issue-view-content-${focusedId}`,
        contentElement = container.querySelector(`#${contentElementId}`)

      if (!contentElement) {
        log.warn("Unable to find content element", contentElementId)
        return
      }

      const offsetTop = Math.max(0, (contentElement as any).offsetTop - remToPx(1))
      log.debug("Scrolling to ", contentElementId, " at ", offsetTop, " element ", contentElement)
      contentElement.parentElement.scrollTo({left: 0, top: offsetTop, behavior: "smooth"})
    }
  }, [focusedId])

  return <FocusedDiv
    classes={{
      root: classes.root
    }}
  >

    <div tabIndex={-1} id={id} ref={containerRef} className={classes.root} {...commandManagerProps}>


        <IssueInfo issue={issue}/>
        <IssueEvents issue={issue} data={data}/>


    </div>

  </FocusedDiv>
})
