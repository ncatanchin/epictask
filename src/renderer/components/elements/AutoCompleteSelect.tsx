import * as React from "react"
import {useEffect, useMemo, useState} from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties, mergeClasses, ViewportMode} from "renderer/styles/ThemedStyles"
import Typography from '@material-ui/core/Typography'
import {TextFieldProps} from '@material-ui/core/TextField'
import MenuItem from '@material-ui/core/MenuItem'

import withStyles, {StyledComponentProps} from "@material-ui/core/styles/withStyles"
import {getValue} from "typeguard"
import baseStyles, {AutoCompleteSelectClasses} from "renderer/components/elements/AutoCompleteSelect.styles"
import {elevationStyles} from "renderer/components/elements/Elevation"
import {Props as SelectProps} from "react-select/lib/Select"
import ReactSelect from "react-select"
import {StyledComponent, StyledElement} from "renderer/components/elements/StyledComponent"
import {CommandManagerProps, useCommandManager} from "renderer/command-manager-ui"
import classNames from "classnames"
import {assert} from "common/ObjectUtil"

const
  log = getLogger(__filename),
  Select = require('react-select').default


const NoOptionsMessage = withStyles(baseStyles as any)((props: InnerP): JSX.Element => {
  return (
    <Typography
      color="textSecondary"
      className={props.classes.noOptionMessage}
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
      menuIsOpen,
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

interface InnerP extends IThemedProperties<AutoCompleteSelectClasses> {
  innerProps?: any
  isFocused?: boolean
  isSelected?: boolean
  textFieldProps?: TextFieldProps
  inputRef?: React.Ref<HTMLInputElement>
  selectProps?: any
}

interface P<T = any> extends SelectProps<T>, StyledComponentProps<AutoCompleteSelectClasses> {
  id?:string
  theme?:any
  onMenuOpen?:any
  onMenuClose?:any
  commandManagerProps?: CommandManagerProps
  selectRef?: React.Ref<ReactSelect<T>> | React.RefObject<ReactSelect<T>>
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

interface SP {
}


export default StyledComponent<P,SP>(baseStyles, {withTheme: true, withRef: true})(function AutoCompleteSelect<T>(props:P<T>): StyledElement<P<T>> {
  const
    {
      id,
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
    } = _.omit(props,"commandManagerProps"),
    [currentOptions, setCurrentOptions] = useState<Array<T>>(options)

  assert(!!props.commandManagerProps || !!id,() => "Either id or commandManagerProps must be provided")

  const
    commandManagerProps:CommandManagerProps = props.commandManagerProps || useCommandManager(
      id,
      builder => builder.make(),
      selectRef as React.RefObject<any>
    ).props

  useEffect(() => {
    setCurrentOptions(options)
  },[options])

  const selectStyles = useMemo(() => ({
    menuPortal: base => {
      return ({
        ...base,
        zIndex: 9999

      })
    },
    ...(styles || {})
  }),[])

  return <div
    id={id}
    ref={innerRef}
    className={classNames(classes.root, customClasses.root)}
    {...commandManagerProps}
  >
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
      {...other}
    />
  </div>
})
