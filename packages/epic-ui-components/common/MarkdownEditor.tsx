// Imports
import { PureRender } from "./PureRender"
import { getValue } from  "epic-global"

// Constants
const
	log = getLogger(__filename),
	SimpleMDE = require('react-simplemde-editor')

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

const baseStyles = (topStyles,theme,palette) => ({
	root: [ FlexColumn, FlexAuto, {} ]
})


/**
 * IMarkdownEditorProps
 */
export interface IMarkdownEditorProps {
	theme?:any
	styles?:any
	
	style?:any
	autoFocus?:boolean
	defaultValue?:string
	onChange: (value:string) => any
	onKeyDown?: (event:KeyboardEvent) => any
}

/**
 * IMarkdownEditorState
 */
export interface IMarkdownEditorState {
	wrapper?:HTMLDivElement
	simpleMdeReact?:any
	simplemde?:any
	codemirror?:any
}

/**
 * MarkdownEditor
 *
 * @class MarkdownEditor
 * @constructor
 **/

@Radium
@PureRender
export class MarkdownEditor extends React.Component<IMarkdownEditorProps,IMarkdownEditorState> {
	
	/**
	 * Get the editor value
	 *
	 * @returns {any}
	 */
	get value():string {
		return getValue(() => this.state.simplemde.value())
	}
	
	/**
	 * Set the editor value
	 *
	 * @param newVal
	 * @returns {any}
	 */
	set value(newVal) {
		const
			simplemde = getValue(() => this.state.simplemde)
		
		if (simplemde) {
			simplemde.value(newVal)
		}
	}
	
	
	/**
	 * Entry point to receive data transfer drops from the outside
	 *
	 * @param data
	 */
	onDrop(data:DataTransfer) {
		const
			{files,items} = data,
			mde = getValue(() => this.state.simplemde)
		
		log.debug(`Received data transfer`,data,mde)
		
		if (!mde)
			return
		
		
		// METHOD TO INSERT DROPPED IMAGE / EVENTUALLY UPLOAD & ATTACH ANYTHING
		const
			insertImage = (url) => {
				const
					currentVal = mde.value(),
					newVal = currentVal + ` ![](${url})`
				
				mde.value(newVal)
				
				this.onChange(newVal)
			}
		
		// CHECK FILES FIRST
		if (files && files.length === 1) {
			const
				file = files[0]
			
			if (/image/.test(file.type)) {
				const
					imgPath = file.path
				
				insertImage(imgPath.startsWith('/') ? `file://${imgPath}` : imgPath)
				
				return
			}
		}
		
		// THEN CHECK ITEMS
		if (items && items.length) {
			for (let i = 0; i < items.length;i++) {
				const
					item = items[i]
				
				if (/uri/.test(item.type)) {
					item.getAsString(insertImage)
					break
				}
			}
		}
	}
	
	/**
	 * Pass thru on change handler
	 * @param value
	 */
	private onChange = (value) => {
		const
			{onChange} = this.props
		
		onChange && onChange(value)
	}
	
	/**
	 * Set the wrapper component
	 *
	 * @param wrapper
	 */
	private setWrapper = (wrapper) => this.setState({wrapper})
	
	/**
	 * Receive the ref and assign
	 * simplemde and codemirror
	 *
	 * @param simpleMdeReact
	 */
	private setSimpleMDE = (simpleMdeReact) => {
		const
			{onKeyDown} = this.props,
			simplemde = getValue(() => simpleMdeReact.simplemde),
			codemirror = getValue(() => simplemde.codemirror)
		
		log.debug(`Markdown editor received`,simpleMdeReact,simplemde,codemirror)
		
		if (codemirror) {
			for (let eventName of ['dragstart','dragenter','dragover','dragleave','drop']) {
				codemirror.on(eventName,(cm,event) => {
					event.codemirrorIgnore = true
				})
			}
			
			const makeFocusHandler = (eventName) => (cm) => {
				const
					wrapper = getValue(() => this.state.wrapper)
				
				log.debug(`Propagating md focus/blur`,eventName,wrapper)
				if (wrapper) {
					eventName === 'focus' ? wrapper.focus() : wrapper.blur()
				}
				// if (wrapper)
				// 	wrapper.dispatchEvent(event)
			}
			
			codemirror.on('focus',makeFocusHandler('focus'))
			codemirror.on('blur',makeFocusHandler('blur'))
			
			if (onKeyDown) {
				codemirror.on('keydown',(cm,event) => {
					onKeyDown(event)
				})
			}
		}
		
		this.setState({
			simpleMdeReact,
			simplemde,
			codemirror
		}, () => {
			if (this.props.autoFocus) {
				$(getValue(() => this.state.wrapper)).find('textarea').focus()
			}
		})
	}
	
	/**
	 * Render markdown editor
	 *
	 * @returns {any}
	 */
	render() {
		const
			{ onChange,autoFocus,defaultValue,style} = this.props
		
		return <div
			style={[style,FlexColumn]}
			className="epic-markdown-editor"
			ref={this.setWrapper}>
			
			<SimpleMDE onChange={this.onChange}
		                  ref={this.setSimpleMDE}
		                  style={style}
		                  onDragOver={(event) => log.info(`Dragging over markdown editor`,event)}
		                  options={{
						            autoDownloadFontAwesome: false,
						            spellChecker: false,
						            status: false,
						            initialValue: defaultValue,
						            autoFocus
						           }}/></div>
	}
	
}