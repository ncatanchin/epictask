import * as React from "react"
import {useCallback, useEffect, useRef, useState} from "react"
import getLogger from "common/log/Logger"
import {
  FillWidth,
  FlexColumn, FlexScale,
  IThemedProperties,
  makeHeightConstraint, makePaddingRem,
  NestedStyles,
  PositionRelative, StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {IDialogProps} from "renderer/models/Dialog"
import {IIssue} from "common/models/Issue"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"
import Deferred from "common/Deferred"
import {shortId} from "common/IdUtil"
import {SimpleDialogActions, uiTask} from "renderer/util/UIHelper"
import {selectedRepoSelector} from "common/store/selectors/DataSelectors"
import {IRepo} from "common/models/Repo"
import {useController} from "renderer/controllers/Controller"
import RepoImportController, {IRepoSearchResult} from "renderer/controllers/RepoImportController"
import {searchRepos} from "renderer/net/RepoAPI"
import TextField from "renderer/components/elements/TextField"
import {formBaseStyles, FormClasses} from "renderer/components/elements/Form.styles"
import List, {ListRowProps} from "renderer/components/elements/List"
import {ContainerNames} from "common/command-manager"
import {IDataSet, makeDataSet} from "common/Types"
import {getValue} from "typeguard"
import RepoImportResultListItem from "renderer/components/elements/RepoImportResultListItem"
import FocusedDiv from "renderer/components/elements/FocusedDiv"

const log = getLogger(__filename)

type Classes = "root"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: {
      "& .dialogContent": {
        ...makeHeightConstraint("70vh"),
        ...FlexColumn,
        ...PositionRelative,
        width: "70vw",
        maxWidth: 1280
      }
    }
  }
}

type RepoImportFormClasses = FormClasses | "list"

function repoImportFormBaseStyles(theme: Theme): StyleDeclaration<RepoImportFormClasses> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    ...formBaseStyles(theme),
    list: {
      ...FlexScale,
      ...FillWidth
    },


  }
}

interface P extends IThemedProperties<Classes>, IDialogProps<IRepo, IRepo> {

}

interface SP {
}


interface ContentP extends IThemedProperties<RepoImportFormClasses>, IDialogProps<IRepo, IRepo> {

}

export const RepoImportDialogTitle = StyledComponent<P>(baseStyles)((props: P & SP): React.ReactElement<P & SP> => {
  const
    {dialog: {data: issue}} = props,
    isEdit = issue && issue.id > 0

  return <>
    Import Repository
  </>
})

export const RepoImportDialogContent = StyledComponent<ContentP>(repoImportFormBaseStyles)((props: ContentP & SP): React.ReactElement<ContentP & SP> => {
  const
    {classes, onDialogComplete, dialog, controller, updateController} = props,
    {data: issue} = dialog,
    isEdit = issue && issue.id > 0,
    onClose = useCallback(() => {
      onDialogComplete()
    }, [onDialogComplete, dialog]),
    //[controller,updateController] = useController<RepoImportController>(),
    [resultsDataSet, setResultsDataSet] = useState<IDataSet<IRepoSearchResult>>(() => makeDataSet(controller.repos)),
    formRef = useRef<HTMLFormElement>(null),
    onImport = useCallback(() => {
      uiTask("Importing", async () => onDialogComplete(await controller.onImport()))
    }, [controller]),
    onQueryChange = useCallback(async (event) => {
      const query = event.target.value

      updateController(controller.setQuery(query))
      searchRepos(query)
        .then(repos => updateController(controller => controller.setRepos(repos)))
        .catch(err => log.error("Unable to complete search", err))
    }, [controller])

  const
    makeSelectedIndexes = (): Array<number> => getValue(() => [controller.repo.repo.id], [])
      .map(id => controller.repos.findIndex(result => result.repo.id === id) as number)
      .filter(index => index !== -1)
      .sort(),
    selectedIndexes = makeSelectedIndexes()


  /**
   * Updated selected notifications
   */
  const updateSelectedRepo = useCallback(async (dataSet: IDataSet<IRepoSearchResult>, indexes: Array<number>): Promise<void> => {
    const
      {data} = dataSet,
      ids = indexes
        .map(index => getValue(() => data[index].repo.id))
        .filterNotNull(),
      result = data.find(result => result.repo.id === ids[0])

    log.info("Update repo indexes", ids, result, indexes, dataSet)
    updateController(controller.setRepo(result))
  }, [])

  useEffect(() => {
    setResultsDataSet(makeDataSet(controller.repos))
  }, [controller.repos])


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
      result = dataSet.data[index] as IRepoSearchResult,
      Consumer = getValue(() => selectedIndexesContext.Consumer, null as React.Consumer<Array<number>> | null)

    return !Consumer ? <div
      key={key}
      style={style}
    /> : <Consumer key={key}>
      {(selectedIndexes: Array<number> | null) => <RepoImportResultListItem
        style={style}
        result={result}
        onClick={onClick}
        selected={selectedIndexes && selectedIndexes.includes(index)}
      />}
    </Consumer>
  }, [])


  return <form ref={formRef} className={classes.root} onSubmit={onImport}>
    <div className="row padding">
      <TextField
        autoFocus
        value={controller.query}
        onChange={onQueryChange}
        placeholder="Search for repositories"
        classes={{
          root: classes.title
        }}
      />
    </div>
    <FocusedDiv className="row body">
      <List
        id={ContainerNames.RepoImportResultsList}
        dataSet={resultsDataSet}
        tabIndex={0}
        onSelectedIndexesChanged={updateSelectedRepo}
        selectedIndexes={selectedIndexes}
        selectable={true}
        rowRenderer={rowRenderer}
        rowHeight={70}
        classes={{
          root: classes.list
        }}
      />
    </FocusedDiv>
  </form>

})

export function showRepoImportDialog(): void {
  const
    actions = new UIActionFactory(),
    deferred = new Deferred<boolean>()

  actions.showDialog({
    id: shortId(),
    type: "RepoImport",
    deferred,
    controller: new RepoImportController(),
    title: (props: IDialogProps<IRepo>) => <RepoImportDialogTitle {...props} />,
    content: (props: IDialogProps<IRepo>) => <RepoImportDialogContent {...props} />,
    actions: (props: IDialogProps<IRepo, IRepo, RepoImportController>) => {
      const
        {controller, updateController} = props,
        onComplete = useCallback((result: boolean) => {
          if (!result) {
            props.onDialogComplete(null)
            return null
          }
          return uiTask("Importing", async () => {
            const repo = selectedRepoSelector(getStoreState())
            props.onDialogComplete(await controller.onImport())

          })
        }, [props.dialog, props.onDialogComplete, controller])

      return <SimpleDialogActions
        onComplete={onComplete}
        classes={props.dialogClasses}
        dialog={props.dialog}
        actionLabel="Import"
      />
    },
    data: null,
    defaultResult: false
  })
}
