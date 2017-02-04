import { Icon, PureRender, TextField } from "epic-ui-components"
import { getUIActions, View } from "epic-typedux"
import { isHovering } from "epic-styles"
import { getValue } from "typeguard"
import { stopEvent } from "epic-util"

const
	log = getLogger(__filename)

export interface IViewTabProps {
	styles:any
	view:View
	selected:boolean
	closeEnabled:boolean
}

export interface IViewTabState {
	editing?:boolean
	newName?:string
}

/**
 * View state tab component
 */
@Radium
@PureRender
export default class ViewTab extends React.Component<IViewTabProps,IViewTabState> {
	
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
		getUIActions().updateView(this.props.view.set('name',getValue(() => this.state.newName,"empty")) as View)
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
			{view,selected} = this.props
		
		if (selected && !this.editing) {
			this.setState({
				editing: true,
				newName: view.name || ''
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
			stopEvent(event)
			
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
	
	private onSelectTab = () => {
		const
			{view} = this.props,
			{id} = view
		
		log.info(`Clicked: ${id}`,view)
		getUIActions().setSelectedTabViewId(id)
	}
	
	
	render() {
		const
			{styles,view,selected,closeEnabled} = this.props,
			{editing,newName} = this.state,
			id = view.id,
			hovering = isHovering(this,"tab")
		
		log.debug(`view state tab: ${id}`)
		return <div ref="tab"
		            style={[styles, selected && styles.selected]}
		            onClick={this.onSelectTab}>
			{editing &&
				<TextField
					autoFocus={true}
					styles={styles.nameField}
					value={newName}
					onBlur={this.onTextBlur}
					onChange={this.onTextChange}
				  onKeyDown={this.onTextKeyDown}
			  />}
			
			{!editing && <div style={[styles.label]} onClick={this.onTextClick}>
				{view.name || '(Untitled)'}
				{view.title && <span style={styles.viewTitle}>&nbsp;({view.title})</span>}
			</div>}
			
			{/* IF CLOSE ENABLED, > 1 VIEW STATE */}
			{!editing && closeEnabled &&
			<Icon
				onClick={() => getUIActions().removeTabView(id)}
				style={makeStyle(styles.closeButton,hovering && styles.closeButton.visible)}>
				close
			</Icon>
			}
		</div>
	}
}