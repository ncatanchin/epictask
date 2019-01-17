import * as React from "react"
import getLogger from "common/log/Logger"
import {
  child,
  CursorPointer, FillWidth,
  FlexRow, FlexRowCenter,
  IThemedProperties, makeDimensionConstraints,
  mergeClasses, mergeStyles, rem,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {ILabel} from "common/models/Label"
import Label from "renderer/components/elements/Label"
import {getValue, guard} from "typeguard"
import {Tag as TagIcon} from "@githubprimer/octicons-react"
import BaseChip from "renderer/components/elements/BaseChip"
import PopoverSelect from "renderer/components/elements/PopoverSelect"
import {connect} from "common/util/ReduxConnect"
import {createStructuredSelector} from "reselect"
import {IMilestone} from "common/models/Milestone"
import {getContrastText} from "renderer/styles/MaterialColors"
import Tooltip from "@material-ui/core/Tooltip/Tooltip"

const
  Octicon = require("@githubprimer/octicons-react").default,
  log = getLogger(__filename)

declare global {
  interface ILabelsStyles {
    colors: {
      addBg: string
      add: string
    }
  }
}


function baseStyles(theme: Theme): any {
  const
    {palette, components: {Labels, Chip}} = theme,
    {primary, secondary} = palette,
    smallDim = Chip.dimen.small

  return {
    root: [FlexRow, FillWidth, {
      flexWrap: ({wrap = false}:P) => wrap ? "wrap" : "nowrap",
      overflowY: ({wrap = false}:P) => wrap ? "auto" : "hidden",
      overflowX: ({wrap = false}:P) => wrap ? "hidden": "auto"
    }],
    chip: {},
    label: {},
    spacer: {},
    addLabel: [CursorPointer],
    add: [CursorPointer,makeDimensionConstraints(rem(smallDim)), FlexRowCenter, {
      borderRadius: `calc(${rem(smallDim)} / 2)`,
      backgroundColor: Labels.colors.addBg,
      [child("icon")]: [makeDimensionConstraints(rem(smallDim - 0.6)),{
        borderRadius: `calc((${rem(smallDim)} - 0.6rem) / 2)`,
        color: Labels.colors.add
      }]
    }]
  }
}

interface P extends IThemedProperties {
  id: string
  wrap?: boolean
  labels: Array<ILabel>
  labelOptions?: Array<ILabel>
  onChanged?: (labels: ILabel[]) => void
  editable?: boolean
}

interface S {
  open: boolean
  anchorEl: HTMLElement | JSX.Element | null
}

@withStatefulStyles(baseStyles, {withTheme: true})
@connect(createStructuredSelector({
  labelOptions: (state: IRootState, props: P) => getValue(() => props.labelOptions, state.DataState.labels.data)
}))
export default class Labels extends React.Component<P, S> {

  static defaultProps: Partial<P> = {
    wrap: false,
    editable: false
  }

  constructor(props: P) {
    super(props)

    this.state = {
      open: false,
      anchorEl: null
    }
  }

  private onOpenSelect = () => this.setState({open: true})

  private onCloseSelect = () => this.setState({open: false})

  private onSelected = (label: ILabel | null) => {
    const
      remove = !!getValue(() => this.props.labels.find(existingLabel => existingLabel.id === label.id)),
      labels = remove ?
        [...(this.props.labels || []).filter(existingLabel => existingLabel.id !== label.id)] :
        [...(this.props.labels || []),label]

    guard(() => this.props.onChanged(labels))
    this.onCloseSelect()
  }

  private setAnchorEl = (anchorEl) => this.setState({anchorEl})

  private styleGetter = (opt:ILabel, selected:boolean) => {
    if (!opt || !opt.color)
      return {}

    const
      color = `#${opt.color}`,
      style = mergeStyles({
        backgroundColor: color,
        color: getContrastText(color)
      }, selected && this.props.theme.focus)

    return style
  }

  render() {
    const
      {id, labels, labelOptions, wrap, editable, theme, onChanged, classes, className} = this.props,
      {anchorEl, open} = this.state,
      labelActionProps = !editable ? {} : {
        onDelete: this.onSelected
      }

    return <div
      className={mergeClasses(classes.root, wrap && "wrap", className)}
      ref={this.setAnchorEl}
    >
      <div className={classes.spacer}/>
      {labels.map((label, index) =>
        <Label
          key={label.id}
          className={classes.chip}
          style={Object.assign({}, !index && {marginLeft: 0})}
          label={label}
          {...labelActionProps}
        />)
      }
      {editable && <>
        <Tooltip title="Add label">
          <div
            className={classes.add}
            onClick={this.onOpenSelect}
            aria-owns={open ? id : null}
          >
            <Octicon className="icon" icon={TagIcon}/>
          </div>
        </Tooltip>
        {/*<BaseChip*/}
          {/*color={theme.components.Labels.colors.addBg}*/}
          {/*label="+"*/}
          {/*variant="small"*/}
          {/*aria-owns={open ? id : null}*/}
          {/*actionIcon={<div className={classes.add}>*/}
            {/*<Octicon className="icon" icon={TagIcon}/>*/}
          {/*</div>}*/}
          {/*onAction={this.onOpenSelect}*/}
          {/*className={classes.chip}*/}
          {/*onClick={this.onOpenSelect}*/}
          {/*classes={{*/}
            {/*chip: classes.chip,*/}
            {/*label: classes.label*/}
          {/*}}*/}
        {/*/>*/}
        <PopoverSelect
          id={id}
          open={open}
          anchorEl={anchorEl as any}
          noneLabel="No options"
          onClose={this.onCloseSelect}
          selectedOption={labels}
          options={labelOptions}
          onSelected={this.onSelected}
          valueGetter="id"
          labelGetter="name"
          styleGetter={this.styleGetter}
        />
      </>
      }
      <div className={classes.spacer}/>
    </div>
  }
}
