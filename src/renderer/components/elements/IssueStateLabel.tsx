import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  StyleDeclaration,
  withStatefulStyles,
  NestedStyles,
  FlexRowCenter, makePaddingRem, rem, mergeClasses
} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {IIssue} from "common/models/Issue"
import {
  GitPullRequest as PullRequestIcon,
  IssueClosed as ClosedIcon,
  IssueOpened as OpenIcon
} from "@githubprimer/octicons-react"

const
  Octicon = require("@githubprimer/octicons-react").default,
  log = getLogger(__filename)


function getColorCode(props:P):string {
  return props.variant === "contrast" ? "contrast" :
    (props.issue.pull_request ? "pr" : (props.issue.state || "open"))

}

function baseStyles(theme: Theme): NestedStyles {
  const
    {palette} = theme,
    {open, closed, pr} = palette

  return {
    root: [FlexRowCenter, makePaddingRem(0, 0.5), {
      fontSize: rem(1),
      color: (props:P) => {
        const
          code = props.variant === "contrast" ? "contrastText" : "main",
          palette = props.issue.pull_request ? pr :
            props.issue.state === "closed" ? closed :
              open

        return palette[code]
      }
    }],

  }
}

interface P extends IThemedProperties {
  variant?:"contrast" | "normal"
  issue:IIssue
}


const selectors = {}

export default StyledComponent<P>(baseStyles, selectors)(function IssueStateLabel(props: P): React.ReactElement<P> {
  const {issue,classes, variant, className, ...other} = props
  return <div className={mergeClasses(classes.root,className)} {...other}>
    <Octicon icon={issue.pull_request ? PullRequestIcon : issue.state === "closed" ? ClosedIcon : OpenIcon}/>
  </div>
})
