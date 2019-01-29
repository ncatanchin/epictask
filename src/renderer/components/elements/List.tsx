import * as React from "react"
import {useCallback, useEffect, useLayoutEffect, useRef, useState} from "react"
import getLogger from "common/log/Logger"
import {Fill, PositionRelative, withStatefulStyles} from "renderer/styles/ThemedStyles"
import {
  AutoSizer as VAutoSizer,
  List as VList,
  ListProps as VListProps,
  ListRowProps as VListRowProps
} from 'react-virtualized'
import {IDataSet, Omit} from "common/Types"
import {StyledComponentProps} from "@material-ui/core"
import {guard, isDefined, isFunction} from "typeguard"
import * as assert from "assert"
import * as _ from 'lodash'
import useForceUpdate from "renderer/util/useForceUpdate"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {useCommandManager} from "renderer/command-manager-ui"
import {ICommandManagerOptions} from "common/command-manager"

const log = getLogger(__filename)


function baseStyles(theme): any {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: {...Fill, ...PositionRelative}
  }
}

export type ListRowProps<T = any> = VListRowProps & {
  dataSet: IDataSet<T>
  selectedIndexesContext: React.Context<Array<number>>,
  onClick: () => void
}

export type ListRowRenderer<T = any> = (props: ListRowProps<T>) => React.ReactNode;

interface P<T> extends StyledComponentProps<string>, Omit<VListProps, "rowCount"> {
  onSelectedIndexesChanged: (dataSet: IDataSet<T>, indexes: number[]) => void
  selectedIndexes: number[]
  rowRenderer: ListRowRenderer<T>
  dataSet: IDataSet<T>
  id: string
  selectable?: boolean
  commandManagerOptions?: Partial<ICommandManagerOptions>
}


export default StyledComponent<P<any>>(baseStyles)(function List<T = any>(props: P<T>): React.ReactElement<P<T>> {

  const
    listRef = useRef<VList>(null),
    rootRef = useRef<HTMLDivElement>(null),
    {
      id,
      selectable = true,
      dataSet, classes,
      selectedIndexes,
      commandManagerOptions,
      onSelectedIndexesChanged,
      rowRenderer: finalRowRenderer,
      rowHeight,
      ...other
    } = props
  assert(isDefined(id), "ID must be provided")
  const
    // [internalSelectedIndexes,setInternalSelectedIndexes] = useState<Array<number>>(selectedIndexes || Array<number>()),
    // internalSelectedIndexesRef = useRef<Array<number>>(internalSelectedIndexes),
    moveSelectionRef = useRef<(increment: number,shiftHeld?: boolean) => void>(null),
    dataSetRef = useRef<IDataSet<T>>(dataSet),
    selectedIndexesContextRef = useRef<React.Context<Array<number>>>(React.createContext(selectedIndexes)),
    selectedIndexesContext = selectedIndexesContextRef.current

  useEffect(() => {
    log.debug("Updating list dataset")
    if (!dataSet) return
    const
      prevDataSet = dataSetRef.current,
      dataChanged = !_.isEqual(prevDataSet, dataSet)

    log.debug("Updating list dataset - change", dataChanged, prevDataSet, dataSet)
    if (!dataChanged) {
      return
    }
    dataSetRef.current = dataSet

    listRef.current && listRef.current.forceUpdateGrid()
  }, [dataSet, dataSet.data, dataSet.total])


  // useLayoutEffect(() => {
  //   if (selectedIndexes && !_.isEqual(internalSelectedIndexesRef.current,selectedIndexes)) {
  //     internalSelectedIndexesRef.current = selectedIndexes
  //     setInternalSelectedIndexes(selectedIndexes)
  //   }
  // }, [selectedIndexes])

  /**
   * Set selected indexes
   *
   * @param newSelectedIndexes
   */
  const setSelectedIndexes = useCallback((newSelectedIndexes: number[]): void => {
    if (!selectable) return

    newSelectedIndexes = [...newSelectedIndexes]

    // setInternalSelectedIndexes(newSelectedIndexes)
    // internalSelectedIndexesRef.current = newSelectedIndexes

    //if (isFunction(onSelectedIndexesChanged)) {
    onSelectedIndexesChanged(dataSetRef.current, newSelectedIndexes)
    //}
  }, [dataSetRef.current, selectedIndexes])

  /**
   * Select all items in the list
   */
  function selectAll(): void {
    setSelectedIndexes(_.range(0, dataSetRef.current.total))
  }

  /**
   * Select all items in the list
   */
  function deselectAll(): void {
    setSelectedIndexes([])
  }

  /**
   * Move the selection block
   *
   * @param increment
   * @param shiftHeld
   */
  useEffect(() => {
    moveSelectionRef.current = (increment: number, shiftHeld: boolean = false): void => {
      const
        dataSet = dataSetRef.current,
        start = increment > 0 ? _.max([...selectedIndexes, 0]) : Math.max(_.min(selectedIndexes), 0),
        dest = Math.min(Math.max(0, start + increment), Math.max(dataSet.total - 1, 0))

      if (!shiftHeld) {
        setSelectedIndexes([dest])
      } else {
        const
          min = Math.min(start, dest),
          max = Math.max(start, dest) + (increment > 0 ? 1 : 0),
          indexRange = _.range(min, max),
          newSelectedIndexes = [...selectedIndexes, ...indexRange],
          filteredIndexes = _.uniq(newSelectedIndexes)

        setSelectedIndexes(filteredIndexes)
      }

      guard(() => listRef.current && listRef.current.scrollToRow(dest))
    }
  }, [dataSetRef.current, selectedIndexes, listRef.current])

  const makeMoveSelection = useCallback((increment: number, shiftHeld: boolean = false): (() => void) => {
    return () => moveSelectionRef.current(increment, shiftHeld)
  }, [moveSelectionRef.current])

  /**
   * On appropriate changes, update registered commands
   */

  const {props: commandManagerProps} = useCommandManager(id, useCallback(builder => {
    if (selectable)
      builder
        .command("CommandOrControl+a", selectAll, {
          overrideInput: false
        })
        .command("Escape", deselectAll)
        .command("Shift+ArrowDown", makeMoveSelection(1, true), {
          overrideInput: false
        })
        .command("Shift+ArrowUp", makeMoveSelection(-1, true), {
          overrideInput: false
        })
        .command("ArrowDown", makeMoveSelection(1), {
          overrideInput: false
        })
        .command("ArrowUp", makeMoveSelection(-1), {
          overrideInput: false
        })
    return builder.make()
  },[makeMoveSelection,selectAll]), rootRef, commandManagerOptions)


  /**
   * Overloaded row renderer
   *
   * @param rowProps
   */
  const rowRenderer = useCallback((rowProps: VListRowProps): React.ReactNode => {
    return finalRowRenderer(Object.assign({}, rowProps, {
      dataSet,
      selectedIndexesContext,
      onClick: (event: React.MouseEvent) => {
        let newSelectedIndexes = [...selectedIndexes]

        const
          {index} = rowProps

        if (event.altKey || event.metaKey) {
          if (!newSelectedIndexes.includes(index)) {
            newSelectedIndexes = [...newSelectedIndexes, index]
          } else {
            newSelectedIndexes = newSelectedIndexes.filter(it => it !== index)
          }
        } else if (event.shiftKey) {
          const
            min = Math.min(index, ...newSelectedIndexes),
            max = Math.max(index, ...newSelectedIndexes)

          newSelectedIndexes = _.range(min, Math.min(max + 1, dataSetRef.current.total))
        } else {
          newSelectedIndexes = [index]
        }

        setSelectedIndexes(newSelectedIndexes)
      }
    }) as any)
  }, [selectedIndexes, dataSet, dataSetRef.current])

  const {Provider: SelectedIndexesProvider} = selectedIndexesContext

  return <div ref={rootRef} className={classes.root} {...commandManagerProps}>
    {dataSet.total > 0 &&
    <SelectedIndexesProvider value={selectedIndexes}>
      <VAutoSizer>
        {({width, height}) => <VList
          ref={listRef}
          height={height}
          width={width}
          tabIndex={-1}

          rowCount={dataSet.total}
          rowHeight={rowHeight}
          rowRenderer={rowRenderer}
        />}
      </VAutoSizer>
    </SelectedIndexesProvider>}
  </div>
})
