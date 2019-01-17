import * as React from "react"
import * as ReactDOM from "react-dom"
import getLogger from "common/log/Logger"
import {
  CursorPointer,
  Fill,
  FillWidth,
  FlexAuto,
  FlexColumnCenter,
  FlexRowCenter,
  FlexScale,
  IThemedProperties,
  makeDimensionConstraints,
  makeMarginRem,
  makePaddingRem,
  mergeClasses,
  PositionRelative,
  rem,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {VerticalSplitPane} from "renderer/components/elements/VerticalSplitPane"
import {IRepo} from "common/models/Repo"
import {AppActionFactory} from "common/store/actions/AppActionFactory"
import Header from "renderer/components/Header"
import RepoSelect from "renderer/components/elements/RepoSelect"
import {
  isSelectedRepoEnabledSelector,
  selectedOrgSelector,
  selectedRepoSelector
} from "common/store/selectors/DataSelectors"
import {IOrg} from "common/models/Org"
import {getValue, guard} from "typeguard"
import Img from 'react-image'
import {IconButton, Typography} from "@material-ui/core"
import CheckIcon from "@material-ui/icons/Check"

import IssueList from "renderer/components/elements/IssueList"
import {userSelector} from "common/store/selectors/AppSelectors"
import {IUser} from "common/models/User"
import {
  useCommandManager
} from "renderer/command-manager-ui"
import {CommandContainerBuilder, CommandType, ICommandContainerItems} from "common/command-manager"
import IssueDetails from "renderer/components/elements/IssueDetails"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {useEffect, useRef, useState} from "react"

const AvatarDefaultURL = require("renderer/assets/images/avatar-default.png")

const log = getLogger(__filename)

declare global {
  interface IIssuesLayoutStyles {
    colors: {
      bg: string
      controlsBg: string
      controlsBgHover: string
    }
  }
}


function baseStyles(theme: Theme): any {
  const
    {palette, components: {IssuesLayout}} = theme,
    {action, primary, secondary, background} = palette

  return {
    root: [Fill, FlexColumnCenter, {
      background: theme.background.global,

      "&.enable": [{
        "& .repo": [makePaddingRem(0, 1), {
          borderRadius: rem(0.5),
          background: IssuesLayout.colors.bg
        }],
        "& .button": [makeMarginRem(2), {
          "& .icon": [makeDimensionConstraints(rem(4)), {
            fontSize: rem(4)
          }]
        }]
      }]
    }],
    header: [FlexAuto],
    controls: [FlexRowCenter, FlexAuto, {
      background: IssuesLayout.colors.controlsBg,
      "& img": [makeDimensionConstraints(rem(2)), makePaddingRem(0)],
      "&:hover, &.open": [CursorPointer, {
        background: IssuesLayout.colors.controlsBgHover
      }]
    }],
    content: [FlexScale, PositionRelative, FillWidth]
  }
}

export interface P extends IThemedProperties {
  header: Header
  repo?: IRepo
  org?: IOrg
  user?: IUser
  isRepoEnabled?: boolean
  splitter?: number | string
}

const selectors = {
  user: userSelector,
  repo: selectedRepoSelector,
  org: selectedOrgSelector,
  isRepoEnabled: isSelectedRepoEnabledSelector,
  splitter: (state: IRootState) => state.AppState.issues.splitter
}

const actions = new AppActionFactory()

export default StyledComponent(baseStyles, selectors)(function (props: P): React.ReactElement<P> {
  const
    {classes, header, repo, org, user, isRepoEnabled, splitter} = props,
    rootRef = useRef<any>(null),
    repoSelectRef = useRef<any>(null),
    id = "IssuesLayout",
    [repoSelectOpen, setRepoSelectOpen] = useState<boolean>(false),
    {props: commandManagerProps} = useCommandManager(id, (builder: CommandContainerBuilder): ICommandContainerItems =>
        builder
          .command(
            "CommandOrControl+o",
            (cmd, event) => guard(() => {
              const
                repoSelect = repoSelectRef.current as any,
                inputElement = (ReactDOM.findDOMNode(repoSelectRef.current) as HTMLElement).querySelector("input")

              log.info("Command fired", cmd, event, repoSelect)
              repoSelect.setState({menuIsOpen: true})

              inputElement.focus()
              inputElement.setAttribute("value", "")
            }),
            {
              name: "Open repo",
              type: CommandType.App,
              hidden: false,
              overrideInput: true
            }
          )
          .make(),
      rootRef
    )

  function onRepoSelection(repo: IRepo): void {
    actions.setSelectedRepo(repo)
  }

  function onRepoSelectOpen(open: boolean): void {
    setRepoSelectOpen(open)
  }

  function onSplitterChange(newSize: number): void {
    log.info("Splitter change", newSize)
    actions.setIssuesSplitter(newSize)
  }


  useEffect(() => {
    header.setRightControls(() =>
      <div className={mergeClasses(classes.controls, repoSelectOpen && "open")}>
        <RepoSelect selectRef={repoSelectRef} onOpen={onRepoSelectOpen} onSelection={onRepoSelection} value={repo}/>
        <Img
          src={getValue(() => user.avatar_url)}
          loader={<img src={AvatarDefaultURL}/>}
        />
      </div>
    )
  }, [header, repo, org, user, repoSelectOpen])

  function renderSelectRepo(): JSX.Element {
    return <>
      <Typography variant="h2">Select a repository to start</Typography>
    </>
  }

  function renderRepoIsNotEnabled(): JSX.Element {
    return <>
      <Typography variant="h2">Enable <span className="repo">{repo.full_name}</span>?</Typography>
      <IconButton className="button" onClick={() => actions.enableRepo(repo)}>
        <CheckIcon className="icon"/>
      </IconButton>
    </>
  }

  function renderIssues(): JSX.Element {
    return <>
      <div className={classes.content}>
        <VerticalSplitPane defaultSize={splitter} minSize={400} onChange={onSplitterChange}>
          <IssueList/>
          <IssueDetails/>
        </VerticalSplitPane>
      </div>
    </>
  }


  return <div ref={rootRef} className={classes.root} {...commandManagerProps}>
    {!repo ?
      renderSelectRepo() :
      !isRepoEnabled ?
        renderRepoIsNotEnabled() :
        renderIssues()
    }
  </div>

})

