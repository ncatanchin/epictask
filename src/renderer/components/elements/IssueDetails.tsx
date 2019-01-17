import * as React from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {IIssue} from "common/models/Issue"
import {selectedIssuesSelector} from "common/store/selectors/DataSelectors"
import baseStyles from "renderer/components/elements/IssueDetails.styles"
import IssueView from "renderer/components/elements/IssueView"

const log = getLogger(__filename)




interface DetailsProps extends IThemedProperties {
  issues?: Array<IIssue>
}

const selectors = {
  issues: selectedIssuesSelector
}

export default StyledComponent(baseStyles, selectors)(function IssueDetails(props: DetailsProps): React.ReactElement<DetailsProps> {
  const {classes, issues = [], ...other} = props
  return !issues.length ? <NoSelectedIssues classes={classes}/> :
    issues.length === 1 ?
      <IssueView classes={classes} issue={issues[0]} {...other} />

      : <div/>
})


function NoSelectedIssues({classes}:IThemedProperties):React.ReactElement<IThemedProperties> {
  return <div className={classes.root}>
    <div className={classes.none}>No issue(s) selected</div>
  </div>
}


