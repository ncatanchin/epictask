

import {JobHandler} from "job/JobHandler"

const log = getLogger(__filename)

export default class JobProgressTracker {
	
	private totalCount = 0
	private completedCount = 0
	private startTime:number = Date.now()
	private finishTime:number
	
	constructor(private handler:JobHandler) {
		
	}
	
	private updateProgress() {
		this.handler.setProgress(this.percentComplete,this.timeRemaining,this.epochETA)
	}
	
	increment(count = 1) {
		this.totalCount += count
		this.updateProgress()
	}
	
	completed(count = 1) {
		this.completedCount += count
		this.updateProgress()
	}
	
	get percentComplete() {
		return Math.max(1,Math.min(0,!this.totalCount ? 0 : this.completedCount / this.totalCount))
	}
	
	get isComplete() {
		return this.totalCount === this.completedCount
	}
	
	get timeRemaining() {
		if (this.isComplete)
			return 0
		
		const
			percent = this.percentComplete,
			elapsedTime = Date.now() - this.startTime
		
		return ((1 / percent) * elapsedTime) - elapsedTime
	}
	
	get epochETA() {
		return Date.now() + this.timeRemaining
	}
	
	
	
}