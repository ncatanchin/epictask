import * as React from "react"
import getLogger from "common/log/Logger"
import {
  Ellipsis,
  FillWidth,
  FlexAuto, FlexRowCenter,
  IThemedProperties,
  makeWidthConstraint, mergeClasses, PositionRelative, rem,
  StyleDeclaration, ViewportMode,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import Typography from '@material-ui/core/Typography'
import NoSsr from '@material-ui/core/NoSsr'
import TextField, {TextFieldProps} from '@material-ui/core/TextField'
import Paper from '@material-ui/core/Paper'
import Chip from '@material-ui/core/Chip'
import MenuItem from '@material-ui/core/MenuItem'
import CancelIcon from '@material-ui/icons/Cancel'
import {emphasize} from '@material-ui/core/styles/colorManipulator'

import withStyles, {StyledComponentProps} from "@material-ui/core/styles/withStyles"
import {ControlProps} from "react-select/lib/components/Control"
import {getValue, guard} from "typeguard"
import {hot} from "react-hot-loader"
import baseStyles from "renderer/components/elements/AutoCompleteSelect.styles"
import Elevation, {elevationStyles} from "renderer/components/elements/Elevation"
import {Input} from "@material-ui/core"
import {Props as SelectProps} from "react-select/lib/Select"
import Tooltip from "@material-ui/core/Tooltip/Tooltip"
import ListItem from "@material-ui/core/ListItem"
import ReactSelect from "react-select"
import {IRepo} from "common/models/Repo"
import {useEffect, useState} from "react"
import {StyledComponent, StyledElement} from "renderer/components/elements/StyledComponent"

const
  log = getLogger(__filename),
  Select = require('react-select').default


const NoOptionsMessage = withStyles(baseStyles as any)((props: InnerP): JSX.Element => {
  return (
    <Typography
      color="textSecondary"
      className={props.classes.noOptionsMessage}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  )
})


class Control extends React.Component<any> {
  render() {
    const {
      clearValue,
      getStyles,
      getValue: getSelectedValue,
      hasValue,
      isMulti,
      isRtl,
      selectOption,
      setValue,
      innerProps,
      isDisabled,
      isFocused,
      cx,
      selectProps,
      innerRef,
      options,
      theme,
      ...props
    } = this.props

    //log.info("disabled",isDisabled,"focused",isFocused,"value",getSelectedValue(),"inner props",innerProps,"props",props)
    return <div
      ref={innerRef}
      className={mergeClasses(selectProps.classes.control,
        getValue(() => (props as any).selectProps.customClasses.control))}
      {...props}
      {...innerProps}
    />
  }
}

class Option extends React.Component<InnerP> {

  render() {
    const props = this.props
    return <MenuItem
      buttonRef={props.innerRef}
      selected={props.isFocused}
      component="div"
      classes={{
        root: props.selectProps.classes.optionRoot,
        selected: "selected"
      }}
      style={{
        fontWeight: props.isSelected ? 500 : 400
      }}
      {...props.innerProps}
    >
      <div className={props.selectProps.classes.optionContent}>{props.children}</div>
    </MenuItem>


  }
}


const Placeholder = withStyles(baseStyles as any)((props: InnerP): JSX.Element => {
  return (
    <Typography
      color="textSecondary"
      className={mergeClasses(props.classes.placeholder, getValue(() => (props as any).selectProps.customClasses.placeholder))}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  )
})


class SingleValue extends React.Component<InnerP> {
  render() {
    const {innerRef, ...props} = this.props
    return <Typography
      ref={innerRef}
      className={mergeClasses(props.selectProps.classes.singleValue,
        getValue(() => (props as any).selectProps.customClasses.singleValue))}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  }
}

class ValueContainer extends React.Component<InnerP> {
  render() {
    const {innerRef, ...props} = this.props
    return <div
      ref={innerRef}
      className={mergeClasses(props.selectProps.classes.valueContainer,
        getValue(() => (props as any).selectProps.customClasses.valueContainer))}
    >
      {props.children}
    </div>
  }
}

class Menu extends React.Component<InnerP, any> {
  constructor(props, context) {
    super(props, context)
    this.state = {}
  }

  render() {
    const {innerRef, ...props} = this.props
    return <div
      ref={innerRef}
      style={elevationStyles.elevation4}
      className={mergeClasses(props.selectProps.classes.paper,
        getValue(() => (props as any).selectProps.customClasses.paper))}
      {...props.innerProps}
    >
      {props.children}
    </div>
  }
}

const SelectComponents = {
  Control,
  Menu,
  //NoOptionsMessage,
  Option,
  //Placeholder,
  DropdownIndicator: () => <div/>,
  IndicatorSeparator: () => <div/>,
  SingleValue,
  ValueContainer
}

interface InnerP extends IThemedProperties {
  innerProps?: any
  isFocused?: boolean
  isSelected?: boolean
  textFieldProps?: TextFieldProps
  inputRef?: React.Ref<HTMLInputElement>
  selectProps?: any
}

interface P<T = any> extends SelectProps<T>, StyledComponentProps<string> {
  selectRef?: React.Ref<ReactSelect<IRepo>> | React.RefObject<ReactSelect<IRepo>>
  viewportMode?: ViewportMode
  isMobile?: boolean
  isPortrait?: boolean
  styles?: any
  placeholder?: string
  options: Array<T>
  value: T
  labelGetter: (value: T) => string
  idGetter: (value: T) => string
  onSelection: (value: T) => void
  isClearable?: boolean
  customClasses?: Partial<{
    root: string
    valueContainer: string
    paper: string
    placeholder: string
    singleValue: string
    control: string
    input: string
    option: string
  }>
}

// interface S<T> {
//   options: Array<T>
// }


export default StyledComponent<any,any,P, any>(baseStyles, {withTheme: true, withRef: true})(function AutoCompleteSelect<T>(props:P<T>): StyledElement<P<T>> {
  const
    {
      isClearable = false,
      options = Array<T>(),
      classes,
      theme,
      placeholder,
      idGetter,
      labelGetter,
      value,
      customClasses = {},
      onSelection,
      styles,
      innerRef,
      selectRef,
      ...other
    } = props,
    [currentOptions, setCurrentOptions] = useState<Array<T>>(options)

  useEffect(() => {
    setCurrentOptions(options)
  },[options])

  const selectStyles = {
    menuPortal: base => {
      return ({
        ...base,
        zIndex: 9999

      })
    },
    ...(styles || {})
  }

  return <div ref={innerRef} className={mergeClasses(classes.root, customClasses.root)}>
    <Select
      ref={selectRef}
      styles={selectStyles}
      options={currentOptions}
      components={SelectComponents as any}
      value={value}
      classes={classes}
      onChange={onSelection}
      placeholder={placeholder}
      isClearable={isClearable}
      getOptionLabel={labelGetter}
      getOptionValue={idGetter}
      blurInputOnSelect={true}
      menuPlacement="bottom"
      menuPosition="fixed"
      menuPortalTarget={document.body}
      customClasses={customClasses}
      isSearchable
      {...props}
    />
  </div>
})
