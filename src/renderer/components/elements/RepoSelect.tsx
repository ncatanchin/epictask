import * as React from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties, StyleDeclaration, withStatefulStyles} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {IRepo} from "common/models/Repo"
import AutoCompleteSelect from "renderer/components/elements/AutoCompleteSelect"
import {selectedOrgReposSelector} from "common/store/selectors/DataSelectors"
import * as _ from 'lodash'
import {guard} from "typeguard"
import ReactSelect from 'react-select'
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {useCallback, useEffect, useMemo, useState} from "react"
import {useCommandManager} from "renderer/command-manager-ui"
import CommonElementIds from "renderer/CommonElements"
import {assert} from "common/ObjectUtil"
const log = getLogger(__filename)


function baseStyles(theme):StyleDeclaration {
	const
		{palette,components:{Select}} = theme,
		{primary, secondary} = palette

	return {
		root: [],
		paper: [Select.paper,{
      position: 'absolute',
      zIndex: 1,
      //marginTop: theme.spacing.unit,
      left: 0,
      right: 0,
		}]
	}
}

interface P extends IThemedProperties {
	onSelection: (repo:IRepo) => void
	onOpen?:(open:boolean) => void
	value:IRepo
  selectRef?: React.Ref<ReactSelect<IRepo>> | React.RefObject<ReactSelect<IRepo>>
}

interface SP {
  repos:Array<IRepo>
}

function idGetter(value:IRepo):string {
  return value.id.toString(10)
}

function labelGetter(value:IRepo):string {
  return value.full_name
}

export default StyledComponent<P,SP>(baseStyles,{
	repos: (state:IRootState) => state.DataState.repos.data,
},{withTheme: true})(function RepoSelect(props:P & SP):React.ReactElement<P> {
	const
		{
		  id,
			theme,
      classes,
      repos,
      value,
      innerRef,
      selectRef,
      onSelection,
			...other
		} = props,
    [open, setOpen] = useState(false),
		onOpen = useCallback(() => setOpen(true),[open]),
    onClose = useCallback(() => setOpen(false),[open])

  assert(() => !!id,() => "ID is required")

  const
    {props:commandManagerProps} = useCommandManager(
			id,
				builder => builder.make(),
			selectRef as React.RefObject<any>
		)

	useEffect(() => {
    guard(() => props.onOpen(open))
	},[open])

	const styles = useMemo(() => ({
    input: (base,state,...other) => {
      return {
        ...base,
        color: theme.palette.primary.contrastText
      }
    },
    menuPortal: (base,state) => {
      return {
        ..._.omit(base,'width','left'),
        right: window.innerWidth - base.left - base.width,
        minWidth: base.width,
        maxWidth: "40vw",
        zIndex: 9999,
      }
    }
  }),[theme,open])




  return <AutoCompleteSelect
    options={repos}
    selectRef={selectRef}
    onSelection={onSelection}
    commandManagerProps={commandManagerProps}
    idGetter={idGetter}
    labelGetter={labelGetter}
    value={value}
    onMenuOpen={onOpen}
    onMenuClose={onClose}
    classes={{
      paper: classes.paper
    }}
    styles={styles}

  />
})
