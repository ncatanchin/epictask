import * as React from "react"
import getLogger from "common/log/Logger"
import {
  Fill,
  FillHeight,
  FlexAuto, FlexRowCenter,
  IThemedProperties,
  makeDimensionConstraints,
  makeHeightConstraint,
  makeWidthConstraint,
  mergeClasses,
  NestedStyles, OverflowHidden,
  PositionAbsolute,
  PositionRelative,
  rem, remToPx, StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {ICollaborator} from "common/models/Repo"
import Tooltip from "@material-ui/core/Tooltip/Tooltip"
import {getValue, guard} from "typeguard"
import Img from 'react-image'
import {ILabel} from "common/models/Label"
import {collaboratorsSelector} from "common/store/selectors/DataSelectors"
import {useCallback, useEffect, useRef, useState} from "react"
import PopoverSelect from "renderer/components/elements/PopoverSelect"
import {IIssue} from "common/models/Issue"
import {Person as PersonIcon} from "@githubprimer/octicons-react"
import * as _ from 'lodash'

const
  Octicon = require("@githubprimer/octicons-react").default,
  log = getLogger(__filename)

function fillProps(props: P): P {
  return Object.assign({
    variant: "small",
    compact: false,
    maxVisibleCollaborators: 3,
    editable: true,
    collaboratorOptions: []
  }, props) as P
}

function makeCollabs(props: P): Array<ICollaborator> {
  const {collaborators, collaboratorOptions: options, issue} = props
  if (!issue || collaborators) {
    return collaborators ? collaborators : []
  }

  const {assignee, assignees = []} = issue
  const allAssignees = [...(assignee ? [assignee] : []), ...(assignees || [])]
  return _.uniqBy(
    allAssignees
      .map(assignee => options.find(opt => opt.id === assignee.id))
      .filter(collab => !!collab),
    "id"
  )
}

function propsFn<T>(fn: (props: P) => T): (props: P) => T {
  return (props: P): T => {
    const fullProps = fillProps(props)

    return fn(fullProps)
  }
}

function makeCollabDimGetter<T = string>(theme: Theme): ((props: P) => T) {
  return propsFn(({variant}: P): T => rem(theme.components.Chip.dimen[variant]) as any)
}

function baseStyles(theme: Theme): StyleDeclaration {
  const
    {palette, components: {Chip, Avatar}} = theme,
    {primary, secondary} = palette,
    collabDimGetter = makeCollabDimGetter(theme),
    picDimGetter = propsFn(({variant}: P): string => rem(Chip.dimen[variant] - 0.2)),
    horizontalPaddingGetter = (props: P): number => props.compact ? remToPx(0.2) : theme.spacing.unit,
    verticalPaddingGetter = (props: P): number => props.compact ? remToPx(0.2) : remToPx(0.2),
    calcWidth = (props: P): number | string => {
      const
        collabs = makeCollabs(props),
        dim = collabDimGetter(props),
        padding = horizontalPaddingGetter(props)

      return `calc((${padding}px * 2) + ${dim} + ((${dim} / 2) * ${Math.max(0, collabs.length - 1)}))`
    }

  return {
    root: {
      ...PositionRelative,
      ...makeWidthConstraint(calcWidth),
      ...makeHeightConstraint(propsFn(collabDimGetter)),
      paddingRight: horizontalPaddingGetter,
      paddingLeft: horizontalPaddingGetter,
      paddingTop: verticalPaddingGetter,
      paddingBottom: verticalPaddingGetter
    },
    avatars: [Fill, PositionRelative],
    pictureWrapper: [PositionAbsolute, FlexRowCenter, FillHeight, makeDimensionConstraints(collabDimGetter), {
      boxSizing: "border-box",
      left: propsFn((props: P) => `calc(50% - (${collabDimGetter(props)} / 2))`),
      top: propsFn((props: P) => `calc(50% - (${collabDimGetter(props)} / 2))`)

    }],
    pictureOutline: {...FlexRowCenter, ...PositionAbsolute,...makeDimensionConstraints(picDimGetter),

      zIndex: 1,
      borderRadius: propsFn((props: P) => `calc(${picDimGetter(props)} / 2)`),
      border: propsFn((props: P) => `${rem(0.1)} solid ${primary.dark}`),
      //borderRadius: propsFn((props: P) => `calc(${picDimGetter(props)} / 2)`),
      left: propsFn((props: P) => `calc(50% - (${picDimGetter(props)} / 2))`),
      top: propsFn((props: P) => `calc(50% - (${picDimGetter(props)} / 2))`)
    },
    picture: {
      ...PositionAbsolute, ...OverflowHidden, ...makeDimensionConstraints(picDimGetter),
      borderRadius: propsFn((props: P) => `calc(${picDimGetter(props)} / 2)`),
      left: propsFn((props: P) => `calc(50% - (${picDimGetter(props)} / 2))`),
      top: propsFn((props: P) => `calc(50% - (${picDimGetter(props)} / 2))`),

      "&.default": [{
        background: Avatar.colors.bg,
        color: Avatar.colors.default,
        fill: Avatar.colors.default
      }]
    }
  }
}

interface P extends IThemedProperties {
  issue: IIssue
  maxVisibleCollaborators?: number | null
  collaborators?: Array<ICollaborator>
  variant?: "normal" | "small"
  compact?: boolean
  editable?: boolean
  collaboratorOptions?: Array<ICollaborator>
  onSelected?: (assignees: Array<ICollaborator>) => void
}


const selectors = {
  collaboratorOptions: (state: IRootState, props: P) => props.collaboratorOptions || collaboratorsSelector(state)
}


export default StyledComponent<P>(baseStyles, selectors, {withTheme: true})(function Collaborators(props: P): React.ReactElement<P> {
  const
    fullProps = fillProps(props),
    {
      id,
      classes,
      className,
      maxVisibleCollaborators,
      onSelected,
      variant,
      editable,
      compact,
      collaboratorOptions,
      collaborators: selectedCollaborators,
      issue,
      theme,
      ...other
    } = fullProps,
    [collabs, setCollabs] = useState(() => makeCollabs(fullProps)),
    collabDim = makeCollabDimGetter(theme)(fullProps),
    [DefaultAvatar] = useState<React.ReactNode>(() => <Octicon className={mergeClasses(classes.picture, "default")}
                                                               icon={PersonIcon}/>)

  useEffect(() => {
    const newCollabs = selectedCollaborators ? selectedCollaborators : makeCollabs(fullProps)
    setCollabs(oldCollabs => _.isEqual(oldCollabs, newCollabs) ? oldCollabs : newCollabs)
  }, [selectedCollaborators, issue && issue.assignee, issue && issue.assignees])

  const
    [open, setOpen] = useState(false),
    anchorEl = useRef<HTMLElement | null>(null),
    tooltipTitle = <span>{collabs.map(collab => <span key={collab.id}>@{collab.login}<br/></span>)}</span>

  function onClose(): void {
    setOpen(false)
  }

  const onCollabSelected = useCallback((collab: ICollaborator | null): void => {
    const
      remove = !!collabs.find(existingCollab => existingCollab.id === collab.id),
      newCollabs = remove ? collabs.filter(existingCollab => existingCollab.id !== collab.id) :
        [...collabs, collab]

    setOpen(false)
    guard(() => onSelected(newCollabs))
  }, [collabs])


  function getAvatarURL(collab: ICollaborator): string {
    return getValue(() => collab.avatar_url)
  }


  return <div className={classes.root} ref={anchorEl as any} aria-owns={open ? id : null}>
    <Tooltip title={tooltipTitle}>
      <div className={classes.avatar} onClick={() => setOpen(true)}>
        {collabs.length ? collabs.map((collab, index) => <div
            key={collab.id}
            className={classes.pictureWrapper}
            style={{
              zIndex: collabs.length - index,
              marginLeft: `calc(${index} * (${collabDim} / 2))`
            }}
          >
            {collab.avatar_url ? <Img
              className={mergeClasses(classes.picture, className)}
              src={getAvatarURL(collab)}
              loader={DefaultAvatar}
              {...other}
            /> : DefaultAvatar}
            <div className={classes.pictureOutline}>

            </div>
          </div>) :
          <div
            key="add"
            className={classes.pictureWrapper}
          >
            <div className={classes.pictureOutline}>
              {DefaultAvatar}
            </div>
          </div>
        }


      </div>
    </Tooltip>
    <PopoverSelect
      id={id}
      noneLabel="No options"
      open={open}
      anchorEl={anchorEl.current}
      onClose={onClose}
      selectedOption={collabs}
      options={collaboratorOptions}
      onSelected={onCollabSelected}
      valueGetter="id"
      labelGetter="login"
    />
  </div>
})
