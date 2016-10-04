
import * as React from 'react'
import { PureRender } from "ui/components/common"
import filterProps from 'react-valid-props'
import { getValue } from "shared/util/ObjectUtil"


const
	log = getLogger(__filename)

//DEBUG
log.setOverrideLevel(LogLevel.DEBUG)


export interface IFileDropProps extends React.HTMLAttributes<any> {
	onFilesDropped?:(files:DataTransfer) => any
	acceptedTypes:string[]
}

export interface IFileDropState {
	
}

@PureRender
export class FileDrop extends React.Component<IFileDropProps,IFileDropState> {
	
	/**
	 * Dragging started
	 *
	 * @param event
	 */
	handleDragStart = (event) => {
		log.debug(`File drag start`,event)
	}
	
	/**
	 * Dropped something
	 *
	 * @param event
	 */
	handleDrop = (event:React.DragEvent<any>) => {
		const
			{onFilesDropped} = this.props
		
		if (event.dataTransfer.files.length > 0) {
			if (onFilesDropped) {
				onFilesDropped(event.dataTransfer)
			}
		}
	}
	
	/**
	 * Drag enter
	 *
	 * @param event
	 */
	handleDragEnter = (event:React.DragEvent<any>) => {
		
	}
	
	/**
	 * Drag leave
	 *
	 * @param event
	 */
	handleDragLeave = (event:React.DragEvent<any>) => {
		
	}
	
	/**
	 * Dragging over
	 *
	 * @param event
	 */
	handleDragOver = (event:React.DragEvent<any>) => {
		log.debug(`File drag over`,event,getValue(() => event.dataTransfer.files))
	}
	
	/**
	 * Dragging ended
	 *
	 * @param event
	 */
	handleDragEnd = (event:React.DragEvent<any>) => {
		
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