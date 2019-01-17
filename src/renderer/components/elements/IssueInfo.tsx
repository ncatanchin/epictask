import * as React from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties, StyleDeclaration, withStatefulStyles, NestedStyles} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {IIssue} from "common/models/Issue"
import {useState} from "react"
import {getIssueEvents, IIssueEventData} from "renderer/net/IssueAPI"
import {useLayoutEffect} from "react"
import PromisedData from "renderer/components/elements/PromisedData"
import baseStyles from "renderer/components/elements/IssueDetails.styles"
import {Typography} from "@material-ui/core"
import Moment from "react-moment"
import {GithubDate} from "renderer/util/UIHelper"
import Avatar from "renderer/components/elements/Avatar"

const log = getLogger(__filename)



interface P extends IThemedProperties {
  issue: IIssue
}



export default StyledComponent(baseStyles)(function IssueInfo(props: P): React.ReactElement<P> {
    const {classes, issue,...other} = props

    return <div className={classes.info} {...other}>
      <Typography variant="h6" className="number" component="div">
        #{issue.number}
      </Typography>
      <div className="top">
        <Typography variant="h6" className="title" component="div">
          {issue.title}
        </Typography>
        <Typography variant="subtitle1" className="subtitle" component="div">
          <Avatar user={issue.user} text picture={false}/> opened this issue on <GithubDate timestamp={issue.created_at}/> - {issue.comments} comments
        </Typography>
      </div>
    </div>
  }
)
