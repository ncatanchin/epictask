import * as React from "react"
import getLogger from "common/log/Logger"
import {
  Ellipsis, FlexAuto,
  FlexRowCenter, FlexScale,
  IThemedProperties, makeDimensionConstraints, makeHeightConstraint, makePaddingRem, OverflowHidden,
  PositionRelative, rem,
  StyleDeclaration,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {getValue, guard} from "typeguard"
import {Milestone as MilestoneIcon, Tag as TagIcon} from '@githubprimer/octicons-react'
import IconButton from "@material-ui/core/IconButton"
import BaseChip from "renderer/components/elements/BaseChip"
import {IMilestone} from "common/models/Milestone"
import PopoverSelect from "renderer/components/elements/PopoverSelect"
import Tooltip from "@material-ui/core/Tooltip/Tooltip"

const Octicon = require("@githubprimer/octicons-react").default

const log = getLogger(__filename)


function baseStyles(theme: Theme): StyleDeclaration {
  const
    {palette, components: {IssueListItem, Milestone}} = theme,
    {primary, secondary} = palette

  return {
    root: [FlexAuto],
    chip: [PositionRelative, FlexRowCenter, {
      marginTop: 0,
      marginBottom: 0
    }],
    label: [FlexScale, OverflowHidden, Ellipsis, PositionRelative, makePaddingRem(0, 1),{
      display: "block",
      paddingRight: ({editable = true}:P) => rem(/*editable ? 1.8 :*/ 1)
    }],
    action: [makeDimensionConstraints(rem(1.2)), makePaddingRem(0), FlexRowCenter, {
      background: Milestone.colors.actionBg,
      borderRadius: rem(0.6),
      marginRight: rem(0.2),
      "& > .icon": [{
        "&,& > svg": [makeDimensionConstraints(rem(1.0))]
      }]
    }]
  }
}

interface P extends IThemedProperties {
  id: string
  milestone?: IMilestone
  milestoneOptions?: Array<IMilestone>
  onSelected?: (milestone: IMilestone | null) => void
  editable?: boolean
}

interface S {
  open: boolean
  anchorEl: HTMLElement | JSX.Element | null
}

@withStatefulStyles(baseStyles, {withTheme: true})
@connect(createStructuredSelector({
  milestoneOptions: (state: IRootState, props: P) => getValue(() => props.milestoneOptions, state.DataState.milestones.data)
}))
export default class Milestone extends React.Component<P, S> {


  constructor(props: P) {
    super(props)

    this.state = {
      open: false,
      anchorEl: null
    }
  }

  private onOpenSelect = () => this.setState({open: true})

  private onCloseSelect = () => this.setState({open: false})

  private onSelected = (milestone: IMilestone | null) => {
    guard(() => this.props.onSelected(
      getValue(() => milestone.id === this.props.milestone.id) ? null : milestone)
    )
    this.onCloseSelect()
  }

  private setAnchorEl = (anchorEl) => this.setState({anchorEl})

  render() {
    const
      {id, milestone, milestoneOptions, onSelected, classes, theme, editable = true} = this.props,
      {open,anchorEl} = this.state,
      actionProps = editable && onSelected ? {
        onClick: this.onOpenSelect,
        onAction: this.onOpenSelect,
        actionIcon: <div className={classes.action}>
          <Octicon className="icon" icon={MilestoneIcon}/>
        </div>
      } : {},
      chip = <BaseChip
        tooltip={getValue(() => milestone.title,"Not set")}
        aria-owns={open ? id : null}
        variant="small"
        color={theme.components.Milestone.colors.bg}
        label={getValue(() => milestone.title, "Not Set")}
        classes={{
          chip: classes.chip,
          label: classes.label
        }}
        {...actionProps}
      />

    return !editable ? chip : <div className={classes.root} ref={this.setAnchorEl}>
      {chip}
      <PopoverSelect
        id={id}
        open={open}
        anchorEl={anchorEl as any}
        onClose={this.onCloseSelect}
        selectedOption={milestone}
        options={milestoneOptions}
        onSelected={this.onSelected}
        noneLabel="No milestone"
        valueGetter="id"
        labelGetter="title"

      />
    </div>
  }
}
