import * as React from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {IIssue} from "common/models/Issue"
import baseStyles from "renderer/components/elements/IssueDetails.styles"
import IssueListItem from "renderer/components/elements/IssueListItem"
import {IssueComment} from "renderer/components/elements/IssueEvents"

const log = getLogger(__filename)



interface P extends IThemedProperties {
  issue: IIssue
}



export default StyledComponent<P>(baseStyles)(function IssueInfo(props: P): React.ReactElement<P> {
    const {classes, issue,...other} = props

    return <>
      <IssueListItem issue={issue} info />
    </>
  }
)
