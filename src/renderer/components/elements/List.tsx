import * as React from "react"
import {useEffect, useLayoutEffect, useRef, useState} from "react"
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

const log = getLogger(__filename)


function baseStyles(theme): any {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: [Fill, PositionRelative]
  }
}

export type ListRowProps = VListRowProps & {
  selectedIndexesContext:React.Context<Array<number>>,
  onClick: () => void
}

export type ListRowRenderer = (props: ListRowProps) => React.ReactNode;

interface P<T> extends StyledComponentProps<string>, Omit<VListProps, "rowCount"> {
  onSelectedIndexesChanged?: (dataSet: IDataSet<T>,indexes: number[]) => void
  selectedIndexes?: number[]
  rowRenderer: ListRowRenderer
  dataSet: IDataSet<T>
  id: string
  selectable?: boolean
}


export default StyledComponent(baseStyles)(function List<T = any>(props: P<T>): React.ReactNode {

  const
    listRef = useRef<VList>(null),
    rootRef = useRef<HTMLDivElement>(null),
    {
      id,
      selectable = true,
      dataSet, classes,
      selectedIndexes,
      onSelectedIndexesChanged,
      rowRenderer:finalRowRenderer,
      rowHeight,
      ...other
    } = props
  assert(isDefined(id), "ID must be provided")
  const
    [internalSelectedIndexes,setInternalSelectedIndexes] = useState<Array<number>>(selectedIndexes || Array<number>()),
    internalSelectedIndexesRef = useRef<Array<number>>(internalSelectedIndexes),
    dataSetRef = useRef<IDataSet<T>>(dataSet),
    selectedIndexesContextRef = useRef<React.Context<Array<number>>>(React.createContext(internalSelectedIndexesRef.current)),
    selectedIndexesContext = selectedIndexesContextRef.current,
    {props:commandManagerProps} = useCommandManager(id,builder => {
      if (selectable)
        builder
          .command("CommandOrControl+a", selectAll, {
            overrideInput: true
          })
          .command("Escape", deselectAll)
          .command("Shift+ArrowDown", makeMoveSelection(1,true), {
            overrideInput: true
          })
          .command("Shift+ArrowUp", makeMoveSelection(-1, true), {
            overrideInput: true
          })
          .command("ArrowDown", makeMoveSelection(1), {
            overrideInput: true
          })
          .command("ArrowUp", makeMoveSelection(-1), {
            overrideInput: true
          })
      return builder.make()
    }, rootRef),
    forceUpdate = useForceUpdate()




  useEffect(() => {
    if (!dataSet) return
    const
      prevDataSet = dataSetRef.current,
      dataChanged = !_.isEqual(prevDataSet,dataSet)
      //   !(dataSet && prevDataSet && prevDataSet.data.length === dataSet.data.length && prevDataSet.data.every(prevValue =>
      //   !!dataSet.data.find(value => _.isEqual(value, prevValue))
      // ))

    if (!dataChanged) {
      log.info("List data unchanged2")
      return
    }
    dataSetRef.current = dataSet

    listRef.current && listRef.current.forceUpdateGrid()
  }, [dataSet])


  useLayoutEffect(() => {
    if (selectedIndexes && !_.isEqual(internalSelectedIndexesRef.current,selectedIndexes)) {
      internalSelectedIndexesRef.current = selectedIndexes
      setInternalSelectedIndexes(selectedIndexes)
    }
  }, [selectedIndexes])

  // useEffect(() => {
  //   listRef.current && listRef.current.forceUpdateGrid()
  // }, [dataSetRef.current, listRef.current])



  /**
   * Set selected indexes
   *
   * @param newSelectedIndexes
   */
  function setSelectedIndexes(newSelectedIndexes:number[]):void {
    if (!selectable || _.isEqual(newSelectedIndexes,internalSelectedIndexesRef.current)) return

    newSelectedIndexes = [...newSelectedIndexes]

    setInternalSelectedIndexes(newSelectedIndexes)
    internalSelectedIndexesRef.current = newSelectedIndexes

    if (isFunction(onSelectedIndexesChanged)) {
      onSelectedIndexesChanged(dataSetRef.current, newSelectedIndexes)
    }
  }

  /**
   * Select all items in the list
   */
  function selectAll():void {
    setSelectedIndexes(_.range(0,dataSetRef.current.total))
  }

  /**
   * Select all items in the list
   */
  function deselectAll():void {
    setSelectedIndexes([])
  }

  /**
   * Move the selection block
   *
   * @param increment
   * @param shiftHeld
   */
  function moveSelection(increment:number, shiftHeld:boolean = false):void {
    const
      internalSelectedIndexes = internalSelectedIndexesRef.current,
      dataSet = dataSetRef.current,
      start = increment > 0 ? _.max([...internalSelectedIndexes,0]) : Math.max(_.min(internalSelectedIndexes),0),
      dest = Math.min(Math.max(0,start + increment),Math.max(dataSet.total - 1,0))

    if (!shiftHeld) {
      setSelectedIndexes([dest])
    } else {
      const
        min = Math.min(start,dest),
        max = Math.max(start,dest) + (increment > 0 ? 1 : 0),
        indexRange = _.range(min,max),
        newSelectedIndexes = [...internalSelectedIndexes,...indexRange],
        filteredIndexes = _.uniq(newSelectedIndexes)

      setSelectedIndexes(filteredIndexes)
    }

    guard(() => listRef.current && listRef.current.scrollToRow(dest))
  }

  function makeMoveSelection(increment:number, shiftHeld:boolean = false):() => void {
    return () => moveSelection(increment,shiftHeld)
  }

  /**
   * On appropriate changes, update registered commands
   */





  /**
   * Overloaded row renderer
   *
   * @param rowProps
   */
  function rowRenderer(rowProps:VListRowProps):React.ReactNode {
    return finalRowRenderer(Object.assign({},rowProps,{
      selectedIndexesContext,
      onClick: (event:React.MouseEvent) => {
        let newSelectedIndexes = [...internalSelectedIndexes]

        const
          {index} = rowProps

        if (event.altKey || event.metaKey) {
          if (!newSelectedIndexes.includes(index)) {
            newSelectedIndexes = [...newSelectedIndexes,index]
          } else {
            newSelectedIndexes = newSelectedIndexes.filter(it => it !== index)
          }
        } else if (event.shiftKey) {
          const
            min = Math.min(index,...newSelectedIndexes),
            max = Math.max(index,...newSelectedIndexes)

          newSelectedIndexes = _.range(min,Math.min(max + 1,dataSetRef.current.total))
        } else {
          newSelectedIndexes = [index]
        }

        setSelectedIndexes(newSelectedIndexes)
      }
    }) as any)
  }

  const {Provider:SelectedIndexesProvider} = selectedIndexesContext

  return <div ref={rootRef} className={classes.root} {...commandManagerProps}>
    {dataSetRef.current.total > 0 &&
    <SelectedIndexesProvider value={internalSelectedIndexes}>
      <VAutoSizer>
        {({width, height}) => <VList
          ref={listRef}
          height={height}
          width={width}
          rowCount={dataSetRef.current.total}
          rowHeight={rowHeight}
          rowRenderer={rowRenderer}

        />}
      </VAutoSizer>
    </SelectedIndexesProvider>}
  </div>
} as any)
