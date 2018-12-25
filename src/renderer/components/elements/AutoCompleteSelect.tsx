import * as React from "react"
import getLogger from "common/log/Logger"
import {
	FillWidth,
	FlexAuto, FlexRowCenter,
	IThemedProperties,
	makeWidthConstraint, PositionRelative, rem,
	StyleDeclaration,
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
import { emphasize } from '@material-ui/core/styles/colorManipulator'

import withStyles from "@material-ui/core/styles/withStyles"
import {ControlProps} from "react-select/lib/components/Control"
import {guard} from "typeguard"
import {hot} from "react-hot-loader"

const
	log = getLogger(__filename),
	Select = require('react-select').default


function baseStyles(theme):StyleDeclaration {
	const
		{palette} = theme,
		{primary, secondary} = palette
	
	return {
		root: [FlexAuto,makeWidthConstraint(rem(20)),PositionRelative,{
		
		}],
		input: [FlexRowCenter,FillWidth,{
			padding: 0,
		}],
		valueContainer: {
			display: 'flex',
			flexWrap: 'wrap',
			flex: 1,
			alignItems: 'center',
			overflow: 'hidden',
		},
		chip: {
			margin: `${theme.spacing.unit / 2}px ${theme.spacing.unit / 4}px`,
		},
		chipFocused: {
			backgroundColor: emphasize(
				theme.palette.type === 'light' ? theme.palette.primary.dark : theme.palette.primary.dark,
				0.08,
			),
		},
		noOptionsMessage: {
			padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
		},
		singleValue: {
			fontSize: 16,
		},
		placeholder: {
			position: 'absolute',
			left: 2,
			fontSize: 16,
		},
		paper: {
			position: 'absolute',
			zIndex: 1,
			marginTop: theme.spacing.unit,
			left: 0,
			right: 0,
		},
		divider: {
			height: theme.spacing.unit * 2,
		}
	} as any
}


const NoOptionsMessage = withStyles(baseStyles as any)((props:InnerP):JSX.Element => {
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

@withStatefulStyles(baseStyles as any)
class InputComponent extends React.Component<InnerP> {
	
	render() {
		const { inputRef, classes, ...props } = this.props
		
		return <div ref={inputRef} {...props} className={classes.input}/>
	}
}


class Control extends React.Component<ControlProps<any>> {
	render() {
		const props = this.props
		return <TextField
			fullWidth
			InputProps={{
				inputComponent: InputComponent,
				inputProps: {
					//className: (props as any).classes.input,
					inputRef: props.innerRef,
					children: props.children,
					...props.innerProps,
				},
			}}
		
		/>
		/*{...(props as any).textFieldProps}*/
	}
}

	class Option extends React.Component<InnerP> {
		
		render() {
			const props = this.props
			return <MenuItem
				buttonRef={props.innerRef}
				selected={props.isFocused}
				component="div"
				style={{
					fontWeight: props.isSelected ? 500 : 400,
				}}
				{...props.innerProps}
			>
				{props.children}
			</MenuItem>
		}
	}
	

const Placeholder = withStyles(baseStyles as any)((props:InnerP):JSX.Element => {
	return (
		<Typography
			color="textSecondary"
			className={props.classes.placeholder}
			{...props.innerProps}
		>
			{props.children}
		</Typography>
	)
})



class SingleValue extends React.Component<InnerP> {
	render() {
		const {innerRef,...props} = this.props
		return <Typography ref={innerRef} className={props.selectProps.classes.singleValue} {...props.innerProps}>
			{props.children}
		</Typography>
	}
}

class ValueContainer extends React.Component<InnerP> {
	render() {
		const {innerRef,...props} = this.props
		return <div ref={innerRef} className={props.selectProps.classes.valueContainer}>{props.children}</div>
	}
}

class Menu extends React.Component<InnerP,any> {
	constructor(props, context) {
		super(props, context)
		this.state = {}
	}
	
	render() {
		const {innerRef,...props} = this.props
		return <div ref={innerRef} className={props.selectProps.classes.paper} {...props.innerProps}>
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
	SingleValue,
	ValueContainer,
}

interface InnerP extends IThemedProperties {
	innerProps?:any
	isFocused?:boolean
	isSelected?:boolean
	textFieldProps?:TextFieldProps
	inputRef?:React.Ref<HTMLInputElement>
	selectProps?:any
}

interface P<T> extends IThemedProperties {
	placeholder?:string
	options:Array<T>
	value:T
	labelGetter: (value:T) => string
	idGetter: (value:T) => string
	onSelection: (value:T) => void
	isClearable?:boolean
}

interface S<T> {
	options:Array<T>
}


@withStatefulStyles(baseStyles,{withTheme: true})
@connect(createStructuredSelector({}))
class AutoCompleteSelect<T> extends React.Component<P<T>, S<T>> {
	static defaultProps:Partial<P<any>> = {
		isClearable: false
	}
	
	constructor(props:P<T>) {
		super(props)
		
		this.state = {
			options: this.props.options
		}
	}
	
	private onSelection = (selection:T) =>
		guard(() => this.props.onSelection(selection))
	
	
	componentDidUpdate(prevProps:Readonly<P<T>>, prevState:Readonly<S<T>>, snapshot?:any):void {
		if (prevProps.options !== this.props.options) {
			this.setState({
				options: this.props.options
			})
		}
	}
	
	render() {
		const
			{
				classes,
				theme,
				placeholder,
				idGetter,
				labelGetter,
				value,
				isClearable
			} = this.props,
			{
				options
			} = this.state
		
		const selectStyles = {
			input: base => ({
				...base,
				color: theme.palette.text.primary,
				'& input': {
					font: 'inherit',
				},
			}),
			menuPortal: base => ({ ...base, zIndex: 9999 })
		}
		
		return <div className={classes.root}>
			{/*classes={classes as any}*/}
			<Select
				styles={selectStyles}
				options={options}
				components={SelectComponents as any}
				value={value}
				classes={classes}
				onChange={this.onSelection}
				placeholder={placeholder}
				isClearable={isClearable}
				getOptionLabel={labelGetter}
				getOptionValue={idGetter}
				menuPlacement="bottom"
				menuPosition="fixed"
				menuPortalTarget={document.body}
				isSearchable
			/>
		</div>
	}
}

export default hot(module)(AutoCompleteSelect)
