import * as React from "react"
import {useCallback, useMemo, useRef, useState} from "react"
import * as ReactDOM from "react-dom"
import getLogger from "common/log/Logger"
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faCircle as FASolidCircle, faBell as FASolidBell} from "@fortawesome/pro-solid-svg-icons"
import {faBell as FALightBell} from "@fortawesome/pro-light-svg-icons"

import {
  CursorPointer,
  Fill,
  FillWidth,
  FlexAuto,
  FlexColumnCenter,
  FlexRowCenter,
  FlexScale,
  IThemedProperties,
  makeDimensionConstraints, makeHeightConstraint,
  makeMarginRem,
  makePaddingRem,
  mergeClasses, PositionAbsolute,
  PositionRelative,
  rem, StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {VerticalSplitPane} from "renderer/components/elements/VerticalSplitPane"
import {IRepo} from "common/models/Repo"
import {AppActionFactory} from "common/store/actions/AppActionFactory"
import Header from "renderer/components/Header"
import RepoSelect from "renderer/components/elements/RepoSelect"
import {
  isSelectedRepoEnabledSelector, notificationsUnreadSelector,
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
import {useCommandManager} from "renderer/command-manager-ui"
import {CommandContainerBuilder, CommandType, getCommandManager, ICommandContainerItems} from "common/command-manager"
import IssueDetails from "renderer/components/elements/IssueDetails"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import CommonElementIds, {CommonElement} from "renderer/CommonElements"
import {showIssueEditDialog} from "renderer/components/elements/IssueEditDialog"
import {areDialogsOpen} from "renderer/util/UIHelper"
import * as $ from 'jquery'
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"
import classNames from "classnames"
import NotificationList from "renderer/components/elements/NotificationList"
import {showRepoImportDialog} from "renderer/components/elements/RepoImportDialog"
import EventHub from "common/events/Event"
import issueSearchProvider from "renderer/search/SearchIssues"
import SearchProviderField from "renderer/components/elements/SearchProviderField"
import {ISearchChip} from "renderer/search/Search"
import {IIssue} from "common/models/Issue"
import {layoutSearchChipSelector, searchIssuesKey} from "renderer/store/selectors/UISelectors"

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

type Classes = "root" | "header" | "controls" | "content" | "search" | "container" | "issueContainer" | "topContainer"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette, components: {IssuesLayout}} = theme,
    {action, notifications, primary, secondary, background} = palette

  return {
    root: {
      ...Fill,
      ...FlexColumnCenter,
      background: theme.background.global,

      "& .enable": {
        "& .repo": {
          ...makePaddingRem(0, 1),
          borderRadius: rem(0.5),
          background: IssuesLayout.colors.bg
        },
        "& .button": {
          ...makeMarginRem(2),
          "& .icon": {
            ...makeDimensionConstraints(rem(4)),
            fontSize: rem(6)
          }
        }
      }
    },
    header: {
      ...FlexAuto
    },
    controls: {
      ...FlexRowCenter,
      ...FlexAuto,
      ...PositionRelative,
      background: IssuesLayout.colors.controlsBg,
      "& img, & .notificationsButton": {
        ...makeDimensionConstraints(rem(2)),
        ...makePaddingRem(0)
      },
      "&:hover, &.open": {
        ...CursorPointer,
        background: IssuesLayout.colors.controlsBgHover
      },
      "& .notificationsButton": {
        ...PositionRelative,
        ...makeHeightConstraint(rem(2)),
        borderRadius: 0,
        "&.unread": {
          backgroundColor: notifications.main,
          "& svg": {
            fontSize: rem(0.6)
          }
        },
        "& svg": {
          fontSize: rem(1)
        },
        "& .badge": {
          //...makePaddingRem(0.2,0.3)
        }
      }
    },
    content: {...FlexScale, ...FlexColumnCenter, ...PositionRelative, ...Fill, ...FillWidth},
    container: {...PositionRelative, ...FlexScale, ...FillWidth},
    topContainer: {
      ...FillWidth,
      ...FlexAuto,
      ...FlexRowCenter
    },
    search: {
      ...FlexScale
    },
    issueContainer: {
      ...FlexScale,
      ...FlexColumnCenter,
      ...PositionRelative,
      ...FillWidth
    }
  }
}

interface P extends IThemedProperties<Classes> {

}

interface SP {
  repo: IRepo
  org: IOrg
  user: IUser
  isRepoEnabled: boolean
  splitter: number | string
  notificationsSplitter: number | string
  notificationsOpen: boolean
  notificationsUnreadCount: number
  searchChips: Array<ISearchChip>
}

const selectors = {
  user: userSelector,
  repo: selectedRepoSelector,
  org: selectedOrgSelector,
  isRepoEnabled: isSelectedRepoEnabledSelector,
  splitter: (state: IRootRendererState) => state.UIState.splitters.issues,
  notificationsSplitter: (state: IRootRendererState) => state.UIState.splitters.notifications,
  notificationsOpen: (state: IRootRendererState) => state.UIState.notificationsOpen,
  notificationsUnreadCount: notificationsUnreadSelector,
  searchChips: layoutSearchChipSelector
}

const appActions = new AppActionFactory()
const uiActions = new UIActionFactory()

export default StyledComponent<P, SP>(baseStyles, selectors)(function (props: P & SP): React.ReactElement<P & SP> {
  const
    {classes, repo, searchChips, org, notificationsSplitter, notificationsUnreadCount, notificationsOpen, user, isRepoEnabled, splitter} = props,
    hasUnreadNotifications = notificationsUnreadCount > 0,
    rootRef = useRef<any>(null),
    repoSelectRef = useRef<any>(null),
    id = CommonElementIds.IssuesLayout,
    [repoSelectOpen, setRepoSelectOpen] = useState<boolean>(false),
    {props: commandManagerProps} = useCommandManager(id, useCallback((builder: CommandContainerBuilder): ICommandContainerItems => {
        const commandManager = getCommandManager()

        function makeContainerFocusHandler(container: CommonElement.IssueList | CommonElement.IssueView): () => void {
          return () => {
            const containerId = CommonElement[container]
            if (commandManager.isFocused(containerId)) {
              log.info("Already focused", containerId)
            } else {
              log.info("Focusing", containerId)
              commandManager.focusOnContainer(containerId)
              //commandManager.setContainerFocused(containerId,true,null)
            }
          }
        }

        return builder
          .command(
            "F5",
            (cmd, event) => guard(() => {
              EventHub.emit("SyncAllData")
            }),
            {
              name: "Sync data with Github",
              type: CommandType.App,
              hidden: false,
              overrideInput: true
            }
          )
          .command(
            "CommandOrControl+o",
            (cmd, event) => guard(() => {
              const
                repoSelect = repoSelectRef.current as any,
                inputElement = (ReactDOM.findDOMNode(repoSelectRef.current) as HTMLElement).querySelector("input")

              repoSelect.setState({menuIsOpen: true})

              inputElement.focus()
              inputElement.setAttribute("value", "")
            }),
            {
              name: "Import repo",
              type: CommandType.App,
              hidden: false,
              overrideInput: true
            }
          )
          .command(
            "CommandOrControl+i",
            (cmd, event) => guard(() => {
              if (areDialogsOpen()) return
              showRepoImportDialog()
            }),
            {
              name: "Open repo",
              type: CommandType.App,
              hidden: false,
              overrideInput: true
            }
          )
          .command(
            "CommandOrControl+n",
            (cmd, event) => guard(() => {
              if (getRendererStoreState().UIState.dialogs.length)
                return

              showIssueEditDialog(null)
            }),
            {
              name: "New Issue",
              type: CommandType.App,
              hidden: false,
              overrideInput: true
            }
          )
          .command(
            "CommandOrControl+f",
            (cmd, event) => guard(() => {
              if (areDialogsOpen())
                return

              $(`#${CommonElementIds.IssueSearch} input`).focus()
            }),
            {
              name: "Search Issues",
              type: CommandType.App,
              hidden: false,
              overrideInput: true
            }
          )
          .command("ArrowLeft", makeContainerFocusHandler(CommonElement.IssueList), {
            overrideInput: false
          })
          .command("ArrowRight", makeContainerFocusHandler(CommonElement.IssueView), {
            overrideInput: false
          })
          .make()
      }, [repoSelectRef]),
      rootRef
    )

  const onRepoSelection = useCallback((repo: IRepo): void => {
    appActions.setSelectedRepo(repo)
  }, [])

  const onRepoSelectOpen = useCallback((open: boolean): void => {
    setRepoSelectOpen(open)
  }, [])

  const onSplitterChange = useCallback((newSize: number): void => {
    uiActions.setSplitter("issues", newSize)
  }, [])

  const onNotificationsSplitterChange = useCallback((newSize: number): void => {
    if (notificationsOpen)
      uiActions.setSplitter("notifications", newSize)
  }, [notificationsOpen])


  // const rightControls = useMemo(() =>
  //     <div className={mergeClasses(classes.controls, repoSelectOpen && "open")}>
  //       {/*<RepoSelect*/}
  //       {/*  id={CommonElementIds.RepoSelect}*/}
  //       {/*  selectRef={repoSelectRef}*/}
  //       {/*  onOpen={onRepoSelectOpen}*/}
  //       {/*  onSelection={onRepoSelection}*/}
  //       {/*  value={repo}*/}
  //       {/*/>*/}
  //       {/*<Img*/}
  //       {/*  src={getValue(() => user.avatar_url)}*/}
  //       {/*  loader={<img src={AvatarDefaultURL}/>}*/}
  //       {/*/>*/}
  //
  //     </div>
  //   , [repo, org, user, repoSelectOpen, notificationsUnreadCount, classes])

  const renderSelectRepo = useCallback((): JSX.Element => {
    return <div className={classes.content}>
      <Typography variant="h2">Select a repository to start</Typography>
    </div>
  }, [classes])

  const
    renderRepoIsNotEnabled = useCallback((): JSX.Element => {
      return <div className={mergeClasses(classes.content, "enable")}>
        <Typography variant="h2">Enable <span className="repo">{repo.full_name}</span>?</Typography>
        <IconButton className="button" onClick={() => appActions.enableRepo(repo)}>
          <CheckIcon className="icon"/>
        </IconButton>
      </div>
    }, [classes, repo]),
    onSearchChipsChanged = useCallback((newSearchChips: Array<ISearchChip<IIssue, number, any>>) => {
      new UIActionFactory().updateLayoutSearchChips(newSearchChips)
    }, [])

  const renderIssues = useCallback((): JSX.Element => {
    return <div className={classes.content}>
      <div className={classes.topContainer}>
        <SearchProviderField
          id={CommonElementIds.IssueSearch}
          classes={{
            root: classes.search
          }}
          provider={issueSearchProvider}
          onChanged={onSearchChipsChanged}
          chips={searchChips}
        />
      </div>
      <div className={classes.issueContainer}>
        <VerticalSplitPane
          defaultSize={splitter}
          minSize={400}
          onChange={onSplitterChange}
        >
          <IssueList/>
          <IssueDetails/>

        </VerticalSplitPane>
      </div>
    </div>

  }, [classes, splitter, onSplitterChange])

  return <div
    ref={rootRef}
    className={classes.root}
    {...commandManagerProps}
  >
    <Header />

    <div className={classes.container}>
      <VerticalSplitPane
        defaultSize={notificationsOpen ? notificationsSplitter : 0}
        primary="second"
        minSize={notificationsOpen ? 300 : 0}
        maxSize={notificationsOpen ? "50%" : 0}
      >
        {!repo ?
          renderSelectRepo() :
          !isRepoEnabled ?
            renderRepoIsNotEnabled() :
            renderIssues()
        }
        <NotificationList/>
      </VerticalSplitPane>
    </div>
  </div>

})
