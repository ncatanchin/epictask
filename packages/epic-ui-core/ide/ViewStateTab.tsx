import { Icon, PureRender } from "epic-ui-components"
import { getUIActions } from "epic-typedux"
import { isHovering } from "epic-styles"
import { ViewState } from "epic-typedux/state/window/ViewState"
import { getValue } from "typeguard"
import { TextField } from "epic-ui-components/common"

const
	log = getLogger(__filename)

export interface IViewStateTabProps {
	styles:any
	viewState:ViewState
	selected:boolean
	closeEnabled:boolean
}

export interface IViewStateTabState {
	editing?:boolean
	newName?:string
}

/**
 * View state tab component
 */
@Radium
@PureRender
export default class ViewStateTab extends React.Component<IViewStateTabProps,IViewStateTabState> {
	
	get editing() {
		return getValue(() => this.state.editing,false)
	}
	
	
	constructor(props,context) {
		super(props,context)
		this.state = {}
	}
	
	/**
	 * Save name editing
	 */
	private save = () => {
		getUIActions().updateView(this.props.viewState.set('name',getValue(() => this.state.newName,"empty")) as ViewState)
		this.setState({editing: false})
	}
	
	/**
	 * Cancel name editing
	 */
	private cancel = () => {
		this.setState({editing: false, newName: null})
	}
	
	/**
	 * Start editing the name if selected
	 *
	 * @param event
	 */
	private onTextClick = (event) => {
		const
			{viewState,selected} = this.props
		
		if (selected && !this.editing) {
			this.setState({
				editing: true,
				newName: viewState.name || ''
			})
		}
		
	}
	
	/**
	 * Update state on text change
	 *
	 * @param event
	 */
	private onTextChange = (event) => this.setState({
		newName: event.target.value
	})
	
	
	/**
	 * on text key down
	 *
	 * @param event
	 */
	private onTextKeyDown = (event) => {
		const
			isEnter = event.key === 'Enter',
			isEscape = event.key === 'Escape'
		
		if (isEnter || isEscape) {
			event.preventDefault()
			event.stopPropagation()
			
			isEnter ? this.save() : this.cancel()
		}
	}
	
	/**
	 * On blur, save
	 *
	 * @param event
	 */
	private onTextBlur = (event) => {
		const
			{selected} = this.props
		
		if (selected && this.editing) {
			this.save()
		}
	}
	
	render() {
		const
			{styles,viewState,selected,closeEnabled} = this.props,
			{editing,newName} = this.state,
			id = viewState.id,
			hovering = isHovering(this,"tab")
		
		log.info(`view state tab: ${id}`)
		return <div ref="tab"
		            style={[styles, selected && styles.selected]}
		            onClick={() => {
		            	log.info(`Clicked: ${id}`,viewState)
		            	getUIActions().setSelectedViewStateId(id)
		            }}>
			{editing &&
				<TextField
					autoFocus={true}
					styles={styles.nameField}
					value={newName}
					onChange={this.onTextChange}
				  onKeyDown={this.onTextKeyDown}
			  />}
			
			{!editing && <div style={[styles.label]} onClick={this.onTextClick}>
				{viewState.name || 'No name'}
			</div>}
			
			{/* IF CLOSE ENABLED, > 1 VIEW STATE */}
			{!editing && closeEnabled &&
			<Icon
				onClick={() => getUIActions().removeView(id)}
				style={makeStyle(styles.closeButton,hovering && styles.closeButton.visible)}>
				close
			</Icon>
			}
		</div>
	}
}