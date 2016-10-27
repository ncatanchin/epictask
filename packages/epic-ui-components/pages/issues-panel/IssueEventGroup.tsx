import { List } from "immutable"
import * as moment from "moment"
import * as React from "react"
import { IssuesEvent, TIssueEventGroupType, getEventGroupType, User } from "epic-models"
import { LabelChip } from "epic-ui-components"

const
	log = getLogger(__filename)

/**
 * Class that holds a set of events
 */
export class EventGroup {
	
	/**
	 * All the events in this group
	 */
	public events = List<IssuesEvent>()
	
	/**
	 * The group type
	 */
	public groupType:TIssueEventGroupType
	
	/**
	 * Time from now for grouping
	 */
	public timeFromNow:string
	
	/**
	 * Event actor
	 */
	public actor:User
	
	/**
	 * Concat all event ids into a string
	 *
	 * @returns {string}
	 */
	get id() {
		return this.events.map(event => event.id).join('//')
	}
	
	/**
	 * Default constructor
	 *
	 * @param event
	 */
	constructor(event:IssuesEvent) {
		this.groupType = getEventGroupType(event)
		this.actor = event.actor
		
		if (!this.groupType)
			log.error(`No group type found for ${event.event}`)
		
		this.addEvent(event)
	}
	
	/**
	 * Does this grouping include the passed event
	 *
	 * @param event
	 * @returns {boolean|Assertion}
	 */
	acceptsEvent(event:IssuesEvent) {
		const
			timeFromNow = moment(event).fromNow()
		
		
		return this.groupType === getEventGroupType(event) &&
			this.actor.id === event.actor.id &&
			(!this.timeFromNow || this.timeFromNow === timeFromNow) &&
			(this.events.size === 0 || this.groupType !== 'pencil')
	}
	
	/**
	 * Add an event to the list
	 *
	 * @param event
	 * @returns {EventGroup}
	 */
	addEvent(event:IssuesEvent) {
		const
			accepted = this.acceptsEvent(event)
		
		if (DEBUG && !accepted)
			debugger
		
		assert(accepted,`This grouping does not accept the passed event (this group = ${this.groupType}) - event type is ${event.event}`)
		
		
		
		this.events = this.events.push(event)
		if (!this.timeFromNow)
			this.timeFromNow = moment(event).fromNow()
		
		return this
	}
	
	getDescription(activityStyle,styles) {
		const
			{groupType:type,events} = this,
			makeEventSpacer = (index) => (events.size < 2 || index === events.size - 1) ?
				'' :
				(index === events.size - 2) ?
					// LAST TAG
					<span>&nbsp;and&nbsp;</span> :
					
					// MIDDLE TAG
					<span>,&nbsp;</span>,
			
			// LABEL CHIP STYLES
			chipStyles = {
				label:{
					display: 'inline-flex',
					marginRight:0
				}
			}
		
		if (events.size) {
			if (type === 'pencil') {
				const
					event = events.get(0),
					{rename} = event
				
				return <span>renamed from {rename.from} tp {rename.to}</span>
			}
			
			// TAGS/LABELS
			else if (type === 'tag') {
				
				return events.map((event,index) =>
					<span key={event.id}>
							{event.event === 'labeled' ? 'added' : 'removed'}&nbsp;&nbsp;
							<LabelChip showIcon={true} label={event.label} styles={chipStyles}/>
						{makeEventSpacer(index)}
						</span>
				)
			}
			
			//MILESTONES
			else if (type === 'person') {
				
				return events.map((event,index) =>
					<span key={event.id}>
						{event.event === 'assigned' ? 'assigned this to ' : 'unassigned this from '}
						{event.assignee ? event.assignee.login : 'not available'}
						{makeEventSpacer(index)}
					</span>
				)
			}
			
			//MILESTONES
			else if (type === 'milestone') {
				
				return events.map((event,index) =>
					<span key={event.id}>
						{event.event === 'milestoned' ? 'added this to ' : 'removed this from '}
						<LabelChip showIcon={true} label={assign({id:'-1'},event.milestone)} styles={chipStyles}/>
						{makeEventSpacer(index)}
					</span>
				)
				
			}
			
			//MILESTONES
			else if (type === 'mention') {
				
				return events.map((event,index) =>
					<span key={event.id}>
						{event.event === 'mentioned' ?
							'mentioned this ' : event.event}
						{makeEventSpacer(index)}
					</span>
				)
			}
		}
		return React.DOM.noscript()
	}
}

/**
 * Type guard events
 *
 * @param o
 * @returns {boolean}
 */
export function isEventGroup(o:any):o is EventGroup {
	return o && List.isList(o.events)
}
