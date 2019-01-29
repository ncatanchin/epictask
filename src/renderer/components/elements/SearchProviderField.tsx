import * as React from "react"
import {ChangeEvent, useCallback, useEffect, useRef, useState} from "react"
import getLogger from "common/log/Logger"
import {
  FillWidth,
  FlexAuto,
  FlexColumn,
  FlexRow,
  FlexScale,
  FlexWrap,
  IThemedProperties,
  makeHeightConstraint, makeMargin,
  makeMarginRem,
  makePadding,
  PositionRelative, rem,
  remToPx,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {StyledComponentProps, StyleRules} from "@material-ui/core/styles/withStyles"
import {getValue, guard} from "typeguard"
import {StyledComponent, StyledElement} from "renderer/components/elements/StyledComponent"
import {CommandManagerProps, useFocused} from "renderer/command-manager-ui"
import {ISearchChip, SearchProvider} from "renderer/search/Search"
import Input from "@material-ui/core/Input/Input"
import Chip from "@material-ui/core/Chip/Chip"
import Dexie from "dexie"
import Popper from "@material-ui/core/Popper/Popper"
import Slide from "@material-ui/core/Slide/Slide"
import MenuList from "@material-ui/core/MenuList/MenuList"
import MenuItem from "@material-ui/core/MenuItem/MenuItem"
import withStyles from "renderer/styles/withStyles"
import {getContrastText} from "renderer/styles/MaterialColors"
import * as _ from "lodash"

const
  log = getLogger(__filename)


type SearchProviderFieldClasses = "root" | "input" |
  "chip" | "chipKey" | "chipValue" | "field" | "availableChip" | "availableChips" |
  "chipDescription" | "availableChipItem"


function baseStyles(theme: Theme): StyleDeclaration<SearchProviderFieldClasses> {
  const
    {palette, components: {Select, MenuList, Labels, Input}, spacing: {unit}} = theme,
    {primary, secondary} = palette,
    rowElementHeight = remToPx(2)

  return {
    root: {
      ...FlexColumn,
      ...PositionRelative
    },
    field: {
      ...FillWidth,
      ...FlexRow,
      ...FlexWrap,
      alignItems: "center"
    },
    input: {
      ...FlexRow,
      ...FlexScale,
      ...makeHeightConstraint(rowElementHeight),
      ...makeMargin(unit * 2, unit * 4),
      outline: "none",
      fontSize: rem(1.2),
      "&:after": {
        borderBottom: 0
      },

      '&::-webkit-input-placeholder': {
        fontSize: rem(1.4),
        fontWeight: '400',
        color: Input.colors.placeholder
      }
    },
    chipKey: {},
    chipValue: {},
    chip: {
      ...makeMargin(unit),
      ...FlexAuto,
      ...makeHeightConstraint(rowElementHeight)
    },
    chipDescription: {
      marginLeft: unit * 4
    },
    availableChip: {},
    availableChipItem: {},
    availableChips: {
      ...MenuList.elevation,
      ...makePadding(0),
      maxWidth: "50vh",
      background: MenuList.colors.bg,
      color: MenuList.colors.text
    }

  }
}


interface P<DB extends Dexie = any, TableName extends keyof DB = any, T = any, PK = any, V = any> extends StyledComponentProps<SearchProviderFieldClasses> {
  id: string
  commandManagerProps?: CommandManagerProps
  placeholder?: string
  chips: Array<ISearchChip<T, PK, V>>
  provider: SearchProvider<DB, TableName, T, PK, V>
  onChanged: (newChips: Array<ISearchChip<T, PK, V>>) => void
  defaultColor?: string
  isClearable?: boolean
  theme?: Theme
}

interface SP {
}


export default StyledComponent<P, SP>(
  baseStyles,
  {
    withTheme: true,
    withRef: true
  }
)(function SearchProviderField<DB extends Dexie = any,
  TableName extends keyof DB = any,
  T = any,
  PK = any,
  V = any>(props: P<DB, TableName, T, PK, V> & SP): StyledElement<P<DB, TableName, T, PK, V>> {
  const
    {
      id,
      commandManagerProps = {},
      isClearable = false,
      chips = Array<ISearchChip<T, PK, V>>(),
      classes,
      placeholder = "Search...",
      onChanged,
      provider,
      theme,
      innerRef,
      ...other
    } = props,

    // AVAILABLE CHIPS
    [availableChips, setAvailableChips] = useState<Array<ISearchChip<T, PK, V>>>([]),

    // QUERY STATE
    [query, setQuery] = useState<string>(""),
    onQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(getValue(() => event.target.value, ""))
    }, [setQuery]),
    anchorEl = useRef<HTMLDivElement>(null),
    open = useFocused(anchorEl) && getValue(() => query.length > 0, false),
    [selectedIndex,setSelectedIndex] = useState(0),
    makeOnChipSelect = useCallback((newChip: ISearchChip<T, PK, V>): ((event: React.MouseEvent) => void) =>
      (event: React.MouseEvent) => {
        onChanged([newChip, ...chips.filter(chip => chip.id !== newChip.id)])
        setQuery("")
        setSelectedIndex(0)
      }
    , [onChanged, chips]),
    onChipRemove = useCallback((removeChip: ISearchChip<T, PK, V>) => {
      onChanged(chips.filter(chip => chip.id !== removeChip.id))
    }, [onChanged, chips]),
    moveSelectionRef = useRef<(increment: number,shiftHeld?: boolean) => void>(null)



  useEffect(() => {
    moveSelectionRef.current = (increment: number, shiftHeld: boolean = false): void => {
      const
        start = increment > 0 ? _.max([selectedIndex, 0]) : Math.max(_.min([selectedIndex]), 0),
        dest = Math.min(Math.max(0, start + increment), Math.max(availableChips.length - 1, 0))


      setSelectedIndex(dest)

      //guard(() => listRef.current && listRef.current.scrollToRow(dest))
    }
  }, [availableChips,open])

  const makeMoveSelection = useCallback((increment: number, shiftHeld: boolean = false): (() => void) => {
    return () => moveSelectionRef.current(increment, shiftHeld)
  }, [moveSelectionRef.current])

  // ON PROVIDER CHANGE - CLEAR
  useEffect(() => {
    setQuery("")
  }, [provider])

  // UPDATE AVAILABLE CHIPS
  useEffect(() => {
    setAvailableChips(query === "" ? [] : provider.searchChips(query))
  }, [provider, query])

  return <div
    id={id}
    ref={innerRef}
    className={classes.root}
    {...commandManagerProps}
  >
    <div ref={anchorEl} className={classes.field}>
      {chips.map(chip => <SearchChipWrapper
        key={chip.id}
        theme={theme}
        classes={classes}
        chip={chip}
        onRemove={onChipRemove}
      />)}
      <Input
        className={classes.input}
        value={query}
        placeholder={placeholder}
        onChange={onQueryChange}
        disableUnderline/>
    </div>

    <Popper id={id} open={open} anchorEl={anchorEl.current} transition placement="bottom-start">
      {({TransitionProps}) => (<Slide direction="down" {...TransitionProps}>
        <MenuList
          classes={{root: classes.availableChips}}
          style={{
            minWidth: anchorEl && anchorEl.current.clientWidth
          }}>
          {availableChips.map(chip => <MenuItem
            key={chip.id}
            onClick={makeOnChipSelect(chip)}
            classes={{root: classes.availableChipItem}}
          >

            <SearchChipWrapper theme={theme} chip={chip} classes={{root: classes.availableChip}}/>
            <div className={classes.chipDescription}>{chip.description}</div>
          </MenuItem>)}
        </MenuList>
      </Slide>)}
    </Popper>
  </div>
})

interface ChipWrapperP<T = any, PK = any, V = any> extends IThemedProperties<SearchProviderFieldClasses> {
  onRemove?: ((chip: ISearchChip<T, PK, V>) => void) | null
  chip: ISearchChip<T, PK, V>
  theme: Theme
}

function SearchChipWrapper<T = any, PK = any, V = any>({theme, onRemove, classes, chip}: ChipWrapperP<T, PK, V>): React.ReactElement<ChipWrapperP<T, PK, V>> {
  const
    label = getValue(() => chip.label({
      chip,
      onRemove,
      theme
    }), null)

  if (label) {
    return label as any
  }

  return <SearchChip
    chip={chip}
    onRemove={onRemove}
    classes={{root: classes.chip, key: classes.chipKey, value: classes.chipValue}}
  />
}


interface ChipP<T = any, PK = any, V = any> extends IThemedProperties<ChipClasses> {
  onRemove?: ((chip: ISearchChip<T, PK, V>) => void) | null
  chip: ISearchChip<T, PK, V>
}

type ChipClasses = "root" | "key" | "value"

function chipBaseStyles(theme: Theme): StyleRules<ChipClasses> {
  const
    {components: {Labels}} = theme,
    colorGetter = (fn: (color: string) => string): ((props: ChipP) => string) =>
      (props: ChipP) => getValue(() => fn(
        props.chip.type === "text" ?
          Labels.colors.text :
          props.chip.color
        )
      )

  return {
    root: {
      background: colorGetter(color => color) as any,
      color: ((props: ChipP) => getValue(() => getContrastText(props.chip.color))) as any
    },

    key: {
      fontWeight: 700
    },

    value: {
      fontWeight: 500
    }
  }
}

export const SearchChip: <T = any, PK = any, V = any>(props: ChipP<T, PK, V>) => React.ReactElement<ChipP<T, PK, V>> =
  withStyles(chipBaseStyles)(({classes, onRemove, chip}) => {
    const onDelete = useCallback(() => onRemove(chip), [onRemove, chip])

    return <Chip
      className={classes.root}
      label={
        <span className={classes.key}>{chip.key}:&nbsp;
          <span className={classes.value}>{chip.valueAsString}</span>
        </span>
      }
      {...(!onRemove ? {} : {onDelete})}
    />
  })
