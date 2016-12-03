
const
	Tooltip = require('react-tooltip')

export function FormErrorTooltip({tip}) {
	return <Tooltip multiline={false} class="formErrorTooltip" type="error">
		{tip}
	</Tooltip>
}