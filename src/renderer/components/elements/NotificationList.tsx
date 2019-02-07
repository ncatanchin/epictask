import * as React from "react"
import {useCallback} from "react"
import getLogger from "common/log/Logger"
import {
  Fill,
  FillWidth,
  FlexColumn,
  FlexScale,
  IThemedProperties,
  makeTransition,
  OverflowHidden,
  PositionAbsolute,
  PositionRelative,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {IDataSet} from "common/Types"
import List, {ListRowProps} from "renderer/components/elements/List"
import {getValue} from "typeguard"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {appSelector} from "common/store/selectors/AppSelectors"
import {AppActionFactory} from "common/store/actions/AppActionFactory"
import {makeCommandManagerAutoFocus} from "common/command-manager"
import {sortedNotificationsSelector} from "common/store/selectors/DataSelectors"
import FocusedDiv from "renderer/components/elements/FocusedDiv"
import CommonElementIds from "renderer/CommonElements"
import {INotification} from "common/models/Notification"
import {withController} from "renderer/controllers/Controller"
import NotificationsController from "renderer/controllers/NotificationsController"
import NotificationListItem from "renderer/components/elements/NotificationListItem"
import {selectNotification} from "renderer/net/NotificationAPI"

const log = getLogger(__filename)

const commandManagerOptions = {
  tabIndex: -1,
  autoFocus: makeCommandManagerAutoFocus(49)
}

type Classes = "root" | "focused" | "list" | "search"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: {
      ...Fill,
      ...PositionRelative,
      ...FlexColumn,
      ...OverflowHidden
    },
    list: {
      ...FlexScale,
      ...FillWidth,
      maxHeight: "auto",
      height: "auto",
      minHeight: 0,
      overflowY: "hidden",
      overflowX: "hidden"
    },
    search: {
      //...FlexAuto,
      ...FillWidth
    },
    focused: {
      ...makeTransition('box-shadow'),
      ...Fill,
      ...PositionAbsolute,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "none",
      boxShadow: "none",
      "&.active": {
        ...theme.focus
      }
    }
  }
}


interface P extends IThemedProperties {

}

interface SP {
  notifications: IDataSet<INotification>
  selectedNotificationIds: Array<string>
}

export default StyledComponent<P, SP>(baseStyles, {
  notifications: sortedNotificationsSelector,
  selectedNotificationIds: appSelector(state => state.selectedNotificationIds)
}, {
  extraWrappers: {
    inner: [withController<P, NotificationsController>(
      props => new NotificationsController(),
      props => []
    )]
  }
})(function NotificationsList(props: P & SP): React.ReactElement<P & SP> {
  const
    id = CommonElementIds.NotificationsList,
    {
      classes,
      notifications,
      selectedNotificationIds,
      ...other
    } = props,
    makeSelectedIndexes = (): Array<number> => selectedNotificationIds
      .map(id => notifications.data.findIndex(issue => issue.id === id) as number)
      .filter(index => index !== -1)
      .sort(),
    selectedIndexes = makeSelectedIndexes()


  /**
   * Row renderer for notifications
   */
  const rowRenderer = useCallback((rowProps: ListRowProps): React.ReactNode => {
    const
      {
        key,
        index,
        onClick,
        style,
        dataSet,
        selectedIndexesContext
      } = rowProps,
      notification = dataSet.data[index] as INotification,
      onDoubleClick = ():void => {
        selectNotification(notification)
          .catch(err => log.error("Unable to select notification", err))
      },
      Consumer = getValue(() => selectedIndexesContext.Consumer, null as React.Consumer<Array<number>> | null)

    return !Consumer ? <div
      key={key}
      style={style}
    /> : <Consumer key={key}>
      {(selectedIndexes: Array<number> | null) => <NotificationListItem
        style={style}
        notification={notification}
        onDoubleClick={onDoubleClick}
        onClick={onClick}
        selected={selectedIndexes && selectedIndexes.includes(index)}
      />}
    </Consumer>
  }, [selectedNotificationIds])


  /**
   * Updated selected notifications
   */
  const updateSelectedNotifications = useCallback(async (dataSet: IDataSet<INotification>, indexes: Array<number>): Promise<void> => {
    const
      {data} = dataSet,
      ids = indexes
        .map(index => getValue(() => data[index].id))
        .filter(id => !!id)



    new AppActionFactory().setSelectedNotificationIds(ids)
  }, [])


  return <FocusedDiv classes={{root: classes.root}}>
    <List
      id={id}
      dataSet={notifications}
      commandManagerOptions={commandManagerOptions}
      onSelectedIndexesChanged={updateSelectedNotifications}
      selectedIndexes={selectedIndexes}
      selectable={true}
      rowRenderer={rowRenderer}
      rowHeight={70}
      classes={{
        root: classes.list
      }}
      {...other as any}
    />
  </FocusedDiv>

})
