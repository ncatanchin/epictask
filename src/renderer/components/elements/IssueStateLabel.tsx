import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  StyleDeclaration,
  withStatefulStyles,
  NestedStyles,
  FlexRowCenter, makePaddingRem, rem, mergeClasses, makeTransition, Transparent, makeDimensionConstraints
} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {IIssue} from "common/models/Issue"
import {
  GitPullRequest as PullRequestIcon,
  IssueClosed as ClosedIcon,
  IssueOpened as OpenIcon
} from "@githubprimer/octicons-react"
import ReactHoverObserver from "react-hover-observer"
import {hasEditPermission} from "common/Security"
import {useMemo} from "react"
import {uiTask} from "renderer/util/UIHelper"
import {IssuesUpdateParams} from "@octokit/rest"
import {patchIssue} from "renderer/net/IssueAPI"

const
  Octicon = require("@githubprimer/octicons-react").default,
  log = getLogger(__filename)


function getColorCode(props:P):string {
  return props.variant === "contrast" ? "contrast" :
    (props.issue.pull_request ? "pr" : (props.issue.state || "open"))

}

function baseStyles(theme: Theme): StyleDeclaration {
  const
    {palette} = theme,
    {open, closed, pr} = palette

  return {
    root: [makeTransition(["all"],300),FlexRowCenter, makeDimensionConstraints(rem(2)),makePaddingRem(0, 0.5), {
      fontSize: rem(1),
      borderRadius: rem(1),
      backgroundColor: Transparent,
      color: (props:P) => {
        const
          code = props.variant === "contrast" ? "contrastText" : "main",
          palette = props.issue.pull_request ? pr :
            props.issue.state === "closed" ? closed :
              open

        return palette[code]
      },
      transform: "scale(1,1)",
      "&.editable.issue.hover": [{
        color: (props:P) => {
          const
            code = props.variant === "contrast" ?  "main" : "contrastText",
            palette = props.issue.state === "closed" ? open : closed

          return palette[code]
        },
        backgroundColor: (props:P) => {
          const
            code = props.variant === "contrast" ? "contrastText" : "main",
            palette = props.issue.state === "closed" ? closed : open

          return palette[code]
        },
        transform: "scale(1.1,1.1)"
      }]
    }],

  }
}

interface P extends IThemedProperties {
  variant?:"contrast" | "normal"
  issue:IIssue
}


const selectors = {}

export default StyledComponent<P>(baseStyles, selectors)(function IssueStateLabel(props: P): React.ReactElement<P> {
  const
    {issue,classes, variant, className, ...other} = props,
    editable = hasEditPermission(issue),
    editProps = useMemo(() => editable ? {
      onClick: () => {
        uiTask("Updating Issue",async ():Promise<void> => {
          const patch:Partial<IssuesUpdateParams> = {
            state: (issue.state === "open") ? "closed" : "open"
          }

          await patchIssue(issue,patch)
        })
      }
    } : {},[issue,editable])

  return <ReactHoverObserver>
    {({isHovering}) => <div className={mergeClasses(classes.root,editable && "editable",!issue.pull_request && "issue", className, isHovering && "hover")} {...other} {...editProps}>
      <Octicon icon={issue.pull_request ? PullRequestIcon :
        (isHovering ?
          (issue.state === "closed" ? OpenIcon : ClosedIcon)
        :(issue.state === "closed" ? ClosedIcon : OpenIcon))}/>
    </div>}
  </ReactHoverObserver>
})
