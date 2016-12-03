import { isString } from "typeguard"

export namespace FormValidators {
	export function makeLengthValidator(minLength = 0, maxLength = Number.MAX_SAFE_INTEGER, message?: string|((minLength, maxLength) => string)) {
		return (value) => {
			const
				valid = value && isString(value) && value.length >= minLength
			
			return valid ?
				valid :
				!message ? `Value must be at least ${minLength} characters` :
					isString(message) ? message :
						message(minLength, maxLength)
		}
		
	}
}