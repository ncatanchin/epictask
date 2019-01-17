import * as React from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties, StyleDeclaration, withStatefulStyles, NestedStyles} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {IIssue} from "common/models/Issue"
import {useEffect, useState} from "react"
import {getIssueEvents, IIssueEventData} from "renderer/net/IssueAPI"
import {useLayoutEffect} from "react"
import PromisedData from "renderer/components/elements/PromisedData"
import baseStyles from "renderer/components/elements/IssueDetails.styles"
import IssueEvents from "renderer/components/elements/IssueEvents"
import IssueInfo from "renderer/components/elements/IssueInfo"

const log = getLogger(__filename)



interface P extends IThemedProperties {
  issue: IIssue
}



export default StyledComponent(baseStyles)(function IssueView(props: P): React.ReactElement<P> {
  const
    {classes, issue} = props,
    [eventsPromise, setEventsPromise] = useState<Promise<IIssueEventData>>(null)

  useEffect(() => {
    setEventsPromise(issue ? getIssueEvents(issue.id) : null)
  }, [issue])


  return <div className={classes.root}>
    <IssueInfo issue={issue}/>
    <PromisedData promise={eventsPromise} unresolvedComponent={() => <div className={classes.events}/>}>
      {(data, err) =>
        !err ?
          <IssueEvents issue={issue} data={data}/> :
          err ?
            <div>{err}</div> :
            <div>No results or error</div>
      }
    </PromisedData>
  </div>
})
