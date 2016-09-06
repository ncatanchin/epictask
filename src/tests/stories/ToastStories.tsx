// Setup story environment
import {getDecorator} from "./StoryHelper"

import {Button} from 'ui/components/common'
import {getStoreState} from "shared/store"
import {clearMessages,addErrorMessage, addMessage, addSuccessMessage} from "shared/Toaster"
import {ToastMessages} from 'ui/components/ToastMessages'

const {storiesOf, action, linkTo} = require('@kadira/storybook')


// logger
const log = getLogger(__filename)

storiesOf('Toast',module)
	.addDecorator(getDecorator)
	
	// Single Job - no updates
	.add('With Info Message', () => {
		clearMessages()
		addMessage('Some info can be nice ;)')
		
		return <ToastMessages />
	})
	
	// Single Job - no updates
	.add('With Success Message', () => {
		clearMessages()
		addSuccessMessage('Good = good / ALWAYS')
		
		return <ToastMessages />
	})
	
	// Single Job - no updates
	.add('With Error Message', () => {
		clearMessages()
		addErrorMessage('Arg an error occurred!')
		
		return <ToastMessages />
	})
	