import * as React from "react"
import {useCallback, useEffect, useState} from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {IIssue, IIssueEventData} from "common/models/Issue"
import {getIssueEvents} from "renderer/net/IssueAPI"
import baseStyles from "renderer/components/elements/IssueDetails.styles"
import IssueEvents from "renderer/components/elements/IssueEvents"
import IssueInfo from "renderer/components/elements/IssueInfo"
import {dataSelector, selectedIssuesSelector} from "common/store/selectors/DataSelectors"
import FocusedDiv from "renderer/components/elements/FocusedDiv"
import {useRef} from "react"
import {useCommandManager} from "renderer/command-manager-ui"
import CommandContainerIds from "renderer/CommandContainers"
import {FocusedTimelineIdContext} from "renderer/components/elements/IssueViewContext"
import {IComment} from "common/models/Comment"
import {getValue} from "typeguard"

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
}


export default StyledComponent<P, SP>(baseStyles, selectors)(function IssueView(props: P & SP): React.ReactElement<P & SP> {
  const
    {classes, data, issues} = props,
    issue = issues[0],
    id = CommandContainerIds.IssueView,
    containerRef = useRef<HTMLDivElement | null>(null),
    [focusedId, setFocusedId] = useState<number>(issue.id),
    moveFocus = useRef<(increment: number) => void>(null),
    {props: commandManagerProps} = useCommandManager(
      id,
      builder => {
        return builder
          .command("ArrowDown", () => moveFocus.current(1), {
            overrideInput: false
          })
          .command("ArrowUp", () => moveFocus.current(-1), {
            overrideInput: false
          })
          .make()
      },
      containerRef
    )

  useEffect(() => {
    const
      contents = [issue, ...data.timeline
        .mapNotNull(activity =>
          activity.type !== "comment" ? null :
            activity.payload
        )],
      contentsLength = Math.max(contents.length - 1, 0)

    moveFocus.current = (increment: number) => {
      const focusedIndex = contents.findIndex(content => content.id === focusedId)
      let newIndex: number = 0
      if (increment > 0) {
        newIndex = focusedIndex + increment
      } else if (increment < 0) {
        newIndex = focusedIndex + increment
      }


      newIndex = Math.max(0, Math.min(newIndex, contentsLength))

      const newFocusedId = getValue(() => contents[newIndex].id)
      log.info("New focused id", newFocusedId, focusedId, contents, focusedIndex)
      if (!newFocusedId || newFocusedId === focusedId) return

      setFocusedId(newFocusedId)
      const container = containerRef.current
      if (container) {
        const
          contentElementId = `issue-view-content-${newFocusedId}`,
          contentElement = container.querySelector(`#${contentElementId}`)

        if (!contentElement) {
          log.warn("Unable to find content element", contentElementId)
          return
        }

        log.info("Scrolling to ", contentElementId, " at ", contentElement.scrollTop, " element ", contentElement)
        contentElement.parentElement.scrollTo(0, contentElement.scrollTop)

      }
    }
  }, [data, issues, focusedId])

  useEffect(() => {
    setFocusedId(getValue(() => issue.id, 0))
  }, [data.timeline.length, issue])

  log.info("View", focusedId, moveFocus,containerRef)

  return <FocusedDiv
    classes={{
      root: classes.root
    }}
  >
    <FocusedTimelineIdContext.Provider value={focusedId}>
      <div tabIndex={-1} id={id} ref={containerRef} className={classes.root} {...commandManagerProps}>
        <IssueInfo issue={issue}/>
        <IssueEvents issue={issue} data={data}/>
      </div>
    </FocusedTimelineIdContext.Provider>
  </FocusedDiv>
})
