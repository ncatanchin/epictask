import * as React from "react"
import getLogger from "common/log/Logger"
import {
  child,
  directChild,
  Ellipsis,
  FillWidth,
  FlexAuto,
  FlexColumn, FlexRow,
  FlexScale,
  IThemedProperties, makeDimensionConstraints,
  makeHeightConstraint, makeMarginRem,
  makePaddingRem, OverflowAuto,
  rem,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {IIssue} from "renderer/models/Issue"
import {Typography} from "@material-ui/core"
import Divider from "@material-ui/core/Divider"
import {FlexSpacer} from "renderer/components/elements/FlexSpacer"
import Labels from "renderer/components/elements/Labels"
import {ILabel} from "renderer/models/Label"
import {getValue} from "typeguard"
import Avatar from "renderer/components/elements/Avatar"


const log = getLogger(__filename)



function baseStyles(theme):any {
  const
    {palette, components: {IssueListItem}} = theme,
    {primary, secondary} = palette
  
  return {
    root: [FillWidth, FlexColumn, {
      background: IssueListItem.colors.bg,
      boxShadow: IssueListItem.colors.boxShadow,
      [directChild('content')]: [FlexScale, FlexColumn, makePaddingRem(0), {
        "& > .title": [makeHeightConstraint(rem(2.5)), makePaddingRem(0.5,0.5,0), FlexAuto, Ellipsis, {
          fontSize: rem(1),
          "& > .number": [makePaddingRem(0, 0.4, 0, 0), {
            color: IssueListItem.colors.number
          }]
        }],
        [directChild("bottomRow")]:[FillWidth,OverflowAuto,FlexRow,makeMarginRem(0.3,0.2,0.5),{
          [directChild("assignee")]: [makeMarginRem(0, 0.5),makeDimensionConstraints(rem(1.8)),{
          
          }],
          [directChild("labels")]: [makeMarginRem(0,0,0,0.2),{
          
          }]
        }]
        
      }]
    }],
    chip: [makeHeightConstraint(rem(1.8)),{
      marginTop: 0,
      marginBottom: 0
    }],
    add: [makeHeightConstraint(rem(1.8)),{
      marginTop: 0,
      marginBottom: 0
    }]
  }
}

interface P extends IThemedProperties {
  issue:IIssue
}

interface S {

}

@withStatefulStyles(baseStyles)
export default class IssueListItem extends React.Component<P, S> {
  
  constructor(props:P) {
    super(props)
    
    this.state = {}
  }
  
  private onAdd = (label:ILabel):void => {
    log.info("Add label",label)
  }
  
  render() {
    const {issue, classes, style, ...other} = this.props
    return <div
      style={style}
      className={classes.root}
      
      {...other}
    >
      <div className="content">
        <Typography className="title"><span className="number">#{issue.number}</span> {issue.title}</Typography>
        <FlexSpacer/>
        <div className="bottomRow">
          {issue.assignees.map(user => <Avatar key={user.id} user={user} className="assignee"/>)}
          <Labels labels={issue.labels} className="labels" classes={{chip: classes.chip, add: classes.add}} onAdd={this.onAdd} />
        </div>
      </div>
      {/*<Divider/>*/}
    </div>
  }
}



