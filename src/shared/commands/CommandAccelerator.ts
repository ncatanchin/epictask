
import { isMac } from "shared/util/ElectronUtil"
import { TCommandDefaultAccelerator } from "shared/commands/Command"
import { isNumber, shallowEquals } from "shared/util/ObjectUtil"
import { GlobalKeys } from "shared/KeyMaps"


const
	CommandOrControl = 'CommandOrControl',
	Meta = 'meta',
	Ctrl = 'ctrl',
	Alt = 'alt',
	Shift = 'shift',
	Down = 'ArrowDown',
	Up = 'ArrowUp',
	Right = 'ArrowRight',
	Left = 'ArrowLeft',
	MappedKeys = {
		[CommandOrControl.toLowerCase()]: isMac() ? Meta : Ctrl
	},
	ElectronMappedKeys = {
		[Meta]: 'Super',
		[Ctrl]: 'Control',
		[Alt]: 'Alt',
		[Shift]: 'Shift',
		[Down]: 'Down',
		[Up]: 'Up',
		[Left]: 'Left',
		[Right]: 'Right'
	},
	ModifiedKeyNames = ['ctrl','meta','shift','alt']



export function isKeyboardEvent(o:any):o is KeyboardEvent {
	return o && (o instanceof KeyboardEvent || (o.type && o.type.indexOf('key') > -1))
}

/**
 * Command accelerator configuration
 */
export class CommandAccelerator {
	
	
	/**
	 * Accelerator comparator
	 *
	 * @param accelerator
	 * @param event
	 * @returns {any}
	 */
	
	static matchToEvent(accelerator:TCommandDefaultAccelerator,event:KeyboardEvent) {
		if (!accelerator || !event)
			return false
		
		const
			accel = new CommandAccelerator(accelerator),
			keyAccel = new CommandAccelerator(event)
		
		return accel.isEqual(keyAccel)
	}
	
	/**
	 * All non modifier key codes
	 */
	codes:string[] = []
	
	/**
	 * Ctrl key
	 */
	ctrlKey:boolean = false
	
	/**
	 * Super key
	 */
	metaKey:boolean = false
	
	/**
	 * Shift key
	 */
	shiftKey:boolean = false
	
	/**
	 * Alt key
	 */
	altKey:boolean = false
	
	
	
	/**
	 * Has any modified
	 */
	get hasModifier() {
		return this.shiftKey || this.ctrlKey || this.metaKey || this.altKey
	}
	
	/**
	 * Has non-input modifier (No shift)
	 */
	get hasNonInputModifier() {
		return this.hasModifier && !this.shiftKey
		
	}
	
	/**
	 * Add another part of the accelerator
	 *
	 * @param code
	 */
	private addPart(code:string) {
		
		if (code) {
			code.toLowerCase()
			
			if (ModifiedKeyNames.includes(code))
				this[`${code}Key`] = true
			else
				this.codes.push(MappedKeys[code] || code)
		}
	}
	
	/**
	 * Create a new accelerator instance
	 *
	 * @param accelerator
	 */
	constructor(
		public accelerator:TCommandDefaultAccelerator|KeyboardEvent
	) {
		if (!accelerator)
			return
		
		// IF KEYBOARD EVENT
		if (isKeyboardEvent(accelerator)) {
			this.addPart(accelerator.code)
			assign(this,_.pick(accelerator,'ctrlKey','altKey','metaKey','shiftKey'))
		} else {
			if (isNumber(accelerator))
				accelerator = GlobalKeys[accelerator]
			
			this.accelerator = accelerator.toLowerCase().replace(/\s/g,'')
			this.accelerator.split('+').forEach(part => this.addPart(part))
		}
	}
	
	/**
	 * Map to electron accelerator string
	 *
	 * @returns {string}
	 */
	toElectronAccelerator():string {
		return !this.codes.length ? '' :this
			.codes
			.map(code => {
				return ElectronMappedKeys[code] || code.toUpperCase()
			})
			.join('+')
	}
	
	/**
	 * Compare to accelerators
	 *
	 * @param o
	 */
	isEqual(o:CommandAccelerator) {
		const
			myCodes = this.codes.map(code => code.toLowerCase()),
			oCodes = o.codes.map(code => code.toLowerCase())
		
		return shallowEquals(
				this,
				o,
				'ctrlKey',
				'altKey',
				'metaKey',
				'shiftKey'
			) && myCodes.every(it => oCodes.includes(it))
	}
}

