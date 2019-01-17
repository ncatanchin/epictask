import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  makePaddingRem,
  mergeClasses, mergeStyles, NestedStyles, rem,
  StyleDeclaration,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {elevationStyles} from "renderer/components/elements/Elevation"
import {getValue, guard, isDefined, isFunction, isNumber, isString} from "typeguard"
import {darken} from "@material-ui/core/styles/colorManipulator"
import Popper from "@material-ui/core/Popper/Popper"
import Grow from "@material-ui/core/Grow/Grow"
import MenuItem from "@material-ui/core/MenuItem/MenuItem"
import ClickAwayListener from "@material-ui/core/ClickAwayListener/ClickAwayListener"
import {useEffect, useRef, useState} from "react"

import Highlighter from "react-highlight-words"
import {selectedOrgReposSelector} from "common/store/selectors/DataSelectors"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {useCommandManager} from "renderer/command-manager-ui"


const log = getLogger(__filename)


function baseStyles(theme: Theme): StyleDeclaration {
  const
    {
      palette,
      components: {
        Select,
        Input,
        Typography
      }
    } = theme,
    {primary, secondary} = palette

  return {
    root: [],
    paper: [Select.paper],
    option: [Select.option.root, {
      "&.focused": [Select.option.focused,theme.outline,{

      }],
      "&.selected": [Select.option.selected,{
        "&.selected":[Select.option.selected]
      }],
      "&:hover": [Select.option.selected,{

      }]
    }],
    divider: [Select.divider],
    input: [Input.field, {
      background: Select.colors.filterBg,
      color: Select.colors.text,

      "&::placeholder": [{
        fontSize: rem(1)
      }]
    }],
    highlight: [Typography.highlight]
  }
}

type PropGetter<T> = ((option: T | null) => string | number) | keyof T

interface P<T = any> extends IThemedProperties {
  filterable?: boolean
  filterPlaceholder ?: string | null
  anchorEl: null | HTMLElement | ((element: HTMLElement) => HTMLElement)
  open: boolean
  id: string
  options: Array<T>
  selectedOption?: Array<T> | T | null
  valueGetter?: PropGetter<T>
  labelGetter?: PropGetter<T>
  styleGetter?: ((option: T | null, selected:boolean) => NestedStyles)
  noneLabel: string | JSX.Element
  unselectLabel?: string | JSX.Element
  onSelected: (option: T | null) => void
  onClose: () => void
}




export default StyledComponent<P>(baseStyles)(function PopoverSelect<T>(props: P<T>): React.ReactElement<P> {
  const
    {
      innerRef,
      options,
      id,
      filterable = true,
      filterPlaceholder = null,
      open,
      selectedOption,
      anchorEl,
      valueGetter,
      labelGetter,
      styleGetter,
      noneLabel,
      unselectLabel,
      onSelected,
      classes,
      onClose,
      ...other
    } = props




  function makeOnSelected(opt: T | null): () => void {
    return () => guard(() => onSelected(opt))
  }


  function getSingleProperty(opt: T | null, propGetter: PropGetter<T>, defaultProp: string, defaultValue: string | number = ""): string | number | null {
    return getValue(() =>
        isString(propGetter) ? opt[propGetter as string] :
          isFunction(propGetter) ? propGetter(opt) : null,
      opt ? opt[defaultProp] : defaultValue)
  }


  function getProperty(opt: T | null, propGetter: PropGetter<T>, defaultProp: string, defaultValue?: string | number): string | number | null
  function getProperty(opt: Array<T> | null, propGetter: PropGetter<T>, defaultProp: string, defaultValue?: string | number): Array<string | number>
  function getProperty(opt: Array<T> | T | null, propGetter: PropGetter<T>, defaultProp: string, defaultValue: string | number = ""): Array<string | number> | string | number | null {
    if (Array.isArray(opt)) {
      return opt.map(it => getSingleProperty(it,propGetter,defaultProp,defaultValue))
    } else {
      return getSingleProperty(opt,propGetter,defaultProp,defaultValue)
    }

  }

  const
    [focusedValue,setFocusedValue] = useState<string | number | null>(getValue(() => getProperty(options[0], valueGetter,"id",null))),
    rootRef = useRef<any>(null),
    makeMoveSelection = (increment:number):(() => void) => {
      return () => {
        setFocusedValue(focusedValue => {
        let index = options.findIndex(opt => getProperty(opt, valueGetter, "id") === focusedValue)
        if (index === -1) {
          log.warn("Unable to find current value", focusedValue, options)
          index = 0
        } else {
          index = Math.max(0, Math.min(index + increment, options.length - 1))
        }

        const value = getValue(() => getProperty(options[index], valueGetter, "id"))
        if (!isDefined(value)) {
          log.warn("Unable to find option at ", index, value, options)
          return focusedValue
        } else {
          return value
        }
        })
      }

    },
    makeFocusedSelect = ():(() => void) => ():void => {
      setFocusedValue(focusedValue => {
        guard(() => onSelected(options.find(opt => getProperty(opt, valueGetter, "id") === focusedValue)))
        return focusedValue
      })
    },
    {props:commandManagerProps} = useCommandManager(
      id,
      builder =>
        builder
          .command("Escape", onClose,{
            overrideInput: true
          })
          .command("Enter", makeFocusedSelect(), {
            overrideInput: true
          })
          .command("ArrowDown", makeMoveSelection(1), {
            overrideInput: true
          })
          .command("ArrowUp", makeMoveSelection(-1), {
            overrideInput: true
          })
          .make(),
       rootRef
    ),
    [query, setQuery] = useState(""),
    [filteredOptions, setFilteredOptions] = useState(options),
    optionClasses = {
      root: classes.option,
      selected: "selected"
    }



  useEffect(
    () => {
      setQuery("")
      setFilteredOptions(options)
    },
    [options]
  )





  function onQueryChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const query = event.target.value
    setQuery(query)
    setFilteredOptions(options.filter(opt => {
      const label = getProperty(opt, labelGetter, "label", "") as string
      return new RegExp(query,"i").test(label)
    }))

  }

  const
    selectedOptions = !selectedOption ? [] : (Array.isArray(selectedOption) ?selectedOption : [selectedOption]) as Array<T>,
    selectedValues = getProperty(
      selectedOptions,
      valueGetter,
      "value"
    ),
    selectionValid = !selectedValues.isEmpty() || selectedValues.every(opt => !opt || (!isNumber(opt) && !isString(opt)))

  if (open) {
    log.info(id, "Selected options", selectedOptions, "Selected values", selectedValues, "Valid", selectionValid, anchorEl)
  }
  return <Popper id={id} open={open} anchorEl={anchorEl} transition>
    {({TransitionProps}) => (
      <Grow {...TransitionProps} timeout={250}>
        <ClickAwayListener onClickAway={onClose}>
          <div
            ref={rootRef}
            style={elevationStyles.elevation4}
            className={classes.paper}
            {...other}
            {...commandManagerProps}
          >

            {/* FILTER INPUT */}
            {filterable && <input
              autoFocus
              placeholder={filterPlaceholder || "Filter..."}
              className={classes.input}
              value={query}
              onChange={onQueryChange}/>
            }


            {/* NO OPTIONS */}
            {!filteredOptions.length && noneLabel && <MenuItem
              component="div"
              classes={optionClasses}
              onClick={makeOnSelected(null)}
            >
              {noneLabel}
            </MenuItem>
            }


            {/* DESELECT, UNSELECT OPTION */}
            {unselectLabel && filteredOptions.length && <MenuItem
              selected={selectionValid}
              component="div"
              classes={optionClasses}
              style={mergeStyles({
                fontWeight: !selectionValid ? 500 : 400
              },getValue(() => styleGetter(null,!selectionValid)))}
              button
              onClick={makeOnSelected(null)}
            >
              {unselectLabel}
            </MenuItem>}


            {/* REGULAR OPTIONS */}
            {filteredOptions.map(opt => {
              const
                value = getProperty(opt, valueGetter, "value"),
                label = getProperty(opt, labelGetter, "label"),
                focused = value === focusedValue,
                selected = selectedValues.some(selectedValue => selectedValue === value),
                style = mergeStyles({
                  fontWeight: selected ? 500 : 400
                },getValue(() => styleGetter(opt, selected)))

              return <MenuItem
                key={value}
                selected={selected}
                component="div"
                className={mergeClasses(classes.option, focused && "focused", selected && "selected")}
                classes={optionClasses}
                style={style}
                button
                onClick={makeOnSelected(opt)}
              >
                <Highlighter
                  searchWords={query.isEmpty() ? [] : query.split(" ")}
                  textToHighlight={label as string}
                  highlightClassName={classes.highlight}
                  caseSensitive={false}
                  autoEscape={false}
                />
              </MenuItem>
            })}
          </div>
        </ClickAwayListener>
      </Grow>
    )}
  </Popper>
})

