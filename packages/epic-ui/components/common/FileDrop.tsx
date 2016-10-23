
import * as React from 'react'
import { PureRender } from "ui/components/common"
import filterProps from 'react-valid-props'
import { getValue } from "shared/util"


const
	log = getLogger(__filename)

//DEBUG
log.setOverrideLevel(LogLevel.DEBUG)


export interface IFileDropProps extends React.HTMLAttributes<any> {
	onFilesDropped?:(files:DataTransfer) => any
	acceptedTypes?:Array<string|RegExp>
	effectAllowed?:string
	dropEffect?:string
}

export interface IFileDropState {
	isOver?:boolean
	dragImage?:any
}

@PureRender
export class FileDrop extends React.Component<IFileDropProps,IFileDropState> {
	
	
	private ensureOver(event:React.DragEvent<any>) {
		log.debug(`ensure over`,event,event.dataTransfer)
		if (!getValue(() => this.state.isOver)) {
			// const
			// 	{dataTransfer} = event as any,
			// 	{files} = dataTransfer
			//
			// let
			// 	dragImage = null
			//
			
			
			
			this.setState({
				isOver:true
			})
			
		}
		event.preventDefault()
		event.stopPropagation()
	}
	
	/**
	 * Dragging started
	 *
	 * @param event
	 */
	handleDragStart = (event) => {
		this.ensureOver(event)
		
		
	}
	
	/**
	 * Dropped something
	 *
	 * @param event
	 */
	handleDrop = (event:React.DragEvent<any>) => {
		const
			{onFilesDropped} = this.props
		
		if (onFilesDropped) {
			onFilesDropped(event.dataTransfer)
		}
		
		event.preventDefault()
		event.stopPropagation()
	}
	
	/**
	 * Drag enter
	 *
	 * @param event
	 */
	handleDragEnter = (event:React.DragEvent<any>) => {
		this.ensureOver(event)
		
	}
	
	/**
	 * Drag leave
	 *
	 * @param event
	 */
	handleDragLeave = (event:React.DragEvent<any>) => {
		log.debug(`Drag leave`)
		
		this.setState({
			isOver:false,
			dragImage: null
		})
		event.preventDefault()
		event.stopPropagation()
	}
	
	/**
	 * Dragging over
	 *
	 * @param event
	 */
	handleDragOver = (event:React.DragEvent<any>) => {
		this.ensureOver(event)
		
		// log.debug(`Drag over`)
		// const
		// 	{dropEffect} = this.props
		//
		// if (dropEffect && event.dataTransfer)
		// 	event.dataTransfer.dropEffect = dropEffect
		
		
	}
	
	/**
	 * Dragging ended
	 *
	 * @param event
	 */
	handleDragEnd = (event:React.DragEvent<any>) => {
		log.debug(`Drag ended`)
		
		event.preventDefault()
		event.stopPropagation()
	}
		
	render() {
		return <div
			onDragStart={this.handleDragStart}
			onDrag={this.handleDrop}
			onDragEnter={this.handleDragEnter}
			onDragLeave={this.handleDragLeave}
			onDragOver={this.handleDragOver}
			onDrop={this.handleDrop}
			onDragEnd={this.handleDragEnd}
			{...filterProps(this.props)}>
			
			{this.props.children}
		
		</div>
	}
}