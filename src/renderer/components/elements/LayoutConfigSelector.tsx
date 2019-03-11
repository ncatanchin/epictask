import * as React from "react"
import getLogger from "common/log/Logger"
import {
  BorderBoxSizing,
  CursorPointer,
  Ellipsis, FillWidth, FlexColumnCenter,
  FlexRowCenter,
  FlexScale,
  IThemedProperties, makeDimensionConstraints, makeMarginRem, makePaddingRem, makeTransition,
  NestedStyles, OverflowHidden, PositionRelative, rem,
  StyleDeclaration, Transparent
} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import * as classNames from "classnames"
import {ILayoutConfig} from "renderer/store/state/UIState"
import {currentLayoutSelector, layoutsSelector} from "renderer/store/selectors/UISelectors"
import FocusedDiv from "renderer/components/elements/FocusedDiv"
import {useRef, useState} from "react"
import {useCallback} from "react"
import {useFocused} from "renderer/command-manager-ui"
import {getValue} from "typeguard"
import {Typography} from "@material-ui/core"
import DownIcon from "@material-ui/icons/ArrowDownward"
import Grow from "@material-ui/core/Grow"
import MenuList from "@material-ui/core/MenuList"
import MenuItem from "@material-ui/core/MenuItem"
import Popper from "@material-ui/core/Popper"
import {ISearchChip} from "renderer/search/Search"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"
import CommonElementIds from "renderer/CommonElements"
import {borderRadius} from "react-select/lib/theme"
import ClickAwayListener from "@material-ui/core/ClickAwayListener"

const log = getLogger(__filename)

type Classes = "root" | "currentValueContainer" | "list" | "listItem"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: {
      ...makeTransition(["background", "color"]),
      ...FlexRowCenter,
      ...FlexScale,
      borderRadius: rem(0.3),
      background: Transparent,

      "&.focused, &:hover, &:focus": {
        background: secondary.main,
        "& *": {
          color: secondary.contrastText
        },
        "& .value .icon": {
          opacity: 1
        }
      }
    },
    currentValueContainer: {
      ...makeTransition(["color"]),
      ...FlexRowCenter,
      ...makePaddingRem(0, 0.5),
      ...CursorPointer,


      "& .value": {
        ...FlexScale,
        ...FlexRowCenter,
        ...Ellipsis,
        "& > span": {
          ...makeTransition(["color"]),
          fontSize: rem(1)
        },
        "& .icon": {
          ...makeTransition(["color", "opacity"]),
          ...makeDimensionConstraints(rem(1)),
          opacity: 0,
          marginLeft: rem(0.3)
        }
      }


    },
    list: {
      ...makePaddingRem(0),
      ...makeMarginRem(0.2, 0, 0, 0),
      ...FlexColumnCenter,
      ...PositionRelative,
      ...OverflowHidden,
      backgroundClip: "border-box",
      background: primary.dark,
      borderRadius: rem(0.3),
      minWidth: "50vw"
    },
    listItem: {
      ...makeMarginRem(0),
      ...makePaddingRem(1),
      ...FlexRowCenter,
      ...FillWidth,
      ...BorderBoxSizing
    }
  }
}

interface P extends IThemedProperties<Classes> {
  theme?: Theme
}


interface SP {
  layout: ILayoutConfig
  layouts: Array<ILayoutConfig>
}

const selectors: Selectors<P, SP> = {
  layout: currentLayoutSelector,
  layouts: layoutsSelector
}


export default StyledComponent<P, SP>(baseStyles, selectors, {withTheme: true})(function LayoutConfigSelector(props: SP & P): React.ReactElement<P> {
  const
    id = CommonElementIds.LayoutSelector,
    {classes, layout: selectedLayout, layouts, theme} = props,
    innerRef = useRef<HTMLElement>(null),
    anchorEl = useRef<HTMLDivElement>(null),
    focused = useFocused(anchorEl) || getValue(() => document.activeElement === innerRef.current || innerRef.current.contains(document.activeElement), false),
    [open, setOpen] = useState<boolean>(false),
    onKeyDown = useCallback((event: React.KeyboardEvent): void => {

    }, []),
    makeOnLayoutSelect = useCallback((layout: ILayoutConfig): ((event: React.MouseEvent) => void) =>
        (event: React.MouseEvent) => {
          new UIActionFactory().setCurrentLayoutConfig(layout)
          setOpen(false)
        }
      , []),
    onClose = useCallback(() => {
      setOpen(false)
    }, [setOpen])

  return selectedLayout && <FocusedDiv
    ref={innerRef}
    tabIndex={0}
    onKeyDown={onKeyDown}
    className={classNames(classes.root, {
      focused
    })}
  >
    <div ref={anchorEl} className={classes.currentValueContainer} onClick={() => setOpen(!open)}>
      <Typography>
        <div className="value">
          <span>{selectedLayout.name}</span>
          <DownIcon className="icon"/>
        </div>
      </Typography>
    </div>

    <Popper id={id} open={open} anchorEl={anchorEl.current} transition placement="bottom">
      {({TransitionProps}) => (<Grow style={{transformOrigin: '0 0 0'}} timeout={250} in={open} {...TransitionProps}>
        <ClickAwayListener onClickAway={onClose}>
          <MenuList
            classes={{root: classes.list}}
            // style={{
            //   minWidth: anchorEl && anchorEl.current.clientWidth
            // }}
          >
            {layouts.map((layout, index) =>
              <MenuItem
                key={layout.id}
                onClick={makeOnLayoutSelect(layout)}
                classes={{root: classes.listItem}}
                selected={selectedLayout.id === layout.id}
              >
                <div className="label">{layout.name}</div>
              </MenuItem>)
            }
          </MenuList>
        </ClickAwayListener>
      </Grow>)}
    </Popper>
  </FocusedDiv>
})
